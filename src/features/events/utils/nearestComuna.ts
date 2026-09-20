// Determina la comuna de Chile a partir de coordenadas usando los límites
// simplificados de src/features/events/data (ver scripts/build-comunas-data.py).

// polygons -> [anillo exterior, ...huecos]; cada anillo es plano: [lat, lng, lat, lng, ...]
export interface ComunaGeometry {
  n: string;
  p: number[][][];
}

export interface ComunaMatch {
  name: string;
  distanceKm: number; // 0 si el punto está dentro de la comuna
}

// Más allá de esta distancia a cualquier comuna se asume que no está en Chile
export const MAX_DISTANCE_KM = 10;

let geometryPromise: Promise<ComunaGeometry[]> | null = null;

// Los límites pesan ~360 KB, por eso se cargan solo al primer uso
export const loadComunaGeometry = (): Promise<ComunaGeometry[]> => {
  if (!geometryPromise) {
    geometryPromise = import('../data/comunas-geometry.json')
      .then((module) => module.default as ComunaGeometry[])
      .catch((error) => {
        geometryPromise = null; // permitir reintento
        throw error;
      });
  }
  return geometryPromise;
};

const pointInRing = (lat: number, lng: number, ring: number[]): boolean => {
  let inside = false;
  const n = ring.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const yi = ring[2 * i];
    const xi = ring[2 * i + 1];
    const yj = ring[2 * j];
    const xj = ring[2 * j + 1];
    if (xi > lng !== xj > lng && lat < ((yj - yi) * (lng - xi)) / (xj - xi) + yi) {
      inside = !inside;
    }
  }
  return inside;
};

const pointInPolygon = (lat: number, lng: number, polygon: number[][]): boolean =>
  pointInRing(lat, lng, polygon[0]) &&
  !polygon.slice(1).some((hole) => pointInRing(lat, lng, hole));

// Distancia mínima (km) del punto al borde de un anillo. Usa una proyección
// plana local, suficiente para las decenas de km que importan aquí.
const distanceToRingKm = (lat: number, lng: number, ring: number[]): number => {
  const kx = 111.32 * Math.cos((lat * Math.PI) / 180);
  const ky = 110.574;
  const n = ring.length / 2;
  let best = Infinity;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const ax = (ring[2 * j + 1] - lng) * kx;
    const ay = (ring[2 * j] - lat) * ky;
    const bx = (ring[2 * i + 1] - lng) * kx;
    const by = (ring[2 * i] - lat) * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return best;
};

// Comuna que contiene el punto; si cae fuera de todas (mar, borde), la más
// cercana dentro de `maxDistanceKm`. Devuelve null si no hay ninguna cerca.
export const findComunaAt = (
  lat: number,
  lng: number,
  geometry: ComunaGeometry[],
  maxDistanceKm: number = MAX_DISTANCE_KM
): ComunaMatch | null => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  for (const comuna of geometry) {
    if (comuna.p.some((polygon) => pointInPolygon(lat, lng, polygon))) {
      return { name: comuna.n, distanceKm: 0 };
    }
  }

  let nearest: ComunaMatch | null = null;
  for (const comuna of geometry) {
    for (const polygon of comuna.p) {
      const distanceKm = distanceToRingKm(lat, lng, polygon[0]);
      if (distanceKm <= maxDistanceKm && (!nearest || distanceKm < nearest.distanceKm)) {
        nearest = { name: comuna.n, distanceKm };
      }
    }
  }
  return nearest;
};

export const findNearestComuna = async (lat: number, lng: number): Promise<ComunaMatch | null> =>
  findComunaAt(lat, lng, await loadComunaGeometry());
