# Archivo: src/services/ContactsService.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/ContactsService.ts | 288 | TypeScript 5.9 | 11350 | Servicio de gestión de contactos de confianza (Firestore + sincronización externa) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Servicio CRUD de los **contactos de confianza** del usuario (destinatarios de las alertas SOS). Opera sobre la subcolección Firestore `users/{userId}/contacts` con validaciones operativas para el MVP: unicidad de teléfono en formato E.164, prioridad numérica (0 = principal), activación/desactivación y ordenamiento por prioridad operativa. Además, tras `add` y `remove` sincroniza (fire-and-forget) con una base de datos externa `safealert_tel.db` alojada en PythonAnywhere mediante `TrialService` (segundo canal de datos de contacto, asociado a la gestión de prueba/período de prueba del MVP).

## Clasificación y estado

`FUNCIONALIDAD EXISTENTE` — Consumido por `src/hooks/useContacts.ts` (líneas 5, 48, 70, 75, 80, 85, 90), que a su vez alimenta las pantallas de contactos. La sincronización a PythonAnywhere (`safealert_tel.db`) existe y se invoca en `add` y `remove`; sin embargo, `update`, `toggleActive` y `setPriority` **no** propagan cambios al canal externo, lo que puede dejar datos divergentes entre Firestore y `safealert_tel.db`.

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `contactsCol` de `../config/firebase` | interna | Referencia a la colección Firestore de contactos | Sí |
| `firestore` de `../config/firebase` | interna | Creación de batch para `setPriority` | Sí |
| `Contact`, `ContactFormData` de `../types/Contact` | interna | Tipado del dominio | Sí |
| `toE164` de `../utils/formatPhone` | interna | Normalización de teléfonos E.164 | Sí |
| `DeviceService` de `./DeviceService` | interna | `getDeviceId()` para la sincronización externa | Sí |
| `TrialService` de `./TrialService` | interna | `syncContacto` / `borrarContacto` hacia PythonAnywhere | Sí |

## Componentes que dependen de este archivo

- `src/hooks/useContacts.ts` (líneas 5, 48, 70, 75, 80, 85, 90): suscribe y ejecuta todas las operaciones (`subscribe`, `add`, `update`, `remove`, `toggleActive`, `setPriority`).
- Pantallas de contactos (a través del hook; no se inspeccionaron aquí por alcance).
- `src/services/AlertService.ts` y demás flujo de alerta leen contactos desde `useContactsStore`/Firestore (no importan `ContactsService` directamente).

## Variables globales y constantes

No hay variables globales mutables ni constantes de módulo en este archivo (todas las operaciones reciben `userId` explícito). Constantes implícitas: colección de contactos definida en `src/config/firebase.ts` (línea 519): `contactsCol = (uid) => firestore().collection('users').doc(uid).collection('contacts')`.

## Estructura (funciones / clases / tipos)

Funciones auxiliares no exportadas:

- `hydrateAndSortContacts(contacts)` (29–51)
- `getNormalizedContacts(userId)` (53–61)
- `getNextPriority(userId)` (63–70)
- `assertUniquePhone(userId, phone, excludedContactId?)` (83–102)

Objeto exportado `ContactsService`:

- `subscribe(userId, onUpdate)` (116–129)
- `add(userId, data)` (142–166)
- `update(userId, contactId, data)` (179–192)
- `remove(userId, contactId)` (205–218)
- `toggleActive(userId, contactId, active)` (231–237)
- `setPriority(userId, contactId)` (250–272)
- `getAll(userId)` (285–287)

Tipos usados: `Contact`, `ContactFormData` (de `../types/Contact`).

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : ContactsService.ts
* Descripción     : Gestión de contactos con validaciones operativas para el MVP.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : ContactsService.add(userId, data) y operaciones relacionadas.
* ============================================================================ */

