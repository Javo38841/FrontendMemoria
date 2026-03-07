import { api } from '../../../services/api.config';
import type { 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials 
} from '../types/auth.types';

export const authService = {
  /**
   * Login de usuario
   * POST /auth/login
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', {
      username: credentials.username,
      password: credentials.password,
    });
    console.log('LOGIN RAW RESPONSE =>', response.data);
    return response.data;
  },

  /**
   * Registro de usuario
   * POST /users
   */
  register: async (credentials: RegisterCredentials): Promise<void> => {
    await api.post('/users', {
      username: credentials.username,
      email: credentials.email,
      password: credentials.password,
    });
  },

  /**
   * Logout (solo frontend - no hay endpoint)
   * Limpia el token del localStorage
   */
  logout: (): void => {
    // No hay endpoint de logout en el backend
    // Solo limpiamos el storage desde el AuthProvider
  },
};