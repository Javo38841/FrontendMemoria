# Informe de Pruebas de Software — FrontendMemoria

## 1. Introducción y tipos de pruebas

Las pruebas de software son una disciplina fundamental en el desarrollo de aplicaciones modernas. Su propósito es verificar que el código se comporta de la manera esperada, detectar errores antes de que lleguen a producción y proporcionar una red de seguridad que permita realizar cambios con confianza.

En aplicaciones frontend, la necesidad de pruebas es especialmente crítica: la lógica de negocio, el manejo de estado, la comunicación con APIs y el comportamiento de la interfaz de usuario son puntos donde los errores impactan directamente a los usuarios finales. Un formulario que acepta datos inválidos, una sesión que no se restaura correctamente o un botón que navega a la página equivocada son fallas que ningún análisis estático puede detectar por sí solo.

Este documento describe la estrategia de pruebas implementada para el proyecto **FrontendMemoria**, una aplicación React con TypeScript que permite a los usuarios crear y gestionar eventos geolocalizados.

Antes de detallar las pruebas realizadas, es útil entender las categorías principales que existen en la industria:

### 1.1 Pruebas Unitarias

Son el tipo más granular. Se prueba una unidad de código —una función, un hook, un componente— de forma aislada del resto del sistema. Las dependencias externas (APIs, base de datos, otros módulos) se reemplazan por dobles de prueba llamados *mocks*.

**Ventajas:** rápidas de ejecutar, fáciles de diagnosticar cuando fallan, deterministas.
**Limitación:** no garantizan que las piezas funcionen correctamente cuando se integran entre sí.

### 1.2 Pruebas de Integración

Verifican la interacción entre dos o más módulos del sistema. Por ejemplo, probar que un componente React consume correctamente el contexto de autenticación, o que un hook llama a un servicio y actualiza el estado en respuesta.

**Ventajas:** detectan problemas en los contratos entre módulos.
**Limitación:** más lentas y complejas de configurar que las unitarias.

### 1.3 Pruebas de Extremo a Extremo (E2E)

Simulan la experiencia completa de un usuario real interactuando con la aplicación en un navegador real. Herramientas como Playwright o Cypress automatizan este proceso.

**Ventajas:** la mayor fidelidad posible respecto al comportamiento real.
**Limitación:** lentas, frágiles ante cambios de UI, requieren infraestructura adicional.

### 1.4 La Pirámide de Pruebas

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

En este proyecto la distribución real es de 273 pruebas unitarias y de componentes, 33 de integración y 68 E2E (sección 7).

Una precisión de vocabulario: en este informe, las pruebas de la sección 3 que combinan varios módulos con dependencias simuladas (por ejemplo `AuthProvider` con `authService` mockeado) se etiquetan como "integración" por su alcance, pero se ejecutan con el resto de las pruebas unitarias. Las **pruebas de integración contra el backend real** son las de la sección 4.

---

## 2. Stack Tecnológico de Pruebas

| Herramienta | Rol |
|---|---|
| **Vitest** (4.1.9) | Test runner integrado con Vite. Comparte la misma configuración de transformación que el proyecto, lo que elimina discrepancias entre entorno de desarrollo y entorno de pruebas. Se usa con dos configuraciones: la del proyecto (unitarias, entorno jsdom) y `vitest.integration.config.ts` (integración contra el backend, entorno Node). Las unitarias fijan la zona horaria en `America/Santiago` (`vitest.global-tz.ts`, referenciado como `globalSetup` en `vite.config.ts`) para que los defectos que dependen de la zona, como el 7 de la sección 6.1, se detecten en cualquier máquina. |
| **React Testing Library** | Renderiza componentes React en un DOM simulado. Su filosofía central es probar el comportamiento observable por el usuario, no los detalles internos de implementación. |
| **@testing-library/user-event** | Simula eventos de usuario (clicks, escritura) de forma realista. |
| **@testing-library/jest-dom** | Extiende los matchers de Vitest con aserciones específicas del DOM (`toBeInTheDocument`, `toHaveTextContent`, etc.). |
| **jsdom** | Implementación de las APIs del navegador (DOM, localStorage, eventos) en Node.js. Permite correr tests de UI sin abrir un navegador real. |
| **Playwright** (`@playwright/test` 1.63.0) | Automatiza un navegador real para las pruebas E2E. Se usa solo el proyecto **Chromium** (build 153). Levanta el servidor de desarrollo de Vite automáticamente y usa el backend real. |

Comandos:

| Comando | Qué ejecuta |
|---|---|
| `npm test` | Pruebas unitarias y de componentes (excluye `tests/integration/**`) |
| `npm run test:integration` | Pruebas de integración contra el backend real |
| `npm run test:e2e` | Pruebas E2E con Playwright (Chromium) |

---

## 3. Pruebas unitarias y de componentes

Estas pruebas se ejecutan con `npm test`, no requieren el backend y usan mocks donde corresponde.

| Archivo de prueba | Tests | Estado |
|---|---|---|
| `events/utils/validators.test.ts` | 35 | ✓ Todos pasando |
| `services/storage.service.test.ts` | 7 | ✓ Todos pasando |
| `hooks/useLocalStorage.test.ts` | 7 | ✓ Todos pasando |
| `router/ProtectedRoute.test.tsx` | 3 | ✓ Todos pasando |
| `auth/services/auth.services.test.ts` | 4 | ✓ Todos pasando |
| `events/services/events.services.test.ts` | 6 | ✓ Todos pasando |
| `context/AuthProvider.test.tsx` | 10 | ✓ Todos pasando |
| `auth/components/LogoutButton.test.tsx` | 2 | ✓ Todos pasando |
| `utils/jwt.test.ts` | 4 | ✓ Todos pasando |
| `events/hooks/useEvents.test.ts` | 7 | ✓ Todos pasando |
| `events/components/EventCard.test.tsx` | 8 | ✓ Todos pasando |
| `events/utils/filterEvents.test.ts` | 67 | ✓ Todos pasando |
| `events/components/EventFilters.test.tsx` | 33 | ✓ Todos pasando |
| `events/components/ComunaCombobox.test.tsx` | 17 | ✓ Todos pasando |
| `events/components/EventForm.test.tsx` | 10 | ✓ Todos pasando |
| `events/utils/nearestComuna.test.ts` | 32 | ✓ Todos pasando |
| `events/utils/comunaSearch.test.ts` | 9 | ✓ Todos pasando |
| `events/components/map/MapView.test.tsx` | 12 | ✓ Todos pasando |
| **Total** | **273** | **273 ✓ / 0 ✗** |

(Rutas relativas a `src/features/` salvo `services/`, `hooks/`, `router/`, `context/` y `utils/jwt.test.ts`, que cuelgan directamente de `src/`.)

### 3.1 Validadores de Formularios

