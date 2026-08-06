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
│   ├── scheduling/                  # Appointment scheduling: booking, cancellation, availability
│   │   ├── core/
│   │   │   ├── domain/
│   │   │   │   ├── entities/        # Appointment
│   │   │   │   ├── value-objects/   # TimeSlot (30-minute slots within business hours)
│   │   │   │   ├── enums/           # AppointmentStatus (SCHEDULED, CANCELLED)
│   │   │   │   ├── events/          # AppointmentCreated, AppointmentCancelled
│   │   │   │   └── errors/          # BarberTimeSlotConflictError, AppointmentTooSoonError, ...
│   │   │   └── application/
│   │   │       ├── dtos/            # Use case input/output DTOs
│   │   │       ├── mappers/         # Appointment -> AppointmentDto, TimeSlot -> TimeSlotDto
│   │   │       ├── policies/        # ensureRequesterIsAdmin
│   │   │       ├── ports/           # AppointmentRepository, AvailabilityService, BarberDirectory,
│   │   │       │                    # TransactionManager (reuses Identity's UserRepository directly)
│   │   │       └── use-cases/       # CreateAppointment, CancelAppointment, GetAppointment,
│   │   │                            # ListCustomerAppointments, ListTodayAppointments,
│   │   │                            # ListFutureAppointments, ListAvailableTimeSlots
│   │   ├── presentation/
│   │   │   ├── controllers/         # AppointmentsController (/appointments)
│   │   │   └── dtos/
│   │   └── index.module.ts          # SchedulingModule wiring
│   │
│   └── analytics/                   # Admin dashboard: read-only metrics across every other module
│       ├── core/
│       │   ├── domain/
│       │   │   ├── enums/           # PeriodPreset (TODAY, WEEK, MONTH, YEAR, CUSTOM)
│       │   │   ├── value-objects/   # DateRange
│       │   │   └── errors/          # InvalidDateRangeError, CustomRangeRequiredError, ...
│       │   └── application/
│       │       ├── dtos/            # Read models (UserMetricsDto, AppointmentMetricsDto, ...) and
│       │       │                    # use case input/output DTOs
│       │       ├── mappers/         # DateRangeFilterDto -> DateRange
│       │       ├── policies/        # ensureRequesterIsAdmin
│       │       ├── ports/           # UserMetricsQuery, AppointmentMetricsQuery, BarberMetricsQuery,
│       │       │                    # CustomerMetricsQuery, AnalyticsRepository (future event projections)
│       │       └── use-cases/       # GetDashboardMetrics, GetUserMetrics, GetAppointmentMetrics,
│       │                            # GetBarberMetrics, GetCustomerMetrics, GetOccupationMetrics
│       ├── presentation/
│       │   ├── controllers/         # AnalyticsController (/analytics) — every route @Auth(ADMIN)
│       │   └── dtos/
│       └── index.module.ts          # AnalyticsModule wiring
│
└── shared/
    ├── application/
    │   ├── use-case.ts              # Generic UseCase<Input, Output> contract implemented by every use case
    │   ├── ports/                   # EventBus, MessageQueue, Clock, CacheManager, CachePolicy,
    │   │                            # CacheInvalidationService — cross-module technical contracts
    │   └── cache/                   # CacheKey(Prefix), CacheOptions, CacheResource, CacheKeyGenerator,
    │                                # CachedUseCase / CacheInvalidatingUseCase decorators (see Caching below)
    ├── domain/
    │   └── events/                  # DomainEvent<Payload> — the shape every module's events implement
    ├── config/                      # Environment, Postgres, Redis and queue configuration
    ├── database/                    # PostgreSQL integration via Sequelize
    ├── presentation/
    │   └── interceptors/            # FieldSelectionInterceptor (sparse fieldsets via ?fields=)
    └── queue/                       # Queue integration via BullMQ/Redis
