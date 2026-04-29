import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>TeamRBAC</Link>
      <div style={styles.links}>
        <Link to="/users" style={styles.link}>Users</Link>
        <Link to="/teams" style={styles.link}>Teams</Link>
        <Link to="/roles" style={styles.link}>Roles</Link>
        <Link to="/permissions" style={styles.link}>Permissions</Link>
        {user ? (
          <>
            <span style={styles.username}>{user.name}</span>
            <button onClick={handleLogout} style={styles.btn}>Logout</button>
          </>
        ) : (
          <Link to="/login" style={styles.link}>Login</Link>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#1e293b', color: '#f1f5f9' },
  brand: { fontWeight: 700, fontSize: 20, color: '#60a5fa', textDecoration: 'none' },
  links: { display: 'flex', gap: 20, alignItems: 'center' },
  link: { color: '#cbd5e1', textDecoration: 'none', fontSize: 14 },
  username: { color: '#94a3b8', fontSize: 13 },
  btn: { background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 },
};
