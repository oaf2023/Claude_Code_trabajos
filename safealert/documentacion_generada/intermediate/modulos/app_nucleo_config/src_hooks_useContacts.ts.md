# Archivo: src/hooks/useContacts.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/hooks/useContacts.ts | 102 | TypeScript 5.9 | 3430 | Hook de React (gestión de contactos) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Hook de fachada para la gestión de contactos de emergencia. Sincroniza los contactos
del usuario desde Firestore mediante suscripción en tiempo real (`ContactsService.
subscribe`), mantiene el estado en `useContactsStore` (lista + loading) y expone
operaciones CRUD y de ordenamiento delegadas en `ContactsService` (añadir, actualizar,
eliminar, activar/desactivar y priorizar). Además, antes de cada operación garantiza
una sesión Firebase válida y mantiene sincronizado el `userId` del
`useSettingsStore` con el uid real de la sesión.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` — consumido por dos pantallas reales
(ver dependientes).

[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `useEffect` de `react` | externa | Suscripción/limpieza (líneas 36-66) | Sí |
| `useContactsStore` de `../stores/useContactsStore` | interna | Estado de contactos y setters | Sí |
| `useSettingsStore` de `../stores/useSettingsStore` | interna | userId y setUserId | Sí |
| `ensureAuthenticated` de `../config/firebase` | interna | resolveUserId | Sí |
| `ContactsService` de `../services/ContactsService` | interna | subscribe/add/update/remove/toggleActive/setPriority | Sí |
| `ContactFormData` de `../types/Contact` | interna | Tipado de parámetros de las acciones | Sí |

## Componentes que dependen de este archivo

| Archivo dependiente | Uso |
| --- | --- |
| app/(tabs)/contacts.tsx | `import { useContacts }` (línea 24) |
| app/contacts/[id].tsx | `import { useContacts }` (línea 26) |

No se detectaron usos en `src/` (el hook de suscripción vive en la capa de pantallas)
ni en `iphone/`.

## Variables globales y constantes

No define variables globales. Depende de los stores y del servicio de contactos.

## Estructura (funciones / clases / tipos)

- `resolveUserId(): Promise<string>` — función privada (líneas 19-27).
- `useContacts(): {...}` — hook exportado (líneas 29-101).
  - `useEffect` de bootstrap de suscripción (líneas 36-66).
  - Acciones: `addContact` (68-71), `updateContact` (73-76), `removeContact`
    (78-81), `toggleContact` (83-86), `prioritizeContact` (88-91).

## Análisis línea por línea

**Bloque líneas 1-27 (imports y resolveUserId):**

```ts
import { useEffect } from 'react';
import { useContactsStore } from '../stores/useContactsStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { ensureAuthenticated } from '../config/firebase';
import { ContactsService } from '../services/ContactsService';
import { ContactFormData } from '../types/Contact';

/* ============================================================================
* Función         : resolveUserId
* Descripción     : Garantiza que exista una sesión Firebase válida y sincroniza el userId operativo con la sesión real.
* Fecha           : 2026-03-25
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : ensureAuthenticated, useSettingsStore
* Ingesta         : Sin argumentos
* Devolución      : Promise<string>
* Uso             : const userId = await resolveUserId()
* ============================================================================ */
async function resolveUserId(): Promise<string> {
  const authenticatedUserId = await ensureAuthenticated();

  if (useSettingsStore.getState().userId !== authenticatedUserId) {
    useSettingsStore.getState().setUserId(authenticatedUserId);
  }

  return authenticatedUserId;
}
```

**Explicación de las líneas 1-27:**
- **Líneas 1-6**: imports. `ContactFormData` (línea 6) es el tipo de datos de entrada
  de los formularios de contacto.
- **Líneas 8-18**: docstring de `resolveUserId`.
- **Líneas 19-27**: `resolveUserId`:
  - **Línea 20**: garantiza sesión Firebase válida (crea anónima si no existe) y
    devuelve el uid real.
  - **Líneas 22-24**: si el `userId` cacheado en `useSettingsStore` difiere del uid
    real, lo actualiza (fuera de React: `getState()`/`setUserId` directos, patrón
    válido en Zustand). Evita lecturas de datos bajo un uid equivocado.
  - **Línea 26**: devuelve el uid autenticado para las operaciones.

**Bloque líneas 29-66 (hook, suscripción y limpieza):**

```ts
export function useContacts() {
  const contacts = useContactsStore((s) => s.contacts);
  const loading = useContactsStore((s) => s.loading);
  const setContacts = useContactsStore((s) => s.setContacts);
  const setLoading = useContactsStore((s) => s.setLoading);
  const userId = useSettingsStore((s) => s.userId);

  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    let unsubscribe = () => {};

    const bootstrapSubscription = async () => {
      try {
        const resolvedUserId = userId || (await resolveUserId());
        if (cancelled) {
          return;
        }

        unsubscribe = ContactsService.subscribe(resolvedUserId, (updated) => {
          setContacts(updated);
          setLoading(false);
        });
      } catch (error) {
        if (!cancelled) {
          console.error('[useContacts] No se pudieron cargar los contactos:', error);
          setLoading(false);
        }
      }
    };

    void bootstrapSubscription();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [setContacts, setLoading, userId]);
