FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS dev
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 5173
CMD ["npm", "run", "preview"]
