import { useState, useEffect, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { authService } from '../features/auth/services/auth.services';
import { storageService } from '../services/storage.service';
import { setAuthToken } from '../services/api.config';
import type { 
  User, 
  LoginCredentials, 
  RegisterCredentials 
} from '../features/auth/types/auth.types';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar auth desde localStorage al cargar la app
  useEffect(() => {
    const initAuth = () => {
      const savedToken = storageService.getToken();
      const savedUser = storageService.getUser<User>();

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(savedUser);
        setAuthToken(savedToken);
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      
      const userData: User = {
        id: response.id,
        username: response.username,
      };

      // Guardar en estado
      setToken(response.token);
      setUser(userData);

      // Guardar en localStorage
      storageService.setToken(response.token);
      storageService.setUser(userData);

      // Setear token en axios headers
      setAuthToken(response.token);
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  // Register
  const register = async (credentials: RegisterCredentials) => {
    try {
      // Crear usuario
      await authService.register(credentials);
      
      // Hacer login automático después del registro
      await login({
        username: credentials.username,
        password: credentials.password,
      });
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  };

  // Logout (solo frontend)
  const logout = () => {
    // Limpiar estado
    setUser(null);
    setToken(null);

    // Limpiar localStorage
    storageService.clearAuth();

    // Limpiar token de axios
    setAuthToken(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};