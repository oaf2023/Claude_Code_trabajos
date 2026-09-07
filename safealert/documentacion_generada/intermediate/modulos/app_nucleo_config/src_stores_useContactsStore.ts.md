# Archivo: src/stores/useContactsStore.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/stores/useContactsStore.ts | 55 | TypeScript 5.9 | 1473 | Store de estado global (Zustand) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Store global de Zustand que mantiene en memoria la lista de contactos de emergencia
del usuario activo y el flag de carga. Centraliza el orden canónico de los contactos
(activos primero, luego por prioridad y finalmente por `addedAt`) y expone acciones de
mutación (set/add/update/remove) que re-aplican siempre ese orden. También ofrece un
selector derivado `activeContacts()` para obtener solo los contactos activos (los que
reciben alertas).

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` — consumido por el hook `useContacts`, por
`AlertService` (contactos activos para envío de alertas) y por pantallas/tests.

[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `create` de `zustand` | externa | Línea 29 (creación del store) | Sí |
| `Contact` de `../types/Contact` | interna | Tipo del estado y funciones de orden | Sí |

No usa persistencia: los contactos viven en Firestore y este store es un caché en
memoria alimentado por la suscripción de `useContacts`/`ContactsService`.

## Componentes que dependen de este archivo

| Archivo dependiente | Uso |
| --- | --- |
| src/hooks/useContacts.ts | Selectores contacts/loading y setters |
| src/services/AlertService.ts | `useContactsStore.getState().activeContacts()` (línea 102) para decidir destinatarios |
| app/(tabs)/index.tsx | Store de contactos (línea 33) |
| app/test-alert.tsx | Store de contactos (línea 12) |
| app/contacts/[id].tsx | Store de contactos (línea 27) |
| src/services/__tests__/AlertService.test.ts | `setState` para simular contactos (tests) |

## Variables globales y constantes

No hay variables globales ni secretos: el estado vive en el store (ver estado
inicial en línea 30-31) y la única lógica estática es la función de ordenación local.

## Estructura (funciones / clases / tipos)

- `sortContacts(contacts: Contact[]): Contact[]` — función privada (líneas 4-16).
- `interface ContactsState` (líneas 18-27).
- `useContactsStore` — store creado con `create<ContactsState>()(set, get)` (líneas
  29-55).

## Análisis línea por línea

**Bloque líneas 1-27 (imports, ordenación e interfaz):**

```ts
import { create } from 'zustand';
import { Contact } from '../types/Contact';

function sortContacts(contacts: Contact[]): Contact[] {
  return [...contacts].sort((left, right) => {
    if (left.active !== right.active) {
      return left.active ? -1 : 1;
    }

    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    return left.addedAt - right.addedAt;
  });
}

