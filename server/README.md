# Server — Express + MongoDB API

REST API for the Team Management RBAC system. Handles authentication, user/team management, role assignment, and permission resolution.

---

## Tech Stack

| Package | Purpose |
|---------|---------|
| express | HTTP framework |
| mongoose | MongoDB ODM |
| jsonwebtoken | JWT creation and verification |
| bcryptjs | Password hashing |
| dotenv | Environment variable loading |
| cors | Cross-origin requests from the React client |
| nodemon | Dev auto-restart |

---

## Folder Structure

```
server/
├── .env                  ← secrets (never committed)
├── .env.example          ← template
├── package.json
└── src/
    ├── index.js          ← app entry, Express setup, Mongoose connect
    ├── seed.js           ← one-time DB seed script
    ├── middleware/
    │   └── auth.js       ← JWT verification middleware
    ├── models/
    │   ├── User.js
    │   ├── Team.js
    │   ├── Role.js
    │   ├── Permission.js
    │   └── TeamMembership.js
    └── routes/
        ├── auth.js
        ├── users.js
        ├── teams.js
        ├── roles.js
        ├── permissions.js
        └── memberships.js
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
MONGO_URI=mongodb://localhost:27017/team_mgmt
JWT_SECRET=replace_with_a_long_random_string
PORT=5000
```

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign/verify JWTs |
| `PORT` | No | Defaults to `5000` |

---

## Scripts

```bash
npm run dev    # start with nodemon (auto-restart on change)
npm start      # start without nodemon (production)
npm run seed   # seed default data into MongoDB
```

---

## Data Models

### User

```js
{
  name:      String (required),
  email:     String (required, unique, lowercase),
  password:  String (hashed with bcryptjs, select: false),
  createdAt: Date,
  updatedAt: Date
}
```

Password is hashed in a pre-save hook. Never returned in API responses (field uses `select: false`).

---

### Team

```js
{
  name:        String (required, unique),
  description: String,
  createdBy:   ObjectId → User,
  createdAt:   Date
}
```

Teams are containers only — they hold no permissions.

---

### Permission

```js
{
  name:        String (required, unique, uppercase),
  description: String
}
```

Seeded values: `CREATE_TASK`, `EDIT_TASK`, `DELETE_TASK`, `VIEW_ONLY`.

---

### Role

```js
{
  name:        String (required, unique),
  permissions: [ObjectId → Permission]
}
```

A role is reusable across any team. Permissions are assigned to roles, not to users or teams directly.

---

### TeamMembership

```js
{
  user: ObjectId → User  (required),
  team: ObjectId → Team  (required),
  role: ObjectId → Role  (required)
}

index: { user: 1, team: 1 }  unique: true
```

This is the central RBAC join table. One document = one user's role within one team.
- A user can appear in multiple memberships (one per team)
- The unique index prevents duplicate team assignments
- Same user, different teams = different roles is fully supported

**Permission resolution chain:**
```
User → TeamMembership → Role → permissions[]
```

---

## API Reference

All protected routes require the header:
```
Authorization: Bearer <jwt_token>
```

---

### Auth — `/api/auth`

#### POST `/api/auth/register`
Create a new account.

**Body:**
```json
{ "name": "Jane", "email": "jane@co.com", "password": "secret123" }
```

**Response `201`:**
```json
{
  "token": "<jwt>",
  "user": { "id": "...", "name": "Jane", "email": "jane@co.com" }
}
```

---

#### POST `/api/auth/login`
Log in and receive a JWT.

**Body:**
```json
{ "email": "jane@co.com", "password": "secret123" }
```

**Response `200`:**
```json
{
  "token": "<jwt>",
  "user": { "id": "...", "name": "Jane", "email": "jane@co.com" }
}
```

---

### Users — `/api/users`

#### GET `/api/users?search=<query>`
List all users. Optional `search` param filters by name or email (case-insensitive regex).

**Response `200`:** Array of user objects (no password field).

---

#### POST `/api/users` 🔒
Create a user. Optionally assign them to a team at the same time.

