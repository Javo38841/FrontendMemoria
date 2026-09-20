import type { Event } from '../types/events.types';

export interface NearbyCriteria {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export interface EventFilterCriteria {
  text?: string;
  location?: string;
  dateFrom?: string; // yyyy-MM-dd, inclusivo
  dateTo?: string;   // yyyy-MM-dd, inclusivo
  nearby?: NearbyCriteria | null;
}

export type DatePreset = 'today' | 'week' | 'upcoming';

export const EMPTY_FILTER_CRITERIA: EventFilterCriteria = {
  text: '',
  location: '',
  dateFrom: '',
  dateTo: '',
  nearby: null,
};

const EARTH_RADIUS_KM = 6371;

// Minúsculas y sin tildes: "Concepción" -> "concepcion"
export const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();

const pad = (n: number): string => String(n).padStart(2, '0');

// Fecha LOCAL como yyyy-MM-dd (toISOString usaría UTC y podría correr el día)
export const toLocalDateString = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Rango para los atajos de fecha. "Esta semana" va de lunes a domingo.
export const getDatePresetRange = (
  preset: DatePreset,
  now: Date = new Date()
): { dateFrom: string; dateTo: string } => {
  const today = toLocalDateString(now);

  if (preset === 'today') {
    return { dateFrom: today, dateTo: today };
  }

  if (preset === 'upcoming') {
    return { dateFrom: today, dateTo: '' };
  }

  const daysSinceMonday = (now.getDay() + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return { dateFrom: toLocalDateString(monday), dateTo: toLocalDateString(sunday) };
};

export const haversineKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
};

export const hasActiveFilters = (criteria: EventFilterCriteria): boolean =>
  Boolean(
    criteria.text?.trim() ||
      criteria.location?.trim() ||
      criteria.dateFrom ||
      criteria.dateTo ||
      criteria.nearby
  );

const hasCoordinates = (event: Event): event is Event & { latitude: number; longitude: number } =>
  Number.isFinite(event.latitude) && Number.isFinite(event.longitude);

// Las fechas yyyy-MM-dd se comparan como texto: el orden lexicográfico
// coincide con el cronológico y evita construir Date (que las leería en UTC).
const matchesDate = (event: Event, { dateFrom, dateTo }: EventFilterCriteria): boolean => {
  if (!dateFrom && !dateTo) return true;
  if (!/^\d{4}-\d{2}-\d{2}/.test(event.date ?? '')) return false;

  const eventDate = event.date.slice(0, 10);
  if (dateFrom && eventDate < dateFrom) return false;
  if (dateTo && eventDate > dateTo) return false;
  return true;
};

const matchesNearby = (event: Event, nearby?: NearbyCriteria | null): boolean => {
  if (!nearby) return true;
  if (!hasCoordinates(event)) return false;
  return (
    haversineKm(nearby.latitude, nearby.longitude, event.latitude, event.longitude) <=
    nearby.radiusKm
  );
};

// Devuelve un arreglo nuevo; no modifica `events`. Todos los filtros son AND.
export const filterEvents = (
  events: Event[],
  criteria: EventFilterCriteria
): Event[] => {
  const text = normalizeText(criteria.text ?? '');
  const location = normalizeText(criteria.location ?? '');

  return events.filter((event) => {
    if (text) {
      const haystack = [event.title, event.description, event.location]
        .map((field) => normalizeText(field ?? ''));
      if (!haystack.some((field) => field.includes(text))) return false;
    }

    if (location && !normalizeText(event.location ?? '').includes(location)) return false;

    if (!matchesDate(event, criteria)) return false;

    return matchesNearby(event, criteria.nearby);
  });
};
