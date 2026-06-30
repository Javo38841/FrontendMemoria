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
            <div style={{
                minHeight: '100vh',
                background: 'radial-gradient(circle at 20% 20%, #1a1530 0%, #0a0a14 60%, #050508 100%)',
                padding: '40px',
                textAlign: 'center',
            }}>
                <p style={{ color: '#9b95ad' }}>Cargando evento...</p>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 20% 20%, #1a1530 0%, #0a0a14 60%, #050508 100%)' }}>
                <div style={{
                    backgroundColor: 'rgba(20, 18, 32, 0.85)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    padding: '20px 40px',
                }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <button
                            onClick={() => navigate('/events')}
                            style={{
                                padding: '8px 16px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                color: '#e6e6f0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                            }}
                        >
                            ← Volver a Eventos
                        </button>
                    </div>
                </div>

                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <p style={{ color: '#ff8a8a', marginBottom: '20px' }}>
                        {error || 'Evento no encontrado'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 20% 20%, #1a1530 0%, #0a0a14 60%, #050508 100%)' }}>
            {/* Header */}
            <div style={{
                backgroundColor: 'rgba(20, 18, 32, 0.85)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                padding: '20px 40px',
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <button
                        onClick={() => navigate('/events')}
                        style={{
                            padding: '8px 16px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#e6e6f0',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            marginBottom: '10px',
                        }}
                    >
                        ← Volver a Eventos
                    </button>
                    <h1 style={{ margin: 0, color: '#e6e6f0' }}>{event.title}</h1>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{
                    backgroundColor: 'rgba(20, 18, 32, 0.85)',
                    padding: '30px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}>
                    {/* Descripción */}
                    <div style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#d2b8ff' }}>Descripción</h2>
                        <p style={{ color: '#9b95ad', lineHeight: '1.6' }}>
                            {event.description}
                        </p>
                    </div>

                    {/* Detalles */}
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#d2b8ff' }}>Detalles</h3>
                        <div style={{ fontSize: '16px', color: '#9b95ad' }}>
                            <div style={{ marginBottom: '10px' }}>
                                <strong style={{ color: '#e6e6f0' }}>📍 Ubicación:</strong> {event.location}
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <strong style={{ color: '#e6e6f0' }}>📅 Fecha:</strong> {event.date}
                            </div>
                            {event.startTime && event.endTime && (
                                <div style={{ marginBottom: '10px' }}>
                                    <strong style={{ color: '#e6e6f0' }}>🕐 Horario:</strong> {event.startTime} - {event.endTime}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mapa */}
                    {event.latitude && event.longitude && (
                        <div>
                            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#d2b8ff' }}>
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