**Body:**
```json
{
  "name": "Jane",
  "email": "jane@co.com",
  "password": "secret123",
  "teamId": "<optional>",
  "roleId": "<optional — required if teamId provided>"
}
```

**Response `201`:**
```json
{
  "_id": "...",
  "name": "Jane",
  "email": "jane@co.com",
  "createdAt": "...",
  "membership": { "_id": "...", "team": "...", "role": "..." }
}
```
`membership` is `null` if no team was specified.

---

#### GET `/api/users/:id`
Get a single user by ID.

---

#### GET `/api/users/:id/memberships`
All team memberships for a user, with role and permissions fully populated.

**Response `200`:**
```json
[
  {
    "_id": "...",
    "team": { "_id": "...", "name": "Engineering" },
    "role": {
      "_id": "...",
      "name": "Admin",
      "permissions": [
        { "_id": "...", "name": "CREATE_TASK", "description": "..." }
      ]
    }
  }
]
```

---

### Teams — `/api/teams`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/teams` | — | List all teams |
| POST | `/api/teams` | JWT | Create team `{ name, description }` |
| GET | `/api/teams/:id` | — | Get team by ID |
| DELETE | `/api/teams/:id` | JWT | Delete team |

---

### Roles — `/api/roles`

#### GET `/api/roles`
List all roles with permissions populated.

#### POST `/api/roles` 🔒
Create a role.
```json
{ "name": "Manager", "permissions": ["<permId>", "<permId>"] }
```

#### PATCH `/api/roles/:id/permissions` 🔒
Replace the full permissions array on a role.
```json
{ "permissions": ["<permId>", "<permId>"] }
```

---

### Permissions — `/api/permissions`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/permissions` | — | List all permissions |
| POST | `/api/permissions` | JWT | Create `{ name, description }` |

---

### Memberships — `/api/memberships`

#### GET `/api/memberships?team=<id>&user=<id>`
Query memberships. Both filters are optional and combinable.
Returns fully populated user, team, role, and permissions.

---

#### POST `/api/memberships` 🔒
Add a user to a team with a role.
```json
{ "user": "<userId>", "team": "<teamId>", "role": "<roleId>" }
```
Returns `409` if the user is already in that team.

---

#### PATCH `/api/memberships/:id` 🔒
Change a member's role within their current team.
```json
{ "role": "<newRoleId>" }
```

---

#### DELETE `/api/memberships/:id` 🔒
Remove a user from a team.

---

#### GET `/api/memberships/user/:userId/team/:teamId/permissions`
Resolve a user's effective role and permissions within a specific team.

**Response `200`:**
```json
{
  "role": "Admin",
  "permissions": [
    { "_id": "...", "name": "CREATE_TASK", "description": "Can create new tasks" },
    { "_id": "...", "name": "DELETE_TASK", "description": "Can delete tasks" }
  ]
}
```
Returns `404` if the user has no membership in that team.

---

## Authentication Middleware

`src/middleware/auth.js` extracts and verifies the Bearer JWT on every protected route. On success it sets `req.user = { id, name, email }` for downstream handlers. On failure it returns `401`.

---

## Seed Script

```bash
npm run seed
```

Idempotent — safe to run multiple times. Uses `findOneAndUpdate` with `upsert: true` so re-running will not create duplicate records.

Creates:
- 4 permissions: `CREATE_TASK`, `EDIT_TASK`, `DELETE_TASK`, `VIEW_ONLY`
- 3 roles: Admin (all), Editor (create/edit/view), Viewer (view only)
- 3 users: alice, bob, carol (password: `password123`)
- 2 teams: Engineering, Design
- 5 memberships covering two different roles for Alice and Bob across both teams

---

## Error Responses

All error responses follow the same shape:
```json
{ "message": "Human-readable error description" }
```

| Code | Meaning |
|------|---------|
| 400 | Missing or invalid request body |
| 401 | Missing, invalid, or expired JWT |
| 404 | Resource not found |
| 409 | Duplicate (unique constraint) |
| 500 | Unexpected server error |
