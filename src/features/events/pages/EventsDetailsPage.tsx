import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsService } from '../services/events.services';
import { MapView } from '../components/map/MapView';
import type { Event } from '../types/events.types';

export const EventDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) return;

            try {
                const data = await eventsService.getById(Number(id));
                setEvent(data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Error al cargar el evento');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvent();
    }, [id]);

    if (isLoading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <p>Cargando evento...</p>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
                <div style={{
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e5e7eb',
                    padding: '20px 40px',
                }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <button
                            onClick={() => navigate('/events')}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            ← Volver a Eventos
                        </button>
                    </div>
                </div>

                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <p style={{ color: '#dc2626', marginBottom: '20px' }}>
                        {error || 'Evento no encontrado'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            {/* Header */}
            <div style={{
                backgroundColor: 'white',
                borderBottom: '1px solid #e5e7eb',
                padding: '20px 40px',
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <button
                        onClick={() => navigate('/events')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginBottom: '10px',
                        }}
                    >
                        ← Volver a Eventos
                    </button>
                    <h1 style={{ margin: 0 }}>{event.title}</h1>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                }}>
                    {/* Descripción */}
                    <div style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Descripción</h2>
                        <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                            {event.description}
                        </p>
                    </div>

                    {/* Detalles */}
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Detalles</h3>
                        <div style={{ fontSize: '16px', color: '#6b7280' }}>
                            <div style={{ marginBottom: '10px' }}>
                                <strong>📍 Ubicación:</strong> {event.location}
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <strong>📅 Fecha:</strong> {event.date}
                            </div>
                            {event.startTime && event.endTime && (
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>🕐 Horario:</strong> {event.startTime} - {event.endTime}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mapa */}
                    {event.latitude && event.longitude && (
                        <div>
                            <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>
                                Ubicación en el Mapa
                            </h3>
                            <MapView
                                events={[event]}
                                center={[event.latitude, event.longitude]}
                                zoom={15}
                                height="400px"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};