import { contactsCol } from '../config/firebase';
import { Contact, ContactFormData } from '../types/Contact';
import { toE164 } from '../utils/formatPhone';
import { firestore } from '../config/firebase';
import { DeviceService } from './DeviceService';
import { TrialService } from './TrialService';
```

**Explicación de las líneas 1–16:**

- **Líneas 1–9**: Cabecera estándar del proyecto.
- **Línea 11**: Importa la fábrica de referencia de colección `contactsCol(userId)`.
- **Línea 12**: Tipos del dominio de contactos.
- **Línea 13**: Normalización E.164 de teléfonos.
- **Línea 14**: Importa `firestore()` (función) para crear el batch en `setPriority`. Se importa en una línea separada pese a que `contactsCol` ya viene del mismo módulo (duplicación menor de import del mismo archivo, pero de símbolos distintos, válida).
- **Línea 15**: `DeviceService.getDeviceId()` para identificar el dispositivo en la sincronización externa.
- **Línea 16**: `TrialService` para sincronizar contactos con `safealert_tel.db` (PythonAnywhere).

```ts
/* ============================================================================
* Función         : hydrateAndSortContacts
...
* ============================================================================ */
function hydrateAndSortContacts(contacts: Contact[]): Contact[] {
  const byAddedAt = [...contacts].sort((left, right) => left.addedAt - right.addedAt);

  return byAddedAt
    .map((contact, index) => ({
      ...contact,
      priority:
        typeof contact.priority === 'number' && Number.isFinite(contact.priority)
          ? contact.priority
          : index,
    }))
    .sort((left, right) => {
      if (left.active !== right.active) {
        return left.active ? -1 : 1;
      }

      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }

      return left.addedAt - right.addedAt;
    });
}
```

**Explicación de las líneas 29–51:**

- **Línea 29**: Define la normalizadora interna (con cabecera de función del proyecto en líneas 18–28).
- **Línea 30**: Copia el arreglo (evita mutar el original) y ordena por `addedAt` ascendente; orden base estable.
- **Líneas 32–39**: Re-hidrata la `priority`: si el documento no trae un número finito (p. ej., registros antiguos o datos parciales), asigna el índice del arreglo ordenado como prioridad por defecto. Esto da robustez ante datos legados.
- **Líneas 40–50**: Orden operativo definitivo: primero los `active` (inactivos al final), luego por `priority` ascendente (0 primero), desempate por `addedAt`.
- **[NOTA]**: El criterio de orden es determinista y está pensado para que el contacto principal (activo + prioridad 0) sea el primero en recibir la alerta.

```ts
async function getNormalizedContacts(userId: string): Promise<Contact[]> {
  const snapshot = await contactsCol(userId).get();
  const contacts = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Contact, 'id'>),
  }));

  return hydrateAndSortContacts(contacts);
}
```

**Explicación de las líneas 53–61:**

- **Línea 53**: Función interna que lee todos los contactos del usuario.
- **Línea 54**: Ejecuta la consulta Firestore completa de la subcolección (sin filtros ni paginación).
- **Líneas 55–58**: Mapea documentos a `Contact`, inyectando el `id` del documento.
- **Línea 60**: Normaliza y ordena antes de devolver.

```ts
async function getNextPriority(userId: string): Promise<number> {
  const contacts = await getNormalizedContacts(userId);
  if (contacts.length === 0) {
    return 0;
  }

  return Math.max(...contacts.map((contact) => contact.priority)) + 1;
}
```

**Explicación de las líneas 63–70:**

- **Línea 64**: Recupera contactos normalizados.
- **Líneas 65–67**: Si no hay contactos, la siguiente prioridad es 0.
- **Línea 69**: Calcula el máximo de prioridades existentes + 1. `[OBSERVACIÓN TÉCNICA]`: no es atómico; dos altas concurrentes pueden calcular la misma prioridad (ver riesgos).

```ts
/* ============================================================================
* Función         : assertUniquePhone
...
* ============================================================================ */
async function assertUniquePhone(
  userId: string,
  phone: string,
  excludedContactId?: string
): Promise<void> {
  const normalizedPhone = toE164(phone);
  const snapshot = await contactsCol(userId).get();
  const duplicated = snapshot.docs.find((doc) => {
    if (excludedContactId && doc.id === excludedContactId) {
      return false;
    }

    const current = doc.data() as Omit<Contact, 'id'>;
    return current.phone === normalizedPhone;
  });

  if (duplicated) {
    throw new Error('Ese teléfono ya está cargado como contacto de confianza.');
  }
}
```

**Explicación de las líneas 83–102:**

- **Línea 83**: Función que garantiza teléfonos únicos por usuario.
- **Línea 88**: Normaliza el teléfono entrante a E.164 antes de comparar (evita duplicados por formato).
- **Línea 89**: Lee todos los contactos del usuario (lectura completa para validar).
- **Líneas 90–97**: Busca un documento cuyo `phone` coincida; si `excludedContactId` se pasa (caso `update`), se excluye el propio documento de la comparación.
- **Líneas 99–101**: Si existe duplicado lanza un error con mensaje de usuario.
- `[OBSERVACIÓN TÉCNICA]`: la unicidad se valida en cliente; no hay regla compuesta en Firestore para garantizarla a nivel de servidor (Firestore no soporta unique index multi-documento nativo), por lo que dos escrituras concurrentes podrían crear duplicados.

```ts
export const ContactsService = {
  /* ============================================================================
  * Función         : subscribe
  ...
  * ============================================================================ */
  subscribe(
    userId: string,
    onUpdate: (contacts: Contact[]) => void
  ): () => void {
    return contactsCol(userId)
      .orderBy('addedAt', 'asc')
      .onSnapshot((snapshot) => {
        const contacts = hydrateAndSortContacts(snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Contact, 'id'>),
        })));
        onUpdate(contacts);
      });
  },
