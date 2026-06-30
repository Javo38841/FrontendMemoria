import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/EventCard';
import type { Event } from '../types/events.types';

export const MyEventsPage = () => {
  const { events, isLoading, error, fetchMyEvents, deleteEvent } = useEvents();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const handleEdit = (event: Event) => {
    navigate(`/events/edit/${event.id}`, { state: { event } });
  };

  const handleDelete = async (eventId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este evento?')) {
      return;
    }

    setDeletingId(eventId);
    const success = await deleteEvent(eventId);
    setDeletingId(null);

    if (success) {
      alert('Evento eliminado exitosamente');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 20% 20%, #1a1530 0%, #0a0a14 60%, #050508 100%)' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(20, 18, 32, 0.85)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '20px 40px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, color: '#e6e6f0' }}>Mis Eventos</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/events')}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#e6e6f0',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              ← Volver a Eventos
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
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
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
            <p style={{ color: '#9b95ad' }}>Cargando tus eventos...</p>
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
              Aún no has creado ningún evento.
            </p>
            <button
              onClick={() => navigate('/events/create')}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              Crear mi primer evento
            </button>
          </div>
        ) : (
          <div>
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showActions={true}
              />
            ))}
          </div>
        )}

        {deletingId && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(20, 18, 32, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            color: '#e6e6f0',
          }}>
            Eliminando evento...
          </div>
        )}
      </div>
    </div>
  );
};