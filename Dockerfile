# syntax=docker/dockerfile:1

FROM node:20-slim AS base

WORKDIR /app

COPY package.json package-lock.json ./

# ============================================================
# DEVELOPMENT
# ============================================================

FROM base AS development

ENV NODE_ENV=development

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ============================================================
# BUILD
# ============================================================

FROM base AS build

# Do NOT set NODE_ENV=production here.
# The build needs the devDependencies, including the Nest CLI.

RUN npm ci

COPY . .

RUN npm run build

# ============================================================
# PRODUCTION
# ============================================================

FROM node:20-slim AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./

# Installs only the dependencies needed at runtime
RUN npm ci --omit=dev

# Copies only the compiled code
COPY --from=build /app/dist ./dist

# Files needed for Sequelize CLI/migrations
COPY --from=build /app/database ./database
COPY --from=build /app/.sequelizerc ./

EXPOSE 3000

CMD ["node", "dist/main.js"]

# ============================================================
# DATABASE MIGRATION
# ============================================================

FROM node:20-slim AS database-migration

WORKDIR /app

COPY package.json package-lock.json ./

# sequelize-cli is in devDependencies,
# so we need the development dependencies
RUN npm ci

COPY database ./database

COPY .sequelizerc ./

CMD ["npx", "sequelize-cli", "db:migrate"]