import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setAuthToken } from '../../src/services/api.config';
import { eventsService } from '../../src/features/events/services/events.services';
import {
  TestData,
  assertBackendAvailable,
  buildEvent,
  registerAndLogin,
  rejectionOf,
  type TestUser,
} from './helpers';

let user: TestUser;
let data: TestData;

beforeAll(async () => {
  await assertBackendAvailable();
  user = await registerAndLogin('events');
  data = new TestData(user);
});

afterAll(async () => {
  if (data) await data.cleanup();
});

beforeEach(() => {
  setAuthToken(user.token);
});

const ids = (events: { id: number }[]) => events.map((e) => e.id).sort((a, b) => a - b);

describe('Eventos contra el backend real', () => {
  describe('create', () => {
    it('crea un evento y devuelve los datos enviados con id y userId', async () => {
      const sent = buildEvent('create');
      const created = await data.createEvent('create');

      expect(typeof created.id).toBe('number');
      expect(created).toMatchObject({ ...sent, userId: user.id });
      expect(typeof created.createdAt).toBe('string');
      expect(typeof created.updatedAt).toBe('string');
    });

    it('latitude y longitude vuelven como number, como declara el tipo Event', async () => {
      const created = await data.createEvent('coordenadas');

      expect(typeof created.latitude).toBe('number');
      expect(typeof created.longitude).toBe('number');
      expect(created.latitude).toBe(-33.4378);
      expect(created.longitude).toBe(-70.6505);

      // y lo mismo al leerlo de vuelta
      const fetched = await eventsService.getById(created.id);
      expect(typeof fetched.latitude).toBe('number');
      expect(typeof fetched.longitude).toBe('number');
    });

    it('conserva la precisión decimal completa de las coordenadas', async () => {
      const created = await data.createEvent('precision', {
        latitude: -36.82390959132064,
        longitude: -73.04953352874571,
      });
      const fetched = await eventsService.getById(created.id);

      expect(fetched.latitude).toBe(-36.82390959132064);
      expect(fetched.longitude).toBe(-73.04953352874571);
    });

    it('conserva tildes, eñes y otros caracteres especiales', async () => {
      const created = await data.createEvent('Ñuñoa – Concepción: ¡música!', {
        description: 'Descripción con tildes, ñ y símbolos: áéíóú ü ¿?',
        location: 'Av. Irarrázaval, Ñuñoa, Región Metropolitana, Chile',
      });
      const fetched = await eventsService.getById(created.id);

      expect(fetched.title).toBe('[TEST] Ñuñoa – Concepción: ¡música!');
      expect(fetched.description).toBe('Descripción con tildes, ñ y símbolos: áéíóú ü ¿?');
      expect(fetched.location).toBe('Av. Irarrázaval, Ñuñoa, Región Metropolitana, Chile');
    });

    // El tipo Event declara startTime/endTime como `string | undefined`, pero el backend
    // devuelve null cuando no se envían. El código de la app los trata como falsy, así que
    // no rompe nada; esto documenta la diferencia entre el tipo y la respuesta real.
    it('las horas opcionales que no se envían vuelven como null', async () => {
      const created = await data.createEvent('sin horas', {
        startTime: undefined,
        endTime: undefined,
      });

      expect(created.startTime).toBeNull();
      expect(created.endTime).toBeNull();
    });
  });

  describe('getAll', () => {
    it('incluye el evento creado', async () => {
      const created = await data.createEvent('getAll');
      const all = await eventsService.getAll();

      const found = all.find((e) => e.id === created.id);
      expect(found).toBeDefined();
      expect(found).toMatchObject({
        id: created.id,
        title: created.title,
        userId: user.id,
        latitude: created.latitude,
        longitude: created.longitude,
      });
    });
  });

  describe('getMyEvents', () => {
    it('devuelve los eventos del usuario y solo los suyos', async () => {
      const a = await data.createEvent('mis eventos A');
      const b = await data.createEvent('mis eventos B');

      const mine = await eventsService.getMyEvents(user.id);

      // el usuario puede tener más eventos de otros tests de este archivo
      expect(ids(mine)).toEqual(expect.arrayContaining(ids([a, b])));
      expect(mine.every((e) => e.userId === user.id)).toBe(true);
    });

    it('no incluye los eventos de otros usuarios', async () => {
      // segundo usuario de prueba, con su propio evento (se borra al terminar)
      const other = await registerAndLogin('events_otro');
      const otherData = new TestData(other);
      try {
        const theirs = await otherData.createEvent('evento ajeno');

        setAuthToken(user.token);
        const mine = await eventsService.getMyEvents(user.id);
        expect(mine.some((e) => e.id === theirs.id)).toBe(false);
      } finally {
        await otherData.cleanup();
      }
    });
  });

  describe('getById', () => {
    it('devuelve el evento pedido con todos sus campos', async () => {
      const created = await data.createEvent('getById');
      const fetched = await eventsService.getById(created.id);

      expect(fetched).toMatchObject({ ...buildEvent('getById'), id: created.id, userId: user.id });
    });
  });

  describe('update', () => {
    it('modifica el evento y getById lo confirma', async () => {
      const created = await data.createEvent('update');
      const changes = buildEvent('update EDITADO', {
        description: 'Descripción modificada por la prueba',
        location: 'Plaza Independencia, Concepción, Chile',
        startTime: '18:30:00',
        endTime: '21:00:00',
        latitude: -36.827,
        longitude: -73.0503,
      });

      const updated = await eventsService.update(created.id, user.id, changes);
      expect(updated).toMatchObject({ ...changes, id: created.id, userId: user.id });

      const fetched = await eventsService.getById(created.id);
      expect(fetched).toMatchObject({ ...changes, id: created.id, userId: user.id });
    });

    it('conserva createdAt y actualiza updatedAt', async () => {
      const created = await data.createEvent('fechas de auditoría');
      await eventsService.update(created.id, user.id, buildEvent('fechas de auditoría EDITADO'));

      const fetched = await eventsService.getById(created.id);
      expect(fetched.createdAt).toBeTruthy();
      expect(new Date(fetched.updatedAt!).getTime()).toBeGreaterThan(
        new Date(fetched.createdAt!).getTime()
      );
    });

    it('no modifica los otros eventos', async () => {
      const target = await data.createEvent('update objetivo');
      const other = await data.createEvent('update otro');

      await eventsService.update(target.id, user.id, buildEvent('update objetivo EDITADO'));

      const untouched = await eventsService.getById(other.id);
      expect(untouched.title).toBe('[TEST] update otro');
    });
  });

  describe('delete', () => {
    it('borra el evento: ya no aparece en getAll ni en getMyEvents', async () => {
      const created = await data.createEvent('delete');

      await expect(eventsService.delete(created.id, user.id)).resolves.toBeUndefined();

      const all = await eventsService.getAll();
      const mine = await eventsService.getMyEvents(user.id);
      expect(all.some((e) => e.id === created.id)).toBe(false);
      expect(mine.some((e) => e.id === created.id)).toBe(false);
    });

    it('no borra los otros eventos del usuario', async () => {
      const doomed = await data.createEvent('delete objetivo');
      const survivor = await data.createEvent('delete sobreviviente');

      await eventsService.delete(doomed.id, user.id);

      const mine = await eventsService.getMyEvents(user.id);
      expect(mine.some((e) => e.id === survivor.id)).toBe(true);
    });

    // Se espera 404 (el recurso ya no existe). Ver informe: hoy el backend responde 500.
    it('getById de un evento borrado responde HTTP 404', async () => {
      const created = await data.createEvent('delete y getById');
      await eventsService.delete(created.id, user.id);

      const error = await rejectionOf(eventsService.getById(created.id));
      expect(error.response?.status).toBe(404);
    });
  });

  describe('errores del backend', () => {
    it('sin token, getById responde HTTP 403', async () => {
      const created = await data.createEvent('sin token');
      setAuthToken(null);

      const error = await rejectionOf(eventsService.getById(created.id));
      expect(error.response?.status).toBe(403);
    });

    it('sin token, update responde HTTP 403 y no modifica el evento', async () => {
      const created = await data.createEvent('update sin token');
      setAuthToken(null);

      const error = await rejectionOf(
        eventsService.update(created.id, user.id, buildEvent('no debería guardarse'))
      );
      expect(error.response?.status).toBe(403);

      setAuthToken(user.token);
      const fetched = await eventsService.getById(created.id);
      expect(fetched.title).toBe('[TEST] update sin token');
    });

    // Se espera 404. Ver informe: hoy el backend responde 500 para ids que no existen.
    it('getById de un id inexistente responde HTTP 404', async () => {
      const error = await rejectionOf(eventsService.getById(2_000_000_000));
      expect(error.response?.status).toBe(404);
    });
  });
});
