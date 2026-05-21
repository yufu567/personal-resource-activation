# Launch Plan

## Runtime

- Deploy the Next.js app on a VPS with Docker Compose.
- Run Postgres and Redis as managed services or the included Compose services.
- Use an S3-compatible bucket such as Cloudflare R2 for uploaded files.
- Keep `AI_PROVIDER=mock` until real model credentials are intentionally configured.

## First Deployment

1. Provision a VPS with Docker and Docker Compose.
2. Copy `.env.example` to `.env` and replace every placeholder value.
3. Build and start the stack:

```bash
docker compose up -d --build
```

4. Check health:

```bash
curl http://localhost:3000/api/health
```

The health response only reports configured/missing dependency status and must not expose secret values.

## Required Environment

- `APP_URL`: public application URL.
- `APP_VERSION`: release label or commit SHA.
- `DATABASE_URL`: Postgres connection string.
- `REDIS_URL`: Redis connection string for queues and background work.
- `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_REGION`: S3-compatible storage target.
- `OBJECT_STORAGE_ACCESS_KEY_ID`, `OBJECT_STORAGE_SECRET_ACCESS_KEY`: object storage credentials.
- `AUTH_SECRET`: future auth session signing secret.
- `TOKEN_ENCRYPTION_KEY`: key used to encrypt connector tokens before storage.
- `AI_PROVIDER`: `mock` for MVP, later `openai` or another provider.

## Backup

- Enable daily Postgres dumps before inviting users.
- Store dumps outside the VPS, encrypted at rest.
- Keep object storage versioning enabled for uploaded files.
- Redis is rebuildable for queues, but append-only persistence is enabled in local Compose.

## Rollback

1. Keep the previous image tag or commit SHA.
2. Stop the current app container.
3. Start the prior image with the same `.env`.
4. If a database migration was applied, restore the latest pre-migration backup before restarting.

## Monitoring

- Add uptime monitoring for `/api/health`.
- Add Sentry before real user onboarding.
- Keep structured server logs and rotate them at the host level.
- Add Bull Board or equivalent once background sync workers are introduced.