```

**Explicación de las líneas 116–129:**

- **Línea 116**: Suscripción en tiempo real a los contactos del usuario.
- **Líneas 120–121**: Consulta ordenada por `addedAt` ascendente (el orden fino lo aplica `hydrateAndSortContacts`).
- **Líneas 122–128**: En cada snapshot, normaliza/ordena los documentos y notifica al callback.
- **Línea 129**: Devuelve la función de cancelación de `onSnapshot` (para limpiar en `useEffect`).

```ts
  /* ============================================================================
  * Función         : add
  ...
  * ============================================================================ */
  async add(userId: string, data: ContactFormData): Promise<Contact> {
    await assertUniquePhone(userId, data.phone);
    const priority = await getNextPriority(userId);

    const contact: Omit<Contact, 'id'> = {
      name: data.name.trim(),
      phone: toE164(data.phone),
      active: true,
      priority,
      addedAt: Date.now(),
    };
    const ref = await contactsCol(userId).add(contact);

    // Sincronizar con safealert_tel.db en PythonAnywhere (fire & forget)
    void DeviceService.getDeviceId().then((deviceId) => {
      void TrialService.syncContacto(
        deviceId,
        contact.name,
        contact.phone,
        contact.priority === 0
      );
    }).catch(() => {});

    return { id: ref.id, ...contact };
  },
```

**Explicación de las líneas 142–166:**

- **Línea 143**: Valida unicidad del teléfono.
- **Línea 144**: Calcula la siguiente prioridad.
- **Líneas 146–152**: Construye el documento: nombre recortado (`trim`), teléfono normalizado E.164, `active: true`, prioridad, `addedAt` en ms.
- **Línea 153**: Añade el documento a Firestore (obtiene el id generado).
- **Líneas 155–163**: **Sincronización fire-and-forget al canal externo PythonAnywhere** (`safealert_tel.db`): obtiene el `deviceId` y llama `TrialService.syncContacto` marcando si es el contacto principal (`priority === 0`). Cualquier error se traga con `.catch(() => {})`.
- **[OBSERVACIÓN TÉCNICA]**: Es un segundo canal de datos personales (nombre + teléfono del contacto) hacia PythonAnywhere, sin espera de confirmación, sin reintento y con error silencioso. Si falla, Firestore y `safealert_tel.db` quedan inconsistentes sin señal.
- **Línea 165**: Retorna el contacto con su id Firestore.

```ts
  /* ============================================================================
  * Función         : update
  ...
  * ============================================================================ */
  async update(
    userId: string,
    contactId: string,
    data: Partial<ContactFormData>
  ): Promise<void> {
    const patch: Partial<Contact> = {};
    if (data.name) patch.name = data.name.trim();
    if (data.phone) {
      await assertUniquePhone(userId, data.phone, contactId);
      patch.phone = toE164(data.phone);
    }

    await contactsCol(userId).doc(contactId).update(patch);
  },
