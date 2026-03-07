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
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '15px',
                backgroundColor: 'white',
                cursor: 'pointer', // ✅ Agregado
                transition: 'box-shadow 0.2s', // ✅ Agregado
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>
                        {event.title}
                    </h3>
                    <p style={{ margin: '0 0 10px 0', color: '#6b7280' }}>
                        {event.description}
                    </p>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
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
                        onClick={(e) => e.stopPropagation()} // ✅ Prevenir navegación al hacer click en botones
                    >
                        {onEdit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // ✅ Agregado
                                    onEdit(event);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
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
                                    e.stopPropagation(); // ✅ Agregado
                                    onDelete(event.id);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
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