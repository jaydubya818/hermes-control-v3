# Hermes Control v3

A web control panel for managing Hermes agent sessions. The server (Express +
WebSocket + `node-pty` for terminal sessions) exposes authenticated REST and
WebSocket endpoints over a Vite-built client, backed by a Hermes install at
`HERMES_PATH` (default `~/.hermes`).

## What it manages

- **Agents** — `server/routes/agentsRouter.ts`
- **Sessions** — `server/routes/sessionsRouter.ts` (including live PTY terminal sessions over WebSocket)
- **Files** — `server/routes/filesRouter.ts`, scoped to `ALLOWED_FILE_ROOTS`
- **Cron** — `server/routes/cronRouter.ts`
- **Analytics** — `server/routes/analyticsRouter.ts`
- **System** — `server/routes/systemRouter.ts`

Auth is JWT-based (`server/auth.ts`), with an admin credential file stored under `HERMES_PATH`.

## Development

```bash
npm install
cp .env.example .env
npm run dev          # runs the Express/WS server and the Vite client together
```

## Scripts

| Command             | Purpose                                   |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Server + client dev, concurrently          |
| `npm run dev:server` | Server only (`tsx watch server/index.ts`)  |
| `npm run dev:client` | Client only (`vite client`)                |
| `npm run build`      | Typecheck + build the client               |
| `npm run start`      | Run the built server (`dist/server/index.js`) |
| `npm run typecheck`  | `tsc --noEmit`                             |

## Configuration

See `.env.example`: `PORT`, `JWT_SECRET`, `HERMES_PATH`, `ALLOWED_FILE_ROOTS`, `NODE_ENV`.
