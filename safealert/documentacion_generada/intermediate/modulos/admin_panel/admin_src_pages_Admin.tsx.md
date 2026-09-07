# Archivo: admin/src/pages/Admin.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/src/pages/Admin.tsx | 185 | TypeScript 5.9 / TSX (React 19) | 7267 | Pantalla de administración del sistema | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Pantalla de administración técnica del panel (ruta `/admin`, montada en `App.tsx` línea 38).
Agrupa tres funciones: (1) consulta y visualización del estado del backend (`GET /api/v1/estado`):
salud de la base de datos, conteos de registros, IP pública del servidor, versión de la API y
política de retención; (2) ejecución manual de la purga de retención (`POST /api/v1/admin/purga`)
con doble confirmación en la interfaz, que elimina registros antiguos según la política configurada
en el backend; y (3) edición de la configuración de conexión (URL del backend y clave de
administrador) persistida en `localStorage`. Complementa al botón "Salir" del `Layout`, ya que aquí
también puede reemplazarse la clave sin pasar por el login.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Importado únicamente desde `App.tsx`. Sus tres bloques funcionales se
corresponden con endpoints reales del backend (`/estado` y `/admin/purga`), verificados en
`backend/flask_app.py` (líneas 1499-1518 y 1577-1583).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `useCallback`, `useEffect`, `useState` de `react` | externa | Líneas 18-25: estado y carga inicial | Sí |
| `fetchEstado`, `purgarDatos`, `setAdminKey`, `setBaseUrl`, `getAdminKey`, `getBaseUrl`, `type EstadoSistema` de `../lib/api` | interna | Líneas 18-67 y 166-182: lectura/escritura de configuración y purga | Sí |
| `ErrorAlerta`, `Spinner` de `../components/Alerta` | interna | Líneas 71, 76, 123: estados de error/carga | Sí |
| `React.FormEvent` | externa (tipo) | Línea 38: tipo del evento del formulario de configuración | Sí |

## Componentes que dependen de este archivo

| Componente/archivo | Relación |
| --- | --- |
| `admin/src/App.tsx` | Lo importa (línea 20) y lo monta en la ruta `/admin` (dentro de `RequiereAuth` y `Layout`) |

