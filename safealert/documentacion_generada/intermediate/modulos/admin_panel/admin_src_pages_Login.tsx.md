# Archivo: admin/src/pages/Login.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/src/pages/Login.tsx | 93 | TypeScript 5.9 / TSX (React 19) | 3171 | Pantalla de autenticación del panel admin | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Pantalla pública de ingreso al panel (ruta `/login`, definida en `App.tsx` línea 31). Solicita la
clave de administrador (que el backend valida como encabezado `X-Admin-Key`) y la URL base del
backend. Para autenticar, guarda ambos valores en `localStorage` (vía `lib/api.ts`) y realiza una
petición de prueba contra `GET /api/v1/admin/stats`; solo si responde correctamente navega al
dashboard (`/`). Funciona como "puerta de entrada" del guardián `RequiereAuth` de `App.tsx`.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Se alcanza desde la ruta pública `/login` y por las redirecciones de
`RequiereAuth` cuando no existe clave. La validación real contra el backend está confirmada por el
código (llamada `fetchStats()`).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `useState` de `react` | externa | Líneas 19-22: estado del formulario | Sí |
| `useNavigate` de `react-router-dom` | externa | Línea 18, usada en 36: navegación a `/` tras éxito | Sí |
| `getBaseUrl`, `setAdminKey`, `setBaseUrl`, `fetchStats`, `ApiError` de `../lib/api` | interna | Líneas 15, 20, 33-44: gestión de clave/URL y validación | Sí |
| `React.FormEvent` | externa (tipo React) | Línea 24: tipo del evento del formulario | Sí |

## Componentes que dependen de este archivo

| Componente/archivo | Relación |
| --- | --- |
| `admin/src/App.tsx` | Lo importa (línea 15) y lo monta en la ruta pública `/login` |

[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `URL_DEFECTO` (literal embebido) | `"https://oaf.pythonanywhere.com"` | string | URL por defecto del backend (PythonAnywhere) usada cuando el campo queda vacío | Líneas 33, 63; también en `lib/api.ts` línea 137 |
| Clave de admin (valor) | `[SECRETO OCULTO]` | string | Se guarda en `localStorage` (clave `safealert_admin_key`) y se envía como `X-Admin-Key` | Líneas 34, 43; `lib/api.ts` |

Estado local del componente (useState): `clave` (línea 19), `url` (línea 20, inicializada con
`getBaseUrl()`), `error` (línea 21), `cargando` (línea 22).

## Estructura (funciones / clases / tipos)

| Nombre | Tipo | Líneas |
| --- | --- | --- |
| `Login` (exportada por defecto) | Componente de página | 17-93 |
| `ingresar` | Handler de envío del formulario (async) | 24-47 |

No hay clases ni interfaces/tipos propios.

## Análisis línea por línea

Bloque 1 (líneas 1-11) — Cabecera documental:

```tsx
/* ============================================================================
 * Archivo         : Login.tsx
 * Descripción     : Pantalla de ingreso al panel admin. Solicita la clave
 *                   X-Admin-Key y la URL base de la API; valida contra
 *                   GET /api/v1/admin/stats antes de permitir el acceso.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : Ruta /login
 * ========================================================================== */
```

**Explicación de las líneas 1-11:**

Cabecera del proyecto. Documenta el mecanismo de autenticación: solicitud de la clave
`X-Admin-Key` y validación contra `GET /api/v1/admin/stats` (endpoint protegido del backend Flask)
antes de dar acceso.

Bloque 2 (líneas 13-22) — Importaciones y estado:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBaseUrl, setAdminKey, setBaseUrl, fetchStats, ApiError } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [clave, setClave] = useState("");
  const [url, setUrl] = useState(getBaseUrl());
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
```

**Explicación de las líneas 13-22:**

- **Línea 13**: hook de estado para los campos del formulario.
- **Línea 14**: hook de navegación de React Router para redirigir tras autenticar.
- **Línea 15**: utilidades de la capa API: lectura/escritura de la URL base y de la clave
  (`localStorage`), llamada de validación `fetchStats()` y clase `ApiError` (que transporta el
  código HTTP del error).
- **Línea 17**: define el componente de página.
- **Línea 18**: instancia `navigate`.
- **Línea 19**: campo `clave` (la X-Admin-Key), inicialmente vacío.
- **Línea 20**: campo `url`, preinicializado con la URL ya guardada (o el valor de
  `import.meta.env.VITE_API_URL`, o la URL por defecto) para reutilizar la última configuración.
- **Líneas 21-22**: estado de error y de "cargando" para bloquear el botón durante la validación.

Bloque 3 (líneas 24-47) — Lógica de ingreso:

```tsx
  const ingresar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!clave.trim()) {
      setError("Ingresá la clave de administrador.");
      return;
    }
    setCargando(true);
    try {
      setBaseUrl(url.trim() || "https://oaf.pythonanywhere.com");
      setAdminKey(clave.trim());
      await fetchStats();
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Clave de administrador inválida.");
      } else {
        setError(err instanceof Error ? err.message : "No se pudo conectar con el backend.");
      }
      setAdminKey("");
    } finally {
      setCargando(false);
    }
  };
