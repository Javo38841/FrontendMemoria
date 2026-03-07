
import { useState } from 'react';
import { eventsService } from '../services/events.services';
import {useAuth} from "../../auth/hooks/useAuth.ts";
import type { Event, EventRequest } from '../types/events.types';

export const useEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar todos los eventos
  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventsService.getAll();
      setEvents(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar eventos');
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar mis eventos
  const fetchMyEvents = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventsService.getMyEvents(user.id);
      setEvents(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar tus eventos');
      console.error('Error fetching my events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Crear evento
  const createEvent = async (eventData: EventRequest): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);
    setError(null);
    try {
      const newEvent = await eventsService.create(user.id, eventData);
      setEvents((prev) => [...prev, newEvent]);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear evento');
      console.error('Error creating event:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar evento
  const updateEvent = async (
    eventId: number,
    eventData: EventRequest
  ): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);
    setError(null);
    try {
      const updatedEvent = await eventsService.update(eventId, user.id, eventData);
      setEvents((prev) =>
        prev.map((event) => (event.id === eventId ? updatedEvent : event))
      );
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar evento');
      console.error('Error updating event:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar evento
  const deleteEvent = async (eventId: number): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);
    setError(null);
    try {
      await eventsService.delete(eventId, user.id);
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar evento');
      console.error('Error deleting event:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    events,
    isLoading,
    error,
    fetchEvents,
    fetchMyEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
};