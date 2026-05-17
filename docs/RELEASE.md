# Release Process

DreamSpirit uses SemVer tags once a deployment baseline is ready.

## Versioning

- Patch: bug fixes, copy changes, small UI polish, documentation updates.
- Minor: compatible features, new settings, non-breaking API additions.
- Major: breaking schema, API, auth, deployment, or data migration changes.

Recommended tag format:

```text
v0.1.0
```

Use deployment suffixes such as `v0.1.0-gz1` only for private operational
milestones that should not be treated as upstream product releases.

## Pre-Release Checklist

Run these checks from a clean checkout:

```bash
npm ci
npm run typecheck
DATABASE_URL="postgresql://dreamspirit:build-only@localhost:5432/dreamspirit?schema=public" \
AUTH_SECRET="build-only-placeholder" \
AUTH_URL="http://localhost:3000" \
npm run build
docker compose --env-file .env.production -f docker-compose.prod.yml config
```

For production database changes, prefer committed Prisma migrations:

```bash
npm run prisma:migrate
npm run prisma:deploy
```

If migrations have not been introduced yet, document that the release still
uses `prisma db push` and treat schema changes as higher risk.

## Create A Release Tag

Update `package.json` version, merge the release PR, then tag the merge commit:

```bash
git tag -a v0.1.0 -m "DreamSpirit v0.1.0"
git push origin v0.1.0
```

## Release Notes

Each release note should include:

- User-visible changes.
- Deployment or environment changes.
- Database migration notes.
- Known risks or manual verification steps.
