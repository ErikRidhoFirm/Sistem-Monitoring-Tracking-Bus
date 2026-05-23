FROM oven/bun:1.3.6 AS base
WORKDIR /app
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile

FROM base AS build
COPY . .
RUN bunx --bun prisma generate
RUN bun run build

FROM oven/bun:1.3.6 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=9999

COPY bun.lock package.json ./
RUN bun install --frozen-lockfile

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/lib ./lib
COPY --from=build /app/generated ./generated
COPY --from=build /app/types ./types
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 9999
ENTRYPOINT ["/app/docker-entrypoint.sh"]
