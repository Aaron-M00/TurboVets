# Secure Task Management System

A role-based task management system built as an Nx monorepo. NestJS + TypeORM + PostgreSQL on the
backend, Angular 21 + Tailwind on the frontend, with a shared `data` library for DTOs and an `auth`
library that holds reusable RBAC guards and decorators.

---

## Stack

- **Workspace:** Nx 22 (integrated)
- **API:** NestJS 11, TypeORM 0.3, PostgreSQL 14/16, JWT (HS256), bcryptjs
- **Web:** Angular 21 (standalone components, signals, zoneless), Angular CDK drag-drop, Tailwind 3
- **State management:** Angular Signals (signal/computed/effect) inside services — no NgRx, no
  Redux. For an app this size signals give reactive state, derived state, and persistence with
  a fraction of the boilerplate, and they're now the official Angular primitive.
- **Tests:** Jest — 65 tests across the workspace

## Workspace layout

```
apps/
  api/            NestJS backend (auth, tasks, audit, seed)
  dashboard/      Angular frontend (login, kanban-style task board)
libs/
  data/           Shared DTOs, enums, request/response contracts
  auth/           RBAC primitives — JWT guard, roles guard, decorators, role helpers
```

The libraries are workspace packages (`@app/data`, `@app/auth`). The frontend imports `@app/data`
for type contracts only — RBAC enforcement lives entirely on the server via `@app/auth`.

---

## Setup

### Prerequisites

- Node 20+ (developed on Node 22)
- PostgreSQL 14 or 16, accepting connections on `localhost:5432`
- npm 10+

### 1. Install

```bash
npm install
```

### 2. Configure env

Copy the example file and edit if your Postgres credentials differ:

```bash
cp .env.example .env
```

`.env` keys:

| Key            | Default       | Notes                                              |
| -------------- | ------------- | -------------------------------------------------- |
| `PORT`         | `3000`        | API port                                           |
| `CORS_ORIGIN`  | dev origin    | Comma-separated list of allowed origins            |
| `DB_HOST`      | `localhost`   |                                                    |
| `DB_PORT`      | `5432`        |                                                    |
| `DB_USER`      | `dev`         | OS-default user on Homebrew Postgres               |
| `DB_PASSWORD`  | (empty)       |                                                    |
| `DB_NAME`      | `taskmgr`     |                                                    |
| `DB_SYNC`      | `true`        | TypeORM auto-schema (dev only — use migrations otherwise) |
| `JWT_SECRET`   | dev value     | Replace with a long random string in production    |
| `JWT_EXPIRES_IN` | `1d`        |                                                    |
| `SEED_ON_BOOT` | `true`        | Seeds three demo users on first run if DB is empty |

### 3. Create the database

```bash
psql -d postgres -c "CREATE DATABASE taskmgr;"
```

### 4. Run

In two terminals:

```bash
# terminal 1 — API on http://localhost:3000
npx nx serve api

# terminal 2 — Web on http://localhost:4200
npx nx serve dashboard
```

The dev server proxies `/api` to the API, so the frontend just calls `/api/...`.

On first boot the API seeds three users (password `password123` for all):

| Email                 | Role   | Org        |
| --------------------- | ------ | ---------- |
| `owner@acme.test`     | Owner  | Acme       |
| `admin@acme.test`     | Admin  | Acme West  |
| `viewer@acme.test`    | Viewer | Acme West  |

### 5. Run tests

```bash
npx nx run-many -t test          # all projects
npx nx test @org/api             # backend only
npx nx test dashboard            # frontend only
npx nx test @app/auth            # role helper + guard
```

---

## Architecture

### Why an Nx monorepo?

The interesting boundaries in this project are not API vs. web — they are *contract* (`libs/data`)
and *RBAC* (`libs/auth`). Putting both in libraries means the controllers, frontend services, and
the seed script all import the same `RoleName`/`PermissionAction` enums. There is one source of
truth for what an "Admin" can do.

### Shared libraries

`libs/data` exports plain TypeScript: `RoleName`, `PermissionAction`, `TaskStatus`, `TaskCategory`,
and request/response DTOs. It has no NestJS or Angular dependency, so both apps consume it freely.

