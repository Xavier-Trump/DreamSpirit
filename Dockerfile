FROM node:22-bookworm-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN DATABASE_URL="postgresql://dreamspirit:build-only@localhost:5432/dreamspirit?schema=public" \
  AUTH_SECRET="build-only-placeholder" \
  AUTH_URL="http://localhost:3000" \
  npm run build \
  && npm prune --omit=dev

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start"]
