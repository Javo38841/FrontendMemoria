export const ROUTES = {
  // Públicas
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',

  // Protegidas - Events
  EVENTS: '/events',
  EVENT_DETAILS: '/events/:id',
  MY_EVENTS: '/my-events',
  CREATE_EVENT: '/events/create',
  EDIT_EVENT: '/events/edit/:id',
} as const;