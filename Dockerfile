FROM oven/bun:1.3.6 AS base
WORKDIR /app
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile

FROM base AS build
ARG NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ARG NEXT_PUBLIC_BUS_FEED_MODE
ARG NEXT_PUBLIC_MQTT_BROKER_URL
ARG NEXT_PUBLIC_MQTT_TOPIC
ARG NEXT_PUBLIC_MQTT_USERNAME
ARG NEXT_PUBLIC_MQTT_PASSWORD

ENV NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=$NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ENV NEXT_PUBLIC_BUS_FEED_MODE=$NEXT_PUBLIC_BUS_FEED_MODE
ENV NEXT_PUBLIC_MQTT_BROKER_URL=$NEXT_PUBLIC_MQTT_BROKER_URL
ENV NEXT_PUBLIC_MQTT_TOPIC=$NEXT_PUBLIC_MQTT_TOPIC
ENV NEXT_PUBLIC_MQTT_USERNAME=$NEXT_PUBLIC_MQTT_USERNAME
ENV NEXT_PUBLIC_MQTT_PASSWORD=$NEXT_PUBLIC_MQTT_PASSWORD

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
