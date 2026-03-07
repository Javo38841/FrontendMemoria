import { MapContainer, TileLayer } from 'react-leaflet';
import { EventMarker } from './EventMarker';
import { MAP_CONFIG } from '../../../../utils/leaflet-config';
import type { MapViewProps } from '../../types/events.types';

export const MapView = ({
  events,
  center = MAP_CONFIG.DEFAULT_CENTER,
  zoom = MAP_CONFIG.DEFAULT_ZOOM,
  height = '500px',
  onEventClick,
}: MapViewProps) => {
  // Filtrar solo eventos con coordenadas
  const eventsWithCoordinates = events.filter(
    event => event.latitude && event.longitude
  );

  // Si hay eventos, centrar el mapa en el primer evento
  const mapCenter = eventsWithCoordinates.length > 0 && eventsWithCoordinates[0].latitude && eventsWithCoordinates[0].longitude
    ? [eventsWithCoordinates[0].latitude, eventsWithCoordinates[0].longitude] as [number, number]
    : center;

  return (
    <div style={{ 
      height, 
      width: '100%', 
      borderRadius: '8px', 
      overflow: 'hidden',
      border: '1px solid #e5e7eb',
      marginBottom: '20px'
    }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution={MAP_CONFIG.ATTRIBUTION}
          url={MAP_CONFIG.TILE_LAYER}
        />

        {eventsWithCoordinates.map((event) => (
          <EventMarker
            key={event.id}
            event={event}
            onClick={onEventClick}
          />
        ))}
      </MapContainer>

      {eventsWithCoordinates.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 1000,
        }}>
          <p style={{ margin: 0, color: '#6b7280' }}>
            No hay eventos con ubicación disponible
          </p>
        </div>
      )}
    </div>
  );
};