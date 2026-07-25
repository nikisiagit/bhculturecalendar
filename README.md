This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## For AI agents and contributors

Project architecture (website, content sync, Mobile API, iOS boundary) is documented for humans and coding agents. **No secret values** belong in these files—only env var names and public URLs.

| Doc | Purpose |
|-----|---------|
| [AGENTS.md](./AGENTS.md) | Primary agent/project rules |
| [CLAUDE.md](./CLAUDE.md) | Pointer for Claude Code–style tools → AGENTS.md |
| [docs/specs/content-sync-architecture.md](./docs/specs/content-sync-architecture.md) | Full content-sync architecture spec |
| [docs/setup-and-verification.md](./docs/setup-and-verification.md) | Setup walkthrough + automated verify steps |
| [docs/near-realtime.md](./docs/near-realtime.md) | Notion → app/site near real-time |
| [workers/content-sync-trigger/](./workers/content-sync-trigger/) | CF Worker: cron + HTTP → GitHub Content Sync |

Local secrets go in `.env.local` (not committed). CI secrets go in GitHub Actions / Cloudflare dashboards.

```bash
npm run sync:verify   # sync Notion → API, then fail if DB/API ≠ Notion
npm run verify:api    # public API health only
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
