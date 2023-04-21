FROM node:18-alpine as builder
COPY . /app
WORKDIR /app
RUN npm i && npm run build
FROM pierrezemb/gostatic
COPY --from=builder /app/build/ /srv/http/
