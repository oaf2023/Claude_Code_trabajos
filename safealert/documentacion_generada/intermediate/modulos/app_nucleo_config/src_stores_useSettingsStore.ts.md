# Archivo: src/stores/useSettingsStore.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/stores/useSettingsStore.ts | 59 | TypeScript 5.9 | 2195 | Store de estado global (Zustand + persist) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Store global persistente de ajustes y datos de perfil del usuario. Extiende el tipo
`AppSettings` (definido en `src/types/Settings`, con valores por defecto en
`DEFAULT_SETTINGS`) añadiendo: `userId` (uid Firebase de la sesión), `isOnboarded`,
`userName`, `userPhone`, `userSelfieUrl` y las acciones setter correspondientes.
Persiste en AsyncStorage (clave 'safealert-settings') un subconjunto seleccionado del
estado mediante `partialize`: onboarding, datos de perfil, palabras de activación,
plantilla de mensaje, audio habilitado, suscripción/pago vencido, cuenta regresiva y
sensibilidad del wake word.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` — ampliamente consumido (ver dependientes).

[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `create` de `zustand` | externa | Línea 22 | Sí |
| `persist`, `createJSONStorage` de `zustand/middleware` | externa | Líneas 22-58 | Sí |
| `AsyncStorage` de `@react-native-async-storage/async-storage` | externa | Línea 43 | Sí |
| `AppSettings`, `DEFAULT_SETTINGS` de `../types/Settings` | interna | Líneas 6, 25 | Sí |

## Componentes que dependen de este archivo

| Archivo dependiente | Uso |
| --- | --- |
| src/hooks/useContacts.ts | userId, setUserId |
| src/services/AlertService.ts | getState().userId, setUserId |
| src/services/WakeWordService.ts | triggerWords, wakeWordSensitivity, updateSettings (guardModeEnabled), setHasSubscription |
| src/services/PaymentService.ts | setHasSubscription (estado de pago) |
| src/components/PaymentOverdueModal.tsx | setPaymentOverdue, estado de pago |
| app/_layout.tsx | useSettingsStore (persist y sesión) |
| app/(tabs)/index.tsx | Ajustes de la pantalla principal |
| app/(tabs)/settings.tsx | Configuración del usuario |
| app/(tabs)/history.tsx | Ajustes de historial |
| app/(tabs)/contacts.tsx | Ajustes de contactos |
| app/bienvenida.tsx | Onboarding |
| app/permissions.tsx | Ajustes de permisos |
| app/contacts/[id].tsx | Edición de contacto |
| app/ubicacion/manual.tsx | Ubicación manual |
| src/services/__tests__/PaymentService.test.ts | setState en tests |

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| Clave de persistencia | 'safealert-settings' | string | Clave AsyncStorage del store | persist (línea 42) |
| userId | null inicial | string \| null | uid Firebase de la sesión | useContacts, AlertService, pantallas |
| isOnboarded | false | boolean | Indica si el onboarding está completo | Pantallas de onboarding |
| userName | '' | string | Nombre del usuario | Perfil/UI |
| userPhone | '' | string | Teléfono del usuario | Perfil/contactos |
| userSelfieUrl | null | string \| null | URL de la foto/selfie del usuario | Perfil/verificación |
| (heredados) AppSettings | DEFAULT_SETTINGS | objeto | Ajustes funcionales (triggerWords, messageTemplate, audioEnabled, hasSubscription, paymentOverdue, alertCountdownSeconds, wakeWordSensitivity, etc.) | Definidos en src/types/Settings |

[NOTA] No se documentan aquí los valores reales de `DEFAULT_SETTINGS` (definidos en
`src/types/Settings`, fuera del alcance de este análisis); este store los propaga y
persiste.

## Estructura (funciones / clases / tipos)

- Interfaz `SettingsState extends AppSettings` (líneas 6-20).
- Store `useSettingsStore` con `persist` (líneas 22-59).
  - Acciones: `updateSettings(patch)`, `setUserId`, `setOnboarded`, `setUserName`,
    `setUserPhone`, `setUserSelfieUrl`, `setHasSubscription`, `setPaymentOverdue`.

## Análisis línea por línea

**Bloque líneas 1-20 (imports e interfaz):**

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, DEFAULT_SETTINGS } from '../types/Settings';

interface SettingsState extends AppSettings {
  userId: string | null;
  isOnboarded: boolean;
  userName: string;
  userPhone: string;
  userSelfieUrl: string | null;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setUserId: (id: string) => void;
  setOnboarded: (value: boolean) => void;
  setUserName: (name: string) => void;
  setUserPhone: (phone: string) => void;
  setUserSelfieUrl: (url: string) => void;
  setHasSubscription: (value: boolean) => void;
  setPaymentOverdue: (value: boolean) => void;
}
```