```

- Each business domain (`auth`, `identity`, `barber`, `qualification`, `account-verification`, `notification`, `scheduling`, `analytics`) lives in its own module under `src/modules`, keeping the code isolated and easy to evolve independently. `barber` and `qualification` were deliberately split into separate modules — a barber profile and the qualification catalog are distinct bounded contexts that happen to reference each other (a barber holds qualification ids; deleting a qualification checks whether any barber still uses it), so each module's use cases reach into the other's ports via plain relative imports rather than merging the two domains. `auth` and `account-verification` follow the same pattern for the user identity they need: instead of depending on Identity's `User` entity, each defines its own decoupled `UserDirectory` port and snapshot type, while still literally reusing Identity's `PasswordHasher` port (a technology-agnostic hash/compare contract, not a domain concept) for both passwords and verification codes. `analytics` takes the same isolation principle further still: it owns no data of its own at all, so instead of reaching into another module's repository or entities it defines its own narrow, read-only ports (`UserMetricsQuery`, `AppointmentMetricsQuery`, `BarberMetricsQuery`, `CustomerMetricsQuery`) scoped to exactly the aggregates a dashboard needs, never duplicating another module's business rules.
- `src/shared` concentrates cross-cutting integrations and configuration reused across domain modules: validated environment variables (`class-validator`), PostgreSQL connection (Sequelize), asynchronous queues with Redis (BullMQ), the generic `UseCase` contract every use case implements, the cache-aside/invalidation primitives every cached use case is wrapped with (`CacheManager`, `CachePolicy`, `CacheInvalidationService`, `CacheKeyGenerator`, `CachedUseCase`/`CacheInvalidatingUseCase` — see [Caching](#caching) below), the `DomainEvent`/`EventBus`/`MessageQueue`/`Clock` primitives every module's event publishing builds on (see [Event-driven notifications](#event-driven-notifications) below), and the `FieldSelectionInterceptor` presentation interceptor (see [API conventions](#api-conventions) below).
- Domain and application layers have no dependency on NestJS or any infrastructure package — controllers depend on use cases, use cases depend on port interfaces, and (once written) infrastructure adapters implement those ports. No persistence, queue, cache or email adapters exist yet, so every port defined so far (`UserRepository`, `PasswordHasher`, `BarberRepository`, `QualificationRepository`, `UserDirectory`, `TokenProvider`, `RefreshTokenRepository`, `EventBus`, `MessageQueue`, `Clock`, `VerificationCodeRepository`, `VerificationCodeGenerator`, `SessionManager`, `LanguageResolver`, `MessageTemplateProvider`, `NotificationSender`, `AppointmentRepository`, `AvailabilityService`, `BarberDirectory`, `TransactionManager`, `UserMetricsQuery`, `AppointmentMetricsQuery`, `BarberMetricsQuery`, `CustomerMetricsQuery`, `AnalyticsRepository`, `CacheManager`, `CachePolicy`, `CacheInvalidationService`) is defined but not yet bound to a concrete implementation.
- Supporting infrastructure (PostgreSQL, Redis and, optionally, the application itself) runs in Docker containers, orchestrated by `docker-compose.yml`.
- Interactive API documentation is generated automatically by Swagger and is available at `/docs` while the application is running.

## API conventions

- **Sparse fieldsets**: any endpoint on a controller decorated with `FieldSelectionInterceptor` accepts a `?fields=a,b,c` query parameter to return only the requested top-level response fields (e.g. `GET /barbers/:id?fields=id,name`). Every controller in this project uses it.
- **Authorization**: every protected route is guarded via the composed `@Auth(...roles)` / `@SelfOrAdmin()` decorators (`auth` module, `presentation/decorators`). `AccessTokenGuard` validates the bearer access token and attaches the caller's id and **current** role to the request; `RolesGuard` enforces an optional role allow-list (no roles means any authenticated user); `SelfOrAdminGuard` allows a route for the resource's own owner or an `ADMIN`. Use cases still receive the acting user's id (`requesterId`/`userId`), but controllers now source it from the verified token via `@CurrentUser()` instead of trusting it from the request body. Every admin-only use case also re-checks the role itself via the `ensureRequesterIsAdmin` policy, so the rule holds even if a use case is ever invoked outside its guarded route — e.g. `GetAppointmentUseCase`'s ownership check runs inside the use case regardless of the controller's own `@Auth()` guard.

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

## Caching

Every cacheable read is wrapped by a generic Decorator instead of calling a cache from inside the use case — the application layer never imports anything cache-related, so a use case's own logic is identical whether it ends up cached or not.

```text
GetBarberUseCase ────wrapped by────► CachedUseCase<Input, Output>            (Cache-Aside)
                                          1. CacheManager.get(key)
                                          2. hit  → return the cached value, the wrapped use case never runs
                                          3. miss → run the wrapped use case
                                          4. CacheManager.set(key, result, { ttlSeconds })
                                          5. return the result

