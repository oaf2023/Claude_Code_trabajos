# Archivo: src/services/AccountService.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/AccountService.ts | 82 | TypeScript 5.9 | 3418 | Servicio de autenticación (migración de cuenta anónima a email/contraseña) | FUNCIONALIDAD EXISTENTE (Android) / [POTENCIALMENTE NO UTILIZADO] | [NIVEL DE CERTEZA: Altamente probable] |

## Objetivo

Servicio de "cuenta recuperable": permite al usuario migrar su identidad anónima de Firebase Authentication a una cuenta con credenciales recuperables (email + contraseña) mediante `linkWithCredential`, además de ofrecer inicio de sesión con email, restablecimiento de contraseña y cierre de sesión. Usa exclusivamente la librería nativa `@react-native-firebase/auth` con carga dinámica (`require`) y está **restringido a Android**: en otras plataformas `getAuth()` devuelve `null` y las operaciones devuelven mensajes de no disponibilidad.

## Clasificación y estado

- `FUNCIONALIDAD EXISTENTE` en runtime Android (código implementado y funcional si se invoca).
- [POTENCIALMENTE NO UTILIZADO] — la búsqueda real con grep sobre todo el repositorio (patrones `AccountService`, `linkEmail`, `signInWithEmail`, `sendPasswordReset`, `signOut` combinados con los usos en pantallas) no encontró ningún importador del servicio en la app, el cliente web ni los tests: las únicas coincidencias están dentro del propio archivo.
- No se encontraron tests para este servicio. [NIVEL DE CERTEZA: Altamente probable]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `Platform` de `react-native` | estándar (externo) | `getAuth()` para decidir plataforma | Sí |
| `@react-native-firebase/auth` | externa (carga dinámica con `require`) | `getAuth()`, `EmailAuthProvider`, `signInWithEmailAndPassword`, `sendPasswordResetEmail`, `signOut` | Sí (Android) |

Nota: el módulo se importa con `require` dentro de funciones (carga perezosa/condicional) y no con `import` estático; el código usa `any` para el tipo de auth. [NIVEL DE CERTEZA: Confirmado por código]

## Componentes que dependen de este archivo

- No se encontraron componentes/pantallas que lo importen (grep en todo el proyecto). [NIVEL DE CERTEZA: Altamente probable]
- La gestión de sesión de la app se realiza a través de la capa `src/config/firebase.ts` (`ensureAuthenticated`, `auth()`), no de este servicio, lo que explica la ausencia de llamadores.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| Ninguna variable global/constante | — | — | El servicio es un objeto de métodos sin estado | — |

Valores mágicos/mensajes:
- `'auth/email-already-in-use'` (línea 43): código de error de Firebase que se traduce a mensaje amigable.
- Mensajes de usuario en español (líneas 34, 35, 41, 44, 45, 54, 57, 59, 69, 71). Significado confirmado por código.

## Estructura (funciones / clases / tipos)

- Función privada `getAuth(): any` (líneas 14–19).
- Objeto exportado `AccountService` (líneas 21–81):
  - `getCurrentUser()` (líneas 22–28).
  - `linkEmail(email, password)` (líneas 30–49).
  - `signInWithEmail(email, password)` (líneas 51–61).
  - `sendPasswordReset(email)` (líneas 63–73).
  - `signOut()` (líneas 75–81).

## Análisis línea por línea

**Bloque 1 (líneas 1–28): cabecera, imports, `getAuth` y `getCurrentUser`.**

```ts
/* ============================================================================
* Archivo         : AccountService.ts
* Descripción     : Servicio de cuenta recuperable. Permite migrar de identidad
*                   anónima a credenciales recuperables (email + contraseña).
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : AccountService.linkEmail(email, password)
* ============================================================================ */

import { Platform } from 'react-native';

function getAuth(): any {
  if (Platform.OS === 'android') {
    return require('@react-native-firebase/auth').default();
  }
  return null;
}

export const AccountService = {
  async getCurrentUser(): Promise<{ uid: string; isAnonymous: boolean; email: string | null } | null> {
    const auth = getAuth();
    if (!auth) return null;
    const user = auth.currentUser;
    if (!user) return null;
    return { uid: user.uid, isAnonymous: user.isAnonymous, email: user.email || null };
  },
```

**Explicación de las líneas 1–28:**
- **Líneas 1–10**: cabecera documental. Define el propósito: cuenta recuperable vía email + contraseña sobre identidad anónima.
- **Línea 12**: importa `Platform` de react-native.
- **Líneas 14–19**: `getAuth()` carga `@react-native-firebase/auth` solo en Android (evita fallos de arranque en iOS/web donde el paquete nativo no está inicializado) y devuelve `null` en el resto de plataformas.
- **Línea 21**: apertura del objeto exportado `AccountService`.
- **Líneas 22–28**: `getCurrentUser` devuelve un objeto reducido con `uid`, `isAnonymous` y `email` del usuario autenticado actual, o `null` si no hay sesión o no hay módulo nativo. [OBSERVACIÓN TÉCNICA] `auth.currentUser` se lee síncronamente; en Firebase el estado puede tardar en hidratarse, por lo que justo tras el arranque podría devolver `null`.