interface ContactsState {
  contacts: Contact[];
  loading: boolean;
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
  updateContact: (id: string, data: Partial<Contact>) => void;
  removeContact: (id: string) => void;
  setLoading: (loading: boolean) => void;
  activeContacts: () => Contact[];
}
```

**Explicación de las líneas 1-27:**
- **Líneas 1-2**: imports de Zustand y del tipo `Contact`.
- **Líneas 4-16**: `sortContacts`:
  - **Línea 5**: clona el array (`[...contacts]`) para no mutar el estado original
    (inmutabilidad con `sort` in-place evitada).
  - **Líneas 6-8**: los contactos activos van primero (`active === true` -> -1).
  - **Líneas 10-12**: dentro del mismo estado activo, ordena por `priority`
    (numérico, ascendente: prioridad menor = más importante, a menos que el
    significado sea al revés; ver observación).
  - **Línea 14**: desempate por `addedAt` (timestamp) ascendente: los más antiguos
    primero.
- **Líneas 18-27**: interfaz del estado: datos (`contacts`, `loading`), acciones de
  mutación y el método derivado `activeContacts()`. `updateContact` acepta una
  actualización parcial `Partial<Contact>`.

[OBSERVACIÓN TÉCNICA] El orden por `priority` es ascendente (menor número primero).
El significado del campo depende del tipo `Contact` (no leído en este módulo): si en
`types/Contact` el valor de prioridad representa "1 = contacto principal", el orden es
correcto; de lo contrario se invierte. Se recomienda confirmar la semántica del campo.

**Bloque líneas 29-55 (implementación del store):**

```ts
export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: [],
  loading: false,

  setContacts: (contacts) => set({ contacts: sortContacts(contacts) }),

  addContact: (contact) =>
    set((state) => ({ contacts: sortContacts([...state.contacts, contact]) })),

  updateContact: (id, data) =>
    set((state) => ({
      contacts: sortContacts(
        state.contacts.map((c) =>
          c.id === id ? { ...c, ...data } : c
        )
      ),
    })),

  removeContact: (id) =>
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
    })),

  setLoading: (loading) => set({ loading }),

  activeContacts: () => sortContacts(get().contacts).filter((c) => c.active),
}));
```

**Explicación de las líneas 29-55:**
- **Línea 29**: crea el store tipado con `set` y `get`.
- **Líneas 30-31**: estado inicial: lista vacía y loading false.
- **Línea 33**: `setContacts` sustituye la lista completa reordenada (usado por la
  suscripción en tiempo real).
- **Líneas 35-36**: `addContact` concatena y reordena.
- **Líneas 38-45**: `updateContact` mapea (merge parcial `{...c, ...data}` sobre el
  contacto cuyo id coincide) y reordena.
- **Líneas 47-50**: `removeContact` filtra por id (no reordena: innecesario al
  eliminar).
- **Línea 52**: `setLoading`.
- **Línea 54**: `activeContacts` reordena y filtra solo activos; es un método que
  lee con `get()` (fuera de la suscripción React), usado por `AlertService` para
  seleccionar destinatarios de la alerta sin depender del ciclo de render.

## Fichas de funciones y métodos

### sortContacts (líneas 4-16)

- Firma: `function sortContacts(contacts: Contact[]): Contact[]`
- Propósito: orden canónico (activos -> prioridad -> addedAt).
- Parámetros: array de contactos. Retorno: nuevo array ordenado (no muta la entrada).
- Dependencias: ninguna. Excepciones: ninguna.
- Efectos: ninguno (función pura). Riesgo: depende de la semántica de `priority`.

### Acciones del store (setContacts/addContact/updateContact/removeContact/setLoading)

- Propósito: mutaciones atómicas con orden canónico garantizado.
- Patrón: `set` con updater funcional para add/update (evita carreras por estado
  obsoleto).
- Riesgo: bajo; todas preservan inmutabilidad.

### activeContacts (línea 54)

- Firma: `activeContacts: () => Contact[]`
- Propósito: devolver los contactos activos y ordenados (destinatarios de alertas).
- Retorno: nueva lista (sortContacts clona). Riesgo: llamarlo desde el render sin
  selector provoca nuevas referencias en cada llamada (uso previsto fuera de React).

## Clases / interfaces / tipos

### ContactsState (líneas 18-27)

- Responsabilidad: contrato del estado global de contactos.
- Campos: `contacts: Contact[]`, `loading: boolean`; acciones y `activeContacts`.
- Relaciones: `Contact` de `src/types/Contact`; alimentado por `ContactsService`
  (vía hook) y consumido por `AlertService` y pantallas.
- Ciclo de vida: estado en memoria; se repuebla en cada suscripción; no persiste.

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` Sin persistencia local: depende 100% de la suscripción a
  Firestore; si la app arranca offline, la lista aparece vacía hasta reconectar
  (comportamiento a validar con el requerimiento de alertas offline).
- `[OBSERVACIÓN TÉCNICA]` La semántica exacta de `priority` (mayor vs menor número =
  más prioritario) no es verificable en este archivo; ver `src/types/Contact`.
- `[INFORMATIVO]` `setContacts` reordena siempre, incluso si el origen (Firestore) ya
  devolviera datos ordenados: coste O(n log n) aceptable para listas pequeñas.

## Seguridad

- `[INFORMATIVO]` Sin secretos ni datos fuera del flujo previsto.
- `[INFORMATIVO]` El store contiene datos personales (contactos) en memoria; no los
  escribe en logs ni los persiste localmente (a diferencia de ajustes, este store no
  usa persist). La protección de datos en tránsito depende de Firestore rules.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo-medio: lista vacía en frío/offline podría impedir seleccionar
  destinatarios de una alerta SOS en una emergencia sin red (el envío SMS podría
  depender de datos cacheados). [RECOMENDACIÓN] Evaluar caché local de contactos
  (AsyncStorage) si el requisito de alertas offline lo exige.
- `[RECOMENDACIÓN]` Confirmar la semántica de `priority` en `types/Contact` y
  documentarla junto al comparador.
- `[RECOMENDACIÓN]` Exponer un selector `useContactsStore((s) => s.contacts.length)`
  o similar en pantallas para evitar renders amplios cuando solo se necesita el
  conteo.