```

**Explicación de las líneas 29-66:**
- **Líneas 30-34**: suscripciones selectivas a los stores (contactos, loading,
  setters y userId persistido).
- **Línea 36**: `useEffect` que arranca con la lista de dependencias
  `[setContacts, setLoading, userId]`.
- **Línea 37**: marca loading activo al montar/actualizar.
- **Líneas 38-39**: `cancelled` (guard de desmontaje) y `unsubscribe` inicializado a
  no-op.
- **Líneas 41-58**: `bootstrapSubscription`:
  - **Línea 43**: resuelve el uid de la sesión (usa el userId del store si existe; si
    no, `resolveUserId`).
  - **Líneas 44-46**: si el componente se desmontó mientras se resolvía la sesión,
    aborta (evita setState tras desmontaje).
  - **Líneas 48-51**: `ContactsService.subscribe(uid, cb)` abre la suscripción en
    tiempo real; cada actualización vuelca la lista al store y apaga el loading.
  - **Líneas 52-57**: en error (p. ej. sin red), registra en consola y desactiva
    loading (solo si no está cancelado).
- **Línea 60**: invoca el bootstrap sin await (fire-and-forget con `void`).
- **Líneas 62-65**: limpieza del efecto: marca `cancelled` y cancela la suscripción
  real, evitando fugas de listeners.
- **Línea 66**: dependencias del efecto: los setters de Zustand son estables; `userId`
  reinicia la suscripción cuando cambia de sesión (p. ej. tras logout).

**Bloque líneas 68-101 (acciones CRUD y retorno):**

```ts
  const addContact = async (data: ContactFormData) => {
    const resolvedUserId = await resolveUserId();
    return ContactsService.add(resolvedUserId, data);
  };

  const updateContact = async (id: string, data: Partial<ContactFormData>) => {
    const resolvedUserId = await resolveUserId();
    return ContactsService.update(resolvedUserId, id, data);
  };

  const removeContact = async (id: string) => {
    const resolvedUserId = await resolveUserId();
    return ContactsService.remove(resolvedUserId, id);
  };

  const toggleContact = async (id: string, active: boolean) => {
    const resolvedUserId = await resolveUserId();
    return ContactsService.toggleActive(resolvedUserId, id, active);
  };

  const prioritizeContact = async (id: string) => {
    const resolvedUserId = await resolveUserId();
    return ContactsService.setPriority(resolvedUserId, id);
  };

  return {
    contacts,
    loading,
    addContact,
    updateContact,
    removeContact,
    toggleContact,
    prioritizeContact,
  };
}
```

**Explicación de las líneas 68-101:**
- **Líneas 68-91**: cada acción resuelve primero el uid autenticado (patrón repetido y
  consistente) y delega en el servicio correspondiente. Las llamadas devuelven la
  promesa del servicio (el llamador puede encadenar feedback).
  - `addContact(data)`: crea contacto.
  - `updateContact(id, data)`: actualización parcial.
  - `removeContact(id)`: elimina.
  - `toggleContact(id, active)`: activa/desactiva.
  - `prioritizeContact(id)`: marca como prioridad (contacto principal).
- **Líneas 93-101**: retorno del hook: estado (contacts/loading) y acciones.
  Nótese que NO se exponen los setters internos (`setContacts`, `setLoading`) a las
  pantallas: el estado solo cambia vía suscripción o acciones delegadas, lo que
  centraliza la escritura en el servicio.

## Fichas de funciones y métodos

### resolveUserId (líneas 19-27)

- Firma: `async function resolveUserId(): Promise<string>`
- Propósito técnico: garantizar sesión y sincronizar el userId operativo.
- Parámetros: ninguno. Retorno: uid (string). Excepciones: las de
  `ensureAuthenticated`.
- Dependencias: `ensureAuthenticated`, `useSettingsStore`. Flujo: autenticar ->
  comparar -> actualizar store si difiere -> devolver uid.
- Efectos secundarios: puede crear sesión anónima y actualizar `userId` persistido.
- Riesgos: si la autenticación anónima falla, todas las operaciones fallan con
  error propagado.

### useContacts / useEffect de suscripción (líneas 36-66)

- Propósito: mantener la lista de contactos sincronizada en tiempo real por sesión.
- Parámetros (del efecto): ninguno; dependencias `[setContacts, setLoading, userId]`.
- Retorno: función de limpieza.
- Riesgos: múltiples montajes del hook (p. ej. navegación entre pestañas) abren/cierran
  suscripciones; el patrón `cancelled` + `unsubscribe` lo gestiona correctamente.

### Acciones CRUD (68-91)

- Firmas: `addContact(data)`, `updateContact(id, data)`, `removeContact(id)`,
  `toggleContact(id, active)`, `prioritizeContact(id)` — todas async.
- Propósito: delegar al servicio la mutación en Firestore con uid resuelto.
- Retorno: promesa del servicio. Excepciones: propagadas al llamador (pantalla).
- Riesgos: operaciones sin feedback de UI si el llamador no captura errores.

## Clases / interfaces / tipos

No define clases ni interfaces propias; usa `ContactFormData` de
`src/types/Contact` para tipar las entradas de creación/actualización.

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` `resolveUserId` se invoca en cada acción y en el bootstrap:
  hace una comprobación de sesión por operación. Es robusto pero añade latencia;
  podría cachearse el uid y revalidar solo en errores de permisos.
