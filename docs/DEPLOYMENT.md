# DreamSpirit Deployment Runbook

This runbook documents a production-style Docker deployment. It intentionally
avoids plaintext secrets and deployment-specific private network details.

## Public Endpoint

- Set `AUTH_URL` to the public HTTPS URL that users open in the browser.
- Terminate TLS at your edge or reverse proxy.
- Keep private network addresses, proxy hostnames, ACLs, and account details in
  your own private operations notes, not in this public repository.

Traffic path:

```text
Browser
  -> public HTTPS endpoint
  -> reverse proxy or load balancer
  -> DreamSpirit web container port 3000
```

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

For a deployment behind a reverse proxy on the same host:

```env
AUTH_URL="https://example.com"
APP_BIND_HOST="127.0.0.1"
APP_PORT="3000"
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

On the app host:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl -I "http://${APP_BIND_HOST}:${APP_PORT}/sign-in"
```

From the reverse proxy host, if it is separate from the app host:

```bash
nc -vz -w 5 <app-private-address> <app-port>
curl -I --max-time 8 http://<app-private-address>:<app-port>/sign-in
```

From any public network:

```bash
curl -I --max-time 15 https://<public-domain>/sign-in
```

Expected result: HTTP `200` or a normal application redirect.

## Operations Notes

- Keep `.env.production`, `data/`, uploaded files, database dumps, and private
  backups out of Git.
- On small VMs, avoid unnecessary image rebuilds during normal operation.
- Use Docker Compose logs for runtime debugging:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f --tail=120
```

- The worker is a separate long-running container. If AI jobs stop processing,
  check both `web` and `worker` logs.
