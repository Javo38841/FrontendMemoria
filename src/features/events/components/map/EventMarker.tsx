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
      {/*
        Nota: el contenedor blanco redondeado del popup (.leaflet-popup-content-wrapper)
        y su flechita son estilos propios de Leaflet y no se pueden oscurecer solo con
        estilos inline aquí. Si quieres que el popup también sea oscuro, hay que
        sobreescribir esas clases en un CSS global (te lo dejo abajo en un comentario).
        Mientras tanto, oscurecí el contenido interno con un fondo propio.
      */}
      <Popup>
        <div style={{
          minWidth: '200px',
          backgroundColor: '#14121f',
          margin: '-12px -20px',
          padding: '14px 18px',
          borderRadius: '8px',
        }}>
          <h3 style={{
            margin: '0 0 10px 0',
            fontSize: '16px',
            color: '#e6e6f0'
          }}>
            {event.title}
          </h3>

          <p style={{
            margin: '0 0 10px 0',
            fontSize: '14px',
            color: '#9b95ad',
            lineHeight: '1.4'
          }}>
            {event.description.length > 100
              ? `${event.description.substring(0, 100)}...`
              : event.description
            }
          </p>

          <div style={{ fontSize: '12px', color: '#7c7790', marginBottom: '10px' }}>
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
              padding: '8px 12px',
              background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
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

