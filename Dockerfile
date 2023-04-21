FROM node:18-alpine as builder
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate 
COPY . /app
WORKDIR /app
RUN pnpm i && pnpm run build
FROM pierrezemb/gostatic
COPY --from=builder /app/dist/ /srv/http/