**Explicación de las líneas 1-20:**
- **Líneas 1-4**: imports (Zustand, persistencia y tipos del dominio de Settings).
- **Línea 6**: la interfaz del estado EXTENDS `AppSettings`: hereda todos los ajustes
  funcionales del dominio (palabras de activación, plantilla, audio, suscripción,
  etc.) y les añade campos de perfil/sesión y acciones.
- **Líneas 7-11**: campos propios: `userId` (sesión), `isOnboarded`, `userName`,
  `userPhone`, `userSelfieUrl`.
- **Líneas 12-19**: acciones: un `updateSettings(patch)` genérico (parcial de
  AppSettings) y setters específicos por campo de perfil/estado de pago.

[OBSERVACIÓN TÉCNICA] No hay un setter genérico para los campos heredados además de
`updateSettings`; los setters específicos (`setHasSubscription`,
`setPaymentOverdue`) son azúcar para esos dos campos, mientras que el resto de
AppSettings se modifica vía `updateSettings` (p. ej.
`updateSettings({ guardModeEnabled })` en WakeWordService).

**Bloque líneas 22-59 (store con persistencia):**

```ts
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      userId: null,
      isOnboarded: false,
      userName: '',
      userPhone: '',
      userSelfieUrl: null,

      updateSettings: (patch) => set((state) => ({ ...state, ...patch })),
      setUserId: (userId) => set({ userId }),
      setOnboarded: (isOnboarded) => set({ isOnboarded }),
      setUserName: (userName) => set({ userName }),
      setUserPhone: (userPhone) => set({ userPhone }),
      setUserSelfieUrl: (userSelfieUrl) => set({ userSelfieUrl }),
      setHasSubscription: (hasSubscription) => set({ hasSubscription }),
      setPaymentOverdue: (paymentOverdue) => set({ paymentOverdue }),
    }),
    {
      name: 'safealert-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isOnboarded: state.isOnboarded,
        userName: state.userName,
        userPhone: state.userPhone,
        userSelfieUrl: state.userSelfieUrl,
        triggerWords: state.triggerWords,
        messageTemplate: state.messageTemplate,
        audioEnabled: state.audioEnabled,
        hasSubscription: state.hasSubscription,
        paymentOverdue: state.paymentOverdue,
        alertCountdownSeconds: state.alertCountdownSeconds,
        wakeWordSensitivity: state.wakeWordSensitivity,
      }),
    }
  )
);
```

**Explicación de las líneas 22-59:**
- **Línea 22**: creación tipada del store (doble invocación para middleware).
- **Líneas 23-24**: `persist(...)`.
- **Línea 25**: el estado inicial comienza con `...DEFAULT_SETTINGS` (todos los
  ajustes por defecto del dominio).
- **Líneas 26-30**: campos de perfil/sesión iniciales: userId null, onboarding
  incompleto, nombre/teléfono vacíos, selfie null.
- **Línea 32**: `updateSettings` hace merge parcial sobre todo el estado (`...state,
  ...patch`); es la vía genérica de actualización de ajustes.
- **Líneas 33-39**: setters específicos.
- **Líneas 41-56**: configuración de persistencia:
  - `name: 'safealert-settings'`: clave AsyncStorage.
  - `createJSONStorage(() => AsyncStorage)`.
  - `partialize`: lista blanca EXHAUSTIVA de campos persistidos: onboarding, perfil
    (nombre, teléfono, selfie URL), configuración funcional (palabras, plantilla,
    audio, suscripción, pago vencido, countdown, sensibilidad del wake word).
- **Líneas 57-58**: cierres.

[OBSERVACIÓN TÉCNICA] `userId` NO se persiste (no está en el partialize): se
considera dato de sesión, no de ajustes; `useContacts.resolveUserId` lo resincroniza
con Firebase cuando hace falta.

