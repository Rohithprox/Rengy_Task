import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';

export default function Teams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [formErr, setFormErr] = useState('');

  function load() {
    setLoading(true);
    api.get('/teams')
      .then(r => setTeams(r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load teams'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setFormErr('');
    try {
      await api.post('/teams', form);
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Teams</h1>

      {user && (
        <Card style={{ marginBottom: 28, maxWidth: 480 }}>
          <h3 style={styles.subheading}>Create New Team</h3>
          {formErr && <p style={styles.err}>{formErr}</p>}
          <form onSubmit={handleCreate}>
            <input style={styles.input} placeholder="Team name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input style={styles.input} placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <button style={styles.btn} disabled={creating}>{creating ? 'Creating…' : 'Create Team'}</button>
          </form>
        </Card>
      )}

      {loading ? <p style={styles.info}>Loading…</p> : error ? <p style={styles.errMsg}>{error}</p> : (
        <div style={styles.grid}>
          {teams.map(t => (
            <Card key={t._id}>
              <p style={styles.teamName}>{t.name}</p>
              <p style={styles.desc}>{t.description || 'No description'}</p>
              {t.createdBy && <p style={styles.meta}>By {t.createdBy.name}</p>}
              <Link to={`/teams/${t._id}`} style={styles.viewLink}>View members →</Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '32px 24px', maxWidth: 900, margin: '0 auto' },
  heading: { fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 24 },
  subheading: { fontWeight: 600, color: '#1e293b', marginBottom: 14, fontSize: 16 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 },
  teamName: { fontWeight: 700, fontSize: 16, color: '#1e293b', margin: '0 0 6px' },
  desc: { color: '#64748b', fontSize: 13, margin: '0 0 8px' },
  meta: { color: '#94a3b8', fontSize: 12, margin: '0 0 10px' },
  viewLink: { color: '#3b82f6', fontSize: 13, textDecoration: 'none', fontWeight: 600 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, marginBottom: 10, fontSize: 14, boxSizing: 'border-box' },
  btn: { padding: '8px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
  info: { color: '#64748b', padding: 32, textAlign: 'center' },
  err: { color: '#dc2626', fontSize: 13, marginBottom: 10 },
  errMsg: { color: '#dc2626', padding: 32, textAlign: 'center' },
};