**Archivo:** `src/features/events/utils/validators.test.ts`
**Tipo:** Unitaria pura

Los validadores son funciones puras sin dependencias externas, lo que los convierte en el candidato ideal para pruebas unitarias directas. Se verificó cada función con casos de borde, valores límite y entradas inválidas.

Los validadores de texto (`validateTitle`, `validateDescription` y `validateLocation`) miden el largo del texto tal como lo escribió el usuario: con `trim` y sin codificar, de modo que cada símbolo cuenta como un carácter y el largo coincide con el contador y con el `maxLength` de los campos. No se codifica el texto en HTML porque React ya escapa lo que renderiza. La función `sanitizeText`, que hacía esa codificación, se eliminó (ver el defecto 6 de la sección 6.1).

| Función | Casos probados |
|---|---|
| `validateTitle` | Rechazo por longitud < 3, rechazo por longitud > 100, aceptación válida; **mide el largo con `trim`, cuenta cada símbolo como un carácter (100 barras son válidas, 101 no) y acepta apóstrofes, barras, comillas y `<` `>`** |
| `validateDescription` | Rechazo por longitud < 10, rechazo por longitud > 500, aceptación válida; **mide el largo con `trim`, cuenta cada símbolo como un carácter (500 barras son válidas, 501 apóstrofes no) y acepta comillas, apóstrofes, barras y etiquetas escritas como texto** |
| `validateLocation` | Rechazo por longitud < 3, rechazo por longitud > 200, aceptación válida; **mide el largo con `trim`, cuenta cada símbolo como un carácter (200 apóstrofes son válidos, 201 no) y acepta direcciones con apóstrofes y barras** |
| `validateDate` | Rechazo de fecha vacía, rechazo de fecha pasada, aceptación de fecha futura; **el día de hoy es válido y el de ayer no, a las 00:30, 12:00 y 22:30 hora local, con la zona horaria fijada en `America/Santiago`** |
| `validateTime` | Campo opcional vacío, formato inválido, formato válido, **segundos opcionales (`HH:mm:ss`)**, rechazo de `24:00`, `20:60` y `20:00:60`, rechazo de segundos mal formados |
| `validateTimeRange` | Hora de fin igual a inicio, hora de fin anterior, rango válido, **rango con segundos (solos o mezclados con `HH:mm`)** |
| `validateCoordinates` | Latitud fuera de rango, longitud fuera de rango, coordenadas válidas |

**Tests:** 35 (24 originales, de los cuales se eliminaron los 3 de `sanitizeText`; más 4 agregados al corregir el defecto 1 de la sección 6.1, 3 de `validateTime` y 1 de `validateTimeRange`; y 9 agregados al corregir el defecto 6, 3 por cada validador de texto; y 1 agregado al corregir el defecto 7, la fecha de hoy) | **Resultado:** 35 ✓

---

### 3.2 Servicio de Almacenamiento

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

### 3.3 Hook useLocalStorage

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

### 3.4 Ruta Protegida

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

### 3.5 Servicios de API

**Archivos:** `auth.services.test.ts` y `events.services.test.ts`
**Tipo:** Unitaria con mock de axios

Los servicios son la capa que comunica el frontend con el backend. Se mockeó la instancia de axios para verificar que cada método llama al endpoint correcto con los parámetros y el cuerpo adecuados, sin realizar peticiones HTTP reales. (Las mismas funciones se prueban contra el backend real en la sección 4.)

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

### 3.6 Proveedor de Autenticación

**Archivo:** `src/context/AuthProvider.test.tsx`
**Tipo:** Integración (contexto + hooks + servicios)

`AuthProvider` es el componente más crítico de la aplicación: gestiona el ciclo completo de autenticación y provee el estado global de sesión a toda la aplicación. Se renderizó el proveedor con un componente consumidor real para probar el sistema completo de contexto.

| Módulo | Casos probados |
|---|---|
| Inicialización | Comienza en estado de carga, resuelve a `isLoading: false` |
| Restauración de sesión | Recupera token y usuario desde localStorage al montar |
| Token vencido | Si el token guardado ya venció, descarta la sesión (`clearAuth`), no configura axios y queda no autenticado |
| Sin sesión previa | Permanece no autenticado cuando localStorage está vacío |
| Login exitoso | Actualiza usuario, token y estado de autenticación |
| Login — persistencia | Persiste token y usuario en localStorage, configura axios |
| Login — error | Expone el error al consumidor, no modifica el estado |
| Logout | Limpia estado, localStorage y headers de axios |
| Register | Registra al usuario y ejecuta login automático |
| Register — error | Expone el error al consumidor sin modificar el estado |

**Tests:** 10 | **Resultado:** 10 ✓

---

### 3.7 Hook useEvents

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

### 3.8 Componente EventCard

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

### 3.9 Lógica pura de filtrado de eventos

**Archivo:** `src/features/events/utils/filterEvents.test.ts`
**Tipo:** Unitaria pura

`filterEvents` aplica los filtros de la pantalla de eventos sobre la lista que devuelve el backend (el filtrado se hace por completo en el cliente). Los filtros son combinables con lógica AND. Las fechas `yyyy-MM-dd` se comparan como texto, sin construir objetos `Date`, para evitar el corrimiento de día que produce interpretar la fecha en UTC.

El filtro de ubicación distingue dos casos. Si el valor es una **comuna conocida** (elegida en el combo o con "Cerca de mí"), exige que un segmento de la dirección, separado por comas, sea exactamente esa comuna (sin distinguir tildes ni mayúsculas); así "Concepción" no trae una dirección de Talcahuano por su "Provincia de Concepción", ni "Santiago" una de otra comuna por su "Región Metropolitana de Santiago". Si el valor **no es una comuna** (texto libre), busca como subcadena de toda la dirección.