[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| (Estado local) `estado`, `error`, `confirmandoPurga`, `purgando`, `resultadoPurga`, `url`, `clave`, `guardado` | — | varios | Control de la pantalla | Líneas 18-25 |
| URL por defecto (literal) | `"https://oaf.pythonanywhere.com"` | string | Respaldo si el campo URL queda vacío | Línea 41 |
| Clave de administrador | `[SECRETO OCULTO]` | string | Se pre-carga desde `getAdminKey()` en el campo y se persiste con `setAdminKey()` | Líneas 24, 42, 175 |

## Estructura (funciones / clases / tipos)

| Nombre | Tipo | Líneas |
| --- | --- | --- |
| `Admin` (exportada por defecto) | Componente de página | 17-185 |
| `cargar` | Callback de consulta de estado (`useCallback`) | 27-32 |
| `guardarConfig` | Handler de guardado de configuración | 38-48 |
| `ejecutarPurga` | Handler de purga (async) | 50-67 |

No hay clases ni interfaces propias; se consume `EstadoSistema` de `lib/api.ts`.

## Análisis línea por línea

Bloque 1 (líneas 1-11) — Cabecera documental:

```tsx
/* ============================================================================
 * Archivo         : Admin.tsx
 * Descripción     : Pantalla de administración: estado del backend (health
 *                   check), política de retención, purga manual con
 *                   confirmación, y configuración de URL/key del API.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : Ruta /admin
 * ========================================================================== */
```

**Explicación de las líneas 1-11:**

Cabecera del proyecto; documenta el alcance de la pantalla (health check, retención, purga manual y
configuración de conexión).

Bloque 2 (líneas 13-25) — Importaciones y estado:

```tsx
import { useCallback, useEffect, useState } from "react";
import { fetchEstado, purgarDatos, setAdminKey, setBaseUrl, getAdminKey, getBaseUrl, type EstadoSistema } from "../lib/api";
import { ErrorAlerta, Spinner } from "../components/Alerta";

export default function Admin() {
  const [estado, setEstado] = useState<EstadoSistema | null>(null);
  const [error, setError] = useState("");
  const [confirmandoPurga, setConfirmandoPurga] = useState(false);
  const [purgando, setPurgando] = useState(false);
  const [resultadoPurga, setResultadoPurga] = useState("");
  const [url, setUrl] = useState(getBaseUrl());
  const [clave, setClave] = useState(getAdminKey());
  const [guardado, setGuardado] = useState("");
```

**Explicación de las líneas 13-25:**

- **Líneas 13-15**: hooks y utilidades de la capa API. Nota: `purgarDatos()` (POST
  `/admin/purga`), `getAdminKey`/`setAdminKey` (clave en `localStorage`) y `getBaseUrl`/`setBaseUrl`
  (URL en `localStorage`).
- **Línea 17**: define el componente de página.
- **Línea 18**: `estado` tipado con `EstadoSistema` (respuesta de `/estado`); `null` = cargando.
- **Línea 19**: error global de la pantalla.
- **Línea 20**: `confirmandoPurga` — controla la etapa de confirmación destructiva.
- **Línea 21**: `purgando` — deshabilita botones durante la operación.
- **Línea 22**: `resultadoPurga` — mensaje de resultado tras purgar.
- **Líneas 23-24**: campos del formulario de configuración precargados con los valores actuales de
  `localStorage` (URL y clave). [NOTA] La clave real queda precargada en el input (ver Seguridad).
- **Línea 25**: `guardado` — mensaje de confirmación temporal de guardado.

Bloque 3 (líneas 27-48) — Carga inicial y guardado de configuración:

```tsx
  const cargar = useCallback(() => {
    setError("");
    fetchEstado()
      .then(setEstado)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al consultar el estado."));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardarConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBaseUrl(url.trim() || "https://oaf.pythonanywhere.com");
      setAdminKey(clave.trim());
      setGuardado("Configuración guardada.");
      window.setTimeout(() => setGuardado(""), 3000);
    } catch {
      setError("No se pudo guardar la configuración.");
    }
  };
```

**Explicación de las líneas 27-48:**

- **Líneas 27-32**: `cargar` (memoizado): limpia el error y consulta `fetchEstado()` (→ `GET
  /api/v1/estado`). En fallo, muestra el mensaje de la excepción o uno genérico. No distingue 401
  con un mensaje específico (a diferencia de otras páginas), aunque la clave se envía igualmente si
  existe. [NOTA] El endpoint `/estado` del backend NO exige `X-Admin-Key` (ver Seguridad).
- **Líneas 34-36**: efecto de montaje que ejecuta `cargar()` una vez (sin auto-refresco en esta
  pantalla; el botón "Actualizar estado" de la línea 115 permite recargar manualmente).
- **Líneas 38-48**: `guardarConfig`, handler del formulario:
  - **Línea 39**: evita la recarga de página.
  - **Líneas 40-42**: persiste la URL recortada (o la URL por defecto si quedó vacía) y la clave
    recortada en `localStorage` vía `setBaseUrl`/`setAdminKey`.
  - **Línea 43**: mensaje "Configuración guardada."
  - **Línea 44**: programa el borrado del mensaje a los 3 s.
  - **Líneas 45-47**: el `catch` nunca llegará a ejecutarse porque `setBaseUrl`/`setAdminKey`
    (`localStorage.setItem`) no lanzan en condiciones normales; es código defensivo inerte.
    [OBSERVACIÓN TÉCNICA] Guardar aquí NO valida la clave contra el backend: si se guarda una clave
    incorrecta, las siguientes pantallas fallarán con 401.

Bloque 4 (líneas 50-67) — Ejecución de la purga:

```tsx
  const ejecutarPurga = async () => {
    setPurgando(true);
    setResultadoPurga("");
    try {
      const res = await purgarDatos();
      const elim = res.eliminados;
      setResultadoPurga(
        `Purga completada: ${elim.accesos ?? 0} accesos, ${elim.ubicaciones ?? 0} ubicaciones, ${elim.consentimientos ?? 0} consentimientos.`
      );
      cargar();
    } catch (err) {
      setResultadoPurga("");
      setError(err instanceof Error ? err.message : "Error al ejecutar la purga.");
    } finally {
      setPurgando(false);
      setConfirmandoPurga(false);
    }
  };
```

**Explicación de las líneas 50-67:**

- **Línea 50**: handler asíncrono de la purga manual.
- **Línea 51**: marca `purgando` (deshabilita botones).
- **Línea 52**: limpia el resultado anterior.
- **Líneas 53-59**: llama a `purgarDatos()` (→ `POST /api/v1/admin/purga`, que ejecuta la función
  `ejecutar_purga_retencion` del backend: borra de `accesos_tecnicos`, `ubicaciones_usuario` y
  `consentimientos_usuario` los registros anteriores a la política: 90/365/365 días por defecto).
  Construye el mensaje de resultado con los contadores devueltos (`eliminados.accesos`,
  `.ubicaciones`, `.consentimientos`) y refresca el estado con `cargar()`.
- **Líneas 60-62**: en fallo limpia el resultado y muestra el mensaje del error (incluye 401/429
  convertidos por `lib/api.ts`).
- **Líneas 63-66**: `finally`: desactiva `purgando` y sale de la fase de confirmación.
- [NOTA] No hay reintento ni mecanismo de "deshacer": la purga es destructiva y definitiva (el
  texto de la interfaz lo advierte, línea 151).

Bloque 5 (líneas 69-118) — Panel de estado del backend:

```tsx
  return (
    <div className="stack">
      {error && <ErrorAlerta mensaje={error} />}

      <div className="panel">
        <h2 className="panel-title">Estado del backend</h2>
        {!estado ? (
          <Spinner texto="Consultando estado…" />
        ) : (
          <div className="grid-datos">
            <div>
              <span className="dato-titulo">Estado</span>
              <span>
                <span className={`badge ${estado.status === "ok" ? "badge-ok" : "badge-err"}`}>
                  {estado.status === "ok" ? "Operativo" : estado.status}
                </span>
              </span>
            </div>
            <div>
              <span className="dato-titulo">Base de datos</span>
              <span>{estado.base_datos.conectada ? "Conectada" : "Sin conexión"}</span>
            </div>
            <div>
              <span className="dato-titulo">Registros en BD</span>
              <span>
                {estado.base_datos.ubicaciones.toLocaleString("es-AR")} ubicaciones ·{" "}
                {estado.base_datos.accesos.toLocaleString("es-AR")} accesos ·{" "}
                {estado.base_datos.consentimientos.toLocaleString("es-AR")} consentimientos
              </span>
            </div>
            <div>
              <span className="dato-titulo">Servidor</span>
              <span>
                IP pública {estado.servidor.ip_publica || "—"} · Geo: {estado.servidor.proveedor_geo}
              </span>
            </div>
            <div>
              <span className="dato-titulo">Versión API</span>
              <span>{estado.version_api}</span>
            </div>
            <div>
              <span className="dato-titulo">Última consulta</span>
              <span>{new Date(estado.timestamp.endsWith("Z") ? estado.timestamp : `${estado.timestamp}Z`).toLocaleString("es-AR")}</span>
            </div>
          </div>
        )}
        <button className="btn btn-ghost" onClick={cargar} disabled={!estado}>
          Actualizar estado
        </button>
      </div>
```

**Explicación de las líneas 69-118:**

- **Líneas 70-71**: contenedor y alerta de error global (arriba de todo).
- **Líneas 73-118**: panel "Estado del backend":
  - **Líneas 75-77**: spinner "Consultando estado…" mientras no llega la respuesta.
  - **Líneas 78-113**: rejilla `grid-datos` con: estado (badge "Operativo"/valor crudo según
    `estado.status === "ok"`), conexión de BD, conteos de ubicaciones/accesos/consentimientos con
    formato es-AR, IP pública del servidor y proveedor de geolocalización, versión de la API
    (`estado.version_api`) y timestamp de la última consulta (se anexa "Z" si el backend no lo
    envía, para tratarlo como UTC).
  - **Líneas 115-117**: botón "Actualizar estado" (re-ejecuta `cargar()`); deshabilitado mientras
    no exista la primera respuesta.
- [NOTA] El conteo de la base de datos duplica información que ya muestra el encabezado del
  `Layout` (que también consulta `/estado` cada 60 s).

Bloque 6 (líneas 120-164) — Panel de política de retención y purga con confirmación:

```tsx
      <div className="panel">
        <h2 className="panel-title">Política de retención</h2>
        {!estado ? (
          <Spinner texto="Consultando retención…" />
        ) : (
          <div className="grid-datos">
            <div>
              <span className="dato-titulo">Accesos técnicos</span>
              <span>{estado.retencion.accesos_dias} días</span>
            </div>
            <div>
              <span className="dato-titulo">Ubicaciones</span>
              <span>{estado.retencion.ubicaciones_dias} días</span>
            </div>
            <div>
              <span className="dato-titulo">Consentimientos</span>
              <span>{estado.retencion.consentimientos_dias} días</span>
            </div>
            <div>
              <span className="dato-titulo">Logs</span>
              <span>{estado.retencion.logs_dias} días</span>
            </div>
          </div>
        )}
        <div className="fila-accion">
          {!confirmandoPurga ? (
            <button className="btn btn-peligro" onClick={() => setConfirmandoPurga(true)}>
              Ejecutar purga de retención
            </button>
          ) : (
            <div className="confirmar-purga">
              <span>¿Eliminar registros anteriores a la retención? Esta acción no se puede deshacer.</span>
              <div>
                <button className="btn btn-peligro" onClick={ejecutarPurga} disabled={purgando}>
                  {purgando ? "Purgando…" : "Sí, purgar"}
                </button>
                <button className="btn btn-ghost" onClick={() => setConfirmandoPurga(false)} disabled={purgando}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
          {resultadoPurga && <p className="ok-msg">{resultadoPurga}</p>}
        </div>
      </div>
```

**Explicación de las líneas 120-164:**

- **Líneas 121-143**: panel "Política de retención" con los días configurados para accesos
  técnicos, ubicaciones, consentimientos y logs (devueltos por `/estado` desde las variables de
  entorno del backend `RETENCION_*_DIAS`).
- **Líneas 144-163**: zona de acción de la purga:
  - **Líneas 145-148**: estado inicial: botón rojo "Ejecutar purga de retención" que activa la
    confirmación.
  - **Líneas 149-161**: estado de confirmación: texto "¿Eliminar registros anteriores a la
    retención? Esta acción no se puede deshacer." con botón "Sí, purgar" (deshabilitado mientras
    `purgando`, texto "Purgando…") y botón "Cancelar".
  - **Línea 162**: mensaje de resultado (verde `ok-msg`) cuando la purga terminó.
