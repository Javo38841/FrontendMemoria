import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { ROUTES } from './routes';

// Auth pages
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';

// Events pages
import { EventsPage } from '../features/events/pages/EventsPage';
import { MyEventsPage } from '../features/events/pages/MyEventsPage';
import { CreateEventPage } from '../features/events/pages/CreateEventPage';
import { EditEventPage } from '../features/events/pages/EditEventPage';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

        {/* Rutas protegidas */}
        <Route
          path={ROUTES.EVENTS}
          element={
            <ProtectedRoute>
              <EventsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.MY_EVENTS}
          element={
            <ProtectedRoute>
              <MyEventsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.CREATE_EVENT}
          element={
            <ProtectedRoute>
              <CreateEventPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.EDIT_EVENT}
          element={
            <ProtectedRoute>
              <EditEventPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta por defecto */}
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.EVENTS} replace />} />
        
        {/* 404 */}
        <Route path="*" element={<Navigate to={ROUTES.EVENTS} replace />} />
      </Routes>
    </BrowserRouter>
  );
};