import { api } from './api.config';
import { storageService } from './storage.service';
import type { AxiosError } from 'axios';

// 🔒 Interceptor REQUEST: Añadir token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = storageService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 🔒 Interceptor RESPONSE: Manejar errores 401
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido - limpiar storage
      storageService.clearAuth();
      
      // Redirigir a login solo si no estamos ya ahí
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);