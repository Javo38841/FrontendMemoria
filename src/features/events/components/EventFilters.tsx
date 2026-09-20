import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  getDatePresetRange,
  hasActiveFilters,
} from '../utils/filterEvents';
import type { DatePreset, EventFilterCriteria } from '../utils/filterEvents';

const RADIUS_OPTIONS_KM = [5, 10, 25, 50];
const DEFAULT_RADIUS_KM = 10;

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Esta semana' },
  { key: 'upcoming', label: 'Próximos' },
];

interface EventFiltersProps {
  criteria: EventFilterCriteria;
  // Recibe solo los campos que cambian; el padre los mezcla con el estado actual
  onChange: (patch: Partial<EventFilterCriteria>) => void;
  onClear: () => void;
}

const geolocationErrorMessage = (error: GeolocationPositionError): string => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Permiso de ubicación denegado. Actívalo en tu navegador para usar "Cerca de mí".';
    case error.POSITION_UNAVAILABLE:
      return 'No se pudo determinar tu ubicación. Inténtalo de nuevo.';
    case error.TIMEOUT:
      return 'Se agotó el tiempo esperando tu ubicación. Inténtalo de nuevo.';
    default:
      return 'No se pudo obtener tu ubicación.';
  }
};

const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: '5px',
  fontWeight: 500,
  color: '#c9c4d8',
  fontSize: '13px',
};

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  fontSize: '14px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.04)',
  color: '#f0f0f5',
  outline: 'none',
  colorScheme: 'dark',
};

const chipStyle = (active: boolean): CSSProperties => ({
  padding: '9px 14px',
  background: active ? 'linear-gradient(90deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.06)',
  border: active ? 'none' : '1px solid rgba(255,255,255,0.12)',
  color: active ? 'white' : '#e6e6f0',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: active ? 600 : 400,
});

export const EventFilters = ({ criteria, onChange, onClear }: EventFiltersProps) => {
  const uid = useId();
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Identifica la solicitud de ubicación vigente; se invalida al cancelar,
  // limpiar o desmontar para ignorar respuestas tardías del navegador.
  const geoRequestId = useRef(0);

  useEffect(() => {
    return () => {
      geoRequestId.current += 1;
    };
  }, []);

  const nearbyActive = Boolean(criteria.nearby);
  const active = hasActiveFilters(criteria);

  const isPresetActive = (preset: DatePreset): boolean => {
    const range = getDatePresetRange(preset);
    return (criteria.dateFrom ?? '') === range.dateFrom && (criteria.dateTo ?? '') === range.dateTo;
  };

  const handlePresetClick = (preset: DatePreset) => {
    if (isPresetActive(preset)) {
      onChange({ dateFrom: '', dateTo: '' });
    } else {
      onChange(getDatePresetRange(preset));
    }
  };

  const handleNearbyClick = () => {
    if (nearbyActive) {
      geoRequestId.current += 1;
      setIsLocating(false);
      onChange({ nearby: null });
      return;
    }

    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización.');
      return;
    }

    const requestId = ++geoRequestId.current;
    setGeoError(null);
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (requestId !== geoRequestId.current) return;
        setIsLocating(false);
        onChange({
          nearby: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            radiusKm,
          },
        });
      },
      (error) => {
        if (requestId !== geoRequestId.current) return;
        setIsLocating(false);
        setGeoError(geolocationErrorMessage(error));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleRadiusChange = (value: number) => {
    setRadiusKm(value);
    if (criteria.nearby) {
      onChange({ nearby: { ...criteria.nearby, radiusKm: value } });
    }
  };

  const handleClear = () => {
    geoRequestId.current += 1;
    setIsLocating(false);
    setGeoError(null);
    setRadiusKm(DEFAULT_RADIUS_KM);
    onClear();
  };

  return (
    <div
      style={{
        backgroundColor: 'rgba(20, 18, 32, 0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        <div>
          <label htmlFor={`${uid}-text`} style={labelStyle}>Buscar</label>
          <input
            id={`${uid}-text`}
            type="text"
            value={criteria.text ?? ''}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Título, descripción o lugar"
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-location`} style={labelStyle}>Ciudad o comuna</label>
          <input
            id={`${uid}-location`}
            type="text"
            value={criteria.location ?? ''}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="Ej: Concepción"
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-from`} style={labelStyle}>Desde</label>
          <input
            id={`${uid}-from`}
            type="date"
            value={criteria.dateFrom ?? ''}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-to`} style={labelStyle}>Hasta</label>
          <input
            id={`${uid}-to`}
            type="date"
            value={criteria.dateTo ?? ''}
            onChange={(e) => onChange({ dateTo: e.target.value })}
            style={inputStyle}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {DATE_PRESETS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={isPresetActive(key)}
            onClick={() => handlePresetClick(key)}
            style={chipStyle(isPresetActive(key))}
          >
            {label}
          </button>
        ))}

        <span style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,0.08)' }} />

        <button
          type="button"
          aria-pressed={nearbyActive}
          disabled={isLocating}
          onClick={handleNearbyClick}
          style={{
            ...chipStyle(nearbyActive),
            cursor: isLocating ? 'wait' : 'pointer',
            opacity: isLocating ? 0.7 : 1,
          }}
        >
          {isLocating ? 'Ubicando...' : '📍 Cerca de mí'}
        </button>

        <label htmlFor={`${uid}-radius`} style={{ ...labelStyle, display: 'inline', margin: 0 }}>
          Radio
        </label>
        <select
          id={`${uid}-radius`}
          value={radiusKm}
          onChange={(e) => handleRadiusChange(Number(e.target.value))}
          style={{ ...inputStyle, width: 'auto' }}
        >
          {RADIUS_OPTIONS_KM.map((km) => (
            <option key={km} value={km}>{km} km</option>
          ))}
        </select>

        <button
          type="button"
          disabled={!active && !geoError}
          onClick={handleClear}
          style={{
            marginLeft: 'auto',
            padding: '9px 14px',
            background: 'rgba(255, 80, 80, 0.12)',
            border: '1px solid rgba(255, 80, 80, 0.3)',
            color: '#ff8a8a',
            borderRadius: '8px',
            cursor: active || geoError ? 'pointer' : 'not-allowed',
            opacity: active || geoError ? 1 : 0.5,
            fontSize: '14px',
          }}
        >
          Limpiar filtros
        </button>
      </div>

      {geoError && (
        <div
          role="alert"
          style={{
            marginTop: '12px',
            padding: '10px 12px',
            backgroundColor: 'rgba(255,80,80,0.1)',
            border: '1px solid rgba(255,80,80,0.2)',
            color: '#ff8a8a',
            borderRadius: '8px',
            fontSize: '13px',
          }}
        >
          {geoError}
        </div>
      )}
    </div>
  );
};