`libs/auth` exports the building blocks the API uses to enforce access:

- `JwtAuthGuard` — passport-jwt extraction + verification
- `RolesGuard` — reads `@Roles(...)` and `@RequirePermissions(...)` metadata
- `@Roles(...)`, `@RequirePermissions(...)`, `@CurrentUser()` decorators
- `permissionsFor(role)`, `hasPermission(role, action)`, `roleAtLeast(role, min)` helpers

Adding a new role or a new permission means editing two files: `enums.ts` (add the value) and
`role.helper.ts` (map the role to its actions). Controllers stay unchanged.

---

## Data model

```
organizations
  id (uuid pk)
  name
  parent_id (uuid, nullable, FK organizations.id)   -- 2-level hierarchy
  created_at

roles
  id (uuid pk)
  name (enum: owner, admin, viewer, unique)

permissions
  id (uuid pk)
  action (string, unique)                            -- e.g. task:create, audit:read

role_permissions   (join table)
  role_id, permission_id

users
  id (uuid pk)
  email (unique)
  password_hash
  name
  organization_id (FK organizations.id)
  role_id (FK roles.id)
  created_at

tasks
  id (uuid pk)
  title, description, category, status, position
  owner_id (FK users.id)
  organization_id (FK organizations.id)
  created_at, updated_at

audit_logs
  id (uuid pk)
  user_id, user_email, action, resource, resource_id
  organization_id, outcome (allowed | denied)
  created_at
```

```
Organization (parent)
   └── Organization (child)         -- Owner of parent sees both
         ├── User (Admin)           -- Admin manages own tasks in their org
         └── User (Viewer)          -- Viewer reads only own tasks
```

---

## Access control

### Roles and inheritance

Roles are linearly ranked: `Viewer < Admin < Owner`. Each role maps to a permission set in
[`libs/auth/src/lib/role.helper.ts`](libs/auth/src/lib/role.helper.ts):

| Permission     | Viewer | Admin | Owner |
| -------------- | :----: | :---: | :---: |
| `task:read`    |   ✓    |   ✓   |   ✓   |
| `task:create`  |        |   ✓   |   ✓   |
| `task:update`  |        |   ✓¹  |   ✓   |
| `task:delete`  |        |   ✓¹  |   ✓   |
| `audit:read`   |        |   ✓   |   ✓   |

¹ Admins may only mutate tasks they themselves own (enforced in `TasksService`).

### Organization scope

The hierarchy is two levels deep:

- **Owner of a parent org** sees and manages tasks in the parent and all direct child orgs.
- **Admin** is scoped to their own org; they can read every task in that org but only mutate their
  own.
- **Viewer** is scoped to their own org and sees all tasks in that org as read-only.

This mix of role-rank gating and per-record ownership checks is intentional — RBAC alone is not
enough for "tenants you can see" + "tasks you can edit". Both checks happen in the service layer
(see `TasksService.findAccessible` and `assertCanMutate`).

### How JWT integrates

1. `POST /api/auth/login` issues a JWT containing `{ sub, email, role, organizationId }`.
2. Every other endpoint is wrapped in `@UseGuards(JwtAuthGuard, RolesGuard)`.
3. `JwtStrategy.validate()` re-loads the user from the DB on each request, so revoked or deleted
   users cannot replay a token. The strategy returns the trimmed `AuthUser` shape.
4. `RolesGuard` reads the metadata from `@Roles(...)` and `@RequirePermissions(...)` and decides.
5. The `@CurrentUser()` decorator surfaces the authenticated user to the handler so it can apply
   ownership/scope checks.

### Audit logging

`AuditInterceptor` runs on every request and writes an entry to `audit_logs` with the resolved
user, the resource, the resource id (if present), the HTTP-derived action, and an `allowed` or
`denied` outcome. Denials are recorded when the controller throws 401/403. Audit entries are also
echoed to the Nest logger so they show up in stdout.

`GET /api/audit-log` is restricted to Admin and Owner roles via `@Roles(RoleName.Admin)` (Owner
inherits because `roleAtLeast` honours the rank order).

---

## API

All endpoints are prefixed with `/api`. Authenticated endpoints expect `Authorization: Bearer <jwt>`.