```

**Explicación de las líneas 179–192:**

- **Línea 179**: Actualización parcial de nombre/teléfono.
- **Línea 184**: Construye el parche.
- **Línea 185**: Si hay nombre, lo recorta.
- **Líneas 186–189**: Si hay teléfono, valida unicidad excluyendo el propio contacto y normaliza a E.164.
- **Línea 191**: Aplica la actualización al documento.
- **[OBSERVACIÓN TÉCNICA]**: `update` no propaga el cambio al canal PythonAnywhere (`safealert_tel.db`), a diferencia de `add`/`remove`. Inconsistencia del doble canal: un teléfono corregido quedaría desactualizado en la base externa.

```ts
  /* ============================================================================
  * Función         : remove
  ...
  * ============================================================================ */
  async remove(userId: string, contactId: string): Promise<void> {
    // Obtener teléfono antes de eliminar para el borrado lógico en SQLite
    const snap = await contactsCol(userId).doc(contactId).get();
    const contactData = snap.data() as Omit<Contact, 'id'> | undefined;

    await contactsCol(userId).doc(contactId).delete();

    // Marcar como borrado en safealert_tel.db (fire & forget)
    if (contactData?.phone) {
      void DeviceService.getDeviceId().then((deviceId) => {
        void TrialService.borrarContacto(deviceId, contactData.phone);
      }).catch(() => {});
    }
  },
```

**Explicación de las líneas 205–218:**

- **Línea 206**: Comentario técnico: se lee el documento antes de borrarlo para conservar el teléfono.
- **Línea 207**: Obtiene el snapshot del contacto.
- **Línea 208**: Extrae los datos (puede no existir).
- **Línea 210**: Elimina el documento de Firestore.
- **Líneas 212–217**: Si existía teléfono, dispara el borrado lógico remoto en `safealert_tel.db` vía `TrialService.borrarContacto` (fire-and-forget con error silencioso).
- **[RIESGO]**: Si el borrado remoto falla, el contacto eliminado en Firestore podría seguir activo en la base externa (riesgo de notificación a un contacto que el usuario eliminó).

```ts
  /* ============================================================================
  * Función         : toggleActive
  ...
  * ============================================================================ */
  async toggleActive(
    userId: string,
    contactId: string,
    active: boolean
  ): Promise<void> {
    await contactsCol(userId).doc(contactId).update({ active });
  },
```

**Explicación de las líneas 231–237:**

- **Líneas 231–237**: Activa/desactiva un contacto actualizando solo el campo `active`. Sin sincronización externa y sin validación previa de existencia (si el documento no existe, `update` lanzará error de Firestore).

```ts
  /* ============================================================================
  * Función         : setPriority
  ...
  * ============================================================================ */
  async setPriority(userId: string, contactId: string): Promise<void> {
    const contacts = await getNormalizedContacts(userId);
    const target = contacts.find((contact) => contact.id === contactId);

    if (!target) {
      throw new Error('No se encontró el contacto a priorizar.');
    }

    const ordered = [
      { ...target, active: true },
      ...contacts.filter((contact) => contact.id !== contactId),
    ];

    const batch = firestore().batch();
    ordered.forEach((contact, index) => {
      batch.update(contactsCol(userId).doc(contact.id), {
        priority: index,
        active: contact.id === contactId ? true : contact.active,
      });
    });

    await batch.commit();
  },