| Módulo | Casos probados | Tests |
|---|---|---|
| `normalizeText` | Minúsculas, sin tildes, recorte de espacios | 1 |
| `haversineKm` | Puntos idénticos, un grado de latitud, distancia conocida Santiago–Valparaíso, simetría | 4 |
| Sin filtros | Criterios vacíos, lista vacía, texto solo con espacios | 3 |
| Texto | Coincidencia en título, descripción y ubicación; sin distinguir mayúsculas ni tildes; sin resultados | 6 |
| Ubicación (campo `location`) | Solo ese campo; sin distinguir mayúsculas ni tildes | 3 |
| Ubicación: comuna exacta | Concepción no trae Talcahuano ni San Pedro de la Paz (misma provincia); Santiago no trae Providencia; Valparaíso no trae Viña del Mar; tildes, mayúsculas y espacios; comunas de varias palabras; una comuna prefijo de otra (Chillán y Chillán Viejo); direcciones con calle, barrio y código postal; dirección que es solo la comuna; comuna dentro de otro segmento ("Municipalidad de Concepción"); nombre que solo aparece como provincia (Arauco); evento sin dirección | 12 |
| Ubicación: texto libre | Sigue buscando por subcadena ("Provincia de Concepción", "Biobío", "Región Metropolitana", un texto parcial, una calle o un lugar, sin distinguir tildes) | 5 |
| Ubicación: el resto no cambia | El texto ("Buscar") sigue buscando en toda la dirección; la comuna exacta se combina con AND con texto, fecha y cercanía; no muta el arreglo original | 3 |
| Fecha | Solo desde, solo hasta, rango, límites inclusivos, un día fuera del rango, desde posterior a hasta, fecha malformada, comparación como fecha local | 8 |
| `getDatePresetRange` | "Hoy", "Próximos", "Esta semana" (lunes a domingo, en lunes, en domingo, cruce de mes y de año) | 7 |
| Cercanía (radio en km) | Dentro del radio, sin coordenadas, coordenadas incompletas o no finitas, límite exacto | 5 |
| Combinaciones AND | Texto + fecha, texto + ubicación + fecha, ubicación + cercanía, todos a la vez, filtros contradictorios | 5 |
| Inmutabilidad | No modifica el arreglo ni los eventos originales, devuelve un arreglo nuevo, conserva el orden | 3 |
| `hasActiveFilters` | Sin filtros y con cada filtro activo | 2 |

**Tests:** 67 (47 anteriores, de los cuales 1 se ajustó por el nuevo comportamiento, y 20 nuevos) | **Resultado:** 67 ✓

Notas: el test "filters by city on the location field only" cambió su resultado esperado de `[2, 4]` a `[2]`: la dirección "Santiago (virtual)" ya no coincide con la comuna Santiago, porque ningún segmento suyo es exactamente "Santiago". Se comprobó que 10 de los tests de ubicación fallan con la implementación anterior. El filtro por radio en km se conserva en la función y en sus pruebas, pero la interfaz ya no lo usa (se reemplazó por la elección de la comuna más cercana, secciones 3.10 y 3.11). Las pruebas de fechas se verificaron además, de forma manual y fuera de la suite, con distintas zonas horarias (`TZ`).

---

### 3.10 Barra de filtros (EventFilters)

**Archivo:** `src/features/events/components/EventFilters.test.tsx`
**Tipo:** Componente (React Testing Library + user-event, con mock de `navigator.geolocation`)

| Módulo | Casos probados | Tests |
|---|---|---|
| Renderizado | Controles presentes, sin selector de radio, valores desde `criteria`, sin alertas iniciales | 4 |
| Texto y ubicación | Cada pulsación se informa como cambio parcial, ubicación independiente del texto, elegir una comuna de la lista | 3 |
| Fechas | Campos "Desde" y "Hasta"; atajos "Hoy", "Esta semana" y "Próximos" con la fecha simulada; `aria-pressed`; desactivar el atajo al editar las fechas | 6 |
| "Cerca de mí" | Pide la posición una vez y rellena la comuna; una comuna grande donde el centroide engañaría; estado "Ubicando..."; el aviso desaparece al editar el campo; posición fuera de Chile; fallo al cargar los datos y reintento; respuesta tardía tras desmontar | 7 |
| Geolocalización con error | Permiso denegado, posición no disponible, tiempo agotado, navegador sin soporte, reintento exitoso | 5 |
| Limpiar filtros | Deshabilitado sin filtros, habilitado con cada filtro, llama a `onClear`, restablece campos y aviso, descarta el mensaje de error | 8 |

**Tests:** 33 | **Resultado:** 33 ✓

---

### 3.11 Combo de comunas (ComunaCombobox)

**Archivo:** `src/features/events/components/ComunaCombobox.test.tsx`
**Tipo:** Componente (React Testing Library + user-event)

Combo accesible (roles ARIA `combobox`, `listbox` y `option`) que sugiere las comunas de Chile mientras se escribe y acepta también texto libre.

| Módulo | Casos probados | Tests |
|---|---|---|
| Apertura | Cerrado al inicio, abre con todas las comunas al enfocar, muestra la región, cierra con Escape y al perder el foco | 4 |
| Filtrado | Filtra al escribir, sin distinguir tildes ni mayúsculas, primero las que empiezan igual, sigue filtrando si el texto es una comuna que prefija otras ("Chillán" y "Chillán Viejo"), ofrece todas al reabrir tras elegir una o si el valor vino de fuera | 6 |
| Texto libre | Acepta texto que no es una comuna y lo explica, conserva el texto al salir, Enter sin opción resaltada no lo reemplaza | 3 |
| Selección | Con el mouse, con flechas y Enter, ArrowDown abre la lista, no pasa del primero ni del último | 4 |

**Tests:** 17 | **Resultado:** 17 ✓

---

### 3.12 Lista de comunas y detección de la comuna (comunaSearch, nearestComuna)

**Archivos:** `src/features/events/utils/comunaSearch.test.ts` y `src/features/events/utils/nearestComuna.test.ts`
**Tipo:** Unitaria pura (`nearestComuna` incluye pruebas contra los límites reales de las comunas)

`comunaSearch` busca comunas por nombre. `nearestComuna` decide en qué comuna está una coordenada usando los límites de las comunas (punto en polígono) y, si el punto cae fuera de todas (por ejemplo, en el mar), la más cercana dentro de 10 km; más lejos devuelve `null`. Los límites (unos 360 KB) se cargan solo al usar "Cerca de mí".

| Archivo | Módulo | Casos probados | Tests |
|---|---|---|---|
| `comunaSearch.test.ts` | Datos | Nombres únicos con región, comunas conocidas con sus tildes, orden alfabético sin distinguir tildes | 3 |
| | `searchComunas` | Consulta vacía, sin distinguir tildes ni mayúsculas, prefijos primero, sin coincidencias, con la lista real, no muta la entrada | 6 |
| `nearestComuna.test.ts` | Geometría sintética | Punto dentro, huecos (enclaves), comunas de varias partes, comuna más cercana fuera de los bordes, la más cercana entre dos, límite de distancia, valor por defecto de 10 km, coordenadas no finitas | 8 |
| | Carga | Los datos se cargan una vez y se reutilizan | 1 |
| | Límites reales | 18 ciudades de Chile caen en su comuna; un punto en el mar cercano a la costa; 4 puntos fuera de Chile devuelven `null` | 23 |

**Tests:** 9 + 32 = 41 | **Resultado:** 41 ✓

Los 18 puntos reales incluyen casos donde calcular la distancia al centro de cada comuna da un resultado erróneo (por ejemplo, Antofagasta, una comuna extensa cuyo centro queda lejos de la ciudad); la detección por punto en polígono los resuelve.

---

### 3.13 Mapa (MapView)

