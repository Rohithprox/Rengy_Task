import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';

function roleColor(name) {
  const map = { Admin: '#7c3aed', Manager: '#d97706', Editor: '#0891b2', Viewer: '#16a34a', Tester: '#db2777' };
  if (map[name]) return map[name];
  // deterministic colour for unknown role names
  const palette = ['#7c3aed', '#0891b2', '#16a34a', '#d97706', '#db2777', '#0f766e'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

// ── Member card with inline role-change ──────────────────────────────────────
function MemberCard({ membership, roles, onRemove, onRoleChange }) {
  const [editing, setEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState(membership.role?._id || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function handleSave() {
    if (selectedRole === membership.role?._id) { setEditing(false); return; }
    setSaving(true);
    setErr('');
    try {
      await api.patch(`/memberships/${membership._id}`, { role: selectedRole });
      setEditing(false);
      onRoleChange();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  }

  const color = roleColor(membership.role?.name || '');

  return (
    <Card style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* remove button */}
      <button onClick={() => onRemove(membership._id)} style={styles.removeBtn} title="Remove from team">✕</button>

      <div style={styles.cardTop}>
        <div style={{ ...styles.avatar, background: color }}>
          {membership.user.name[0].toUpperCase()}
        </div>
        <div>
          <p style={styles.name}>{membership.user.name}</p>
          <p style={styles.email}>{membership.user.email}</p>
        </div>
      </div>

      {/* Role display / edit toggle */}
      {editing ? (
        <div>
          <select
            style={styles.roleSelect}
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
          >
            {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
          {err && <p style={styles.errTiny}>{err}</p>}
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? '…' : 'Save'}
            </button>
            <button style={styles.cancelBtn} onClick={() => { setEditing(false); setSelectedRole(membership.role?._id || ''); }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.roleRow}>
          <span style={{ ...styles.badge, background: color }}>
            {membership.role?.name || 'Unknown'}
          </span>
          <button style={styles.changeRoleBtn} onClick={() => setEditing(true)}>
            Change role
          </button>
        </div>
      )}

      {/* Permissions for this role */}
      {membership.role?.permissions?.length > 0 && (
        <div style={styles.permRow}>
          {membership.role.permissions.map(p => (
            <span key={p._id} style={styles.permChip}>{p.name}</span>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Main TeamDetail page ──────────────────────────────────────────────────────
export default function TeamDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ userId: '', roleId: '' });
  const [addErr, setAddErr] = useState('');
  const [adding, setAdding] = useState(false);

  // search for "Add Member" user dropdown
  const [userSearch, setUserSearch] = useState('');

  const memberIds = new Set(members.map(m => m.user._id));
  const nonMembers = allUsers.filter(u => {
    if (memberIds.has(u._id)) return false;
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  function loadMembers() {
    return api.get(`/memberships?team=${id}`).then(r => setMembers(r.data));
  }

  useEffect(() => {
    Promise.all([
      api.get(`/teams/${id}`).then(r => setTeam(r.data)),
      loadMembers(),
      api.get('/users').then(r => setAllUsers(r.data)),
      api.get('/roles').then(r => setRoles(r.data)),
    ]).finally(() => setLoading(false));
  }, [id]);

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true);
    setAddErr('');
    try {
      await api.post('/memberships', { user: form.userId, team: id, role: form.roleId });
      setForm({ userId: '', roleId: '' });
      setUserSearch('');
      await loadMembers();
    } catch (err) {
      setAddErr(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(membershipId) {
    if (!window.confirm('Remove this member from the team?')) return;
    try {
      await api.delete(`/memberships/${membershipId}`);
      await loadMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove');
    }
  }

  if (loading) return <p style={styles.info}>Loading…</p>;
  if (!team) return <p style={styles.err}>Team not found</p>;

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>{team.name}</h1>
      {team.description && <p style={styles.teamDesc}>{team.description}</p>}

      <h2 style={styles.subheading}>
        Members
        <span style={styles.count}>{members.length}</span>
      </h2>

      {members.length === 0 ? (
        <p style={styles.empty}>No members yet — add one below.</p>
      ) : (
        <div style={styles.grid}>
          {members.map(m => (
            <MemberCard
              key={m._id}
              membership={m}
              roles={roles}
              onRemove={handleRemove}
              onRoleChange={loadMembers}
            />
          ))}
        </div>
      )}

      {/* Add Member */}
      {user && (
        <Card style={{ marginTop: 36, maxWidth: 500 }}>
          <h3 style={styles.formTitle}>Add Member</h3>
          {addErr && <p style={styles.errText}>{addErr}</p>}
          <form onSubmit={handleAdd}>
            {/* searchable user filter */}
            <input
              style={styles.searchInput}
              placeholder="Search user by name or email…"
              value={userSearch}
              onChange={e => { setUserSearch(e.target.value); setForm(f => ({ ...f, userId: '' })); }}
            />
            <select
              style={styles.select}
              value={form.userId}
              onChange={e => setForm({ ...form, userId: e.target.value })}
              required
              size={nonMembers.length > 0 && userSearch ? Math.min(nonMembers.length + 1, 5) : 1}
            >
              <option value="">Select user…</option>
              {nonMembers.map(u => (
                <option key={u._id} value={u._id}>{u.name} — {u.email}</option>
              ))}
            </select>
            <select
              style={styles.select}
              value={form.roleId}
              onChange={e => setForm({ ...form, roleId: e.target.value })}
              required
            >
              <option value="">Select role…</option>
              {roles.map(r => (
                <option key={r._id} value={r._id}>
                  {r.name}{r.permissions?.length ? ` (${r.permissions.map(p => p.name).join(', ')})` : ''}
                </option>
              ))}
            </select>
            <button style={styles.addBtn} disabled={adding}>
              {adding ? 'Adding…' : 'Add Member'}
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '32px 24px', maxWidth: 1000, margin: '0 auto' },
  heading: { fontSize: 26, fontWeight: 700, color: '#1e293b', marginBottom: 4 },
  teamDesc: { color: '#64748b', marginBottom: 24, fontSize: 14 },
  subheading: { fontSize: 18, fontWeight: 600, color: '#1e293b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  count: { background: '#e2e8f0', color: '#475569', borderRadius: 20, padding: '2px 10px', fontSize: 13, fontWeight: 600 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 },

  cardTop: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 },
  name: { fontWeight: 600, color: '#1e293b', margin: '0 0 2px', fontSize: 14 },
  email: { color: '#64748b', fontSize: 11, margin: 0 },
  removeBtn: { position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 13, lineHeight: 1 },

  roleRow: { display: 'flex', alignItems: 'center', gap: 8 },
  badge: { display: 'inline-block', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
  changeRoleBtn: { background: 'none', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: 5, padding: '2px 9px', fontSize: 11, cursor: 'pointer' },

  roleSelect: { width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', background: '#fff' },
  errTiny: { color: '#dc2626', fontSize: 11, margin: '4px 0 0' },
  saveBtn: { padding: '5px 14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: 12 },
  cancelBtn: { padding: '5px 12px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 5, cursor: 'pointer', fontSize: 12 },

  permRow: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  permChip: { fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' },

  formTitle: { fontWeight: 700, color: '#1e293b', marginBottom: 14, fontSize: 15 },
  searchInput: { width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, marginBottom: 8, fontSize: 13, boxSizing: 'border-box' },
  select: { width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, marginBottom: 10, fontSize: 13, boxSizing: 'border-box', background: '#fff' },
  addBtn: { padding: '9px 22px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  errText: { color: '#dc2626', fontSize: 13, marginBottom: 10 },

  info: { padding: 48, textAlign: 'center', color: '#64748b' },
  err: { padding: 48, textAlign: 'center', color: '#dc2626' },
  empty: { color: '#94a3b8', fontSize: 14 },
};
