FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV CLIENT_DIST_DIR=/app/dist

COPY --from=build /app/dist ./dist
COPY server/package*.json ./server/
RUN npm --prefix server ci --omit=dev
COPY server/server.js ./server/server.js

EXPOSE 3001
CMD ["npm", "--prefix", "server", "start"]
