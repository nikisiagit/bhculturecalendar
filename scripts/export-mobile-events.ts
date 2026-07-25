import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

async function main() {
    const { getEvents } = await import("../src/lib/notion");
    const { toMobileEvents } = await import("../src/lib/mobile-api");
    const events = toMobileEvents(await getEvents());
    process.stdout.write(JSON.stringify({ events }));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});