# ClickBeard

REST API for managing barbershop appointments, built with [NestJS](https://nestjs.com/) and TypeScript.

## Architecture

The project follows NestJS's standard modular structure, organized by domain. Inside each domain module, code is further layered following Clean Architecture: `core/domain` (entities, value objects, domain errors — no framework dependencies), `core/application` (use cases, DTOs, mappers, and port interfaces implemented by infrastructure), and `presentation` (NestJS controllers and HTTP request/response DTOs).

```text
src/
├── main.ts                          # Application bootstrap, global ValidationPipe and Swagger configuration
├── app.module.ts                    # Root, global module
├── modules/
│   ├── auth/                        # Authentication — scaffolded, not yet implemented
│   │   └── index.module.ts
│   │
│   ├── identity/                    # Users: registration, authentication, roles, activation
│   │   ├── core/
│   │   │   ├── domain/
│   │   │   │   ├── entities/        # User
│   │   │   │   ├── value-objects/   # Email, Password (hashed), PlainPassword
│   │   │   │   ├── enums/           # UserRole (CLIENT, BARBER, ADMIN)
│   │   │   │   └── errors/          # Domain errors (InvalidEmailError, WeakPasswordError, ...)
│   │   │   └── application/
│   │   │       ├── dtos/            # Use case input/output DTOs
│   │   │       ├── mappers/         # User -> UserDto
│   │   │       ├── ports/           # UserRepository, PasswordHasher
│   │   │       └── use-cases/       # RegisterUser, AuthenticateUser, GetUserProfile,
│   │   │                            # ChangePassword, ChangeUserRole, ActivateUser, DeactivateUser
│   │   ├── presentation/
│   │   │   ├── controllers/         # UsersController (/users)
│   │   │   └── dtos/                # *.request.dto.ts / *.response.dto.ts (class-validator + Swagger)
│   │   └── index.module.ts          # IdentityModule wiring
│   │
│   ├── barber/                      # Barber profiles and their assigned qualifications
│   │   ├── core/
│   │   │   ├── domain/
│   │   │   │   ├── entities/        # Barber
│   │   │   │   ├── value-objects/   # Age
│   │   │   │   └── errors/          # BarberNotFoundError, InvalidHiringDateError, ...
│   │   │   └── application/
│   │   │       ├── dtos/            # Use case input/output DTOs
│   │   │       ├── mappers/         # Barber (+ Qualification[]) -> BarberDto
│   │   │       ├── policies/        # ensureRequesterIsAdmin
│   │   │       ├── ports/           # BarberRepository, UserDirectory (read-only view into Identity)
│   │   │       └── use-cases/       # CreateBarber, UpdateBarber, GetBarber, ListBarbers,
│   │   │                            # AddQualificationToBarber, RemoveQualificationFromBarber
│   │   ├── presentation/
│   │   │   ├── controllers/         # BarbersController (/barbers)
│   │   │   └── dtos/
│   │   └── index.module.ts          # BarberModule wiring
│   │
│   ├── qualification/               # Qualification catalog (e.g. "Beard Trim", "Fade Cut")
│   │   ├── core/
│   │   │   ├── domain/
│   │   │   │   ├── entities/        # Qualification
│   │   │   │   └── errors/          # QualificationNotFoundError, QualificationInUseError, ...
│   │   │   └── application/
│   │   │       ├── dtos/            # Use case input/output DTOs
│   │   │       ├── mappers/         # Qualification -> QualificationDto
│   │   │       ├── ports/           # QualificationRepository
│   │   │       └── use-cases/       # CreateQualification, UpdateQualification,
│   │   │                            # DeleteQualification, ListQualifications
│   │   ├── presentation/
│   │   │   ├── controllers/         # QualificationsController (/qualifications)
│   │   │   └── dtos/
│   │   └── index.module.ts          # QualificationModule wiring
│   │
│   └── scheduling/                  # Appointment scheduling — scaffolded, not yet implemented
│       └── index.module.ts
│
└── shared/
    ├── application/
    │   └── use-case.ts              # Generic UseCase<Input, Output> contract implemented by every use case
    ├── config/                      # Environment, Postgres, Redis and queue configuration
    ├── database/                    # PostgreSQL integration via Sequelize
    ├── presentation/
    │   └── interceptors/            # FieldSelectionInterceptor (sparse fieldsets via ?fields=)
    └── queue/                       # Queue integration via BullMQ/Redis
```

- Each business domain (`auth`, `identity`, `barber`, `qualification`, `scheduling`) lives in its own module under `src/modules`, keeping the code isolated and easy to evolve independently. `barber` and `qualification` were deliberately split into separate modules — a barber profile and the qualification catalog are distinct bounded contexts that happen to reference each other (a barber holds qualification ids; deleting a qualification checks whether any barber still uses it), so each module's use cases reach into the other's ports via plain relative imports rather than merging the two domains.
- `src/shared` concentrates cross-cutting integrations and configuration reused across domain modules: validated environment variables (`class-validator`), PostgreSQL connection (Sequelize), asynchronous queues with Redis (BullMQ), the generic `UseCase` contract every use case implements, and the `FieldSelectionInterceptor` presentation interceptor (see [API conventions](#api-conventions) below).
- Domain and application layers have no dependency on NestJS or any infrastructure package — controllers depend on use cases, use cases depend on port interfaces, and (once written) infrastructure adapters implement those ports. No persistence adapters exist yet, so the repository/hasher/directory ports (`UserRepository`, `PasswordHasher`, `BarberRepository`, `QualificationRepository`, `UserDirectory`) are defined but not yet bound to a concrete implementation, and `auth`/`scheduling` are empty scaffolds.
- Supporting infrastructure (PostgreSQL, Redis and, optionally, the application itself) runs in Docker containers, orchestrated by `docker-compose.yml`.
- Interactive API documentation is generated automatically by Swagger and is available at `/docs` while the application is running.

## API conventions

- **Sparse fieldsets**: any endpoint on a controller decorated with `FieldSelectionInterceptor` accepts a `?fields=a,b,c` query parameter to return only the requested top-level response fields (e.g. `GET /barbers/:id?fields=id,name`). Every controller in this project uses it.
- **Authorization**: there is no route guard/JWT middleware yet. Actions restricted to admins (see Business Rules) are enforced inside the use case itself via the `ensureRequesterIsAdmin` policy, and the caller must pass the acting user's id explicitly as `requesterId` in the request body.

## Business rules

### Identity (users)

- Every user has a role: `CLIENT` (default on registration), `BARBER`, or `ADMIN`.
- A user's name must be at least 2 characters long once trimmed.
- Email addresses are normalized (trimmed and lower-cased) and validated against a standard email format; they must be unique across users.
- Passwords must be at least 8 characters long and contain at least one letter and one number before being hashed; only the hash is ever persisted or compared.
- Changing a password requires the current password to be correct, and the new password must be different from the current one.
- Changing a user's role to the role it already has is rejected as a no-op.
- An `ADMIN` account can never be deactivated. A non-admin user cannot be deactivated twice, nor activated if already active.
- Authentication fails with the same "invalid credentials" error whether the email doesn't exist or the password is wrong, to avoid leaking which emails are registered.

### Barber

- A barber profile's id is the same as the underlying Identity user's id (one-to-one).
- A barber profile can only be created for a user that exists in Identity and currently has the `BARBER` role; a user can only have one barber profile.
- A barber must always have at least one qualification: creation requires a non-empty list of qualification ids (duplicates are silently de-duplicated), and the last remaining qualification cannot be removed.
- A qualification already assigned to a barber cannot be assigned again, and a qualification not assigned to a barber cannot be removed.
- A barber's hiring date can never be set in the future (on creation or update).
- A barber's age must be between 18 and 100.
- Creating a barber and adding/removing a qualification from a barber all require the requester to be an `ADMIN`.

### Qualification

- A qualification name must be at least 2 characters long once trimmed and must be unique across the catalog; description is optional and blank/whitespace-only values are stored as absent.
- A qualification cannot be deleted while at least one barber still has it assigned.
- Creating, updating, and deleting qualifications all require the requester to be an `ADMIN`.

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
