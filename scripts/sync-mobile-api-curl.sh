#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

API_URL="${MOBILE_API_URL:-https://api.bhculturecalendar.co.uk}"
SYNC_SECRET="${MOBILE_SYNC_SECRET:?MOBILE_SYNC_SECRET is required}"

CURL_OPTS=()
if [[ -n "${MOBILE_API_RESOLVE:-}" ]]; then
  CURL_OPTS+=(--resolve "$MOBILE_API_RESOLVE")
fi

echo "Exporting mobile events from Notion..."
PAYLOAD_FILE="$(mktemp)"
npx tsx scripts/export-mobile-events.ts > "$PAYLOAD_FILE"

TOTAL=$(python3 -c "import json; print(len(json.load(open('$PAYLOAD_FILE'))['events']))")
echo "Prepared $TOTAL events"

python3 <<PY
import json, subprocess, os

with open("$PAYLOAD_FILE") as f:
    events = json.load(f)["events"]

api_url = "$API_URL".rstrip("/")
secret = "$SYNC_SECRET"
batch_size = 100
curl_opts = "${CURL_OPTS[*]}".split() if "${CURL_OPTS[*]}" else []

all_ids = [event["id"] for event in events]

for i in range(0, len(events), batch_size):
    batch = events[i:i+batch_size]
    body = json.dumps({"events": batch})
    cmd = [
        "curl", "-sS", "-f",
        *curl_opts,
        "-X", "POST", f"{api_url}/admin/sync-events",
        "-H", "content-type: application/json",
        "-H", f"x-sync-secret: {secret}",
        "--data-binary", "@-",
    ]
    result = subprocess.run(cmd, input=body, text=True, capture_output=True)
    if result.returncode != 0:
        print(result.stderr or result.stdout)
        raise SystemExit(1)
    print(f"Batch {i//batch_size + 1}: synced {len(batch)} events -> {result.stdout.strip()}")

finalize_body = json.dumps({"events": [], "finalize": True, "allIds": all_ids})
finalize_cmd = [
    "curl", "-sS", "-f",
    *curl_opts,
    "-X", "POST", f"{api_url}/admin/sync-events",
    "-H", "content-type: application/json",
    "-H", f"x-sync-secret: {secret}",
    "--data-binary", "@-",
]
finalize_result = subprocess.run(finalize_cmd, input=finalize_body, text=True, capture_output=True)
if finalize_result.returncode != 0:
    print(finalize_result.stderr or finalize_result.stdout)
    raise SystemExit(1)
print(f"Finalized sync -> {finalize_result.stdout.strip()}")
PY

rm -f "$PAYLOAD_FILE"
echo "Production sync complete."