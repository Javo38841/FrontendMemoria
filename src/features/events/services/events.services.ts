import { api } from '../../../services/api.config';
import type { Event, EventRequest } from '../types/events.types';

export const eventsService = {
  /**
   * Obtener todos los eventos
   */
  getAll: async (): Promise<Event[]> => {
    const response = await api.get<Event[]>('/events/allEvents');
    return response.data;
  },

  /**
   * Obtener mis eventos
   */
  getMyEvents: async (userId: number): Promise<Event[]> => {
    const response = await api.get<Event[]>('/events/my-events', {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Obtener evento por ID
   */
  getById: async (eventId: number): Promise<Event> => {
    const response = await api.get<Event>(`/events/${eventId}`);
    return response.data;
  },

  /**
   * Crear evento
   */
  create: async (userId: number, event: EventRequest): Promise<Event> => {
    const response = await api.post<Event>('/events', event, {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Actualizar evento
   */
  update: async (
    eventId: number,
    userId: number,
    event: EventRequest
  ): Promise<Event> => {
    const response = await api.put<Event>(`/events/${eventId}`, event, {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Eliminar evento
   */
  delete: async (eventId: number, userId: number): Promise<void> => {
    await api.delete(`/events/${eventId}`, {
      params: { userId },
    });
  },
};