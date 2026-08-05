# ClickBeard

REST API for managing barbershop appointments, built with [NestJS](https://nestjs.com/) and TypeScript.

## Architecture

The project follows NestJS's standard modular structure, organized by domain:

```text
src/
├── main.ts                  # Application bootstrap and Swagger configuration
├── app.module.ts             # Root, global module
├── modules/
│   ├── auth/                 # Authentication
│   ├── identity/              # Identity / users
│   ├── barber/                # Barber registration and management
│   └── scheduling/            # Appointment scheduling
└── shared/
    ├── config/                # Environment, Postgres, Redis and queue configuration
    ├── database/               # PostgreSQL integration via Sequelize
    └── queue/                  # Queue integration via BullMQ/Redis
```

- Each business domain (`auth`, `identity`, `barber`, `scheduling`) lives in its own module under `src/modules`, keeping the code isolated and easy to evolve independently.
- `src/shared` concentrates cross-cutting integrations and configuration reused across domain modules: validated environment variables (`class-validator`), PostgreSQL connection (Sequelize), and asynchronous queues with Redis (BullMQ).
- Supporting infrastructure (PostgreSQL, Redis and, optionally, the application itself) runs in Docker containers, orchestrated by `docker-compose.yml`.
- Interactive API documentation is generated automatically by Swagger and is available at `/docs` while the application is running.

## Technologies

- **[NestJS](https://nestjs.com/)** + **TypeScript** — the application's main framework and language.
- **[Sequelize](https://sequelize.org/)** (`sequelize-typescript`) + **PostgreSQL** — ORM and relational database.
- **[BullMQ](https://docs.bullmq.io/)** + **Redis** — asynchronous processing queues and cache.
- **[Swagger](https://docs.nestjs.com/openapi/introduction)** (`@nestjs/swagger`) — interactive API documentation.
- **class-validator** / **class-transformer** — data validation and transformation (e.g., environment variables, DTOs).
- **Jest** + **Supertest** — unit and end-to-end testing.
- **ESLint** + **Prettier** — code standardization and quality.
- **Commitizen** (`cz-conventional-changelog`) — commit message standardization.
- **Docker** / **Docker Compose** — containerization of the application and infrastructure (PostgreSQL and Redis).

## Scripts

The project provides a series of scripts to make it easier to manage infrastructure and the development environment.

### Initial Setup

#### `npm run setup`

Performs the entire initial environment setup.

#### What this command does

1. Installs all project dependencies.
2. Creates the `.env` file from `.env.example` (if it doesn't already exist).
3. Starts the PostgreSQL and Redis containers.
4. Waits for PostgreSQL to become available.
5. Runs all migrations.
6. Runs all seeders.
7. Finishes by reporting that the environment is ready for development.

Once it's done, simply start the application:

```bash
npm run dev
```

---

### Docker

All commands use the file:

```text
docker/docker-compose.yml
```

#### `npm run docker:up`

Starts all the infrastructure defined in Docker Compose.

Use this command when you want to bring up all of the application's services.

---

#### `npm run docker:down`

Stops all application containers while keeping the volumes.

---

#### `npm run docker:restart`

Restarts all containers.

Very useful after changes to Docker configuration.

---

#### `npm run docker:logs`

Displays the logs of all services in real time.

---

#### `npm run docker:build`

Rebuilds all application images.

Use this command whenever there are changes to the `Dockerfile`.

---

#### `npm run docker:clean`

Completely removes the Docker infrastructure.

This command:

- stops the containers;
- removes the volumes;
- removes orphaned containers.

> **Warning:** all persisted PostgreSQL and Redis data will be removed.

---

### Database

The commands below control only PostgreSQL and Redis.

---

#### `npm run db:up`

Starts only the containers responsible for data persistence.

Services started:

- PostgreSQL
- Redis

---

#### `npm run db:down`

Stops only the database services.

The application remains unaffected.

---

#### `npm run db:restart`

Restarts only PostgreSQL and Redis.

---

#### `npm run db:logs`

Displays the PostgreSQL and Redis logs.

Ideal for debugging connection or startup issues.

---

#### `npm run db:reset`

Completely removes the database volumes and creates a new instance.

Flow executed:

1. Removes containers and volumes.
2. Starts PostgreSQL and Redis.
3. The database will be empty.

After running this command, it's recommended to run again:

```bash
npm run migration:up
npm run seed:up
```

or simply:

```bash
npm run setup
```

---

#### `npm run redis:flush`

Removes all keys stored in Redis.

This command is useful during development when you need to clear:

- cache;
- queues;
- sessions;
- distributed locks.

Does not affect PostgreSQL.

---

### Migrations

#### `npm run migration:generate`

Creates a new migration.

Example:

```bash
npm run migration:generate -- create-users-table
```

---

#### `npm run migration:up`

Runs all pending migrations.

---

#### `npm run migration:down`

Reverts the last executed migration.

---

#### `npm run migration:reset`

Removes all executed migrations.

Normally used only during development.

---

### Seeders

#### `npm run seed:up`

Runs all seeders.

Used to populate the database with initial data.

---

#### `npm run seed:down`

Removes all data inserted by the seeders.

---

### Recommended Workflow

#### First run

```bash
git clone <repository>

cd project

npm run setup

npm run dev
```

---

#### Daily development

If the infrastructure already exists:

```bash
npm run db:up

npm run dev
```

or, if the entire application is dockerized:

```bash
npm run docker:up
```

---

#### Restart only the databases

```bash
npm run db:restart
```

---

#### Completely clean the environment

```bash
npm run docker:clean

npm run setup
```

---
