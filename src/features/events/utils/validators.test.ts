import { describe, it, expect } from 'vitest'
import {
  sanitizeText,
  validateTitle,
  validateDescription,
  validateLocation,
  validateDate,
  validateTime,
  validateTimeRange,
  validateCoordinates,
} from './validators'

describe('sanitizeText', () => {
  it('trim whitespace', () => {
    expect(sanitizeText('  hola  ')).toBe('hola')
  })

  it('escapes < and >', () => {
    expect(sanitizeText('<script>')).toBe('&lt;script&gt;')
  })

  it('escapes quotes and slashes', () => {
    expect(sanitizeText('"hello\'/path')).toBe('&quot;hello&#x27;&#x2F;path')
  })
})

describe('validateTitle', () => {
  it('rejects titles shorter than 3 chars', () => {
    expect(validateTitle('ab')).toEqual({ isValid: false, error: expect.any(String) })
  })

  it('rejects titles longer than 100 chars', () => {
    expect(validateTitle('a'.repeat(101))).toEqual({ isValid: false, error: expect.any(String) })
  })

  it('accepts valid title', () => {
    expect(validateTitle('Evento de prueba')).toEqual({ isValid: true })
  })
})

describe('validateDescription', () => {
  it('rejects descriptions shorter than 10 chars', () => {
    expect(validateDescription('corta')).toEqual({ isValid: false, error: expect.any(String) })
  })

  it('rejects descriptions longer than 500 chars', () => {
    expect(validateDescription('a'.repeat(501))).toEqual({ isValid: false, error: expect.any(String) })
  })

  it('accepts valid description', () => {
    expect(validateDescription('Esta es una descripción válida')).toEqual({ isValid: true })
  })
})

describe('validateLocation', () => {
  it('rejects location shorter than 3 chars', () => {
    expect(validateLocation('ab')).toEqual({ isValid: false, error: expect.any(String) })
  })

  it('rejects location longer than 200 chars', () => {
    expect(validateLocation('a'.repeat(201))).toEqual({ isValid: false, error: expect.any(String) })
  })

  it('accepts valid location', () => {
    expect(validateLocation('Santiago, Chile')).toEqual({ isValid: true })
  })
})

describe('validateDate', () => {
  it('rejects empty date', () => {
    expect(validateDate('')).toEqual({ isValid: false, error: expect.any(String) })
  })

  it('rejects past date', () => {
    expect(validateDate('2020-01-01')).toEqual({ isValid: false, error: expect.any(String) })
  })

  it('accepts future date', () => {
    expect(validateDate('2099-12-31')).toEqual({ isValid: true })
  })
})

describe('validateTime', () => {
  it('accepts empty time (optional)', () => {
    expect(validateTime('')).toEqual({ isValid: true })
  })

  it('rejects invalid format', () => {
    expect(validateTime('25:00')).toEqual({ isValid: false, error: expect.any(String) })
    expect(validateTime('9:5')).toEqual({ isValid: false, error: expect.any(String) })
  })

  it('accepts valid time', () => {
    expect(validateTime('09:30')).toEqual({ isValid: true })
    expect(validateTime('23:59')).toEqual({ isValid: true })
  })
})

describe('validateTimeRange', () => {
  it('accepts when either time is missing', () => {
    expect(validateTimeRange('', '10:00')).toEqual({ isValid: true })
    expect(validateTimeRange('10:00', '')).toEqual({ isValid: true })
  })

  it('rejects end time before or equal to start time', () => {
    expect(validateTimeRange('10:00', '09:00')).toEqual({ isValid: false, error: expect.any(String) })
    expect(validateTimeRange('10:00', '10:00')).toEqual({ isValid: false, error: expect.any(String) })
  })

  it('accepts end time after start time', () => {
    expect(validateTimeRange('09:00', '10:00')).toEqual({ isValid: true })
  })
})

describe('validateCoordinates', () => {
  it('rejects latitude out of range', () => {
    expect(validateCoordinates(-91, 0)).toEqual({ isValid: false, error: expect.any(String) })
    expect(validateCoordinates(91, 0)).toEqual({ isValid: false, error: expect.any(String) })
  })

  it('rejects longitude out of range', () => {
    expect(validateCoordinates(0, -181)).toEqual({ isValid: false, error: expect.any(String) })
    expect(validateCoordinates(0, 181)).toEqual({ isValid: false, error: expect.any(String) })
  })

  it('accepts valid coordinates', () => {
    expect(validateCoordinates(-33.4489, -70.6693)).toEqual({ isValid: true })
  })
})
