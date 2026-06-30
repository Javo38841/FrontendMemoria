import { useState } from 'react';
import { useAuth } from "../hooks/useAuth.ts";
import { useNavigate, Link } from 'react-router-dom';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ username, password });
      navigate('/events');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
      console.error('Error login:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.root}>

      <div style={styles.brand}>
        <span style={styles.brandName}>
          Beat<span style={styles.brandAccent}>Map</span>
        </span>
      </div>

      <div style={styles.card}>
        <div style={styles.icon}>✦</div>
        <h1 style={styles.title}>Bienvenido de nuevo</h1>
        <p style={styles.subtitle}>Conecta con artistas y organizadores de eventos musicales</p>

        <div style={styles.tabs}>
          <span style={{ ...styles.tab, ...styles.tabActive }}>Iniciar Sesión</span>
          <Link to="/register" style={{ ...styles.tab, textDecoration: 'none', textAlign: 'center' }}>
            Registrarse
          </Link>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label} htmlFor="login-username">Username</label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={styles.input}
          />

          <label style={styles.label} htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          {error && <div style={styles.errorBox}>{error}</div>}

          <button type="submit" disabled={isLoading} style={styles.submitBtn}>
            {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p style={styles.switchText}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" style={styles.link}>Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    width: '100%',
    background: 'radial-gradient(circle at 20% 20%, #1a1530 0%, #0a0a14 60%, #050508 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 16px 64px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#e6e6f0',
  },
  backBtn: {
    alignSelf: 'flex-start',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e6e6f0',
    borderRadius: '999px',
    padding: '10px 18px',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '32px',
  },
  brand: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '28px',
  },
  brandName: { fontSize: '26px', fontWeight: 800, color: '#ffffff' },
  brandAccent: { color: '#b07cf5' },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'rgba(20, 18, 32, 0.85)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '32px 28px',
    boxShadow: '0 0 40px rgba(120, 80, 220, 0.08)',
  },
  icon: {
    width: '44px',
    height: '44px',
    margin: '0 auto 16px',
    background: 'rgba(150, 110, 240, 0.15)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#b07cf5',
    fontSize: '18px',
  },
  title: { textAlign: 'center', fontSize: '22px', fontWeight: 700, color: '#d2b8ff', margin: '0 0 6px' },
  subtitle: { textAlign: 'center', fontSize: '13px', color: '#9b95ad', margin: '0 0 24px' },
  tabs: {
    display: 'flex',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '24px',
  },
  tab: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#9b95ad',
    padding: '10px 0',
    fontSize: '14px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  tabActive: { background: 'rgba(120, 90, 220, 0.25)', color: '#d2b8ff', fontWeight: 600, textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', color: '#c9c4d8', marginTop: '10px' },
  input: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    padding: '11px 12px',
    color: '#f0f0f5',
    fontSize: '14px',
    outline: 'none',
  },
  errorBox: {
    color: '#ff8a8a',
    marginTop: '14px',
    padding: '10px',
    backgroundColor: 'rgba(255,80,80,0.1)',
    border: '1px solid rgba(255,80,80,0.2)',
    borderRadius: '8px',
    fontSize: '13px',
  },
  submitBtn: {
    marginTop: '22px',
    background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
    border: 'none',
    color: 'white',
    fontSize: '15px',
    fontWeight: 600,
    padding: '13px 0',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  switchText: { textAlign: 'center', fontSize: '13px', color: '#9b95ad', marginTop: '18px' },
  link: { color: '#b07cf5', textDecoration: 'none' },
};