**Archivo:** `src/features/events/components/map/MapView.test.tsx`
**Tipo:** Componente con Leaflet real en jsdom

Estas pruebas usan la instancia real de Leaflet (`react-leaflet`) dentro de jsdom. Como jsdom mide los elementos en 0×0, las pruebas simulan un tamaño de 1000×500 px para que Leaflet pueda calcular el zoom, y capturan la instancia del mapa para leer su centro, zoom y límites.

| Módulo | Casos probados | Tests |
|---|---|---|
| Vista inicial | Con varios eventos se encuadran todos, con uno se centra en él con el zoom pedido, sin eventos usa el centro por defecto | 3 |
| Al filtrar | Se mueve y acerca a los eventos que quedan, sigue el filtro de una ciudad a otra, se centra si queda uno, no se mueve si no queda ninguno, reencuadra al volver de un resultado vacío o al limpiar el filtro, ignora eventos sin coordenadas | 7 |
| Sin molestar al usuario | No reinicia la vista al re-renderizar con los mismos eventos ni al cambiar solo la altura | 2 |

**Tests:** 12 | **Resultado:** 12 ✓

Lo que estas pruebas no cubren es el render visual: los tiles del mapa, los íconos pintados y el aspecto real de los marcadores y popups. En el navegador real eso se comprueba parcialmente en las pruebas E2E (sección 5), que verifican la presencia de los marcadores y de los popups pero no su apariencia. `EventMarker` y `LocationPicker` no tienen pruebas unitarias propias; se cubren solo mediante E2E (popup del marcador y elección de ubicación con un clic en el mapa).

---

### 3.14 Formulario de evento (EventForm)

**Archivo:** `src/features/events/components/EventForm.test.tsx`
**Tipo:** Componente (React Testing Library + user-event), con el `LocationPicker` reemplazado por un botón que entrega una ubicación válida

Estas pruebas escriben con `userEvent.type`, que teclea tecla por tecla como un usuario. Es relevante porque `fireEvent.change` (y el `fill()` de Playwright) ponen el valor completo de una vez y no pasan por cada pulsación, que es donde el formulario corrompía el texto (defecto 6 de la sección 6.1).

| Módulo | Casos probados | Tests |
|---|---|---|
| Escribir con el teclado | Conserva los espacios entre palabras en el título y en la descripción; conserva el apóstrofe y la barra (`Rock's AC/DC`); conserva comillas y los signos `<` y `>`; conserva los espacios de los bordes mientras se escribe (el recorte es al enviar); el contador de caracteres cuenta lo tecleado | 6 |
| Lo que llega a `onSubmit` | Título y descripción idénticos a lo tecleado (con espacios, guion, apóstrofe, barra, comillas, `&` y etiquetas escritas como texto); recorte de los espacios de los bordes solo al enviar; un título de 100 símbolos es válido (el largo cuenta lo tecleado); no envía si al recortar el título quedan menos de 3 caracteres | 4 |

**Tests:** 10 | **Resultado:** 10 ✓

Con el código anterior al arreglo, 9 de estos 10 tests fallaban (el campo mostraba `Nochedejazz` en lugar de `Noche de jazz` y `Rock&#x27;sAC&#x2F;DC` en lugar de `Rock's AC/DC`); el que pasaba era el de "no envía si al recortar el título quedan menos de 3 caracteres".

---

### 3.15 Botón de cerrar sesión (LogoutButton)

**Archivo:** `src/features/auth/components/LogoutButton.test.tsx`
**Tipo:** Integración de componentes (usa `AuthProvider` y `ProtectedRoute` reales, sin mocks)

El botón "Cerrar Sesión" llama a `logout()` del contexto y no navega por su cuenta: la redirección a `/login` la hace `ProtectedRoute` al quedar la sesión vacía. Las pruebas montan un `MemoryRouter` con una ruta protegida que solo contiene el botón.

| Caso | Qué verifica |
|---|---|
| Cierre de sesión | Al hacer clic aparece la pantalla de login, `token` y `user` desaparecen de `localStorage` y el header `Authorization` de axios queda sin definir |
| Ruta protegida | Tras cerrar sesión el botón ya no está en pantalla: no se puede volver a la ruta protegida |

**Tests:** 2 | **Resultado:** 2 ✓

---

### 3.16 Vencimiento del token (isTokenExpired)

**Archivo:** `src/utils/jwt.test.ts`
**Tipo:** Unitaria pura

`isTokenExpired` lee el claim `exp` del payload de un JWT (sin verificar la firma, que es responsabilidad del backend) y `AuthProvider` la usa al restaurar la sesión: como el backend no envía cabeceras CORS en sus 401 (sección 6.2), el interceptor 401 no corre en el navegador y un token vencido dejaba al usuario en pantallas con "Error al cargar eventos".

| Caso | Resultado esperado |
|---|---|
| `exp` en el pasado | `true` |
| `exp` en el futuro | `false` |
| Sin `exp`, token ilegible o vacío | `false` (se deja decidir al backend) |
| Payload con tildes (UTF-8) | Se lee correctamente |

**Tests:** 4 | **Resultado:** 4 ✓

---

## 4. Pruebas de integración contra el backend real

**Archivos:** `tests/integration/auth.integration.test.ts` y `tests/integration/events.integration.test.ts`
**Comando:** `npm run test:integration`

A diferencia de las pruebas de la sección 3, estas no usan mocks: `authService` y `eventsService` se ejecutan con axios real contra el backend en `http://localhost:8000` (o la URL de `VITE_API_BASE_URL`, la misma que usa la aplicación). Verifican el contrato real entre frontend y backend: qué status devuelve cada endpoint, qué forma tienen las respuestas y qué rutas exigen token.

**Configuración.** `vitest.integration.config.ts` usa entorno Node, ejecuta los archivos de a uno y solo incluye `tests/integration/**/*.integration.test.ts`. Como el patrón por defecto de Vitest recoge los archivos `*.test.ts`, los scripts `test` y `test:ui` excluyen `tests/integration/**` para que `npm test` siga ejecutando solo las pruebas unitarias.

**Disponibilidad del backend.** Antes de empezar, cada archivo comprueba que el backend responde; si no, falla con un mensaje que indica la URL y la causa (por ejemplo, `ECONNREFUSED`) y cómo configurar `VITE_API_BASE_URL`.

**Datos y limpieza.** Cada archivo registra un usuario único (nombre con marca de tiempo y sufijo aleatorio) y crea eventos cuyo título empieza con `[TEST]`. Al terminar (`afterAll`) se borran los eventos creados y el usuario de prueba (`DELETE /users/{id}`; `authService` no tiene esa función, por lo que se usa el endpoint directamente). Si algo no se puede borrar, la suite falla con un mensaje que lista lo que quedó. Tras las corridas realizadas, la base no conservó ningún evento `[TEST]`.

