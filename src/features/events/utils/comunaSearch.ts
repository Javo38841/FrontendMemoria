import { COMUNAS } from '../data/comunas';
import type { Comuna } from '../data/comunas';
import { normalizeText } from './filterEvents';

// Comunas cuyo nombre contiene el texto (sin distinguir mayúsculas ni tildes).
// Las que empiezan con el texto van primero; el resto conserva el orden alfabético.
export const searchComunas = (query: string, comunas: Comuna[] = COMUNAS): Comuna[] => {
  const q = normalizeText(query);
  if (!q) return comunas;

  const starts: Comuna[] = [];
  const contains: Comuna[] = [];
  for (const comuna of comunas) {
    const name = normalizeText(comuna.name);
    if (name.startsWith(q)) starts.push(comuna);
    else if (name.includes(q)) contains.push(comuna);
  }
  return [...starts, ...contains];
};
