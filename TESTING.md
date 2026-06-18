# Informe de Pruebas de Software — FrontendMemoria

## 1. Introducción

Las pruebas de software son una disciplina fundamental en el desarrollo de aplicaciones modernas. Su propósito es verificar que el código se comporta de la manera esperada, detectar errores antes de que lleguen a producción y proporcionar una red de seguridad que permita realizar cambios con confianza.

En aplicaciones frontend, la necesidad de pruebas es especialmente crítica: la lógica de negocio, el manejo de estado, la comunicación con APIs y el comportamiento de la interfaz de usuario son puntos donde los errores impactan directamente a los usuarios finales. Un formulario que acepta datos inválidos, una sesión que no se restaura correctamente o un botón que navega a la página equivocada son fallas que ningún análisis estático puede detectar por sí solo.

Este documento describe la estrategia de pruebas implementada para el proyecto **FrontendMemoria**, una aplicación React con TypeScript que permite a los usuarios crear y gestionar eventos geolocalizados.

---

## 2. Tipos de Pruebas de Software

Antes de detallar las pruebas realizadas, es útil entender las categorías principales que existen en la industria:

### 2.1 Pruebas Unitarias

Son el tipo más granular. Se prueba una unidad de código —una función, un hook, un componente— de forma aislada del resto del sistema. Las dependencias externas (APIs, base de datos, otros módulos) se reemplazan por dobles de prueba llamados *mocks*.

**Ventajas:** rápidas de ejecutar, fáciles de diagnosticar cuando fallan, deterministas.
**Limitación:** no garantizan que las piezas funcionen correctamente cuando se integran entre sí.

### 2.2 Pruebas de Integración

Verifican la interacción entre dos o más módulos del sistema. Por ejemplo, probar que un componente React consume correctamente el contexto de autenticación, o que un hook llama a un servicio y actualiza el estado en respuesta.

**Ventajas:** detectan problemas en los contratos entre módulos.
**Limitación:** más lentas y complejas de configurar que las unitarias.

### 2.3 Pruebas de Extremo a Extremo (E2E)

Simulan la experiencia completa de un usuario real interactuando con la aplicación en un navegador real. Herramientas como Playwright o Cypress automatizan este proceso.

**Ventajas:** la mayor fidelidad posible respecto al comportamiento real.
**Limitación:** lentas, frágiles ante cambios de UI, requieren infraestructura adicional.

### 2.4 La Pirámide de Pruebas

La industria recomienda distribuir los esfuerzos en forma de pirámide: muchas pruebas unitarias en la base (rápidas y baratas), un número moderado de pruebas de integración en el medio, y pocas pruebas E2E en la cúspide. Esta distribución maximiza la cobertura al menor costo de mantenimiento.

```
        /\
       /E2E\
      /──────\
     /Integrac.\
    /────────────\
   /   Unitarias  \
  /────────────────\
```

---

## 3. Stack Tecnológico de Pruebas

| Herramienta | Rol |
|---|---|
| **Vitest** | Test runner integrado con Vite. Comparte la misma configuración de transformación que el proyecto, lo que elimina discrepancias entre entorno de desarrollo y entorno de pruebas. |
| **React Testing Library** | Renderiza componentes React en un DOM simulado. Su filosofía central es probar el comportamiento observable por el usuario, no los detalles internos de implementación. |
| **@testing-library/user-event** | Simula eventos de usuario (clicks, escritura) de forma realista. |
| **@testing-library/jest-dom** | Extiende los matchers de Vitest con aserciones específicas del DOM (`toBeInTheDocument`, `toHaveTextContent`, etc.). |
| **jsdom** | Implementación de las APIs del navegador (DOM, localStorage, eventos) en Node.js. Permite correr tests de UI sin abrir un navegador real. |

---

## 4. Pruebas Realizadas

### 4.1 Validadores de Formularios

**Archivo:** `src/features/events/utils/validators.test.ts`
**Tipo:** Unitaria pura

Los validadores son funciones puras sin dependencias externas, lo que los convierte en el candidato ideal para pruebas unitarias directas. Se verificó cada función con casos de borde, valores límite y entradas inválidas.

| Función | Casos probados |
|---|---|
| `sanitizeText` | Trim de espacios, escape de `<>`, escape de comillas y barras |
| `validateTitle` | Rechazo por longitud < 3, rechazo por longitud > 100, aceptación válida |
| `validateDescription` | Rechazo por longitud < 10, rechazo por longitud > 500, aceptación válida |
| `validateLocation` | Rechazo por longitud < 3, rechazo por longitud > 200, aceptación válida |
| `validateDate` | Rechazo de fecha vacía, rechazo de fecha pasada, aceptación de fecha futura |
| `validateTime` | Campo opcional vacío, formato inválido, formato válido |
| `validateTimeRange` | Hora de fin igual a inicio, hora de fin anterior, rango válido |
| `validateCoordinates` | Latitud fuera de rango, longitud fuera de rango, coordenadas válidas |

