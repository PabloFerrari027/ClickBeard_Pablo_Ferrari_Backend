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

ENV NODE_ENV=production

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

# Instala apenas dependências necessárias em runtime
RUN npm ci --omit=dev

# Copia somente o código compilado
COPY --from=build /app/dist ./dist

# Copia arquivos necessários para Sequelize CLI/migrations
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

# sequelize-cli está nas devDependencies,
# portanto precisamos das dependências de desenvolvimento
RUN npm ci

COPY database ./database
COPY .sequelizerc ./

CMD ["npx", "sequelize-cli", "db:migrate"]