- [NOTA] La confirmación es únicamente en la interfaz; el backend ejecuta la purga sin
  confirmación adicional. El botón de purga queda visible para cualquier operador con la clave.

Bloque 7 (líneas 166-185) — Panel de configuración de conexión:

```tsx
      <div className="panel">
        <h2 className="panel-title">Configuración de conexión</h2>
        <form className="form-config" onSubmit={guardarConfig}>
          <label className="campo">
            <span>URL del backend</span>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://oaf.pythonanywhere.com" />
          </label>
          <label className="campo">
            <span>Clave de administrador</span>
            <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="X-Admin-Key" autoComplete="off" />
          </label>
          <button className="btn btn-primary" type="submit">
            Guardar
          </button>
          {guardado && <p className="ok-msg">{guardado}</p>}
        </form>
      </div>
    </div>
  );
}
```

**Explicación de las líneas 166-185:**

- **Líneas 166-182**: panel "Configuración de conexión":
  - **Líneas 169-172**: campo "URL del backend" (`type="url"`) con el valor precargado.
  - **Líneas 173-176**: campo "Clave de administrador" (`type="password"`, `autoComplete="off"`)
    precargado con la clave actual en claro dentro del DOM (oculto visualmente por el tipo
    password).
  - **Líneas 177-179**: botón "Guardar" que dispara `guardarConfig`.
  - **Línea 180**: mensaje "Configuración guardada." temporal (3 s).
