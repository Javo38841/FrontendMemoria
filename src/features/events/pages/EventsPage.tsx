import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/EventCard';
import { MapView } from '../components/map/MapView';

export const EventsPage = () => {
  const { user, logout } = useAuth();
  const { events, isLoading, error, fetchEvents } = useEvents();
  const navigate = useNavigate();
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEventClick = (event: any) => {
    navigate(`/events/${event.id}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 20% 20%, #1a1530 0%, #0a0a14 60%, #050508 100%)' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(20, 18, 32, 0.85)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '20px 40px',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#ffffff', fontWeight: 800 }}>
              Beat<span style={{ color: '#b07cf5' }}>Map</span>
            </h1>
            <p style={{ margin: '5px 0 0 0', color: '#9b95ad' }}>
              Hola, <strong style={{ color: '#d2b8ff' }}>{user?.username}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/my-events')}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#e6e6f0',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Mis Eventos
            </button>
            <button
              onClick={() => navigate('/events/create')}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              + Crear Evento
            </button>
            <button
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
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Toggle Vista */}
        <div style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#e6e6f0' }}>Todos los Eventos</h2>
          <button
            onClick={() => setShowMap(!showMap)}
            style={{
              padding: '10px 20px',
              background: showMap ? 'rgba(255,255,255,0.06)' : 'linear-gradient(90deg, #8b5cf6, #6366f1)',
              border: showMap ? '1px solid rgba(255,255,255,0.12)' : 'none',
              color: showMap ? '#e6e6f0' : 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {showMap ? '📋 Ocultar Mapa' : '🗺️ Mostrar Mapa'}
          </button>
        </div>

        {error && (
          <div style={{
            padding: '15px',
            backgroundColor: 'rgba(255,80,80,0.1)',
            border: '1px solid rgba(255,80,80,0.2)',
            color: '#ff8a8a',
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#9b95ad' }}>Cargando eventos...</p>
          </div>
        ) : events.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: 'rgba(20, 18, 32, 0.85)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <p style={{ fontSize: '18px', color: '#9b95ad' }}>
              No hay eventos disponibles. ¡Sé el primero en crear uno!
            </p>
          </div>
        ) : (
          <>
            {/* Mapa */}
            {showMap && (
              <MapView
                events={events}
                height="500px"
                onEventClick={handleEventClick}
              />
            )}

            {/* Lista de Eventos */}
            <div>
              <h3 style={{
                marginBottom: '15px',
                color: '#9b95ad',
                fontSize: '14px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {events.length} {events.length === 1 ? 'Evento' : 'Eventos'}
              </h3>
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};