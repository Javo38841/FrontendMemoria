import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { latLngBounds } from 'leaflet';
import { EventMarker } from './EventMarker';
import { MAP_CONFIG } from '../../../../utils/leaflet-config';
import type { MapViewProps } from '../../types/events.types';

type LatLng = [number, number];

// MapContainer solo lee center/zoom/bounds al montarse. Este componente mueve el mapa
// cuando cambia el conjunto de eventos mostrados (por ejemplo al filtrar por ciudad):
// varios eventos -> se encuadran todos; uno -> se centra en él; ninguno -> no se mueve.
const FitToEvents = ({ points, zoom }: { points: LatLng[]; zoom: number }) => {
  const map = useMap();
  const signature = points.map(([lat, lng]) => `${lat},${lng}`).join(';');
  // Arranca igual a la firma inicial: el montaje ya lo resuelve MapContainer
  const lastSignature = useRef(signature);

  useEffect(() => {
    if (signature === lastSignature.current) return;
    lastSignature.current = signature;

    if (points.length === 1) {
      map.setView(points[0], zoom);
    } else if (points.length > 1) {
      map.fitBounds(latLngBounds(points), { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, points, signature, zoom]);

  return null;
};

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

  const points: LatLng[] = eventsWithCoordinates.map(
    (event) => [event.latitude as number, event.longitude as number]
  );

  // Vista inicial: varios eventos -> encuadrar todos; uno -> centrar en él; ninguno -> centro por defecto.
  // MapContainer ignora `bounds` si también recibe center y zoom, por eso van en props excluyentes.
  const initialView =
    points.length > 1
      ? { bounds: latLngBounds(points), boundsOptions: { padding: [40, 40] as [number, number], maxZoom: 15 } }
      : { center: points.length === 1 ? points[0] : center, zoom };

  return (
    <div style={{
      height,
      width: '100%',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      marginBottom: '20px',
      position: 'relative',
      boxShadow: '0 0 30px rgba(120, 80, 220, 0.08)',
    }}>
      <MapContainer
        {...initialView}
        style={{ height: '100%', width: '100%' }}
      >
        <FitToEvents points={points} zoom={zoom} />
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
          backgroundColor: 'rgba(20, 18, 32, 0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          zIndex: 1000,
        }}>
          <p style={{ margin: 0, color: '#9b95ad' }}>
            No hay eventos con ubicación disponible
          </p>
        </div>
      )}
    </div>
  );
};