**Bloque 2 (líneas 30–49): `linkEmail`.**

```ts
  async linkEmail(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const auth = getAuth();
      const user = auth?.currentUser;
      if (!user) return { success: false, message: 'No hay sesión activa.' };
      if (!user.isAnonymous) return { success: false, message: 'La cuenta ya tiene credenciales.' };

      const { EmailAuthProvider } = require('@react-native-firebase/auth');
      const credential = EmailAuthProvider.credential(email, password);
      await user.linkWithCredential(credential);
      console.log('[Account] Cuenta vinculada con email:', email);
      return { success: true, message: 'Cuenta vinculada correctamente.' };
    } catch (error: any) {
      const msg = error?.code === 'auth/email-already-in-use'
        ? 'Este email ya está registrado. Iniciá sesión en lugar de vincular.'
        : error?.message || 'Error al vincular cuenta.';
      console.error('[Account] Error al vincular:', error?.code, msg);
      return { success: false, message: msg };
    }
  },
```

**Explicación de las líneas 30–49:**
- **Línea 30**: firma: `linkEmail(email, password)` devuelve `{ success, message }`.
- **Líneas 32–33**: obtiene el módulo auth y el usuario actual.
- **Línea 34**: sin sesión activa → error controlado.
- **Línea 35**: si la cuenta no es anónima (ya tiene credenciales) → error controlado.
- **Línea 37**: carga `EmailAuthProvider` dinámicamente.
- **Línea 38**: construye la credencial email/contraseña.
- **Línea 39**: `linkWithCredential` vincula la credencial a la cuenta anónima (la migra a cuenta recuperable conservando `uid` y datos asociados en Firestore).
- **Línea 40**: log con el email (ver Seguridad: PII en logs).
- **Línea 41**: retorno de éxito.
- **Líneas 42–47**: manejo de error: traduce `auth/email-already-in-use` a mensaje amigable; registra código y mensaje en consola.
- **Línea 48**: retorno de fallo con mensaje.

**Bloque 3 (líneas 51–81): `signInWithEmail`, `sendPasswordReset` y `signOut`.**

```ts
  async signInWithEmail(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const auth = getAuth();
      if (!auth) return { success: false, message: 'Autenticación no disponible.' };
      await auth.signInWithEmailAndPassword(email, password);
      console.log('[Account] Inicio de sesión exitoso:', email);
      return { success: true, message: 'Sesión iniciada.' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Error al iniciar sesión.' };
    }
  },

  async sendPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const auth = getAuth();
      if (!auth) return { success: false, message: 'Autenticación no disponible.' };
      await auth.sendPasswordResetEmail(email);
      console.log('[Account] Email de restablecimiento enviado a:', email);
      return { success: true, message: 'Revisá tu correo para restablecer la contraseña.' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Error al enviar email.' };
    }
  },

  async signOut(): Promise<void> {
    const auth = getAuth();
    if (auth) {
      await auth.signOut();
      console.log('[Account] Sesión cerrada.');
    }
  },
};
```

**Explicación de las líneas 51–81:**
- **Líneas 51–61**: `signInWithEmail` inicia sesión con email/contraseña. Sin módulo nativo devuelve error controlado; ante fallo devuelve el mensaje del error (que Firebase expone en inglés; no se traduce).
- **Líneas 63–73**: `sendPasswordReset` envía el correo de restablecimiento. Mismo patrón de guard y errores.
- **Líneas 75–81**: `signOut` cierra la sesión si hay módulo disponible; no devuelve estado (void). Si el `signOut` lanza, la excepción escapa sin capturar. [OBSERVACIÓN TÉCNICA]
- **Línea 82**: cierre del objeto `AccountService`.

## Fichas de funciones y métodos

### getAuth (líneas 14–19)
- Firma: `function getAuth(): any`.
- Propósito técnico: resolver la instancia de auth nativa solo en Android.
- Parámetros: ninguno.
- Retorno: instancia de auth de `@react-native-firebase/auth` o `null`.
- Dependencias: `Platform`, paquete nativo de auth.
- Efectos secundarios: carga del módulo nativo (require).
- Riesgos: uso de `any`; si se ejecutara en iOS/web con `@react-native-firebase/auth` instalado, la carga condicional evita el crash, pero el servicio queda inoperante fuera de Android.

### getCurrentUser (líneas 22–28)
- Firma: `async getCurrentUser(): Promise<{ uid: string; isAnonymous: boolean; email: string | null } | null>`.
- Propósito: exponer datos reducidos del usuario actual.
- Retorno: objeto o `null`.
- Dependencias: `getAuth`.
- Riesgos: lectura síncrona de `currentUser` que puede estar aún sin hidratar al iniciar la app.

### linkEmail (líneas 30–49)
- Firma: `async linkEmail(email: string, password: string): Promise<{ success: boolean; message: string }>`.
- Propósito técnico/funcional: vincular email+contraseña a la cuenta anónima actual (migración de identidad conservando el `uid`).
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| email | string | Email a vincular. |
| password | string | Contraseña. No se almacena localmente; se pasa al SDK nativo. |

