// Tipos que vienen de tu API
export interface AuthResponse {
  token: string;
  id: number;
  username: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

// Tipo de usuario en el contexto
export interface User {
  id: number;
  username: string;
  email?: string;
}

// Tipo del contexto de autenticación
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}