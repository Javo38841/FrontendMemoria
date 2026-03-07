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
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
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
            <h1 style={{ margin: 0, color: '#1f2937' }}>🎉 BeatMap</h1>
            <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>
              Hola, <strong>{user?.username}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/my-events')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Mis Eventos
            </button>
            <button
              onClick={() => navigate('/events/create')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              + Crear Evento
            </button>
            <button
              onClick={logout}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
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
          <h2 style={{ margin: 0 }}>Todos los Eventos</h2>
          <button
            onClick={() => setShowMap(!showMap)}
            style={{
              padding: '10px 20px',
              backgroundColor: showMap ? '#6b7280' : '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
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
            backgroundColor: '#fee',
            color: '#dc2626',
            borderRadius: '4px',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Cargando eventos...</p>
          </div>
        ) : events.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}>
            <p style={{ fontSize: '18px', color: '#6b7280' }}>
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
                color: '#6b7280',
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