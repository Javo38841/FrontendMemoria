export interface EventRequest {
  title: string;
  description: string;
  date: string;       // yyyy-MM-dd
  location: string;
  startTime?: string; // HH:mm:ss
  endTime?: string;   // HH:mm:ss
  latitude: number;
  longitude: number;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  startTime?: string;
  endTime?: string;
  latitude?: number;
  longitude?: number;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventFormData {
  title: string;
  description: string;
  date: string;
  location: string;
  startTime: string;
  endTime: string;
  latitude: number;
  longitude: number;
}

export interface MapViewProps {
  events: Event[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onEventClick?: (event: Event) => void;
}

export interface EventMarkerProps {
  event: Event;
  onClick?: (event: Event) => void;
}