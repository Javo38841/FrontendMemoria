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
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 20% 20%, #1a1530 0%, #0a0a14 60%, #050508 100%)' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(20, 18, 32, 0.85)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '20px 40px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ margin: 0, color: '#e6e6f0' }}>Crear Nuevo Evento</h1>
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
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};