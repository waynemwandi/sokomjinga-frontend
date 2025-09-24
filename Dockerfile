FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

# --- add curl for healthcheck ---
RUN apk add --no-cache curl
# ---------------------------------

COPY --from=build /app/build ./build
COPY package*.json ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["node", "build"]