```

**Explicación de las líneas 24-47:**

- **Línea 24**: declara el handler asíncrono del evento de envío.
- **Línea 25**: evita la recarga de página por el envío nativo del formulario.
- **Línea 26**: limpia el error previo.
- **Líneas 27-30**: validación cliente: si la clave está vacía (o solo espacios), muestra el
  mensaje "Ingresá la clave de administrador." y aborta sin llamar al backend.
- **Línea 31**: marca el estado de carga (deshabilita el botón y cambia su texto a "Verificando…").
- **Línea 33**: persiste la URL base (con recorte de espacios) o la URL por defecto
  `https://oaf.pythonanywhere.com` si el campo quedó vacío.
- **Línea 34**: persiste la clave de administrador en `localStorage` (clave
  `safealert_admin_key`, valor `[SECRETO OCULTO]`). Se guarda ANTES de validar: si la validación
  falla se borra en el `catch` (línea 43).
- **Línea 35**: petición de validación `fetchStats()` → `GET /api/v1/admin/stats` con el
  encabezado `X-Admin-Key` recién guardado. Es el endpoint que responde 401 si la clave es
  inválida (decorador `require_admin_key` en `backend/flask_app.py` líneas 1414-1416).
- **Línea 36**: si la validación es exitosa, navega al dashboard.
- **Líneas 37-43**: gestión de errores:
  - **Líneas 38-40**: si el error es `ApiError` con `status === 401` muestra "Clave de
    administrador inválida." (la URL es válida pero la clave no).
  - **Líneas 41-42**: para el resto (red caída, 404, 429, 500, etc.) muestra el mensaje del error
    o un mensaje genérico "No se pudo conectar con el backend." (los 429 provienen de
    `lib/api.ts` como "Demasiadas solicitudes (rate limit)…").
  - **Línea 43**: ante cualquier fallo borra la clave guardada (`setAdminKey("")`); la URL se
    conserva para reintentar.
- **Líneas 44-46**: `finally` que termina el estado de carga.

Bloque 4 (líneas 49-92) — Interfaz del formulario:

```tsx
  return (
    <div className="login-page">
      <form className="login-card" onSubmit={ingresar}>
        <div className="login-logo">
          <span className="sidebar-logo-mark">S</span>
          <h1>SafeAlert Admin</h1>
          <p>Panel de administración de posicionamientos</p>
        </div>
        <label className="campo">
          <span>URL del backend</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://oaf.pythonanywhere.com"
            autoComplete="url"
          />
        </label>
        <label className="campo">
          <span>Clave de administrador</span>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="X-Admin-Key"
            autoComplete="current-password"
            autoFocus
          />
        </label>
        {error && (
          <div className="alerta-error" role="alert">
            {error}
          </div>
        )}
        <button className="btn btn-primary btn-block" type="submit" disabled={cargando}>
          {cargando ? "Verificando…" : "Ingresar"}
        </button>
        <p className="login-note">
          La clave se guarda solo en este navegador (localStorage) y se envía en el encabezado{" "}
          <code>X-Admin-Key</code>.
        </p>
      </form>
    </div>
  );
}
```

**Explicación de las líneas 49-92:**

- **Línea 50-51**: contenedor de la página y formulario que dispara `ingresar` al enviarse.
- **Líneas 52-56**: cabecera visual del login (marca "S", título "SafeAlert Admin" y subtítulo
  "Panel de administración de posicionamientos").
- **Líneas 57-66**: campo "URL del backend", con `type="url"` (validación nativa de formato URL) y
  `autoComplete="url"` para permitir al navegador sugerir valores.
- **Líneas 67-77**: campo "Clave de administrador", con `type="password"` (oculto), placeholder
  `X-Admin-Key`, `autoComplete="current-password"` y `autoFocus`.
- **Líneas 78-82**: alerta de error accesible con `role="alert"` cuando `error` tiene contenido.
- **Líneas 83-85**: botón de envío deshabilitado mientras `cargando`; texto "Verificando…" durante
  la validación e "Ingresar" en reposo.
- **Líneas 86-89**: nota informativa al usuario: la clave se guarda solo en este navegador
  (`localStorage`) y viaja en el encabezado `X-Admin-Key` (información coherente con la
  implementación de `lib/api.ts`).