- **Líneas 183-185**: cierre del contenedor y del componente.

## Fichas de funciones y métodos

### Admin (líneas 17-185)

- Firma (código original): `export default function Admin() { ... }`
- Propósito técnico y funcional: pantalla de administración (health, retención, purga,
  configuración de conexión).
- Parámetros: ninguno. Retorno: JSX. Excepciones: no lanza.
- Dependencias: `fetchEstado`, `purgarDatos`, `getBaseUrl`, `setBaseUrl`, `getAdminKey`,
  `setAdminKey`, `ErrorAlerta`, `Spinner`.
- Desde dónde se llama: `App.tsx`, ruta `/admin`.
- Efectos secundarios: escribe `localStorage` al guardar configuración; ejecuta borrados masivos en
  el backend al purgar.
- Riesgos: ver Seguridad y Riesgos.

### cargar (líneas 27-32)

- Firma (código original): `const cargar = useCallback(() => { ... }, []);`
- Propósito: consultar el estado del sistema (`GET /api/v1/estado`).
- Parámetros: ninguno. Retorno: `void`. Excepciones: capturadas y volcadas a `error`.
- Dependencias: `fetchEstado`. Se invoca en el montaje (líneas 34-36) y desde el botón "Actualizar
  estado" (línea 115) y tras la purga (línea 59).

### guardarConfig (líneas 38-48)

- Firma (código original): `const guardarConfig = (e: React.FormEvent) => { ... }`
- Propósito: persistir URL y clave en `localStorage` (sin validar contra el backend).
- Parámetros: evento de formulario. Retorno: `void`. Excepciones: `catch` inerte (ver
  Observaciones).