- `[OBSERVACIÓN TÉCNICA]` El `userId` inicial del store puede estar desactualizado
  tras reinstalación si `ensureAuthenticated` crea un uid nuevo: el bootstrap usa
  `userId || await resolveUserId()`; si hay userId previo no se revalida la sesión
  hasta la primera operación.
- `[INFORMATIVO]` Los errores de carga se registran con `console.error` (prefijo
  '[useContacts]'); no se imprimen datos de contacto.
- `[INFORMATIVO]` El hook no expone `setContacts`/`setLoading`: solo la suscripción y
  las acciones pueden modificar el estado, buen encapsulamiento.

## Seguridad

- `[INFORMATIVO]` No maneja secretos; el uid se obtiene de Firebase Auth.
- `[BAJO]` `console.error` de errores de red podría incluir URLs de Firestore en el
  mensaje; sin payloads de contactos. Riesgo bajo.
- `[INFORMATIVO]` Datos personales (contactos de emergencia: nombres, teléfonos) se
  sincronizan desde Firestore bajo el path por uid; la protección real depende de las
  security rules de Firestore (revisar que solo el uid propietario lea `users/{uid}/contacts`).

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Medio: si las reglas de Firestore no restringen el acceso por uid, la
  suscripción expondría contactos de otros usuarios; auditar reglas.
- `[RECOMENDACIÓN]` Considerar cachear el uid resuelto (p. ej. en el store) y
  revalidar únicamente ante errores de autenticación/permisos para reducir llamadas
  de red por operación.
- `[RECOMENDACIÓN]` Añadir manejo de errores de usuario visible (toast/alerta) en las
  pantallas para las acciones que hoy propagan excepción sin feedback.
