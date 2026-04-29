[← Back to root README](../README.md)

# Client — React + Vite SPA

Frontend for the Team Management RBAC system. All data is fetched from the Express backend — nothing is hardcoded.

---

## Tech Stack

| Package | Purpose |
|---------|---------|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| React Router v6 | Client-side routing |
| Axios | HTTP requests to backend API |
| Context API | Auth state (no Redux needed) |

---

## Folder Structure

```
client/
├── vite.config.js        ← dev proxy: /api → http://localhost:5000
├── package.json
└── src/
    ├── main.jsx          ← ReactDOM entry
    ├── App.jsx           ← Router + AuthProvider wrapper
    ├── index.css         ← global reset and base styles
    ├── api.js            ← axios instance with JWT interceptor
    ├── context/
    │   └── AuthContext.jsx   ← login / register / logout + token storage
    ├── components/
    │   ├── Navbar.jsx        ← top navigation bar
    │   └── Card.jsx          ← reusable white card wrapper
    └── pages/
        ├── Login.jsx
        ├── Register.jsx
        ├── Users.jsx
        ├── Teams.jsx
        ├── TeamDetail.jsx
        ├── Roles.jsx
        └── PermissionViewer.jsx
```

---

## Setup and Running

```bash
npm install
npm run dev        # starts on http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build locally
```

The Vite dev server proxies all `/api/*` requests to `http://localhost:5000` so there are no CORS issues in development. See `vite.config.js`.

The backend must be running on port `5000` before starting the frontend.

---

## Pages

### Login — `/login`

- Email + password form
- Calls `POST /api/auth/login`
- Stores JWT and user object in `localStorage`
- Redirects to `/teams` on success
- Shows demo credentials hint: `alice@demo.com / password123`

---

### Register — `/register`

- Name + email + password form
- Calls `POST /api/auth/register`
- Same post-submit behaviour as Login

---

### Users — `/users`

**What you can do:**

- **Search bar** — live filter by name or email (client-side, instant). Shows "X of N users" count when active
- **Create user** — `+ New User` button (visible when logged in) opens a form:
  - Full Name, Email, Password (all required)
  - Team dropdown + Role dropdown (optional — role is disabled until a team is chosen; role becomes required once a team is selected)
  - On submit calls `POST /api/users` — creates the user and, if a team+role was selected, creates the TeamMembership atomically in the same request
- **View memberships** — "Show teams & permissions" toggle on each card fetches `GET /api/users/:id/memberships` and shows team name, role badge, and permission tags
- **Assign to extra teams** — inline "Assign to team" form on each card (Team + Role dropdowns + Assign button) calls `POST /api/memberships`. Use this to add an existing user to a second, third team, etc.

---

### Teams — `/teams`

**What you can do:**
- View all teams as cards showing name, description, and creator
- **Create team** — Name + description form (visible when logged in), calls `POST /api/teams`
- Click **View members →** to open Team Detail

---

### Team Detail — `/teams/:id`

**What you can do:**
- View all members with their role badge and permission chips
- **Change role** — "Change role" button on each card opens an inline dropdown + Save/Cancel; calls `PATCH /api/memberships/:id`. The membership view refreshes immediately after saving
- **Remove member** — ✕ button calls `DELETE /api/memberships/:id`
- **Add member** — form at the bottom:
  - Search input filters the user dropdown (only non-members are shown)
  - Role dropdown shows permission names inline: `Admin (CREATE_TASK, EDIT_TASK…)`
  - Calls `POST /api/memberships`

---

### Roles — `/roles`

**What you can do:**
- View all roles as cards with colour-coded permission pills
- **Create role** — `+ New Role` opens a name input; calls `POST /api/roles` with an empty permissions array
- **Edit permissions** — "Edit permissions ▾" toggle per card opens an inline checkbox editor:
  - All permissions shown as toggle chips (highlighted = selected)
  - "Save Changes" button only appears when the selection has changed from the saved state
  - Calls `PATCH /api/roles/:id/permissions`

---

### Permission Viewer — `/permissions`

**What you can do:**
- Two panels side by side: User selector and Team selector
- Each panel has a **live search input** that filters the list as you type
- Click a user → click a team → permissions resolve **automatically** (no submit button needed)
- Calls `GET /api/memberships/user/:uid/team/:tid/permissions`
- Result shows:
  - Summary bar: user name · team name · role pill
  - Colour-coded permission cards with name and description
  - Clear error message if the user has no role in the selected team

---

## Authentication Flow

`src/context/AuthContext.jsx` manages auth state globally:

```
User logs in / registers
        ↓
API returns { token, user }
        ↓
Stored in localStorage
        ↓
AuthContext.user is set → components re-render
        ↓
Navbar shows username + Logout
Mutating UI (+ New User, Change Role, etc.) becomes visible
```

On logout, `localStorage` is cleared and `user` is set to `null`.

---

## API Layer — `src/api.js`

```js
const api = axios.create({ baseURL: 'http://localhost:5000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

Every outgoing request automatically attaches the JWT if one is present. No need to manually set the `Authorization` header anywhere in page components.

---

## Colour System

Permission colours are consistent across all pages:

| Permission | Colour |
|------------|--------|
| `CREATE_TASK` | Purple `#7c3aed` |
| `EDIT_TASK` | Blue `#0891b2` |
| `DELETE_TASK` | Red `#dc2626` |
| `VIEW_ONLY` | Green `#16a34a` |

Role badge colours: Admin/Manager/Editor/Viewer have fixed colours. Any other role name gets a deterministic colour derived from the name string so it stays consistent across page loads.

---

## Auth-Gated UI

Actions that mutate data are hidden unless the user is logged in:

| Element | Requires login |
|---------|----------------|
| `+ New User` button | Yes |
| `+ New Role` button | Yes |
| Create Team form | Yes |
| Add Member form | Yes |
| Change Role button | Yes |
| Remove member ✕ button | Yes |

All read-only views (user list, team list, roles list, permission viewer) are accessible without logging in.
