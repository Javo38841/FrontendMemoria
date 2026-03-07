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
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Evento no encontrado</p>
        <button onClick={() => navigate('/my-events')}>Volver a Mis Eventos</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '20px 40px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ margin: 0 }}>Editar Evento</h1>
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
            maxWidth: '600px',
          }}>
            {error}
          </div>
        )}

        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
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