**Tests:** 24 | **Resultado:** 24 ✓

---

### 4.2 Servicio de Almacenamiento

**Archivo:** `src/services/storage.service.test.ts`
**Tipo:** Unitaria con mock de localStorage

El `storageService` encapsula toda la interacción con `localStorage` para tokens y datos de usuario. Se reemplazó el `localStorage` del navegador por una implementación en memoria para garantizar aislamiento entre tests.

| Módulo | Casos probados |
|---|---|
| Token | Retorno null sin token, almacenamiento y recuperación, eliminación |
| Usuario | Retorno null sin usuario, almacenamiento y recuperación con JSON, eliminación |
| clearAuth | Eliminación simultánea de token y usuario |

**Tests:** 7 | **Resultado:** 7 ✓

---

### 4.3 Hook useLocalStorage

**Archivo:** `src/hooks/useLocalStorage.test.ts`
**Tipo:** Unitaria de hook React

Hook genérico que sincroniza estado de React con `localStorage`. Se utilizó `renderHook` de React Testing Library para probar el hook de forma aislada, simulando el ciclo de vida de un componente sin necesidad de renderizar UI.

| Caso probado | Descripción |
|---|---|
| Valor inicial | Retorna el valor por defecto cuando la clave no existe |
| Persistencia previa | Lee correctamente un valor guardado antes del montaje |
| Escritura | Persiste el nuevo valor en localStorage al llamar a `setValue` |
| Actualización de estado | El estado React refleja el nuevo valor inmediatamente |
| Función actualizadora | Soporta el patrón `setValue(prev => prev + 1)` |
| Objetos complejos | Serializa y deserializa objetos correctamente |
| JSON corrupto | Cae al valor inicial sin lanzar excepción |

**Tests:** 7 | **Resultado:** 7 ✓

---

### 4.4 Ruta Protegida

**Archivo:** `src/router/ProtectedRoute.test.tsx`
**Tipo:** Integración (componente + contexto)

`ProtectedRoute` es el guardián de todas las rutas privadas de la aplicación. Se mockeó el hook `useAuth` para simular los tres estados posibles del ciclo de autenticación.

| Escenario | Comportamiento esperado |
|---|---|
| Autenticación en curso (`isLoading: true`) | Muestra indicador de carga, no renderiza hijos |
| No autenticado (`isAuthenticated: false`) | Redirige a `/login`, no renderiza hijos |
| Autenticado (`isAuthenticated: true`) | Renderiza los componentes hijos correctamente |

**Tests:** 3 | **Resultado:** 3 ✓

---

### 4.5 Servicios de API

**Archivos:** `auth.services.test.ts` y `events.services.test.ts`
**Tipo:** Unitaria con mock de axios

Los servicios son la capa que comunica el frontend con el backend. Se mockeó la instancia de axios para verificar que cada método llama al endpoint correcto con los parámetros y el cuerpo adecuados, sin realizar peticiones HTTP reales.

**authService:**

| Método | Verificaciones |
|---|---|
| `login` | Endpoint `/auth/login`, propagación de credenciales, manejo de error |
| `register` | Endpoint `/users`, propagación de todos los campos, manejo de error |

**eventsService:**

| Método | Verificaciones |
|---|---|
| `getAll` | GET `/events/allEvents` |
| `getMyEvents` | GET `/events/my-events` con parámetro `userId` |
| `getById` | GET `/events/:id` con ID dinámico |
| `create` | POST `/events` con body y parámetro `userId` |
| `update` | PUT `/events/:id` con body y parámetro `userId` |
| `delete` | DELETE `/events/:id` con parámetro `userId` |

**Tests:** 10 | **Resultado:** 10 ✓

---

### 4.6 Proveedor de Autenticación

**Archivo:** `src/context/AuthProvider.test.tsx`
**Tipo:** Integración (contexto + hooks + servicios)

`AuthProvider` es el componente más crítico de la aplicación: gestiona el ciclo completo de autenticación y provee el estado global de sesión a toda la aplicación. Se renderizó el proveedor con un componente consumidor real para probar el sistema completo de contexto.