### `POST /api/auth/login`

```json
{ "email": "owner@acme.test", "password": "password123" }
```

Response:

```json
{
  "token": "eyJhbGciOiJI...",
  "user": {
    "id": "…",
    "email": "owner@acme.test",
    "name": "Olivia Owner",
    "role": "owner",
    "organizationId": "…"
  }
}
```

### `GET /api/auth/me`

Returns the authenticated user.

### `GET /api/tasks`

Lists tasks visible to the caller (scoped to role + organization hierarchy). Optional query
parameters:

- `search` — case-insensitive substring match against title or description
- `category` — `work` or `personal`
- `status` — `todo`, `in_progress`, or `done`

Filtering happens at the database level (TypeORM `ILike`) — the frontend debounces input and
re-issues the request rather than filtering an in-memory list.

### `POST /api/tasks`

```json
{ "title": "Ship feature", "description": "…", "category": "work", "status": "todo" }
```

Requires `task:create`. Owner is set to the caller, organization is the caller's org.

### `PUT /api/tasks/:id`

Partial update. Body may include `title`, `description`, `category`, `status`, `position`.
Drag-and-drop reordering uses this with `position`.

### `DELETE /api/tasks/:id`

Returns `204`. Subject to the same ownership/scope checks as update.

### `GET /api/audit-log`

Most recent 200 entries. Owner / Admin only.

---

## Frontend

The dashboard is a single-page Angular app using zoneless change detection and signals. Lazy
loading splits login from the dashboard. State lives inside two services (`AuthService`,
`TasksService`) that expose readonly signals.

The board is a 3-column kanban (`To do`, `In progress`, `Done`) backed by Angular CDK drag-drop.
Dropping a card in another column issues a `PUT /api/tasks/:id { status }`; dropping in the same
column issues `{ position }`. Local state is updated optimistically.

Owners and Admins see the full UI (create, edit, delete, audit panel). Viewers see a read-only
board scoped to tasks they own — the same rules the backend enforces, surfaced in the UI via
`auth.canMutate()` / `auth.canViewAudit()` signals.

---

## Bonus features

- **Task completion visualization.** Stats row at the top of the dashboard shows total / in
  progress / done counts plus a progress bar based on `done / total`.
- **Dark / light theme toggle.** Toggle button in the header. Preference persists in
  `localStorage` and falls back to the OS setting (`prefers-color-scheme: dark`) on first visit.
  Implemented with CSS variables on `:root` and `.dark` so the entire UI flips with one class.
- **Keyboard shortcuts** (active when no input is focused):

  | Key       | Action                          |
  | --------- | ------------------------------- |
  | `n`       | Open the new-task form          |
  | `/`       | Focus the search box            |
  | `Esc`     | Close any open modal / panel    |
  | `Shift+D` | Toggle dark/light theme         |

---

## Tradeoffs and unfinished areas

- **No refresh tokens.** A single 1-day JWT is issued at login. Production should add short-lived
  access tokens + rotating refresh tokens (HttpOnly cookie) and a server-side blocklist.
- **`synchronize: true`.** TypeORM regenerates the schema on boot for fast iteration. A real
  deployment should switch to migrations and disable sync.
- **No rate limiting.** `@nestjs/throttler` should sit in front of `auth/login` and audit reads.
- **No CSRF.** Tokens come from `Authorization` headers (not cookies), so traditional CSRF is moot,
  but if cookies are introduced later this needs CSRF tokens.
- **RBAC is computed per-request.** For high-traffic deployments the role/permission map should be
  cached (it's currently a constant in `libs/auth`, so the cost is trivial — but if permissions
  ever become DB-driven, they need a memoised cache with invalidation).
- **No password reset / registration UI.** Users are seeded; an admin would create new users
  through a proper user-management endpoint.
- **Audit log retention.** No pruning. A real system would partition by month and archive.

## Future considerations

- Role delegation (per-resource share — e.g., grant Admin on a single task to a Viewer).
- Field-level masking for Viewer-visible tasks.
- WebSocket push for live board updates instead of polling/local optimism.
- Migration to `passport-jwt` HS512 + asymmetric (RS256) signing once tokens are issued by a
  separate auth service.
