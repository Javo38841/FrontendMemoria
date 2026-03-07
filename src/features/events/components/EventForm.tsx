import { useState, useEffect } from 'react';
import { LocationPicker } from './map/LocationPicker.tsx';
import type { Event, EventFormData } from '../types/events.types';
import {
    sanitizeText,
    validateTitle,
    validateDescription,
    validateLocation,
    validateDate,
    validateTime,
    validateTimeRange,
    validateCoordinates,
} from '../../events/utils/validators';

interface EventFormProps {
    event?: Event;
    onSubmit: (data: EventFormData) => Promise<void>;
    onCancel: () => void;
    isLoading: boolean;
}

interface FormErrors {
    title?: string;
    description?: string;
    location?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    timeRange?: string;
    coordinates?: string;
}

export const EventForm = ({ event, onSubmit, onCancel, isLoading }: EventFormProps) => {
    const [formData, setFormData] = useState<EventFormData>({
        title: '',
        description: '',
        date: '',
        location: '',
        startTime: '',
        endTime: '',
        latitude: -36.8261,
        longitude: -73.0493,
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Cargar datos si es edición
    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title,
                description: event.description,
                date: event.date,
                location: event.location,
                startTime: event.startTime || '',
                endTime: event.endTime || '',
                latitude: event.latitude || -36.8261,
                longitude: event.longitude || -73.0493,
            });
        }
    }, [event]);

    // Validar campo individual
    const validateField = (name: string, value: any): string | undefined => {
        switch (name) {
            case 'title':
                const titleValidation = validateTitle(value);
                return titleValidation.isValid ? undefined : titleValidation.error;

            case 'description':
                const descValidation = validateDescription(value);
                return descValidation.isValid ? undefined : descValidation.error;

            case 'location':
                const locValidation = validateLocation(value);
                return locValidation.isValid ? undefined : locValidation.error;

            case 'date':
                const dateValidation = validateDate(value);
                return dateValidation.isValid ? undefined : dateValidation.error;

            case 'startTime':
            case 'endTime':
                const timeValidation = validateTime(value);
                if (!timeValidation.isValid) return timeValidation.error;

                // Validar rango si ambas horas están presentes
                if (formData.startTime && formData.endTime) {
                    const rangeValidation = validateTimeRange(formData.startTime, formData.endTime);
                    if (!rangeValidation.isValid) {
                        setErrors(prev => ({ ...prev, timeRange: rangeValidation.error }));
                    } else {
                        setErrors(prev => ({ ...prev, timeRange: undefined }));
                    }
                }
                return undefined;

            default:
                return undefined;
        }
    };

    // Manejar cambios en inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const sanitizedValue = name === 'title' || name === 'description' || name === 'location'
            ? sanitizeText(value)
            : value;

        setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));

        // Validar si el campo ya fue tocado
        if (touched[name]) {
            const error = validateField(name, sanitizedValue);
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    // Manejar blur (cuando el usuario sale del campo)
    const handleBlur = (name: string) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, formData[name as keyof EventFormData]);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    // Manejar cambio de ubicación desde el mapa
    const handleLocationChange = (data: { latitude: number; longitude: number; location: string }) => {
        setFormData(prev => ({
            ...prev,
            latitude: data.latitude,
            longitude: data.longitude,
            location: data.location,
        }));

        // Validar coordenadas
        const coordValidation = validateCoordinates(data.latitude, data.longitude);
        setErrors(prev => ({
            ...prev,
            coordinates: coordValidation.isValid ? undefined : coordValidation.error
        }));

        // Validar ubicación
        const locValidation = validateLocation(data.location);
        setErrors(prev => ({
            ...prev,
            location: locValidation.isValid ? undefined : locValidation.error
        }));
    };

    // Validar todo el formulario
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        const titleVal = validateTitle(formData.title);
        if (!titleVal.isValid) newErrors.title = titleVal.error;

        const descVal = validateDescription(formData.description);
        if (!descVal.isValid) newErrors.description = descVal.error;

        const locVal = validateLocation(formData.location);
        if (!locVal.isValid) newErrors.location = locVal.error;

        const dateVal = validateDate(formData.date);
        if (!dateVal.isValid) newErrors.date = dateVal.error;

        if (formData.startTime) {
            const startVal = validateTime(formData.startTime);
            if (!startVal.isValid) newErrors.startTime = startVal.error;
        }

        if (formData.endTime) {
            const endVal = validateTime(formData.endTime);
            if (!endVal.isValid) newErrors.endTime = endVal.error;
        }

        if (formData.startTime && formData.endTime) {
            const rangeVal = validateTimeRange(formData.startTime, formData.endTime);
            if (!rangeVal.isValid) newErrors.timeRange = rangeVal.error;
        }

        const coordVal = validateCoordinates(formData.latitude, formData.longitude);
        if (!coordVal.isValid) newErrors.coordinates = coordVal.error;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Enviar formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Marcar todos los campos como tocados
        setTouched({
            title: true,
            description: true,
            location: true,
            date: true,
            startTime: true,
            endTime: true,
        });

        // Validar todo
        if (!validateForm()) {
            return;
        }

        await onSubmit(formData);
    };

    const inputStyle = (fieldName: string) => ({
        width: '100%',
        padding: '10px',
        fontSize: '14px',
        borderRadius: '4px',
        border: `1px solid ${touched[fieldName] && errors[fieldName as keyof FormErrors] ? '#dc2626' : '#d1d5db'}`,
        outline: 'none',
    });

    const errorStyle = {
        color: '#dc2626',
        fontSize: '12px',
        marginTop: '4px',
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
            {/* Título */}
            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Título *
                </label>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    onBlur={() => handleBlur('title')}
                    required
                    maxLength={100}
                    style={inputStyle('title')}
                />
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    {formData.title.length}/100 caracteres
                </div>
                {touched.title && errors.title && (
                    <div style={errorStyle}>{errors.title}</div>
                )}
            </div>

            {/* Descripción */}
            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Descripción *
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    onBlur={() => handleBlur('description')}
                    required
                    maxLength={500}
                    rows={4}
                    style={{
                        ...inputStyle('description'),
                        fontFamily: 'inherit',
                        resize: 'vertical',
                    }}
                />
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    {formData.description.length}/500 caracteres
                </div>
                {touched.description && errors.description && (
                    <div style={errorStyle}>{errors.description}</div>
                )}
            </div>

            {/* LocationPicker (integrado) */}
            <LocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                location={formData.location}
                onLocationChange={handleLocationChange}
            />
            {errors.location && (
                <div style={errorStyle}>{errors.location}</div>
            )}
            {errors.coordinates && (
                <div style={errorStyle}>{errors.coordinates}</div>
            )}

            {/* Fecha */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px', marginTop: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                        Fecha *
                    </label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        onBlur={() => handleBlur('date')}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        style={inputStyle('date')}
                    />
                    {touched.date && errors.date && (
                        <div style={errorStyle}>{errors.date}</div>
                    )}
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                        Hora Inicio
                    </label>
                    <input
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        onBlur={() => handleBlur('startTime')}
                        style={inputStyle('startTime')}
                    />
                    {touched.startTime && errors.startTime && (
                        <div style={errorStyle}>{errors.startTime}</div>
                    )}
                </div>
            </div>

            {/* Hora Fin */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Hora Fin
                </label>
                <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    onBlur={() => handleBlur('endTime')}
                    style={inputStyle('endTime')}
                />
                {touched.endTime && errors.endTime && (
                    <div style={errorStyle}>{errors.endTime}</div>
                )}
                {errors.timeRange && (
                    <div style={errorStyle}>{errors.timeRange}</div>
                )}
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '10px' }}>
                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: '500',
                    }}
                >
                    {isLoading ? 'Guardando...' : event ? 'Actualizar Evento' : 'Crear Evento'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: '500',
                    }}
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
};