- Retorno: `{ success, message }`.
- Excepciones: controladas internamente.
- Dependencias: `getAuth`, `EmailAuthProvider`, `linkWithCredential`.
- Flujo interno: verificar sesión → verificar anonimato → crear credencial → vincular → log/retorno.
- Desde dónde se llama: sin llamadores encontrados. [POTENCIALMENTE NO UTILIZADO]
- Efectos secundarios: migra la cuenta anónima a permanente (efecto irreversible en el tipo de cuenta).
- Riesgos: `linkWithCredential` puede fallar con códigos no contemplados (`auth/credential-already-in-use`, `auth/requires-recent-login` en cuentas antiguas), que se muestran crudos vía `error.message`.

### signInWithEmail (líneas 51–61)
- Firma: `async signInWithEmail(email: string, password: string): Promise<{ success: boolean; message: string }>`.
- Propósito: iniciar sesión con email/contraseña en sesiones ya migradas.
- Retorno: `{ success, message }`.
- Dependencias: `getAuth`, `signInWithEmailAndPassword`.
- Desde dónde se llama: sin llamadores encontrados. [POTENCIALMENTE NO UTILIZADO]
- Riesgos: mensajes de error en inglés sin traducir (menor calidad UX).

### sendPasswordReset (líneas 63–73)
- Firma: `async sendPasswordReset(email: string): Promise<{ success: boolean; message: string }>`.
- Propósito: enviar email de restablecimiento de contraseña.
- Retorno: `{ success, message }`.
- Dependencias: `getAuth`, `sendPasswordResetEmail`.
- Desde dónde se llama: sin llamadores encontrados. [POTENCIALMENTE NO UTILIZADO]
- Riesgos: loguea el email destino (PII).

### signOut (líneas 75–81)
- Firma: `async signOut(): Promise<void>`.
- Propósito: cerrar la sesión de Firebase.
- Retorno: `void`.
- Dependencias: `getAuth`, `signOut`.
- Desde dónde se llama: sin llamadores encontrados. [POTENCIALMENTE NO UTILIZADO]
- Riesgos: no captura errores de `signOut`.

## Clases / interfaces / tipos

- No define clases ni interfaces propias (tipos inline en las firmas). El servicio es un objeto plano de métodos.

## Observaciones técnicas

- [POTENCIALMENTE NO UTILIZADO] Sin importadores en todo el repositorio (grep). El flujo de autenticación de la app usa `ensureAuthenticated()`/`auth()` de `src/config/firebase.ts`; la funcionalidad de "vincular email a cuenta anónima" no aparece conectada a ninguna pantalla actual. [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] Restricción implícita a Android: `getAuth()` devuelve `null` fuera de Android, por lo que en iOS/web todos los métodos devuelven "Autenticación no disponible"/`null`. Si la app debe soportar cuenta recuperable en iOS/web, este servicio no cubre esa plataforma (la capa `firebase.ts` sí lo hace vía SDK modular). [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] Uso de `any` y de `require` condicional: reduce el chequeo de tipos y complica el tree-shaking; es un patrón deliberado para evitar inicializar el módulo nativo en plataformas no soportadas. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] `console.log` de emails (líneas 40, 56, 68): los correos de los usuarios quedan en los logs de la app (PII). [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] No hay tests para el servicio ni manejo de `auth/requires-recent-login`, un error típico al vincular credenciales en cuentas anónimas con sesión antigua. [NIVEL DE CERTEZA: Confirmado por código]

## Seguridad

- [MEDIO] Contraseña gestionada por el SDK nativo (no se persiste en el código), pero el servicio no aplica políticas locales (longitud, fortaleza); depende de la configuración de Firebase Authentication. [NIVEL DE CERTEZA: Confirmado por código]
- [MEDIO] Logs con emails de usuario (PII) en `console.log`: en producción con Sentry o LogCat podrían persistirse correos. [NIVEL DE CERTEZA: Confirmado por código]
- [INFORMATIVO] No se manejan tokens, claves ni secretos; no hay construcción de URLs ni SQL. [NIVEL DE CERTEZA: Confirmado por código]
- [INFORMATIVO] `linkWithCredential` sobre cuenta anónima conserva el `uid`, lo cual es el comportamiento deseado para no perder los datos Firestore asociados a la identidad anónima. [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Servicio sin conexión a UI: o bien integrarlo (pantalla de "hacer la cuenta recuperable") o marcarlo como candidato a eliminación para evitar código muerto. [RECOMENDACIÓN]
- [RIESGO] Si se desea soporte multiplataforma, migrar a la capa `auth()` de `src/config/firebase.ts` (ya abstrae Android/iOS/web) en lugar del acceso directo a `@react-native-firebase/auth`. [RECOMENDACIÓN]
- [RIESGO] Eliminar los logs con emails o enmascararlos antes de loguear. [RECOMENDACIÓN]
- [INFORMATIVO] Añadir tests y traducir mensajes de error de Firebase (p. ej. `auth/wrong-password`, `auth/user-not-found`) a español. [RECOMENDACIÓN]