```

**Explicación de las líneas 250–272:**

- **Línea 251**: Recupera los contactos normalizados (orden activo/prioridad).
- **Líneas 252–256**: Localiza el contacto a priorizar; si no existe lanza error.
- **Líneas 258–261**: Construye el nuevo orden: el objetivo primero (y forzado a `active: true`), el resto detrás en su orden previo.
- **Líneas 263–269**: Prepara un `batch` atómico: reasigna `priority` por índice (0, 1, 2...) y garantiza que el priorizado quede activo.
- **Línea 271**: Ejecuta el batch atómicamente.
- **[NOTA]**: Operación atómica correcta que reordena toda la lista. No sincroniza el cambio de "contacto principal" con `safealert_tel.db` (el flag `esPrincipal` que `add` envía a `syncContacto` quedaría desactualizado si se prioriza otro contacto después).

```ts
  /* ============================================================================
  * Función         : getAll
  ...
  * ============================================================================ */
  async getAll(userId: string): Promise<Contact[]> {
    return getNormalizedContacts(userId);
  },
};
```

**Explicación de las líneas 285–287:**

- **Línea 285**: Recupera todos los contactos normalizados y ordenados (lectura puntual, sin suscripción).

## Fichas de funciones y métodos

### hydrateAndSortContacts (líneas 29–51)

- Firma: `function hydrateAndSortContacts(contacts: Contact[]): Contact[]`
- Propósito: re-hidratar prioridades ausentes y ordenar por activo/prioridad/alta.
- Parámetros: `contacts: Contact[]`. Retorno: `Contact[]` (copia nueva). Excepciones: ninguna.
- Efectos: ninguno externo (copia defensiva). Se llama desde `getNormalizedContacts`, `subscribe` y se exporta indirectamente vía sus usos internos.

### getNormalizedContacts (líneas 53–61)

- Firma: `async function getNormalizedContacts(userId: string): Promise<Contact[]>`
- Propósito: leer y normalizar contactos de Firestore.
- Dependencias: `contactsCol(userId).get()`, `hydrateAndSortContacts`.

### getNextPriority (líneas 63–70)

- Firma: `async function getNextPriority(userId: string): Promise<number>`
- Propósito: calcular la siguiente prioridad disponible. Riesgo de carrera (no atómico).

### assertUniquePhone (líneas 83–102)

- Firma: `async function assertUniquePhone(userId: string, phone: string, excludedContactId?: string): Promise<void>`
- Propósito: prevenir teléfonos duplicados normalizando E.164.
- Lanza: `Error('Ese teléfono ya está cargado como contacto de confianza.')`.
- Llamada desde: `add` y `update`.

### ContactsService.subscribe (líneas 116–129)

- Firma: `subscribe(userId: string, onUpdate: (contacts: Contact[]) => void): () => void`
- Propósito: suscripción en tiempo real.
- Retorno: función de limpieza de `onSnapshot`.

### ContactsService.add (líneas 142–166)

- Firma: `async add(userId: string, data: ContactFormData): Promise<Contact>`
- Propósito: alta de contacto con validación de unicidad, prioridad y sincronización externa.
- Efectos secundarios: escritura Firestore + sincronización fire-and-forget PythonAnywhere.
- Riesgos: carrera de prioridad; fallo silencioso de la sincronización remota.

### ContactsService.update (líneas 179–192)

- Firma: `async update(userId: string, contactId: string, data: Partial<ContactFormData>): Promise<void>`
- Propósito: edición parcial. Sin sincronización externa (inconsistencia documentada).

### ContactsService.remove (líneas 205–218)

- Firma: `async remove(userId: string, contactId: string): Promise<void>`
- Propósito: borrado en Firestore + borrado lógico remoto.
- Efectos: dos canales de escritura. Riesgo: contacto eliminado localmente puede permanecer en la BD externa.

### ContactsService.toggleActive (líneas 231–237)

- Firma: `async toggleActive(userId: string, contactId: string, active: boolean): Promise<void>`
- Propósito: activar/desactivar sin eliminar.

### ContactsService.setPriority (líneas 250–272)

- Firma: `async setPriority(userId: string, contactId: string): Promise<void>`
- Propósito: reordenar contactos para fijar el principal.
- Efectos: batch atómico sobre toda la lista. Lanza `Error('No se encontró el contacto a priorizar.')`.

### ContactsService.getAll (líneas 285–287)

- Firma: `async getAll(userId: string): Promise<Contact[]>`
- Propósito: lectura puntual de contactos ordenados.

## Clases / interfaces / tipos

No se declaran clases. Tipos externos (definidos en `src/types/Contact.ts`):

| Tipo | Responsabilidad | Campos |
| --- | --- | --- |
| `Contact` | Documento persistido de contacto de confianza | `id`, `name`, `phone` (E.164), `active`, `priority` (0 = principal), `addedAt` (ms) |
| `ContactFormData` | Datos de entrada del formulario | `name`, `phone` |

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` **Doble canal de datos personales**: nombre y teléfono de los contactos de confianza se escriben en Firestore (canal principal) y además se envían a PythonAnywhere (`safealert_tel.db`) vía `TrialService` en `add` (líneas 155–163) y `remove` (líneas 212–217). `[NIVEL DE CERTEZA: Confirmado por código]`.
- `[OBSERVACIÓN TÉCNICA]` La sincronización externa es fire-and-forget con errores silenciosos (`.catch(() => {})`), sin cola de reintentos: pérdida silenciosa de sincronía.
- `[OBSERVACIÓN TÉCNICA]` `update` (179–192), `toggleActive` (231–237) y `setPriority` (250–272) no propagan cambios al canal externo; en particular, cambiar el contacto principal con `setPriority` no actualiza el flag "principal" en `safealert_tel.db` que sí envía `add`.
- `[OBSERVACIÓN TÉCNICA]` La unicidad de teléfono (83–102) es cliente-side y no atómica; `getNextPriority` (63–70) tampoco es atómico. Riesgo de duplicados/prioridades repetidas bajo escrituras concurrentes.
- `[OBSERVACIÓN TÉCNICA]` `getNormalizedContacts`/`assertUniquePhone` leen la colección completa por operación (coste Firestore O(n)); con muchos contactos podría escalar mal.
- `[NOTA]` Import duplicado del módulo `../config/firebase` (líneas 11 y 14) con símbolos distintos: válido, aunque podría unificarse.

