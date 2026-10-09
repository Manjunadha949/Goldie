# Dr. Meghana portfolio — Vercel edition

Complete current website: responsive pages, mobile photo first, orange hover navigation, fast internal page navigation, robot chat bubble, one video at a time, Owner Studio, Visit FAQs, expertise and image editing, Turso persistence and Groq chatbot.

## Deploy

1. Extract this ZIP. Import the `Dr-Meghana-Vercel` folder into a Git repository, then import that repository into Vercel.
2. Select **Other** as the framework, **Node.js 22.x**, build command `npm run build`, output directory `public`. The included `vercel.json` sets these routes and places the function in Mumbai.
3. Add these variables in Vercel → Project Settings → Environment Variables. Use the Turso URL/token and Groq key you provided; do not commit them to source control.

| Variable | Value |
| --- | --- |
| `TURSO_DATABASE_URL` | Your `libsql://…turso.io` URL |
| `TURSO_AUTH_TOKEN` | Your Turso read/write token |
| `GROQ_API_KEY` | Your Groq API key |
| `GROQ_MODEL` | `qwen/qwen3.8-27b` |
| `STUDIO_USERNAME` | Your chosen admin username |
| `STUDIO_PASSWORD` | Your chosen admin password |
| `INTEGRATION_KEY` | 64 hexadecimal characters generated below |

Generate the integration encryption key:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

4. Install dependencies and prepare the database before deploying. Copy `.env.example` to `.env`, fill in your values, then run:

```sh
npm ci
npm run db:setup
npm run build
npm test
```

`db:setup` creates missing tables without deleting existing records. It can safely be rerun. Your existing website content in `site_content/main` is reused. For a new database, the bundled content is displayed until your first admin save.

5. Deploy in Vercel. After changing Vercel environment variables, redeploy so they take effect.
6. Open `https://YOUR-VERCEL-DOMAIN/studio` and sign in. Use **Visit FAQs**, **Expertise & services**, **All website text**, and **Profile images** to edit. Use **Database & AI connection** to verify or update credentials. Save to website to publish edits.

## Storage and connections

- Content, hashed admin sessions, login/chat rate limits and uploaded images persist in Turso. Images use `portfolio_media`.
- Groq requests run only on the server. Browser code never receives the API key or Turso token.
- Connection settings edited through Studio are encrypted with `INTEGRATION_KEY`. Preserve this key across redeployments.
- Public content is cached for up to 60 seconds per function instance. Saving clears that instance's cache; other instances refresh within the cache window. Internal page navigation reuses loaded content and checks for updates in the background.
- Existing images uploaded to the earlier ChatGPT-hosted site use that host's image storage. If you uploaded custom images there, upload them again in Vercel Studio; bundled portfolio images already work.
- This ZIP contains the latest code and bundled content. Content already saved in your connected Turso database is read at runtime.

## Checks completed

Production build, TypeScript check, login/logout, password updates, authenticated content edits, conflict handling, direct page routes, FAQ and AI chatbot paths. Live Turso/Groq connection checks were also run. A deployment in your Vercel account still requires the environment variables above.

## Project files

- `api/index.ts`: Vercel Web Request/Response handler.
- `lib/runtime.ts`: Turso database and image-storage adapter.
- `server/api/`: admin authentication, content, upload, connection and chat endpoints.
- `public/`: website styles/scripts and bundled images.
- `scripts/build-vercel.mjs`: asset and server-renderer generation.

Do not upload `node_modules`, `.env`, or `.test-build`. They are excluded from this ZIP.
