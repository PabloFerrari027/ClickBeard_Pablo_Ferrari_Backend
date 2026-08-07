# syntax=docker/dockerfile:1

# node:20-slim (Debian/glibc) rather than an alpine base: bcrypt is a
# native module and its prebuilt binaries reliably match glibc, avoiding
# a full node-gyp compile (python3/make/g++) that alpine would need.
FROM node:20-slim AS base
WORKDIR /app
COPY package.json package-lock.json ./

# docker-compose's `app` service builds this stage and overrides the
# command with `npm run dev` (nest start --watch) against the bind-mounted
# source, so it needs devDependencies (the Nest CLI, ts-node, ...).
FROM base AS development
ENV NODE_ENV=development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# Default (last) stage: what a plain `docker build .` produces, meant
# for actual deployments — compiled output only, no devDependencies.
FROM base AS production
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