### 4.1 Autenticación (15 tests)

| Módulo | Casos probados | Tests |
|---|---|---|
| General | La URL apunta al backend configurado | 1 |
| Registro | Usuario nuevo sin error; `username` repetido → 400; `email` repetido → 400 | 3 |
| Login | Devuelve `token`, `id` y `username`; el JWT identifica al usuario y no está vencido; contraseña incorrecta → 401; usuario inexistente → 401 (*) | 4 |
| Rutas protegidas | Sin token → 403 (`getMyEvents` y crear evento, sin crear nada); token inválido → 401; firma del token alterada → 401; token válido funciona; `getAll` es público; `getAll` con token inválido → 401 | 7 |

### 4.2 Eventos (18 tests)

| Módulo | Casos probados | Tests |
|---|---|---|
| `create` | Devuelve los datos enviados con `id` y `userId`; `latitude` y `longitude` vuelven como `number`; conserva la precisión decimal; conserva tildes y caracteres especiales; las horas opcionales no enviadas vuelven como `null` | 5 |
| `getAll` | Incluye el evento creado | 1 |
| `getMyEvents` | Devuelve los eventos del usuario y solo los suyos; no incluye los de otro usuario | 2 |
| `getById` | Devuelve el evento con todos sus campos | 1 |
| `update` | Modifica y `getById` lo confirma; conserva `createdAt` y actualiza `updatedAt`; no modifica otros eventos | 3 |
| `delete` | Ya no aparece en `getAll` ni en `getMyEvents`; no borra otros eventos; `getById` de un evento borrado → 404 (*) | 3 |
| Errores | Sin token `getById` → 403; sin token `update` → 403 y no modifica; `getById` de un id inexistente → 404 (*) | 3 |

(*) Las tres pruebas marcadas con asterisco esperan el comportamiento correcto (401 o 404), pero el backend responde 500. Se declaran con `it.fails` y el sufijo `[defecto conocido del backend: hoy responde 500]`: la suite queda en verde mientras el defecto exista y una de ellas fallará el día que el backend se corrija, avisando que hay que quitar el `.fails`. Ver sección 6.2.

**Resultado:** 33 tests (30 pasan + 3 `expected fail`), 2 archivos.

---

## 5. Pruebas E2E con Playwright

**Archivos:** `e2e/*.e2e.ts` (7 archivos)
**Comando:** `npm run test:e2e`

Las pruebas E2E automatizan un Chromium real que navega la aplicación (servida por Vite) contra el backend real.

**Configuración.** `playwright.config.ts` define un único proyecto (Chromium), un solo worker (los tests comparten el backend), sin reintentos, y arranca el servidor con `npm run dev` en el puerto 5173 (o reutiliza uno ya levantado). Los archivos se llaman `*.e2e.ts` en lugar de `*.spec.ts` para que Vitest no los recoja en `npm test`.

**Datos y aislamiento.** La base ya contiene eventos ajenos a las pruebas, por lo que ninguna aserción mira totales ni el contador global de eventos. Cada archivo crea por API (en `beforeAll`) un usuario único y sus eventos, con título `[E2E] <marca de tiempo> ...`, y las aserciones apuntan solo a esos eventos: en la pantalla de eventos se aíslan escribiendo ese título único en el buscador. Las pruebas de filtros usan fechas del año 2031 para que ningún atajo de fecha ("Hoy", "Esta semana") las incluya.

**Limpieza.** Al terminar (`afterAll`) se borran todos los eventos del usuario y el usuario (`DELETE /users/{id}`) y se verifica que no quede nada; si queda algo, la suite falla con un mensaje que lo lista. Tras las corridas realizadas, la base no conservó ningún evento `[E2E]`.

**Servicios externos simulados.** Para no depender de internet, el navegador intercepta las peticiones a Nominatim (búsqueda y geocodificación inversa que hace `LocationPicker` al hacer clic en el mapa), a los tiles de OpenStreetMap y a los íconos de Leaflet en `unpkg`. El backend y la aplicación son reales. La geolocalización usa el permiso y las coordenadas que ofrece Playwright.

**Sesión y diálogos.** Para iniciar sesión sin pasar por la pantalla de login, las pruebas escriben el token en `localStorage` una sola vez (no en cada navegación, para no ocultar el cierre de sesión ni la limpieza del interceptor). Los `alert` y `window.confirm` de la aplicación se manejan de forma explícita: sin un manejador, Playwright los descarta, y un `confirm` descartado cancelaría el borrado.

### 5.1 Resumen por flujo

| Flujo | Archivo | Tests |
|---|---|---|
| Autenticación y sesión | `auth.e2e.ts` (12) y `smoke.e2e.ts` (3) | 15 |
| CRUD de eventos (validación, crear, editar, eliminar) | `events-crud.e2e.ts` | 9 |
| Mapa (popup del marcador) | `events-crud.e2e.ts` | 1 |
| Detalle de un evento | `event-details.e2e.ts` | 8 |
| Filtros | `events-filters.e2e.ts` (19) y `events-location-filter.e2e.ts` (9) | 28 |
| Accesibilidad (etiquetas del formulario) | `events-crud.e2e.ts` | 2 |
| Escritura con el teclado (`pressSequentially`) | `events-typing.e2e.ts` | 5 |
| **Total** | **7 archivos** | **68** |

### 5.2 Autenticación y sesión (15 tests)

- **Rutas protegidas sin sesión** (`smoke.e2e.ts`): `/events`, `/my-events` y `/events/create` redirigen a `/login`.
- **Registro:** un usuario nuevo se registra desde la interfaz y queda con sesión iniciada; un `username` repetido muestra el error del backend y no inicia sesión.
- **Login:** con credenciales válidas entra a `/events` y guarda la sesión; con contraseña incorrecta muestra un error y no guarda sesión.
- **Sesión:** cerrar sesión limpia el almacenamiento y vuelve a exigir login; una sesión guardada sobrevive a recargar la página.
- **Cierre de sesión desde cada pantalla protegida (5 tests):** en `/events`, `/my-events`, `/events/create`, `/events/:id` (con un evento creado por API) y `/events/edit/:id` (entrando con "Editar" desde `/my-events`) se inicia sesión, se hace clic en "Cerrar Sesión", se espera `/login`, se comprueba que `token` y `user` quedaron nulos en `localStorage` y que `page.goBack()` sigue dejando al usuario en `/login`.
- **Token inválido en `localStorage`:** debe redirigir a `/login` y limpiar la sesión (interceptor 401). Esta prueba está declarada con `test.fail()` y la etiqueta `[defecto conocido del backend: el 401 no trae cabeceras CORS]` (sección 6.2).

### 5.3 CRUD de eventos (9 tests)

