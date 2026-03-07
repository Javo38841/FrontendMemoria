import { useNavigate } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import { EventForm } from '../components/EventForm';
import type { EventFormData } from '../types/events.types';

export const CreateEventPage = () => {
  const navigate = useNavigate();
  const { createEvent, isLoading, error } = useEvents();

  const handleSubmit = async (data: EventFormData) => {
    const success = await createEvent(data);
    if (success) {
      alert('Evento creado exitosamente!');
      navigate('/my-events');
    }
  };

  const handleCancel = () => {
    navigate('/my-events');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '20px 40px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ margin: 0 }}>Crear Nuevo Evento</h1>
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
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};