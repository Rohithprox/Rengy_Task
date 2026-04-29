import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form.name, form.email, form.password);
      navigate('/teams');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <h2 style={styles.title}>Create Account</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Name</label>
          <input style={styles.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          <button style={styles.btn} disabled={loading}>{loading ? 'Creating…' : 'Register'}</button>
        </form>
        <p style={{ marginTop: 16, fontSize: 13, color: '#64748b' }}>
          Have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' },
  box: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 32, width: 360 },
  title: { marginBottom: 20, fontSize: 22, fontWeight: 700, color: '#1e293b' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#475569' },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, marginBottom: 14, fontSize: 14, boxSizing: 'border-box' },
  btn: { width: '100%', padding: '10px 0', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 15 },
  error: { color: '#dc2626', fontSize: 13, marginBottom: 12 },
};
