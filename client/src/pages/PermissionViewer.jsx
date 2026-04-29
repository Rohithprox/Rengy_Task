import { useEffect, useState } from 'react';
import api from '../api';
import Card from '../components/Card';

const PERM_STYLES = {
  CREATE_TASK: { bg: '#ede9fe', text: '#7c3aed', border: '#c4b5fd', dot: '#7c3aed' },
  EDIT_TASK:   { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc', dot: '#0891b2' },
  DELETE_TASK: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5', dot: '#dc2626' },
  VIEW_ONLY:   { bg: '#dcfce7', text: '#15803d', border: '#86efac', dot: '#16a34a' },
};
function permStyle(name) {
  return PERM_STYLES[name] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', dot: '#94a3b8' };
}

function roleColor(name) {
  const map = { Admin: '#7c3aed', Manager: '#d97706', Editor: '#0891b2', Viewer: '#16a34a' };
  if (map[name]) return map[name];
  const palette = ['#7c3aed', '#0891b2', '#16a34a', '#d97706', '#db2777'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

export default function PermissionViewer() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // search filters for selects
  const [userSearch, setUserSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');

  useEffect(() => {
    Promise.all([api.get('/users'), api.get('/teams')]).then(([ur, tr]) => {
      setUsers(ur.data);
      setTeams(tr.data);
    });
  }, []);

  // auto-lookup whenever both are selected
  useEffect(() => {
    if (!selectedUser || !selectedTeam) { setResult(null); setError(''); return; }
    setLoading(true);
    setError('');
    setResult(null);
    api.get(`/memberships/user/${selectedUser}/team/${selectedTeam}/permissions`)
      .then(r => setResult(r.data))
      .catch(e => setError(e.response?.data?.message || 'This user has no role in that team'))
      .finally(() => setLoading(false));
  }, [selectedUser, selectedTeam]);

  const filteredUsers = userSearch.trim()
    ? users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
    : users;

  const filteredTeams = teamSearch.trim()
    ? teams.filter(t => t.name.toLowerCase().includes(teamSearch.toLowerCase()))
    : teams;

  const selectedUserObj = users.find(u => u._id === selectedUser);
  const selectedTeamObj = teams.find(t => t._id === selectedTeam);

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Permission Viewer</h1>
      <p style={styles.subtitle}>
        Select a user and a team — their role and permissions are resolved automatically.
      </p>

      <div style={styles.selectors}>
        {/* User selector */}
        <Card style={styles.selectorCard}>
          <p style={styles.selectorLabel}>User</p>
          <input
            style={styles.searchInput}
            placeholder="Search by name or email…"
            value={userSearch}
            onChange={e => { setUserSearch(e.target.value); setSelectedUser(''); }}
          />
          <div style={styles.optionList}>
            {filteredUsers.length === 0 ? (
              <p style={styles.noMatch}>No users match "{userSearch}"</p>
            ) : (
              filteredUsers.map(u => (
                <div
                  key={u._id}
                  style={{
                    ...styles.optionItem,
                    background: selectedUser === u._id ? '#eff6ff' : '#fff',
                    borderColor: selectedUser === u._id ? '#93c5fd' : '#f1f5f9',
                  }}
                  onClick={() => { setSelectedUser(u._id); setUserSearch(''); }}
                >
                  <div style={styles.optionAvatar}>{u.name[0].toUpperCase()}</div>
                  <div>
                    <p style={styles.optionName}>{u.name}</p>
                    <p style={styles.optionSub}>{u.email}</p>
                  </div>
                  {selectedUser === u._id && <span style={styles.checkMark}>✓</span>}
                </div>
              ))
            )}
          </div>
          {selectedUserObj && !userSearch && (
            <div style={styles.selectedBadge}>
              Selected: <strong>{selectedUserObj.name}</strong>
              <button style={styles.clearBtn} onClick={() => setSelectedUser('')}>✕</button>
            </div>
          )}
        </Card>

        <div style={styles.arrow}>→</div>

        {/* Team selector */}
        <Card style={styles.selectorCard}>
          <p style={styles.selectorLabel}>Team</p>
          <input
            style={styles.searchInput}
            placeholder="Search team…"
            value={teamSearch}
            onChange={e => { setTeamSearch(e.target.value); setSelectedTeam(''); }}
          />
          <div style={styles.optionList}>
            {filteredTeams.length === 0 ? (
              <p style={styles.noMatch}>No teams match "{teamSearch}"</p>
            ) : (
              filteredTeams.map(t => (
                <div
                  key={t._id}
                  style={{
                    ...styles.optionItem,
                    background: selectedTeam === t._id ? '#f5f3ff' : '#fff',
                    borderColor: selectedTeam === t._id ? '#c4b5fd' : '#f1f5f9',
                  }}
                  onClick={() => { setSelectedTeam(t._id); setTeamSearch(''); }}
                >
                  <div style={{ ...styles.optionAvatar, background: '#7c3aed' }}>{t.name[0].toUpperCase()}</div>
                  <div>
                    <p style={styles.optionName}>{t.name}</p>
                    {t.description && <p style={styles.optionSub}>{t.description}</p>}
                  </div>
                  {selectedTeam === t._id && <span style={styles.checkMark}>✓</span>}
                </div>
              ))
            )}
          </div>
          {selectedTeamObj && !teamSearch && (
            <div style={{ ...styles.selectedBadge, borderColor: '#c4b5fd', background: '#f5f3ff' }}>
              Selected: <strong>{selectedTeamObj.name}</strong>
              <button style={styles.clearBtn} onClick={() => setSelectedTeam('')}>✕</button>
            </div>
          )}
        </Card>
      </div>

      {/* Result area */}
      <div style={{ marginTop: 32 }}>
        {!selectedUser || !selectedTeam ? (
          <p style={styles.hint}>← Select both a user and a team to see permissions.</p>
        ) : loading ? (
          <p style={styles.hint}>Looking up…</p>
        ) : error ? (
          <Card style={{ maxWidth: 480, borderColor: '#fca5a5', background: '#fff5f5' }}>
            <p style={{ color: '#dc2626', margin: 0, fontWeight: 500 }}>{error}</p>
            <p style={{ color: '#94a3b8', fontSize: 12, margin: '6px 0 0' }}>
              This user may not be a member of {selectedTeamObj?.name}.
            </p>
          </Card>
        ) : result && (
          <div>
            {/* Summary bar */}
            <div style={styles.summaryBar}>
              <span style={styles.summaryText}>
                <strong>{selectedUserObj?.name}</strong> in <strong>{selectedTeamObj?.name}</strong>
              </span>
              <span style={{ ...styles.rolePill, background: roleColor(result.role) }}>
                {result.role}
              </span>
              <span style={styles.permCount}>
                {result.permissions.length} permission{result.permissions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {result.permissions.length === 0 ? (
              <Card style={{ maxWidth: 480, marginTop: 16 }}>
                <p style={{ color: '#94a3b8', margin: 0 }}>
                  Role <strong>{result.role}</strong> has no permissions assigned yet.
                  Go to the Roles page to add some.
                </p>
              </Card>
            ) : (
              <div style={styles.permGrid}>
                {result.permissions.map(p => {
                  const cs = permStyle(p.name);
                  return (
                    <div key={p._id} style={{ ...styles.permCard, background: cs.bg, borderColor: cs.border }}>
                      <div style={{ ...styles.permDot, background: cs.dot }} />
                      <div>
                        <p style={{ ...styles.permName, color: cs.text }}>{p.name}</p>
                        <p style={styles.permDesc}>{p.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '32px 24px', maxWidth: 1000, margin: '0 auto' },
  heading: { fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 6 },
  subtitle: { color: '#64748b', marginBottom: 28, fontSize: 14 },

  selectors: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'start' },
  selectorCard: { display: 'flex', flexDirection: 'column', gap: 10 },
  selectorLabel: { fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 },
  searchInput: { width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 7, fontSize: 13, boxSizing: 'border-box', outline: 'none' },
  optionList: { display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto' },
  optionItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer' },
  optionAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  optionName: { fontWeight: 600, color: '#1e293b', margin: 0, fontSize: 13 },
  optionSub: { color: '#94a3b8', fontSize: 11, margin: 0 },
  checkMark: { marginLeft: 'auto', color: '#3b82f6', fontWeight: 700 },
  noMatch: { color: '#94a3b8', fontSize: 13, padding: '8px 0' },
  selectedBadge: { padding: '6px 12px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 7, fontSize: 13, color: '#1e3a5f', display: 'flex', alignItems: 'center', gap: 6 },
  clearBtn: { marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13, padding: 0 },
  arrow: { fontSize: 24, color: '#cbd5e1', alignSelf: 'center', paddingTop: 48 },

  hint: { color: '#94a3b8', fontSize: 14, fontStyle: 'italic' },
  summaryBar: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  summaryText: { fontSize: 15, color: '#1e293b' },
  rolePill: { color: '#fff', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  permCount: { color: '#64748b', fontSize: 13 },

  permGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 },
  permCard: { display: 'flex', alignItems: 'flex-start', gap: 12, border: '2px solid', borderRadius: 12, padding: 18 },
  permDot: { width: 10, height: 10, borderRadius: '50%', marginTop: 4, flexShrink: 0 },
  permName: { fontWeight: 700, margin: '0 0 4px', fontSize: 14 },
  permDesc: { color: '#64748b', fontSize: 12, margin: 0 },
};
