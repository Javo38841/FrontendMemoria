import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import { EventForm } from '../components/EventForm';
import type { EventFormData, Event } from '../types/events.types';

export const EditEventPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { updateEvent, isLoading, error } = useEvents();

  // Obtener el evento del state de navegación
  const event = location.state?.event as Event | undefined;

  const handleSubmit = async (data: EventFormData) => {
    if (!id) return;

    const success = await updateEvent(Number(id), data);
    if (success) {
      alert('Evento actualizado exitosamente!');
      navigate('/my-events');
    }
  };

  const handleCancel = () => {
    navigate('/my-events');
  };

  if (!event) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 20% 20%, #1a1530 0%, #0a0a14 60%, #050508 100%)',
        padding: '40px',
        textAlign: 'center',
      }}>
        <p style={{ color: '#9b95ad' }}>Evento no encontrado</p>
        <button
          onClick={() => navigate('/my-events')}
          style={{
            marginTop: '12px',
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#e6e6f0',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Volver a Mis Eventos
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 20% 20%, #1a1530 0%, #0a0a14 60%, #050508 100%)' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(20, 18, 32, 0.85)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '20px 40px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ margin: 0, color: '#e6e6f0' }}>Editar Evento</h1>
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
            maxWidth: '600px',
          }}>
            {error}
          </div>
        )}

        <div style={{
          backgroundColor: 'rgba(20, 18, 32, 0.85)',
          padding: '30px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <EventForm
            event={event}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};