- **Validación del formulario:** un formulario vacío no se envía (validación nativa del navegador); con datos inválidos se muestran los errores de la aplicación y no se envía ninguna petición POST (con horario inválido y sin horario); con el error de horario ya visible, un clic en "Crear Evento" valida y no envía nada.
- **Crear:** se crea un evento eligiendo la ubicación con un clic en el mapa. Se comprueba que el formulario envía las coordenadas del clic (no las iniciales) y que la dirección se pidió con esas mismas coordenadas, que la aplicación avisa y lleva a "Mis eventos", que el evento quedó guardado en el backend y que en `/events` aparece como tarjeta y como marcador.
- **Editar:** un evento sin horas se edita y el cambio se ve en "Mis eventos" y en el backend; un evento con horas se edita sin tener que reescribirlas.
- **Eliminar:** cancelar la confirmación no elimina el evento; confirmar lo elimina de la lista y del backend (se comprueban ambos diálogos, el `confirm` y el `alert` de éxito).

Estas pruebas llenan los campos con `fill()`, que inserta el valor completo de una vez; la escritura tecla por tecla se prueba en la sección 5.8.

### 5.4 Mapa (1 test)

- El marcador de un evento abre un popup con su título, su dirección y el botón "Ver Detalles". Además, varias pruebas de CRUD y de filtros comprueban el número de marcadores (`.leaflet-marker-icon`) de los eventos propios.

### 5.5 Detalle de un evento (8 tests)

- Desde el popup del marcador y desde la tarjeta se llega a `/events/<id>` y se ve el evento (título, descripción, ubicación y fecha).
- El detalle muestra el mapa con la ubicación; "Volver a Eventos" regresa a `/events`.
- La ruta es protegida: sin sesión redirige a `/login`.
- Un id que no existe no muestra ningún evento y permite volver.
- La ruta nueva no captura a las demás rutas de `/events`: `/events/create` sigue abriendo el formulario de creación y `/events/edit/<id>` el de edición.

### 5.6 Filtros (28 tests)

**`events-filters.e2e.ts` (19 tests).** Con 3 eventos sembrados por API, en tres comunas distintas y con fechas de 2031, cada prueba comprueba qué eventos propios aparecen o desaparecen de la lista y del mapa.

- **Texto (5):** el token único deja solo los 3 eventos; filtra por título sin distinguir mayúsculas, por descripción y por la ubicación; sin coincidencias avisa y mantiene visible la barra de filtros.
- **Comuna (3):** escribir el nombre de una comuna deja solo el evento de esa comuna; el combo sugiere comunas sin distinguir tildes y al elegir una filtra; acepta texto libre que no es una comuna.
- **Fecha (5):** rango desde–hasta; solo "Desde" o solo "Hasta"; fechas límite inclusivas; "Próximos" (fija la fecha de hoy); "Hoy" y "Esta semana" excluyen los eventos de 2031.
- **Combinados y limpieza (2):** los filtros se combinan con AND; "Limpiar filtros" restablece los campos y devuelve los eventos propios a la lista y al mapa.
- **"Cerca de mí" (4):** con la geolocalización en Concepción selecciona esa comuna y filtra por ella; si la ubicación cambia, elige otra comuna; fuera de Chile avisa y no cambia el filtro; sin permiso de ubicación muestra el mensaje de permiso denegado.

**`events-location-filter.e2e.ts` (9 tests).** Con 2 eventos sembrados en comunas distintas que comparten la misma "Provincia de Concepción" y la misma región (uno en Concepción y otro en Talcahuano), comprueba que el filtro por comuna compara la comuna exacta:

- **Comuna exacta (5):** "Concepción" deja solo el evento de Concepción y no el de Talcahuano; "Talcahuano" deja solo el de Talcahuano; elegir la comuna en la lista del combo aplica la misma regla; sin distinguir mayúsculas ni tildes; cambiar de una comuna a la otra cambia el resultado.
- **Texto libre (2):** "Provincia de Concepción" y "Biobío", que no son comunas, siguen buscando por subcadena y traen ambos eventos.
- **Resto sin cambios (1):** el buscador de texto sigue buscando en toda la dirección.
- **"Cerca de mí" (1):** con la ubicación en Concepción selecciona esa comuna y trae solo su evento.

Se comprobó que 5 de estos tests fallan con la implementación anterior.

### 5.7 Accesibilidad (2 tests)

- Cada campo del formulario de creación se encuentra y se puede llenar por su etiqueta (título, descripción, fecha, hora de inicio y hora de fin).
- El formulario de edición también asocia sus etiquetas.

### 5.8 Escritura con el teclado (5 tests)

Estas pruebas (`events-typing.e2e.ts`) teclean con `pressSequentially`, tecla por tecla, en vez de `fill()`, que inserta el valor completo de una vez y no reproduce lo que ocurre en cada pulsación. Usan un título con espacios, guion, apóstrofe y barra (`Noche de jazz - Rock's AC/DC`) y una descripción con comillas, apóstrofe, barra, `&` y etiquetas HTML escritas como texto.

- El título y la descripción tecleados se conservan tal cual en el campo, y los contadores de caracteres cuentan lo tecleado.
- Al crear el evento, el backend guarda título y descripción idénticos a lo tecleado (sin entidades HTML), la tarjeta los muestra bien y `<b>negrita</b>` no se interpreta como HTML (React escapa el texto).
- El popup del marcador y la pantalla de detalle también lo muestran bien (con un evento creado por API).
- Los espacios al inicio y al final se conservan mientras se escribe y se recortan solo al enviar.
- En la edición, el formulario precarga el texto tal cual y, al seguir tecleando, no se codifica.

Con el código anterior al arreglo fallan 4 de estos 5 tests; el del popup y el detalle no depende del formulario y pasa en ambos casos.

**Resultado:** 68 tests (67 pasan + 1 `test.fail`), 7 archivos. Tras agregar el cierre de sesión por pantalla se ejecutó la suite completa 2 veces seguidas; las dos corridas terminaron con todos los tests pasando (código de salida 0) y sin tests intermitentes. Al terminar, la base no conservó ningún evento `[E2E]`:

| Corrida | Resultado | Duración |
|---|---|---|
| 1 | 68 passed | 1,2 min |
| 2 | 68 passed | 1,1 min |

(Playwright informa las duraciones de más de un minuto en minutos, con un decimal.)

---

## 6. Hallazgos

Las pruebas E2E y de integración, junto con revisiones manuales, detectaron defectos reales, en el frontend y en el backend. Los del frontend se corrigieron; los del backend no son parte del alcance de esta memoria y quedan documentados, con sus pruebas marcadas como defecto conocido.

### 6.1 Defectos del frontend detectados y corregidos