- Efectos secundarios: `localStorage.setItem` (x2) y temporizador de 3 s para el mensaje.

### ejecutarPurga (líneas 50-67)

- Firma (código original): `const ejecutarPurga = async () => { ... }`
- Propósito: invocar `POST /api/v1/admin/purga` y mostrar los contadores de eliminados.
- Parámetros: ninguno. Retorno: `Promise<void>`. Excepciones: capturadas en estado `error`.
- Dependencias: `purgarDatos`, `cargar`.
- Efectos secundarios: borrado irreversible de registros históricos en el backend (accesos,
  ubicaciones y consentimientos anteriores a la política de retención).

## Clases / interfaces / tipos

| Tipo | Responsabilidad | Campos principales |
| --- | --- | --- |
| `EstadoSistema` (definida en `lib/api.ts` líneas 99-116, consumida aquí) | Tipa la respuesta de `GET /api/v1/estado` | `status`, `timestamp`, `base_datos` (conectada, ubicaciones, accesos, consentimientos), `servidor` (ip_publica, proveedor_geo), `retencion` (accesos_dias, ubicaciones_dias, consentimientos_dias, logs_dias), `version_api` |

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] `guardarConfig` no valida la nueva clave contra el backend; además su
  bloque `try/catch` (líneas 40-47) es inerte porque `setBaseUrl`/`setAdminKey` no lanzan
  excepciones en condiciones normales. Impacto: configurar una clave errónea deja el panel en
  estado de 401 hasta corregirla manualmente.
- [OBSERVACIÓN TÉCNICA] La clave real se precarga en el campo de tipo password (línea 24 con
  `getAdminKey()` y línea 175 con `value={clave}`). Aunque el navegador la oculta, queda accesible
  en el DOM y en la memoria del input. Impacto: cualquier extensión o script del navegador con
  acceso al DOM puede leerla.
- [OBSERVACIÓN TÉCNICA] El botón "Ejecutar purga de retención" aparece también con la clave
  inválida (si la sesión caducó): la confirmación se muestra pero el backend rechazará con 401.
- [NIVEL DE CERTEZA: Confirmado por código] El endpoint `/api/v1/estado` no está decorado con
  `require_admin_key` en `backend/flask_app.py` (línea 1499-1500); por tanto esta pantalla y el
  `Layout` consultan un recurso accesible sin clave de administrador.

## Seguridad

- [MEDIO] `GET /api/v1/estado` es consultable sin `X-Admin-Key` (backend). Expone información
  operativa: conteos de tablas, IP pública del servidor, proveedor de geolocalización, versión de
  API y política de retención. No expone datos personales, pero es información interna que debería
  protegerse (o al menos no usarse como fuente exclusiva de salud).
- [ALTO] `POST /api/v1/admin/purga` elimina de forma masiva e irreversible registros históricos
  (accesos, ubicaciones, consentimientos). La protección es la clave compartida `X-Admin-Key`; un
  compromiso de la clave (localStorage, XSS) permitiría destruir datos con una única petición
  (mitigado parcialmente por el rate limit `purga:{ip}` del backend y por la doble confirmación en
  la UI, que no es exigida por el backend).
- [MEDIO] La clave `[SECRETO OCULTO]` se muestra precargada en el formulario y se persiste en
  `localStorage` sin cifrar (misma exposición que en Login; el panel además permite sobrescribirla
  en cualquier momento).
- [INFORMATIVO] No hay auditoría en la interfaz de quién ejecutó la purga ni cuándo; el backend
  solo registra el evento en `logger.info` (líneas 1573-1574 de `flask_app.py`).
- [BAJO] La consulta de estado se repite cada 60 s en el `Layout` (otro archivo) y a demanda aquí;
  duplicación menor de tráfico contra un endpoint no protegido.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Operación destructiva con protección insuficiente: recomendar proteger `/api/v1/estado`
  con la clave admin y exigir la clave nuevamente (re-ingreso) en la interfaz antes de purgar.
- [RECOMENDACIÓN] Registrar auditoría de purga (usuario/fecha/orígenes) y permitir confirmación
  por backend (p. ej. campo `confirmar: true`).
- [RECOMENDACIÓN] No precargar la clave en el input; pedirla solo al cambiar (placeholder
  "dejar vacío para conservar la actual").
- [RECOMENDACIÓN] Añadir validación de la configuración guardada (llamada de prueba como en Login)
  antes de dar por buena la clave.