UpdateBarberUseCase ─wrapped by────► CacheInvalidatingUseCase<Input, Output>
                                          1. run the wrapped use case (persists the change)
                                          2. CacheInvalidationService.invalidateKeys/invalidatePrefixes(...)
                                          3. return the result   — synchronously, before the caller gets a response
```

- `CacheManager` (`shared/application/ports`) is the only port that actually talks to a cache technology — `get`/`set`/`delete`/`deleteByPrefix`. It's defined but not implemented yet, same as every other port in this project; swapping Redis for anything else will never touch the application layer.
- `CachePolicy` resolves how long each `CacheResource` (`USER_PROFILE`, `BARBER`, `BARBERS_LIST`, `QUALIFICATIONS`, `APPOINTMENT`, `CUSTOMER_APPOINTMENTS`, `AVAILABLE_TIME_SLOTS`, and one per Analytics metric) stays cached, so tuning a TTL never requires touching a use case.
- `CacheKeyGenerator` (`shared/application/cache`) is the single place every cache key format is defined (`user:{id}`, `barber:{id}`, `barbers:list:{page}`, `appointments:{customerId}:{page}`, `time-slots:{barberId}:{date}:{qualificationId}`, `dashboard:{period}`, `metrics:{type}:{period}`, ...) — no module's wiring ever builds a key string by hand.
- Invalidation is always **synchronous**, never event-driven: a write use case's `index.module.ts` wiring wraps it in `CacheInvalidatingUseCase`, which clears the affected keys/prefixes right after persistence and before the caller gets a response, so the very next read is guaranteed fresh. Domain events keep existing for their own purpose (see [Event-driven notifications](#event-driven-notifications) above) — cache consistency never depends on one being consumed.
- `GetAppointmentUseCase`'s cache key is the one exception that includes the requester's id (`appointment:{id}:{requesterId}`, not just `appointment:{id}`): it performs its own ownership/admin check internally (its route is only guarded by `@Auth()` with no role restriction, so any authenticated caller reaches the use case), so a cache hit must never let one caller ride on another caller's already-authorized result. Every other cached read either has no such check or is already gated by a controller guard before the cache is ever reached (e.g. Analytics' `@Auth(ADMIN)`), so its key is shared across every valid caller.
- Currently cached: Identity's `GetUserProfile`; Barber's `GetBarber` and `ListBarbers`; Qualification's `ListQualifications`; Scheduling's `GetAppointment`, `ListCustomerAppointments` and `ListAvailableTimeSlots`; and all six Analytics dashboard/metrics use cases. The writes that make those stale (`CreateBarber`, `UpdateBarber`, `AddQualificationToBarber`, `RemoveQualificationFromBarber`, `CreateQualification`, `UpdateQualification`, `DeleteQualification`, `CreateAppointment`, `CancelAppointment`, `ChangePassword`, `ChangeUserRole`, `DeactivateUser`, `ActivateUser`) invalidate exactly the keys/prefixes they affect.

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

### Scheduling (appointments)

- An appointment can only be booked for a barber who is active and holds the requested qualification.
- Appointments are booked in fixed 30-minute slots aligned to business hours (08:00–18:00); a slot outside that grid is rejected.
- Appointments must be booked at least 2 hours in advance; the same 2-hour window applies to cancellation — an appointment can no longer be cancelled once it's inside that window.
- A barber cannot be double-booked: creating an appointment fails if that barber's time slot is already occupied by another non-cancelled appointment.
- Only the appointment's own customer, or an `ADMIN`, may view or cancel it.
- Cancelling an already-cancelled appointment is rejected (`AppointmentAlreadyCancelledError`), not treated as a no-op.

### Analytics (admin dashboard)

- Every endpoint is restricted to `ADMIN`.
- Analytics owns no data: every read composes narrow, Analytics-defined ports (`UserMetricsQuery`, `AppointmentMetricsQuery`, `BarberMetricsQuery`, `CustomerMetricsQuery`) instead of reusing another module's repository or duplicating its business rules.
- Every query accepts a date-range filter — `TODAY`, `WEEK`, `MONTH`, `YEAR`, or `CUSTOM` (which requires both `startAt` and `endAt`) — resolved by the `DateRange` value object.
- `AnalyticsRepository` is a projection-store port reserved for a future event-driven adapter that maintains metrics incrementally; nothing consumes it yet, so dashboard/metric reads currently query the source ports directly (through the cache — see [Caching](#caching) above).

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