| # | Defecto | Cómo se detectó | Corrección |
|---|---|---|---|
| 1 | **Editar un evento con horas no permitía guardar.** El backend devuelve las horas como `HH:mm:ss` y el formulario de edición las precarga así, pero `validateTime` solo aceptaba `HH:mm`: aparecía "Formato de hora inválido (HH:mm)" y no se guardaba hasta reescribir las horas. | E2E: "edita un evento con horas sin tener que reescribirlas" | `6e52c3c` — los segundos son opcionales; `24:00`, `20:60` y `20:00:60` siguen siendo inválidos (4 tests unitarios nuevos) |
| 2 | **El primer clic en "Crear Evento" se perdía.** Al hacer clic estando en "Hora Fin", el campo perdía el foco, aparecía su error de validación y el botón se desplazaba unos 23 px antes de soltar el clic; el evento `submit` nunca se disparaba y había que hacer clic dos veces. | E2E: "datos inválidos muestran los errores de la app y no envían ninguna petición POST" (se midió el desplazamiento del botón) | `88a8a1d` — los mensajes de título, descripción, fecha y rango de horas reservan siempre su línea, de modo que el layout no salta. La validación al salir del campo se mantiene |
| 3 | **La ruta de detalle de evento no estaba registrada.** `ROUTES.EVENT_DETAILS` existía pero `AppRouter` no la registraba: `EventDetailsPage` era inalcanzable y "Ver Detalles" y la tarjeta terminaban redirigiendo a `/events`. | Lectura del código al preparar los E2E; el E2E de detalle falla si se quita la ruta | `df1d087` — ruta registrada como protegida; 8 E2E nuevos |
| 4 | **Los `label` del formulario de evento no estaban asociados a sus campos** (sin `htmlFor` ni `id`), por lo que no se podían encontrar por etiqueta ni los lectores de pantalla los leían al enfocar el campo. | Lectura del código al escribir los E2E (no se podía usar `getByLabel`); los 2 E2E nuevos fallan sin el cambio | `59e699e` — `htmlFor` e `id` (con `useId`) sin cambiar estilos ni comportamiento; 2 E2E nuevos |
| 5 | **El filtro por comuna traía eventos de otras comunas.** Las direcciones son "lugar, comuna, Provincia de X, Región de Y, …, Chile" y el filtro buscaba el valor como subcadena de toda la dirección: "Concepción" traía también las de Talcahuano por su "Provincia de Concepción", y "Santiago" las de otras comunas por su región. En una medición manual con una base de 72 eventos de prueba, "Santiago" devolvió 26 eventos frente a 11 realmente ubicados en esa comuna, "Concepción" 24 frente a 18 y "Valparaíso" 22 frente a 12. | Prueba manual con datos sembrados, contrastando el resultado con la comuna real de cada evento | `7df7132` — si el valor es una comuna conocida se exige que un segmento de la dirección (separado por comas) sea exactamente esa comuna; el texto libre sigue buscando por subcadena. 20 tests unitarios nuevos, 1 test existente ajustado y 9 E2E |
| 6 | **Escribir con el teclado corrompía el texto.** `handleChange` aplicaba `sanitizeText` en cada pulsación, que recortaba (`trim`) y codificaba `<`, `>`, `"`, `'` y `/` como entidades HTML: los espacios se perdían mientras se escribía (`Noche de jazz` quedaba `Nochedejazz`) y los símbolos se guardaban como entidades (`Rock's AC/DC` quedaba `Rock&#x27;sAC&#x2F;DC`). Además, los validadores medían el texto ya codificado, de modo que los símbolos contaban de más, y el contador de caracteres mostraba un valor mayor (21/100 para un título de 12 caracteres). React ya escapa el texto al renderizar (no hay `dangerouslySetInnerHTML` en `src`), por lo que codificar la entrada corrompía los datos sin agregar protección. | Al probar con escritura real (`userEvent.type`). **Los E2E iniciales no lo detectaron porque llenaban los campos con `fill()`, que inserta el valor completo de una vez y no pasa por cada pulsación.** En el backend de pruebas no había datos ya codificados | `a1e2daa` (tests que lo reproducen: 9 de 10 fallaban), `a9a6d0f` (arreglo: `handleChange` guarda el valor tal cual, los validadores miden con `trim` sin codificar y el recorte se aplica al enviar; `sanitizeText` se elimina) y `741a630` (5 E2E con `pressSequentially`; 4 fallan con el código anterior) |
| 7 | **El día de hoy se rechazaba como fecha pasada en zonas al oeste de UTC.** `validateDate` hacía `new Date('yyyy-MM-dd')`, que JavaScript interpreta en UTC (medianoche UTC son las 21:00 del día anterior en Chile), y lo comparaba con la medianoche local de hoy: con la zona `America/Santiago`, elegir la fecha de hoy mostraba "La fecha no puede ser en el pasado". Además, el atributo `min` del campo de fecha usaba `toISOString()` (fecha UTC) y bloqueaba el día de hoy por las tardes-noches. | Revisión del código; la prueba nueva fija la zona horaria en `America/Santiago` (`vitest.global-tz.ts`) y falla con el código anterior (se comprobó revirtiendo el arreglo) | `abb2cb5` (prueba que lo reproduce) y `1c31a80` (arreglo: se compara como texto `yyyy-MM-dd` con la fecha local de hoy, usando `toLocalDateString`, y el mismo helper en el `min` del formulario) |
| 8 | **El cierre de sesión solo estaba disponible en la pantalla de eventos.** El botón "Cerrar Sesión" existía únicamente en `EventsPage`; desde "Mis Eventos", crear, editar y el detalle de un evento no había forma de cerrar la sesión. | Revisión de las pantallas protegidas | `4435f13` (componente `LogoutButton` usado en las 5 pantallas protegidas, sin navegar a mano: la redirección la hace `ProtectedRoute`) y `3cffa51` (2 pruebas unitarias y 5 E2E, uno por pantalla) |

### 6.2 Defectos conocidos del backend, sin corregir

Se verificaron con `curl` y con las pruebas de integración o E2E. No se modificó el backend.

