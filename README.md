# ClickBeard

REST API for managing barbershop appointments, built with [NestJS](https://nestjs.com/) and TypeScript.

## Architecture

The project follows NestJS's standard modular structure, organized by domain. Inside each domain module, code is further layered following Clean Architecture: `core/domain` (entities, value objects, domain errors — no framework dependencies), `core/application` (use cases, DTOs, mappers, and port interfaces implemented by infrastructure), and `presentation` (NestJS controllers and HTTP request/response DTOs).

```text
src/
├── main.ts                          # Application bootstrap, global ValidationPipe and Swagger configuration
├── app.module.ts                    # Root, global module
├── modules/
│   ├── auth/                        # Authentication: login, refresh/rotate and revoke sessions — Core only, no infra yet
│   │   ├── core/
│   │   │   ├── domain/
│   │   │   │   ├── entities/        # RefreshToken
│   │   │   │   ├── events/          # UserLoggedIn
│   │   │   │   └── errors/          # InvalidCredentialsError, InvalidRefreshTokenError, ...
│   │   │   └── application/
│   │   │       ├── dtos/            # Use case input/output DTOs
│   │   │       ├── mappers/         # AuthUserSnapshot -> AuthenticatedUserDto
│   │   │       ├── ports/           # UserDirectory, TokenProvider, RefreshTokenRepository
│   │   │       │                    # (reuses Identity's PasswordHasher directly instead of redefining it)
│   │   │       └── use-cases/       # Login, RefreshToken, Logout
│   │   └── index.module.ts          # AuthModule wiring
│   │
│   ├── identity/                    # Users: registration, authentication, roles, activation
│   │   ├── core/
│   │   │   ├── domain/
│   │   │   │   ├── entities/        # User
│   │   │   │   ├── value-objects/   # Email, Password (hashed), PlainPassword
│   │   │   │   ├── enums/           # UserRole (CLIENT, BARBER, ADMIN)
│   │   │   │   ├── events/          # UserRegistered, PasswordChanged
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
│   ├── account-verification/        # Post-login email code: generate, resend, validate, expire, complete auth
│   │   ├── core/
│   │   │   ├── domain/
│   │   │   │   ├── entities/        # VerificationCode
│   │   │   │   ├── events/          # VerificationCodeGenerated, VerificationSucceeded, VerificationFailed
│   │   │   │   └── errors/          # VerificationCodeExpiredError, InvalidVerificationCodeError, ...
│   │   │   └── application/
│   │   │       ├── dtos/            # Use case input/output DTOs
│   │   │       ├── ports/           # VerificationCodeRepository, VerificationCodeGenerator, SessionManager
│   │   │       │                    # (reuses Identity's PasswordHasher to hash/compare the code)
│   │   │       └── use-cases/       # GenerateVerificationCode, ResendVerificationCode,
│   │   │                            # ValidateVerificationCode, InvalidateExpiredVerificationCodes,
│   │   │                            # CompleteAuthentication
│   │   └── index.module.ts          # AccountVerificationModule wiring
│   │
│   ├── notification/                # Generic event -> notification pipeline, reused by every notification
│   │   ├── core/
│   │   │   └── application/
│   │   │       ├── formatters/      # formatMessage — fills {{placeholder}} template variables
│   │   │       ├── ports/           # LanguageResolver, MessageTemplateProvider, NotificationSender,
│   │   │       │                    # NotificationDispatcher (alias of UseCase<DomainEvent, void>)
│   │   │       └── use-cases/       # DispatchNotification
│   │   └── index.module.ts          # NotificationModule wiring
│   │
│   └── scheduling/                  # Appointment scheduling — scaffolded, not yet implemented
│       └── index.module.ts
│
└── shared/
    ├── application/
    │   ├── use-case.ts              # Generic UseCase<Input, Output> contract implemented by every use case
    │   └── ports/                   # EventBus, MessageQueue, Clock — cross-module technical contracts
    ├── domain/
    │   └── events/                  # DomainEvent<Payload> — the shape every module's events implement
    ├── config/                      # Environment, Postgres, Redis and queue configuration
    ├── database/                    # PostgreSQL integration via Sequelize
    ├── presentation/
    │   └── interceptors/            # FieldSelectionInterceptor (sparse fieldsets via ?fields=)
    └── queue/                       # Queue integration via BullMQ/Redis
```

- Each business domain (`auth`, `identity`, `barber`, `qualification`, `account-verification`, `notification`, `scheduling`) lives in its own module under `src/modules`, keeping the code isolated and easy to evolve independently. `barber` and `qualification` were deliberately split into separate modules — a barber profile and the qualification catalog are distinct bounded contexts that happen to reference each other (a barber holds qualification ids; deleting a qualification checks whether any barber still uses it), so each module's use cases reach into the other's ports via plain relative imports rather than merging the two domains. `auth` and `account-verification` follow the same pattern for the user identity they need: instead of depending on Identity's `User` entity, each defines its own decoupled `UserDirectory` port and snapshot type, while still literally reusing Identity's `PasswordHasher` port (a technology-agnostic hash/compare contract, not a domain concept) for both passwords and verification codes.
- `src/shared` concentrates cross-cutting integrations and configuration reused across domain modules: validated environment variables (`class-validator`), PostgreSQL connection (Sequelize), asynchronous queues with Redis (BullMQ), the generic `UseCase` contract every use case implements, the `DomainEvent`/`EventBus`/`MessageQueue`/`Clock` primitives every module's event publishing builds on (see [Event-driven notifications](#event-driven-notifications) below), and the `FieldSelectionInterceptor` presentation interceptor (see [API conventions](#api-conventions) below).
- Domain and application layers have no dependency on NestJS or any infrastructure package — controllers depend on use cases, use cases depend on port interfaces, and (once written) infrastructure adapters implement those ports. No persistence, queue or email adapters exist yet, so every port defined so far (`UserRepository`, `PasswordHasher`, `BarberRepository`, `QualificationRepository`, `UserDirectory`, `TokenProvider`, `RefreshTokenRepository`, `EventBus`, `MessageQueue`, `Clock`, `VerificationCodeRepository`, `VerificationCodeGenerator`, `SessionManager`, `LanguageResolver`, `MessageTemplateProvider`, `NotificationSender`) is defined but not yet bound to a concrete implementation, and `scheduling` remains an empty scaffold.
- Supporting infrastructure (PostgreSQL, Redis and, optionally, the application itself) runs in Docker containers, orchestrated by `docker-compose.yml`.
- Interactive API documentation is generated automatically by Swagger and is available at `/docs` while the application is running.

## API conventions

- **Sparse fieldsets**: any endpoint on a controller decorated with `FieldSelectionInterceptor` accepts a `?fields=a,b,c` query parameter to return only the requested top-level response fields (e.g. `GET /barbers/:id?fields=id,name`). Every controller in this project uses it.
- **Authorization**: there is no route guard/JWT middleware yet. Actions restricted to admins (see Business Rules) are enforced inside the use case itself via the `ensureRequesterIsAdmin` policy, and the caller must pass the acting user's id explicitly as `requesterId` in the request body.

## Event-driven notifications

Business modules never send emails (or any other notification) directly — they only publish a domain event, and a generic, reusable pipeline turns that event into a sent notification. Nothing about this is specific to any one notification, which is what lets new ones be added without touching business logic.

```text
Identity.RegisterUser ────publish───► UserRegistered ──┐
Identity.ChangePassword ─publish───► PasswordChanged ──┤
Authentication.Login ────publish───► UserLoggedIn        (async, via a queue — not implemented yet)
                                                         │
AccountVerification.GenerateVerificationCode            │
  (a future queue consumer runs this on UserLoggedIn)   │
  ────────────publish───► VerificationCodeGenerated ────┤
                                                         ▼
                                     Notification.DispatchNotificationUseCase
                             (LanguageResolver → MessageTemplateProvider → format → NotificationSender)
```

- Every event implements the shared `DomainEvent<Payload>` shape (`name`, `occurredAt`, an optional `recipientEmail`, and a flat string `payload`) from `shared/domain/events`, and is published through the single `EventBus` port from `shared/application/ports`.
- `DispatchNotificationUseCase` (Notification module) is the one pipeline behind every notification: it resolves the recipient's preferred language (`LanguageResolver`, keyed by email — the one field every notifiable event carries), looks up the template for `event.name` + that language (`MessageTemplateProvider`), fills in `{{placeholder}}` variables from `event.payload`, and sends it (`NotificationSender`). It silently does nothing for events with no `recipientEmail` or no matching template, so unrelated events (like `VerificationSucceeded`/`VerificationFailed`) can flow through the same bus without triggering anything.
- The verification-code email is triggered by `VerificationCodeGenerated`, not `UserLoggedIn` — the code doesn't exist yet at the moment login succeeds, so the email can only be built once Account Verification has actually generated one.
- `MessageQueue` (`shared/application/ports`) models the async transport a real `EventBus` adapter would use internally to move a published event off the request path; no Core code calls it directly yet, since the queue infrastructure itself hasn't been implemented.

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

### Authentication (login sessions)

- Login authenticates by email + password only — never by name, since email is already a unique identifier. Credentials are checked the same way as Identity's own rule: the same "invalid credentials" error whether the account doesn't exist, is inactive, or the password is wrong.
- A successful login does **not** create a session by itself: `LoginUseCase` only confirms the credentials and publishes `UserLoggedIn`. The session (access + refresh token) is only created afterwards, by Account Verification's `CompleteAuthenticationUseCase`, once the emailed code has been validated.
- Refreshing a session always rotates the refresh token: the token used is revoked and linked (`replacedByTokenId`) to the new one issued in its place, so a reused/replayed refresh token can be told apart from the current one.
- Logging out revokes the given refresh token; logging out a token that was already revoked is a no-op, not an error.

### Account Verification (post-login code)

- Only one verification code can be active per user at a time. Generating a new one — whether because the user just logged in or asked to resend it — invalidates whatever code was active before.
- A code expires 10 minutes after it's generated and only ever exists as a hash at rest (hashed the same way as passwords, via Identity's `PasswordHasher`); the raw code only ever appears in the `VerificationCodeGenerated` event payload, for the email.
- A code allows at most 5 validation attempts; exceeding that locks it out even if the correct code is later supplied.
- A code cannot be validated again once it was already consumed (successfully validated) or invalidated (superseded or expired).
- The session can only be created after the code was successfully validated: `CompleteAuthenticationUseCase` re-checks the user's latest code is actually consumed itself, rather than trusting that validation happened first.

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

### Notifications

See [Event-driven notifications](#event-driven-notifications) for how this works mechanically; the notifications currently expected are:

- A welcome email on `UserRegistered`.
- A verification-code email on `VerificationCodeGenerated`.
- A password-changed email on `PasswordChanged`.

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