- **Líneas 90-93**: cierres del JSX y del componente.

## Fichas de funciones y métodos

### Login (líneas 17-93)

- Firma (código original): `export default function Login() { ... }`
- Propósito técnico y funcional: renderiza el formulario de ingreso y coordina la validación de la
  clave de administrador contra el backend antes de navegar al panel.
- Parámetros: ninguno. Retorno: JSX. Excepciones: no lanza directamente (errores capturados en el
  handler).
- Dependencias: hooks de React/Router y funciones de `lib/api.ts`.
- Desde dónde se llama: `App.tsx` en la ruta `/login`.
- Efectos secundarios: escribe en `localStorage` la URL y la clave al intentar ingresar; borra la
  clave si la validación falla.
- Riesgos: ver sección Seguridad.

### ingresar (líneas 24-47)

- Firma (código original): `const ingresar = async (e: React.FormEvent) => { ... }`
- Propósito técnico: valida y autentica contra `GET /api/v1/admin/stats`.
- Propósito funcional: decidir si el usuario puede entrar al panel.
- Parámetros: `e: React.FormEvent` (evento de envío del formulario). Retorno: `Promise<void>`.
  Excepciones: maneja `ApiError` y `Error` genérico; no relanza.
- Dependencias: `setBaseUrl`, `setAdminKey`, `fetchStats`, `ApiError`, `navigate`.
- Flujo interno: prevenir recarga → limpiar error → validar clave no vacía → guardar URL/clave →
  `fetchStats()` → navegar a `/` → en fallo 401 mensaje específico, en otro fallo mensaje del
  error, borrar clave → finalizar carga.
- Desde dónde se llama: `onSubmit` del formulario (línea 51).
- Efectos secundarios: persistencia en `localStorage`, navegación, borrado de clave en fallo.
- Riesgos: envía la clave a cualquier URL que el usuario escriba (ver Seguridad).

## Clases / interfaces / tipos

No hay clases ni interfaces propias. Se consume `ApiError` (clase) y las utilidades de
`lib/api.ts` (documentadas en el módulo de dicha capa).

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] La clave se guarda en `localStorage` antes de la validación y solo se
  borra si `fetchStats()` falla; si el usuario cierra la pestaña durante la petición quedaría
  almacenada una clave no validada. Impacto: bajo (el guardián de `App.tsx` la consideraría válida
  y la primera llamada real devolvería 401).
- [OBSERVACIÓN TÉCNICA] `fetchStats()` no está protegida por rate limit en el backend
  (a diferencia de `pagos/simular` y `purga`), por lo que el login puede intentarse en bucle sin
  bloqueo por IP.
- [NIVEL DE CERTEZA: Confirmado por código] El endpoint de validación es `GET /api/v1/admin/stats`
  (cabecera del archivo, línea 5, y `fetchStats()` en `lib/api.ts` línea 234-236), no `/estado`.

## Seguridad

- [MEDIO] La clave de administrador viaja en `localStorage` en claro y se reenvía en cada petición
  como `X-Admin-Key`. Un XSS en el panel (o en el dominio servido) podría exfiltrarla. La nota
  visible (líneas 86-89) informa al usuario de esta práctica.
- [MEDIO] La URL del backend es libremente editable por el usuario: si un operador introduce una
  URL controlada por un atacante, la clave `[SECRETO OCULTO]` se enviaría a ese servidor. No hay
  lista blanca de dominios permitidos.
- [BAJO] La validación se hace por código de estado: un 200 de cualquier servidor que replique la
  API permitiría el acceso a esa instancia (comportamiento esperado de multi-backend, pero
  conviene registrarlo).
- [INFORMATIVO] No se registra el intento de login en logs del backend (no hay endpoint de
  auditoría de acceso al panel); tampoco hay bloqueo por intentos fallidos.
- [INFORMATIVO] No se observan secretos impresos a consola ni en textos.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Almacenamiento de la clave en `localStorage` sin cifrado y reenvío automático en todas
  las llamadas: recomendación de evaluar sesión con cookie HttpOnly o token de corta duración y
  renovación.
- [RECOMENDACIÓN] Restringir la URL del backend a una lista de orígenes conocidos o, al menos,
  avisar visualmente cuando la URL no sea la oficial.
- [RECOMENDACIÓN] Considerar reintentos con espera ante 429 y mensajes de error diferenciados para
  red caída (hoy el `ApiError` con status 0 ya produce "Sin conexión con el servidor", que se
  muestra tal cual).
- [INFORMATIVO] Valores por defecto y placeholders contienen la URL de producción
  `https://oaf.pythonanywhere.com` en tres lugares (líneas 33, 63 y `lib/api.ts` línea 137);
  mantenerlos sincronizados si cambia el despliegue.