1. **Las respuestas 401 no incluyen `Access-Control-Allow-Origin`.** Con el frontend en otro origen (por ejemplo `localhost:5173` contra `localhost:8000`), el navegador las bloquea por CORS (`net::ERR_FAILED`) y axios recibe un error sin `response`. Como consecuencia, el interceptor 401 de la aplicación (que limpia la sesión y redirige a `/login`) nunca se ejecuta: con un token inválido la aplicación se queda en `/events` mostrando "Error al cargar eventos". Se comprobó que, simulando la cabecera en el navegador, el interceptor funciona y la prueba pasa; el defecto está en el backend. La prueba E2E correspondiente está marcada con `test.fail()`.
2. **Respuestas 500 en lugar de 401 o 404.** El login con un usuario inexistente responde 500 (con contraseña incorrecta sí responde 401), y `getById` de un id inexistente o de un evento ya borrado también responde 500 en vez de 404. Con `curl` se comprobó el mismo comportamiento en `PUT` y `DELETE` de un id inexistente, y en `GET /events/abc` (id no numérico). Las tres pruebas de integración correspondientes están marcadas con `it.fails`.
3. **Sin validación de datos en el servidor.** El backend acepta y guarda eventos sin título ni descripción (incluso con un cuerpo `{}`) y con fechas pasadas; una fecha con formato inválido produce un 500. Toda la validación existente está en el frontend.
4. **Campos `null` en algunas respuestas.** `startTime` y `endTime` llegan `null` cuando no se enviaron (el tipo `Event` los declara opcionales, no `null`; el código de la aplicación los trata como valores falsos y no falla) y la respuesta del `PUT` devuelve `createdAt: null`, aunque `getById` después sí lo devuelve. Una prueba de integración documenta el caso de las horas.
5. **`POST /users` devuelve el hash de la contraseña** (bcrypt) en la respuesta.

### 6.3 Observaciones pendientes del frontend

No están corregidas y no tienen prueba que las cubra (salvo indicación):

- **La regla del filtro por comuna tiene dos efectos laterales.** (1) Un texto que coincide exactamente con una comuna conocida se trata como esa comuna aunque se esté escribiendo el nombre de otra más larga: al escribir "San Pedro" (comuna de la Región Metropolitana) el filtro devuelve 0 eventos de San Pedro de la Paz, mientras que "San Pedro de" (texto libre) y el nombre completo sí los devuelven. Se comprobó con una prueba puntual y no tiene test en la suite. (2) Una dirección que no trae la comuna como segmento propio (por ejemplo "Santiago (virtual)" o "Municipalidad de Concepción, …") no coincide con el filtro de esa comuna; este caso sí tiene test unitario.
- **`LocationPicker` no usa la prop `location`** (detectado leyendo el código): el campo de búsqueda de dirección arranca vacío al editar un evento.
- **`EventMarker` recibe `onClick` pero no lo invoca** (detectado leyendo el código); la navegación se hace con el botón "Ver Detalles" del popup.
- **`/events/edit` sin id** coincide con `/events/:id` y muestra el estado de error de la página de detalle (detectado leyendo el código).
- **El `label` de `LocationPicker`** ("Ubicación del Evento") sigue sin asociarse a su campo.

---

## 7. Resultados Globales

| Tipo de prueba | Comando | Archivos | Tests | Resultado |
|---|---|---|---|---|
| Unitarias y de componentes | `npm test` | 18 | 273 | 273 pasan |
| Integración contra el backend | `npm run test:integration` | 2 | 33 | 30 pasan + 3 `expected fail` |
| E2E (Chromium) | `npm run test:e2e` | 7 | 68 | 67 pasan + 1 `test.fail` |
| **Total** | | **27** | **374** | **370 pasan + 4 fallos esperados (defectos conocidos del backend)** |

Salida de `npm test -- --run`:

```
 Test Files  18 passed (18)
      Tests  273 passed (273)
   Duration  ~7 s
```

Salida de `npm run test:integration`:

```
 Test Files  2 passed (2)
      Tests  30 passed | 3 expected fail (33)
```

Salida de `npm run test:e2e` (la línea marcada con ✘ es el `test.fail()` esperado):

```
Running 68 tests using 1 worker
  ✘   7 [chromium] › e2e/auth.e2e.ts:144:8 › Sesión › un token inválido en localStorage redirige a /login ... [defecto conocido del backend: el 401 no trae cabeceras CORS]
  68 passed (1.1m)
```

Los 4 "fallos esperados" corresponden a los defectos del backend de la sección 6.2 (3 pruebas de integración con `it.fails` y 1 E2E con `test.fail()`); cada una avisará cuando el backend se corrija.

Estado de la calidad estática: `npm run build` termina sin errores (se corrigieron 4 errores de tipos previos) y `npm run lint` informa 22 problemas preexistentes (20 errores y 2 advertencias) que no se abordaron.

---

## 8. Limitaciones

- **Solo Chromium.** No se probó en Firefox, WebKit ni en navegadores móviles.
- **No hay integración continua.** Las pruebas se ejecutan a mano; no hay un flujo automático (por ejemplo, GitHub Actions) que las corra en cada cambio, y tampoco umbrales de cobertura.
- **Las pruebas de integración y E2E requieren el backend levantado** y crean datos temporales (usuarios y eventos) en él. Si una corrida se interrumpe antes de la limpieza, esos datos deben borrarse a mano.
- **En los E2E se simulan servicios externos:** Nominatim, los tiles de OpenStreetMap y los íconos de `unpkg`. Por eso no se verifica el aspecto real del mapa ni el comportamiento con esos servicios reales.
- **No se probó la autorización por dueño del evento:** no se verificó si un usuario puede editar o borrar eventos de otro (el `userId` viaja como parámetro de la petición).
- **No se hicieron pruebas de usabilidad ni de rendimiento.**
- **La geolocalización se prueba con coordenadas simuladas** (Playwright); no se evaluó la precisión de la ubicación de un navegador real, que en un computador puede ser aproximada.
- **Los datos de comunas** provienen de un repositorio público que no declara licencia y contienen 345 comunas (no incluyen "Antártica"); los límites están simplificados (precisión de unos 1 km en los bordes).
- **22 problemas de lint preexistentes** (20 errores y 2 advertencias) que no se corrigieron.

---

## 9. Conclusión

La suite tiene tres niveles. Las 273 pruebas unitarias y de componentes cubren la lógica de negocio, los servicios, el contexto de autenticación (incluido el descarte del token vencido y el cierre de sesión), los hooks, los componentes de la interfaz (incluido el formulario de evento), el filtrado y el componente del mapa, y se ejecutan en unos 6 segundos. Las 33 pruebas de integración verifican contra el backend real el contrato de autenticación y de eventos. Las 68 pruebas E2E recorren los flujos principales en un navegador real: autenticación (incluido el cierre de sesión desde cada pantalla protegida), creación, edición y eliminación de eventos, el detalle, el mapa y los filtros.

Las pruebas de integración y E2E, junto con revisiones manuales, encontraron ocho defectos del frontend, que se corrigieron, y varios del backend, que quedan documentados y con sus pruebas marcadas como defecto conocido. Esas pruebas fallarán cuando el backend se corrija, lo que indicará que la marca debe retirarse.

Las limitaciones de la sección 8 delimitan lo que estas pruebas garantizan: se ejecutan solo en Chromium, a mano y con el backend levantado. Los siguientes pasos naturales serían automatizar la ejecución en integración continua y resolver las observaciones pendientes de la sección 6.3.