| Módulo | Casos probados |
|---|---|
| Inicialización | Comienza en estado de carga, resuelve a `isLoading: false` |
| Restauración de sesión | Recupera token y usuario desde localStorage al montar |
| Sin sesión previa | Permanece no autenticado cuando localStorage está vacío |
| Login exitoso | Actualiza usuario, token y estado de autenticación |
| Login — persistencia | Persiste token y usuario en localStorage, configura axios |
| Login — error | Expone el error al consumidor, no modifica el estado |
| Logout | Limpia estado, localStorage y headers de axios |
| Register | Registra al usuario y ejecuta login automático |
| Register — error | Expone el error al consumidor sin modificar el estado |

**Tests:** 9 | **Resultado:** 9 ✓

---

### 4.7 Hook useEvents

**Archivo:** `src/features/events/hooks/useEvents.test.ts`
**Tipo:** Integración (hook + servicio + contexto)

Hook central de la lógica de eventos. Se mockearon tanto el servicio de API como el contexto de autenticación para probar el comportamiento del hook de forma aislada.

| Operación | Casos probados |
|---|---|
| `fetchEvents` | Carga correcta, limpieza de estado de carga, manejo de error |
| `createEvent` | Agrega el evento a la lista, retorna `true`; retorna `false` sin usuario |
| `updateEvent` | Reemplaza el evento en la lista, retorna `true` |
| `deleteEvent` | Elimina el evento de la lista; establece error ante fallo |

**Tests:** 7 | **Resultado:** 7 ✓

---

### 4.8 Componente EventCard

**Archivo:** `src/features/events/components/EventCard.test.tsx`
**Tipo:** Integración (componente + router)

Componente de visualización de eventos con interacciones de navegación y acciones CRUD. Se verificó tanto el renderizado correcto de datos como el comportamiento de los eventos de usuario.

| Módulo | Casos probados |
|---|---|
| Renderizado | Título, descripción, ubicación, fecha, rango horario opcional |
| Visibilidad de acciones | Botones ocultos sin `showActions`, visibles con `showActions` |
| Navegación | Click en la card navega a `/events/:id` |
| Edición | Click en "Editar" invoca `onEdit` con el evento correcto |
| Eliminación | Click en "Eliminar" invoca `onDelete` con el ID correcto |
| Propagación de eventos | Botones de acción no disparan la navegación de la card |

**Tests:** 8 | **Resultado:** 8 ✓

---

## 5. Resultados Globales

```
 Test Files  9 passed (9)
      Tests  75 passed (75)
   Duration  ~900ms
```

| Archivo de prueba | Tests | Estado |
|---|---|---|
| `events/utils/validators.test.ts` | 24 | ✓ Todos pasando |
| `services/storage.service.test.ts` | 7 | ✓ Todos pasando |
| `hooks/useLocalStorage.test.ts` | 7 | ✓ Todos pasando |
| `router/ProtectedRoute.test.tsx` | 3 | ✓ Todos pasando |
| `auth/services/auth.services.test.ts` | 4 | ✓ Todos pasando |
| `events/services/events.services.test.ts` | 6 | ✓ Todos pasando |
| `context/AuthProvider.test.tsx` | 9 | ✓ Todos pasando |
| `events/hooks/useEvents.test.ts` | 7 | ✓ Todos pasando |
| `events/components/EventCard.test.tsx` | 8 | ✓ Todos pasando |
| **Total** | **75** | **75 ✓ / 0 ✗** |

---

## 6. Conclusión

La suite de pruebas implementada cubre de manera sistemática las capas más significativas de la aplicación: lógica de negocio pura, servicios de infraestructura, contexto de autenticación, hooks de estado y componentes de interfaz. Los 75 tests se ejecutan en menos de un segundo, lo que garantiza que el ciclo de retroalimentación durante el desarrollo sea inmediato y no represente una fricción para el equipo.

Más allá de los números, la decisión más importante fue la de priorizar las pruebas por impacto real. Se cubrió primero lo que más duele cuando falla en producción —el sistema de autenticación, la validación de datos y las rutas protegidas— y se dejó fuera lo que tiene bajo retorno en esta etapa, como los componentes de mapa que dependen de Leaflet, una librería que no funciona en entornos de prueba simulados.

Esta suite establece un contrato vivo entre la intención del código y su comportamiento real. Cada test es una afirmación documentada sobre cómo debe funcionar el sistema: que una fecha pasada sea rechazada, que el logout limpie tanto el estado como el almacenamiento local, que un usuario no autenticado nunca pueda ver rutas protegidas. Ese conjunto de afirmaciones no solo detecta regresiones: comunica las reglas de negocio de forma más precisa que cualquier documentación en prosa.

El paso natural siguiente sería incorporar umbrales de cobertura en la configuración de Vitest y ejecutar la suite de forma automática en cada pull request mediante GitHub Actions, convirtiendo lo que hoy es una herramienta de desarrollo en una garantía de calidad continua.
