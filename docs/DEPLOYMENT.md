# DreamSpirit Deployment Runbook

This runbook documents the production-style Docker deployment used by
`dream.vectorcontrol.tech`. It intentionally avoids plaintext secrets.

## Live Public Endpoint

- Public URL: `https://dream.vectorcontrol.tech`
- DNS: Cloudflare proxied `A` record to the hk1 edge host.
- Reverse proxy: hk1 nginx terminates TLS and proxies to gz1 over Tailscale.
- Upstream: `http://100.89.231.43:3001`
- App host: gz1, Linux user `dream`, project path `/home/dream/projects/DreamSpirit`

Traffic path:

```text
Browser
  -> Cloudflare
  -> hk1 nginx
  -> gz1 Tailnet 100.89.231.43:3001
  -> DreamSpirit web container port 3000
```

The hk1 to gz1 Tailscale ACL must allow `host:hk1` to reach `host:gz1` on
`tcp:3001`. Do not reuse ports that already belong to other services.

## First-Time Setup

Clone the repository on the target host:

```bash
git clone https://github.com/Xavier-Trump/DreamSpirit.git
cd DreamSpirit
cp .env.production.example .env.production
chmod 600 .env.production
```

Edit `.env.production` locally on the server. Required values:

- `POSTGRES_PASSWORD`
- `AUTH_SECRET`
- `AUTH_URL`
- `APP_BIND_HOST`
- `APP_PORT`
- AI provider variables, if server-level AI defaults are desired

For the current gz1 deployment:

```env
AUTH_URL="https://dream.vectorcontrol.tech"
APP_BIND_HOST="100.89.231.43"
APP_PORT="3001"
```

## Start Or Update

Build and start:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

For normal restarts without source or Dockerfile changes:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

The production compose file currently defaults to `npx prisma db push` through
`PRISMA_DEPLOY_COMMAND`. After the project adopts committed Prisma migrations,
set this instead:

```env
PRISMA_DEPLOY_COMMAND="npx prisma migrate deploy"
```

## Verify

On gz1:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl -I "http://${APP_BIND_HOST}:${APP_PORT}/sign-in"
```

From hk1:

```bash
nc -vz -w 5 100.89.231.43 3001
curl -I --max-time 8 http://100.89.231.43:3001/sign-in
```

From any public network:

```bash
curl -I --max-time 15 https://dream.vectorcontrol.tech/sign-in
```

Expected result: HTTP `200` or a normal application redirect.

## Operations Notes

- Keep `.env.production`, `data/`, uploaded files, database dumps, and private
  backups out of Git.
- The gz1 VM is small. Avoid unnecessary image rebuilds during normal operation.
- Use Docker Compose logs for runtime debugging:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f --tail=120
```

- The worker is a separate long-running container. If AI jobs stop processing,
  check both `web` and `worker` logs.
