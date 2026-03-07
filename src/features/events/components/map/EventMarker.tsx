import { Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import type { EventMarkerProps } from '../../types/events.types';

export const EventMarker = ({ event, onClick }: EventMarkerProps) => {
  const navigate = useNavigate();

  if (!event.latitude || !event.longitude) return null;

  const handleViewDetails = () => {
    navigate(`/events/${event.id}`);
  };

  return (
    <Marker position={[event.latitude, event.longitude]}>
      <Popup>
        <div style={{ minWidth: '200px' }}>
          <h3 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '16px',
            color: '#1f2937'
          }}>
            {event.title}
          </h3>
          
          <p style={{ 
            margin: '0 0 10px 0', 
            fontSize: '14px', 
            color: '#6b7280',
            lineHeight: '1.4'
          }}>
            {event.description.length > 100 
              ? `${event.description.substring(0, 100)}...` 
              : event.description
            }
          </p>

          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px' }}>
            <div style={{ marginBottom: '4px' }}>
              📍 {event.location}
            </div>
            <div style={{ marginBottom: '4px' }}>
              📅 {event.date}
            </div>
            {event.startTime && (
              <div>🕐 {event.startTime}</div>
            )}
          </div>

          <button
            onClick={handleViewDetails}
            style={{
              marginTop: '10px',
              padding: '6px 12px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              width: '100%',
            }}
          >
            Ver Detalles
          </button>
        </div>
      </Popup>
    </Marker>
  );
};