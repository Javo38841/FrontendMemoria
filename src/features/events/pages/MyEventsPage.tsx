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
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '20px 40px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>Mis Eventos</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/events')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              ← Volver a Eventos
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
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
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
            <p>Cargando tus eventos...</p>
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
              Aún no has creado ningún evento.
            </p>
            <button
              onClick={() => navigate('/events/create')}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
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
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}>
            Eliminando evento...
          </div>
        )}
      </div>
    </div>
  );
};