## Fichas de funciones y métodos

### updateSettings (línea 32)

- Firma: `updateSettings: (patch: Partial<AppSettings>) => void`
- Propósito: actualización genérica parcial de ajustes funcionales.
- Parámetros: patch parcial. Retorno: void.
- Efectos: merge sobre el estado (inmutable vía spread).
- Riesgos: bajo; al aceptar cualquier Partial<AppSettings> tipado, no hay validación
  de dominio en runtime (p. ej. rangos de sensibilidad) — la validación debe ocurrir
  antes de llamarla.

### Setters de perfil (setUserId, setOnboarded, setUserName, setUserPhone, setUserSelfieUrl)

- Propósito: mutaciones directas de perfil/sesión. Riesgos: `setUserId` acepta
  cualquier string sin validar formato de uid.

### setHasSubscription / setPaymentOverdue (líneas 38-39)

- Propósito: reflejar el estado de la suscripción de pago (usado por PaymentService y
  modales de pago/vencimiento).
- Riesgo: si estos flags se desincronizan del backend (pago confirmado pero flag
  false), la app podría restringir funciones; revisar flujo de sincronización en
  PaymentService.

## Clases / interfaces / tipos

### SettingsState (líneas 6-20)

- Responsabilidad: contrato del store (AppSettings heredados + perfil + acciones).
- Campos: ver tablas. Relaciones: `AppSettings`/`DEFAULT_SETTINGS` de
  `src/types/Settings`.
- Ciclo de vida: persistencia total del subconjunto listado en `partialize`; el resto
  (userId y acciones) no se persiste. La rehidratación ocurre en el arranque de
  Zustand persist.

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` `userSelfieUrl` (URL de una foto del usuario) SÍ se persiste
  en AsyncStorage en claro: dato personal sensible (imagen biométrica). Valoración en
  Seguridad.
- `[OBSERVACIÓN TÉCNICA]` `userId` no persiste: correcto para sesión, pero implica que
  tras reinstalar o cambiar de uid anónimo, el store conserva ajustes (onboarding,
  palabras) bajo un uid nuevo; depende de cómo `resolveUserId`/bootstrap decidan
  fusionar.
- `[OBSERVACIÓN TÉCNICA]` Los flags `hasSubscription`/`paymentOverdue` persistidos
  pueden quedar obsoletos respecto al backend (p. ej. suscripción vencida mientras la
  app estuvo cerrada); la app debe revalidar en boot (ver PaymentService).
- `[INFORMATIVO]` La lista blanca de persistencia mantiene fuera de disco datos no
  necesarios; buen equilibrio entre UX y privacidad.

## Seguridad

- `[MEDIO]` `userSelfieUrl` se persiste en claro en AsyncStorage. Si la URL apunta a
  un recurso privado de Storage (token firmado), su persistencia local puede alargar
  la validez del acceso; si es una URL pública, expone la imagen a cualquiera que
  conozca el enlace. [RECOMENDACIÓN] Revisar la política de Storage (URLs firmadas vs
  públicas) y considerar guardar la selfie en almacenamiento seguro.
- `[INFORMATIVO]` `userPhone` (número de teléfono personal) se persiste en claro en
  AsyncStorage: dato personal regulado (DAMMA/DAMA); el almacenamiento local en claro
  de la app móvil es habitual, pero debe declararse en la política de privacidad y
  cifrarse si el dispositivo es compartido.
- `[INFORMATIVO]` No se registran logs de datos personales en este archivo.
- `[INFORMATIVO]` Las reglas de sincronización con Firestore de estos campos (si se
  suben) quedan fuera de este archivo; auditar qué ajustes se replican al backend y
  bajo qué path.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Medio: persistencia de selfie y teléfono en claro. [RECOMENDACIÓN]
  Evaluar cifrado (p. ej. expo-secure-store para selfie/phone) o no persistir la
  selfie y recargarla desde el backend.
- `[RIESGO]` Bajo: desincronización de flags de pago al reabrir la app.
  [RECOMENDACIÓN] Revalidar `hasSubscription`/`paymentOverdue` contra el backend en
  cada arranque antes de mostrar restricciones.
- `[RECOMENDACIÓN]` Documentar el contrato de persistencia (partialize) para que
  futuros ajustes decidan conscientemente si deben persistirse.