## Seguridad

- `[ALTO]` Datos personales en doble canal: los teléfonos (E.164) y nombres de los contactos de confianza del usuario se transmiten a un backend PythonAnywhere además de Firestore. La exposición amplía la superficie: el backend externo debe garantizar cifrado en tránsito (HTTPS) y en reposo, y el proyecto debe registrar este tratamiento en su política de privacidad/consentimiento (DAMMA/DAMA-DMBOK).
- `[INFORMATIVO]` No hay cifrado de los campos `name`/`phone` en Firestore; la protección depende de las reglas de seguridad de Firestore (no analizadas en este módulo).
- `[BAJO]` Los errores de sincronización remota se tragan sin log (`[TrialService]` sí registra algunos `console.warn` internos, ver `TrialService.ts`), lo que dificulta la auditoría de tratamientos fallidos de datos personales.
- `[BAJO]` No se valida el formato del teléfono más allá de la conversión E.164 (un valor sin `+` y sin ceros iniciales recibe `+54` por defecto de `toE164`); el alcance del error se limita al mensaje de unicidad.
- `[INFORMATIVO]` Consentimiento: el alta de un contacto de confianza no incluye verificación de que ese tercero haya consentido recibir alertas; es un supuesto de diseño del MVP (el usuario declara a sus contactos).
- No se imprimen secretos ni tokens en este archivo.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Divergencia Firestore vs `safealert_tel.db` por sincronización parcial y no reintentada; recomendar una cola de sincronización local con estado y reconciliación periódica.
- `[RIESGO]` Contacto eliminado en la app podría seguir recibiendo alertas si el borrado remoto falló; recomendar confirmación de borrado en ambos canales o tratar `safealert_tel.db` como fuente secundaria consultada por `TrialService.checkPrueba`.
- `[RECOMENDACIÓN]` Centralizar el alta de contactos con transacciones Firestore y, si el canal PythonAnywhere sigue vigente, propagar también `update`, `toggleActive` y `setPriority` (o eliminar el canal si es legado).
- `[RECOMENDACIÓN]` Evaluar reglas de seguridad Firestore que restrinjan `users/{uid}/contacts` al propio `uid` y auditoría de accesos.
- `[RECOMENDACIÓN]` Documentar en la política de privacidad el tratamiento de datos de contactos de confianza y su envío a infraestructura externa.
