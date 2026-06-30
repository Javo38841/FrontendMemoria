import { useNavigate } from 'react-router-dom';
import type { Event } from '../types/events.types';

interface EventCardProps {
    event: Event;
    onEdit?: (event: Event) => void;
    onDelete?: (eventId: number) => void;
    showActions?: boolean;
}

export const EventCard = ({ event, onEdit, onDelete, showActions = false }: EventCardProps) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/events/${event.id}`);
    };

    return (
        <div
            onClick={handleCardClick}
            style={{
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '15px',
                backgroundColor: 'rgba(20, 18, 32, 0.85)',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s, border-color 0.2s',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 24px rgba(120, 80, 220, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(155, 110, 240, 0.35)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#e6e6f0' }}>
                        {event.title}
                    </h3>
                    <p style={{ margin: '0 0 10px 0', color: '#9b95ad' }}>
                        {event.description}
                    </p>
                    <div style={{ fontSize: '14px', color: '#9b95ad' }}>
                        <div>📍 {event.location}</div>
                        <div>📅 {event.date}</div>
                        {event.startTime && event.endTime && (
                            <div>🕐 {event.startTime} - {event.endTime}</div>
                        )}
                    </div>
                </div>

                {showActions && (
                    <div
                        style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {onEdit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(event);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    background: 'rgba(99, 102, 241, 0.18)',
                                    border: '1px solid rgba(99, 102, 241, 0.4)',
                                    color: '#a5b4fc',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                ✏️ Editar
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(event.id);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    background: 'rgba(255, 80, 80, 0.12)',
                                    border: '1px solid rgba(255, 80, 80, 0.3)',
                                    color: '#ff8a8a',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                🗑️ Eliminar
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};