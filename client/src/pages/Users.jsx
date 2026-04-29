import { useEffect, useState } from 'react';
import api from '../api';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';

const BADGE_COLORS = {
  Admin: '#7c3aed',
  Editor: '#0891b2',
  Viewer: '#16a34a',
};

const PERM_COLORS = {
  CREATE_TASK: '#7c3aed',
  EDIT_TASK: '#0891b2',
  DELETE_TASK: '#dc2626',
  VIEW_ONLY: '#16a34a',
};

// ── Inline "assign to team" panel shown on a user card ──────────────────────
function AssignPanel({ userId, teams, roles, onAssigned }) {
  const [form, setForm] = useState({ teamId: '', roleId: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      await api.post('/memberships', { user: userId, team: form.teamId, role: form.roleId });
      setForm({ teamId: '', roleId: '' });
      onAssigned();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to assign');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.assignForm}>
      {err && <p style={styles.errSmall}>{err}</p>}
      <select style={styles.select} value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })} required>
        <option value="">Team…</option>
        {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
      </select>
      <select style={styles.select} value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })} required>
        <option value="">Role…</option>
        {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
      </select>
      <button style={styles.assignBtn} disabled={saving}>{saving ? '…' : 'Assign'}</button>
    </form>
  );
}

// ── Memberships list for a single user ──────────────────────────────────────
function UserMemberships({ userId, refreshTick }) {
  const [memberships, setMemberships] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get(`/users/${userId}/memberships`)
      .then(r => setMemberships(r.data))
      .finally(() => setLoading(false));
  }, [userId, open, refreshTick]);

  if (!open) {
    return (
      <button style={styles.toggleBtn} onClick={() => setOpen(true)}>
        Show teams &amp; permissions ▾
      </button>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      <button style={{ ...styles.toggleBtn, color: '#64748b' }} onClick={() => setOpen(false)}>
        Hide ▴
      </button>
      {loading ? (
        <p style={styles.tiny}>Loading…</p>
      ) : memberships.length === 0 ? (
        <p style={styles.tiny}>Not assigned to any team yet.</p>
      ) : (
        memberships.map(m => (
          <div key={m._id} style={styles.membershipRow}>
            <span style={styles.teamLabel}>{m.team?.name}</span>
            <span style={{ ...styles.roleBadge, background: BADGE_COLORS[m.role?.name] || '#64748b' }}>
              {m.role?.name}
            </span>
            <div style={styles.permTags}>
              {m.role?.permissions?.map(p => (
                <span key={p._id} style={{ ...styles.permTag, borderColor: PERM_COLORS[p.name] || '#cbd5e1', color: PERM_COLORS[p.name] || '#64748b' }}>
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Main Users page ──────────────────────────────────────────────────────────
export default function Users() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageErr, setPageErr] = useState('');

  // search
  const [search, setSearch] = useState('');

  // create user form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', teamId: '', roleId: '' });
  const [formErr, setFormErr] = useState('');
  const [creating, setCreating] = useState(false);

  // per-user assign refresh ticks
  const [assignTicks, setAssignTicks] = useState({});

  function loadUsers() {
    return api.get('/users').then(r => setUsers(r.data));
  }

  // client-side filter (instant) — also supports server-side via search param
  const filteredUsers = search.trim()
    ? users.filter(u => {
        const q = search.toLowerCase();
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      })
    : users;

  useEffect(() => {
    Promise.all([
      loadUsers(),
      api.get('/teams').then(r => setTeams(r.data)),
      api.get('/roles').then(r => setRoles(r.data)),
    ])
      .catch(e => setPageErr(e.response?.data?.message || 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setFormErr('');
    try {
      const body = { name: form.name, email: form.email, password: form.password };
      if (form.teamId && form.roleId) {
        body.teamId = form.teamId;
        body.roleId = form.roleId;
      }
      const { data } = await api.post('/users', body);
      setForm({ name: '', email: '', password: '', teamId: '', roleId: '' });
      setShowForm(false);
      await loadUsers();
      // auto-open memberships for the new user so the assignment is visible
      if (data.membership) bumpAssignTick(data._id);
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  }

  function bumpAssignTick(userId) {
    setAssignTicks(prev => ({ ...prev, [userId]: (prev[userId] || 0) + 1 }));
  }

  if (loading) return <p style={styles.info}>Loading…</p>;
  if (pageErr) return <p style={styles.errPage}>{pageErr}</p>;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.headerRow}>
        <h1 style={styles.heading}>Users <span style={styles.count}>{users.length}</span></h1>
        {authUser && (
          <button style={styles.newBtn} onClick={() => setShowForm(v => !v)}>
            {showForm ? '✕ Cancel' : '+ New User'}
          </button>
        )}
      </div>

      {/* Search bar */}
      <div style={styles.searchRow}>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <span style={styles.searchMeta}>
            {filteredUsers.length} of {users.length} users
          </span>
        )}
      </div>

      {/* Create User Form */}
      {showForm && (
        <Card style={styles.createCard}>
          <h3 style={styles.formTitle}>Create New User</h3>
          {formErr && <p style={styles.errSmall}>{formErr}</p>}
          <form onSubmit={handleCreate} style={styles.createForm}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.input}
                placeholder="e.g. Jane Smith"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                placeholder="Min 6 chars"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            {/* Team + Role — optional at creation time */}
            <div style={{ ...styles.fieldGroup, gridColumn: '1 / -1' }}>
              <p style={styles.sectionDivider}>Assign to a team (optional)</p>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Team</label>
              <select
                style={styles.input}
                value={form.teamId}
                onChange={e => setForm({ ...form, teamId: e.target.value })}
              >
                <option value="">— none —</option>
                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Role {form.teamId && <span style={styles.required}>*</span>}</label>
              <select
                style={styles.input}
                value={form.roleId}
                onChange={e => setForm({ ...form, roleId: e.target.value })}
                required={!!form.teamId}
                disabled={!form.teamId}
              >
                <option value="">— select role —</option>
                {roles.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.name}{r.permissions?.length ? ` (${r.permissions.map(p => p.name).join(', ')})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <button style={styles.createBtn} disabled={creating}>
              {creating ? 'Creating…' : 'Create User'}
            </button>
          </form>
        </Card>
      )}

      {/* User Cards Grid */}
      {users.length === 0 ? (
        <p style={styles.empty}>No users yet. Create one above.</p>
      ) : filteredUsers.length === 0 ? (
        <p style={styles.empty}>No users match "{search}".</p>
      ) : (
        <div style={styles.grid}>
          {filteredUsers.map(u => (
            <Card key={u._id} style={styles.userCard}>
              {/* Avatar + basic info */}
              <div style={styles.cardTop}>
                <div style={{ ...styles.avatar, background: avatarColor(u.name) }}>
                  {u.name[0].toUpperCase()}
                </div>
                <div>
                  <p style={styles.name}>{u.name}</p>
                  <p style={styles.email}>{u.email}</p>
                  <p style={styles.date}>Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <hr style={styles.divider} />

              {/* Team assignments viewer */}
              <UserMemberships
                userId={u._id}
                refreshTick={assignTicks[u._id] || 0}
              />

              {/* Assign to team form (logged-in only) */}
              {authUser && (
                <div style={{ marginTop: 10 }}>
                  <p style={styles.assignLabel}>Assign to team</p>
                  <AssignPanel
                    userId={u._id}
                    teams={teams}
                    roles={roles}
                    onAssigned={() => bumpAssignTick(u._id)}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// deterministic avatar colour from name
function avatarColor(name) {
  const palette = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const styles = {
  page: { padding: '32px 24px', maxWidth: 1100, margin: '0 auto' },
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  heading: { fontSize: 24, fontWeight: 700, color: '#1e293b' },
  count: { background: '#e2e8f0', color: '#475569', borderRadius: 20, padding: '2px 10px', fontSize: 14, fontWeight: 600, marginLeft: 8 },
  newBtn: { padding: '8px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, cursor: 'pointer', fontSize: 14 },

  searchRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  searchInput: { flex: 1, maxWidth: 400, padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, outline: 'none' },
  searchMeta: { fontSize: 13, color: '#94a3b8' },
  createCard: { marginBottom: 28, maxWidth: 560 },
  formTitle: { fontWeight: 700, color: '#1e293b', marginBottom: 16, fontSize: 16 },
  createForm: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' },
  fieldGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 },
  input: { width: '100%', padding: '8px 11px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' },
  createBtn: { gridColumn: '1 / -1', padding: '9px 0', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14, marginTop: 4 },
  sectionDivider: { fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: '1px solid #f1f5f9', paddingTop: 12, margin: 0 },
  required: { color: '#ef4444', marginLeft: 2 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 },
  userCard: { display: 'flex', flexDirection: 'column' },
  cardTop: { display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 },
  name: { fontWeight: 600, color: '#1e293b', margin: '0 0 3px', fontSize: 15 },
  email: { color: '#64748b', fontSize: 12, margin: '0 0 2px' },
  date: { color: '#94a3b8', fontSize: 11, margin: 0 },
  divider: { border: 'none', borderTop: '1px solid #f1f5f9', margin: '10px 0' },

  toggleBtn: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0 },
  tiny: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  membershipRow: { marginTop: 8, padding: '8px 10px', background: '#f8fafc', borderRadius: 7 },
  teamLabel: { fontSize: 13, fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: 4 },
  roleBadge: { display: 'inline-block', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, marginBottom: 6 },
  permTags: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  permTag: { fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, border: '1px solid', background: '#fff' },

  assignLabel: { fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 },
  assignForm: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  select: { flex: 1, minWidth: 90, padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, background: '#fff' },
  assignBtn: { padding: '6px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 12 },
  errSmall: { color: '#dc2626', fontSize: 12, marginBottom: 8 },

  info: { padding: 48, textAlign: 'center', color: '#64748b' },
  errPage: { padding: 48, textAlign: 'center', color: '#dc2626' },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 48 },
};
