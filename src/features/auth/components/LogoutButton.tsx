import { useAuth } from '../hooks/useAuth';

export const LogoutButton = () => {
  const { logout } = useAuth();

  return (
    <button
      type="button"
      onClick={logout}
      style={{
        padding: '10px 20px',
        background: 'rgba(255, 80, 80, 0.12)',
        border: '1px solid rgba(255, 80, 80, 0.3)',
        color: '#ff8a8a',
        borderRadius: '8px',
        cursor: 'pointer',
      }}
    >
      Cerrar Sesión
    </button>
  );
};
