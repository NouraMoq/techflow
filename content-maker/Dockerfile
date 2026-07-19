# ============================================================================
# صانع المحتوى | Content Maker — production image (Next.js + Prisma + PostgreSQL)
# The Prisma provider is switched to postgresql at build time (scripts/use-postgres.sh)
# so the committed schema stays SQLite for local dev. The Prisma query engine is
# generated inside Alpine here, matching the Alpine runner (linux-musl).
# ============================================================================

# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
# Deps (legacy-peer-deps required by this project)
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps --no-audit --no-fund
# Source
COPY . .
# Switch datasource to PostgreSQL, generate client, build.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV NEXT_TELEMETRY_DISABLED=1
RUN sh scripts/use-postgres.sh \
 && npx prisma generate \
 && npm run build

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Copy the built app + full node_modules (includes prisma CLI + engine for
# runtime migrations, and tsx for optional seeding).
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh
# Run as non-root
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -S nextjs
USER nextjs
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
