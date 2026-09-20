/**
 * Validadores de formularios
 *
 * Los textos se miden tal como los escribió el usuario (con trim, sin codificar): así el largo
 * coincide con el contador y con el maxLength de los campos. No se codifica el texto en HTML porque
 * React ya escapa lo que renderiza (no se usa dangerouslySetInnerHTML).
 */

// Validar título (3-100 caracteres)
export const validateTitle = (title: string): { isValid: boolean; error?: string } => {
    const length = title.trim().length;

    if (length < 3) {
        return { isValid: false, error: 'El título debe tener al menos 3 caracteres' };
    }

    if (length > 100) {
        return { isValid: false, error: 'El título no puede exceder 100 caracteres' };
    }

    return { isValid: true };
};

// Validar descripción (10-500 caracteres)
export const validateDescription = (description: string): { isValid: boolean; error?: string } => {
    const length = description.trim().length;

    if (length < 10) {
        return { isValid: false, error: 'La descripción debe tener al menos 10 caracteres' };
    }

    if (length > 500) {
        return { isValid: false, error: 'La descripción no puede exceder 500 caracteres' };
    }

    return { isValid: true };
};

// Validar ubicación
export const validateLocation = (location: string): { isValid: boolean; error?: string } => {
    const length = location.trim().length;

    if (length < 3) {
        return { isValid: false, error: 'La ubicación debe tener al menos 3 caracteres' };
    }

    if (length > 200) {
        return { isValid: false, error: 'La ubicación no puede exceder 200 caracteres' };
    }

    return { isValid: true };
};

// Validar fecha (no puede ser en el pasado)
export const validateDate = (date: string): { isValid: boolean; error?: string } => {
    if (!date) {
        return { isValid: false, error: 'La fecha es obligatoria' };
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        return { isValid: false, error: 'La fecha no puede ser en el pasado' };
    }

    return { isValid: true };
};

// Validar hora (formato HH:mm o HH:mm:ss; el backend devuelve las horas con segundos)
export const validateTime = (time: string): { isValid: boolean; error?: string } => {
    if (!time) return { isValid: true }; // Opcional

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

    if (!timeRegex.test(time)) {
        return { isValid: false, error: 'Formato de hora inválido (HH:mm)' };
    }

    return { isValid: true };
};

// Validar rango de horas (hora fin debe ser después de hora inicio)
export const validateTimeRange = (
    startTime: string,
    endTime: string
): { isValid: boolean; error?: string } => {
    if (!startTime || !endTime) return { isValid: true };

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    if (end <= start) {
        return { isValid: false, error: 'La hora de fin debe ser posterior a la hora de inicio' };
    }

    return { isValid: true };
};

// Validar coordenadas
export const validateCoordinates = (
    latitude: number,
    longitude: number
): { isValid: boolean; error?: string } => {
    if (latitude < -90 || latitude > 90) {
        return { isValid: false, error: 'Latitud inválida (debe estar entre -90 y 90)' };
    }

    if (longitude < -180 || longitude > 180) {
        return { isValid: false, error: 'Longitud inválida (debe estar entre -180 y 180)' };
    }

    return { isValid: true };
};