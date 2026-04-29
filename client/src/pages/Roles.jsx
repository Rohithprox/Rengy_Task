import { useEffect, useState } from 'react';
import api from '../api';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';

const PERM_COLORS = {
  CREATE_TASK: { bg: '#ede9fe', text: '#7c3aed', border: '#c4b5fd' },
  EDIT_TASK:   { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
  DELETE_TASK: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
  VIEW_ONLY:   { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
};
function permStyle(name) {
  return PERM_COLORS[name] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
}

// ── Permissions editor for one role ─────────────────────────────────────────
function PermissionEditor({ role, allPermissions, onUpdated }) {
  const [selected, setSelected] = useState(new Set(role.permissions.map(p => p._id)));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setMsg('');
  }

  async function handleSave() {
    setSaving(true);
    setMsg('');
    try {
      await api.patch(`/roles/${role._id}/permissions`, { permissions: [...selected] });
      setMsg('Saved');
      onUpdated();
    } catch {
      setMsg('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const dirty = JSON.stringify([...selected].sort()) !==
    JSON.stringify(role.permissions.map(p => p._id).sort());

  return (
    <div style={styles.editor}>
      <p style={styles.editorLabel}>Permissions</p>
      <div style={styles.checkGrid}>
        {allPermissions.map(p => {
          const cs = permStyle(p.name);
          const checked = selected.has(p._id);
          return (
            <label
              key={p._id}
              style={{
                ...styles.checkChip,
                background: checked ? cs.bg : '#f8fafc',
                border: `1.5px solid ${checked ? cs.border : '#e2e8f0'}`,
                color: checked ? cs.text : '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(p._id)}
                style={{ display: 'none' }}
              />
              {checked ? '✓ ' : ''}{p.name}
            </label>
          );
        })}
      </div>
      {dirty && (
        <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      )}
      {msg && <span style={{ fontSize: 12, color: msg === 'Saved' ? '#16a34a' : '#dc2626', marginLeft: 8 }}>{msg}</span>}
    </div>
  );
}

// ── Main Roles page ──────────────────────────────────────────────────────────
export default function Roles() {
  const { user: authUser } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState(null);

  // create role form
  const [form, setForm] = useState({ name: '' });
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');

  function loadRoles() {
    return api.get('/roles').then(r => setRoles(r.data));
  }

  useEffect(() => {
    Promise.all([loadRoles(), api.get('/permissions').then(r => setPermissions(r.data))])
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateErr('');
    try {
      await api.post('/roles', { name: form.name, permissions: [] });
      setForm({ name: '' });
      setShowForm(false);
      await loadRoles();
    } catch (err) {
      setCreateErr(err.response?.data?.message || 'Failed to create role');
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <p style={styles.info}>Loading…</p>;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.heading}>Roles <span style={styles.count}>{roles.length}</span></h1>
          <p style={styles.subtitle}>Each role carries a set of permissions. Assign roles to users within teams.</p>
        </div>
        {authUser && (
          <button style={styles.newBtn} onClick={() => setShowForm(v => !v)}>
            {showForm ? '✕ Cancel' : '+ New Role'}
          </button>
        )}
      </div>

      {/* Create Role Form */}
      {showForm && (
        <Card style={styles.createCard}>
          <h3 style={styles.formTitle}>Create Role</h3>
          {createErr && <p style={styles.errText}>{createErr}</p>}
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Role Name</label>
              <input
                style={styles.input}
                placeholder="e.g. Manager, Tester, Lead…"
                value={form.name}
                onChange={e => setForm({ name: e.target.value })}
                required
              />
            </div>
            <button style={styles.createBtn} disabled={creating}>
              {creating ? 'Creating…' : 'Create'}
            </button>
          </form>
          <p style={styles.hint}>You can assign permissions after creating the role.</p>
        </Card>
      )}

      {/* Role Cards */}
      {roles.length === 0 ? (
        <p style={styles.empty}>No roles yet.</p>
      ) : (
        <div style={styles.grid}>
          {roles.map(role => {
            const isOpen = expandedRole === role._id;
            return (
              <Card key={role._id} style={styles.roleCard}>
                {/* Role header */}
                <div style={styles.roleHeader}>
                  <div style={styles.roleIcon}>{role.name[0].toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <p style={styles.roleName}>{role.name}</p>
                    <p style={styles.roleMeta}>
                      {role.permissions.length === 0
                        ? 'No permissions assigned'
                        : `${role.permissions.length} permission${role.permissions.length > 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>

                {/* Current permission pills */}
                {role.permissions.length > 0 && (
                  <div style={styles.pillRow}>
                    {role.permissions.map(p => {
                      const cs = permStyle(p.name);
                      return (
                        <span key={p._id} style={{ ...styles.pill, background: cs.bg, color: cs.text, border: `1px solid ${cs.border}` }}>
                          {p.name}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Toggle edit */}
                {authUser && (
                  <button
                    style={styles.editToggle}
                    onClick={() => setExpandedRole(isOpen ? null : role._id)}
                  >
                    {isOpen ? 'Close editor ▴' : 'Edit permissions ▾'}
                  </button>
                )}

                {/* Inline permission editor */}
                {isOpen && (
                  <PermissionEditor
                    role={role}
                    allPermissions={permissions}
                    onUpdated={() => loadRoles()}
                  />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '32px 24px', maxWidth: 1000, margin: '0 auto' },
  headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 },
  heading: { fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 4 },
  count: { background: '#e2e8f0', color: '#475569', borderRadius: 20, padding: '2px 10px', fontSize: 14, fontWeight: 600, marginLeft: 8 },
  subtitle: { color: '#64748b', fontSize: 13, margin: 0 },
  newBtn: { padding: '9px 18px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' },

  createCard: { marginBottom: 28, maxWidth: 520 },
  formTitle: { fontWeight: 700, color: '#1e293b', marginBottom: 14, fontSize: 15 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' },
  createBtn: { padding: '9px 22px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' },
  hint: { marginTop: 10, fontSize: 12, color: '#94a3b8' },
  errText: { color: '#dc2626', fontSize: 13, marginBottom: 10 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 },
  roleCard: { display: 'flex', flexDirection: 'column', gap: 10 },
  roleHeader: { display: 'flex', alignItems: 'center', gap: 12 },
  roleIcon: { width: 40, height: 40, borderRadius: 10, background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 },
  roleName: { fontWeight: 700, color: '#1e293b', margin: 0, fontSize: 15 },
  roleMeta: { color: '#94a3b8', fontSize: 12, margin: 0 },
  pillRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  pill: { fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20 },
  editToggle: { background: 'none', border: 'none', color: '#7c3aed', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, textAlign: 'left' },

  editor: { borderTop: '1px solid #f1f5f9', paddingTop: 12 },
  editorLabel: { fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 },
  checkGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  checkChip: { fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20, userSelect: 'none', transition: 'all 0.1s' },
  saveBtn: { marginTop: 12, padding: '7px 18px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 },

  info: { padding: 48, textAlign: 'center', color: '#64748b' },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 48 },
};
