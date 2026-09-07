# Archivo: admin/src/pages/UsuarioDetalle.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/src/pages/UsuarioDetalle.tsx | 240 | TypeScript 5.9 / TSX (React 19) | 8939 | Pantalla de detalle de un usuario | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Pantalla de detalle de un usuario concreto (ruta `/usuarios/:usuarioId`, montada en `App.tsx`
línea 36). Alcanzada desde el listado de `Usuarios`. Muestra en cuatro bloques: (1) ficha del
usuario (datos de registro y suscripción, última ubicación y antigüedad); (2) historial de
ubicaciones (tabla con fecha de servidor, coordenadas, origen, precisión, permiso, dirección e IP);
(3) consentimientos (tipo de permiso, estado, versión de política, fecha); y (4) accesos técnicos
(fecha, IP, ruta consultada, dispositivo, SO y geolocalización de IP). Los datos se cargan en
paralelo con cuatro llamadas al backend Flask.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Importado únicamente desde `App.tsx`. Todos los endpoints consumidos
existen en el backend (`/admin/usuarios`, `/ubicaciones/usuario/<id>`,
`/consentimientos/usuario/<id>` y `/accesos/usuario/<id>`), verificados en `flask_app.py`
(líneas 1261, 1164, 1524 y 1540).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `useCallback`, `useEffect`, `useState` de `react` | externa | Líneas 31-66: estado y carga | Sí |
| `Link`, `useParams` de `react-router-dom` | externa | Líneas 31, 74: parámetro de ruta y vínculo "volver" | Sí |
| `fetchAccesos`, `fetchConsentimientos`, `fetchUbicacionesUsuario`, `fetchUsuarios`, `ApiError`, tipos `AccesoTecnico`, `Consentimiento`, `UbicacionMapa`, `UsuarioAdmin` de `../lib/api` | interna | Líneas 43-48 y tipado de estados | Sí |
| `antiguedad`, `formatearCoordenada`, `formatearDistancia`, `formatearFecha`, `iniciales` de `../lib/format` | interna | Líneas 80-230: formato de fechas/coordenadas | Sí |
| `BadgeConsentimiento`, `BadgeEstadoSuscripcion`, `BadgeOrigen` de `../components/Badges` | interna | Líneas 98, 118, 155, 190: insignias | Sí |
| `ErrorAlerta`, `Spinner` de `../components/Alerta` | interna | Líneas 68-70: estados | Sí |

## Componentes que dependen de este archivo

| Componente/archivo | Relación |
| --- | --- |
| `admin/src/App.tsx` | Lo importa (línea 18) y lo monta en la ruta `/usuarios/:usuarioId` |
| `admin/src/pages/Usuarios.tsx` | Navega a esta ruta con `navigate(\`/usuarios/${encodeURIComponent(u.device_id)}\`)` |

[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| (Límites embebidos) | `1` (usuarios), `100` (ubicaciones), `50` (accesos) | number | Tamaños de las consultas de detalle | Líneas 44-47 |
| Estado local | — | — | `usuario`, `ubicaciones`, `consentimientos`, `accesos`, `error`, `cargando` | Líneas 32-37 |

No hay constantes globales con nombre propio.

## Estructura (funciones / clases / tipos)

| Nombre | Tipo | Líneas |
| --- | --- | --- |
| `UsuarioDetalle` (exportada por defecto) | Componente de página | 30-240 |
| `cargar` | Callback de carga múltiple (`useCallback`, async) | 39-62 |

No hay clases ni interfaces propias; se consumen los tipos de `lib/api.ts` listados en
Dependencias.

## Análisis línea por línea

Bloque 1 (líneas 1-11) — Cabecera documental:

```tsx
/* ============================================================================
 * Archivo         : UsuarioDetalle.tsx
 * Descripción     : Detalle de un usuario: datos de registro y suscripción,
 *                   última ubicación, historial de ubicaciones (tabla),
 *                   consentimientos y accesos técnicos.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : Ruta /usuarios/:usuarioId
 * ========================================================================== */
```

**Explicación de las líneas 1-11:**

Cabecera del proyecto; describe el contenido de la pantalla.

Bloque 2 (líneas 13-28) — Importaciones:

```tsx
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchAccesos,
  fetchConsentimientos,
  fetchUbicacionesUsuario,
  fetchUsuarios,
  ApiError,
  type AccesoTecnico,
  type Consentimiento,
  type UbicacionMapa,
  type UsuarioAdmin,
} from "../lib/api";
import { antiguedad, formatearCoordenada, formatearDistancia, formatearFecha, iniciales } from "../lib/format";
import { BadgeConsentimiento, BadgeEstadoSuscripcion, BadgeOrigen } from "../components/Badges";
import { ErrorAlerta, Spinner } from "../components/Alerta";
```

**Explicación de las líneas 13-28:**

- **Línea 13**: hooks de React.
- **Línea 14**: `Link` (vínculo "volver") y `useParams` (leer `:usuarioId` de la URL).
- **Líneas 15-25**: funciones de la capa API para los cuatro conjuntos de datos y sus tipos.
- **Línea 26**: utilidades de formato (fechas, coordenadas, distancia, antigüedad, iniciales).
- **Línea 27**: insignias de estado de suscripción, consentimiento y origen.
- **Línea 28**: alerta de error y spinner.

Bloque 3 (líneas 30-66) — Estado, carga en paralelo y efecto:

```tsx
export default function UsuarioDetalle() {
  const { usuarioId = "" } = useParams();
  const [usuario, setUsuario] = useState<UsuarioAdmin | null>(null);
  const [ubicaciones, setUbicaciones] = useState<UbicacionMapa[]>([]);
  const [consentimientos, setConsentimientos] = useState<Consentimiento[]>([]);
  const [accesos, setAccesos] = useState<AccesoTecnico[]>([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [lista, ubics, consents, acc] = await Promise.all([
        fetchUsuarios({ busqueda: usuarioId, limite: 1 }),
        fetchUbicacionesUsuario(usuarioId, 100),
        fetchConsentimientos(usuarioId),
        fetchAccesos(usuarioId, 50),
      ]);
      setUsuario(lista.usuarios.find((u) => u.device_id === usuarioId) ?? null);
      setUbicaciones(ubics);
      setConsentimientos(consents);
      setAccesos(acc);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Sesión expirada. Volvé a ingresar.");
      } else {
        setError(err instanceof Error ? err.message : "Error al cargar el detalle del usuario.");
      }
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);
```

**Explicación de las líneas 30-66:**

- **Línea 31**: extrae `usuarioId` de la ruta; si falta, queda `""` (evita `undefined` en las URL).
- **Líneas 32-37**: estados: ficha del usuario (null = aún sin resolver), historiales de
  ubicaciones, consentimientos y accesos, mensaje de error y bandera de carga (inicialmente `true`
  para mostrar el spinner de inmediato).
- **Líneas 39-62**: `cargar` (memoizado y dependiente de `usuarioId`):
  - **Línea 43-48**: `Promise.all` de cuatro peticiones simultáneas:
    1. `fetchUsuarios({ busqueda: usuarioId, limite: 1 })` → `GET /api/v1/admin/usuarios?busqueda=…&limite=1`. Es la forma indirecta de obtener la ficha: no existe endpoint de "detalle de
       usuario" dedicado en el cliente.
    2. `fetchUbicacionesUsuario(usuarioId, 100)` → `GET /api/v1/ubicaciones/usuario/<id>?limite=100`
       (últimas 100 ubicaciones).
    3. `fetchConsentimientos(usuarioId)` → `GET /api/v1/consentimientos/usuario/<id>`.
    4. `fetchAccesos(usuarioId, 50)` → `GET /api/v1/accesos/usuario/<id>?limite=50`.
  - **Línea 49**: de la lista devuelta por la primera consulta, busca el registro cuyo
    `device_id` coincide exactamente con `usuarioId`; si no está, `usuario` queda `null` (la
    búsqueda `LIKE` del backend podría haber traído filas parecidas sin coincidencia exacta).
  - **Líneas 50-52**: almacena los tres historiales.
  - **Líneas 53-58**: manejo de errores; distingue 401 ("Sesión expirada. Volvé a ingresar.").
  - **Líneas 59-61**: `finally` desactiva la carga.
- **Líneas 64-66**: efecto que recarga al cambiar `cargar` (y por tanto `usuarioId`).

Bloque 4 (líneas 68-127) — Guardas de pantalla y ficha del usuario:

```tsx
  if (cargando) return <Spinner texto="Cargando detalle…" />;
  if (error) return <ErrorAlerta mensaje={error} />;
  if (!usuario) return <ErrorAlerta mensaje="Usuario no encontrado." />;

  return (
    <div className="stack">
      <Link to="/usuarios" className="volver">
        ← Volver a usuarios
      </Link>

      <div className="panel panel-usuario">
        <div className="celda-usuario grande">
          <span className="avatar avatar-grande">{iniciales(usuario.name)}</span>
          <div>
            <h2>{usuario.name}</h2>
            <p className="mono">{usuario.device_id}</p>
          </div>
        </div>
        <div className="grid-datos">
          <div>
            <span className="dato-titulo">Teléfono</span>
            <span>{usuario.phone || "—"}</span>
          </div>
          <div>
            <span className="dato-titulo">Registrado</span>
            <span>{formatearFecha(usuario.registered_at)}</span>
          </div>
          <div>
            <span className="dato-titulo">Suscripción</span>
            <span>
              <BadgeEstadoSuscripcion estado={usuario.subscription_status} />
              {usuario.plan_type && <small className="plan-tag">{usuario.plan_type}</small>}
            </span>
          </div>
          <div>
            <span className="dato-titulo">Vence</span>
            <span>{formatearFecha(usuario.subscription_expires_at)}</span>
          </div>
          <div>
            <span className="dato-titulo">Ubicaciones totales</span>
            <span>{usuario.total_ubicaciones.toLocaleString("es-AR")}</span>
          </div>
          <div>
            <span className="dato-titulo">Última ubicación</span>
            <span>
              {usuario.ultima_latitud != null ? (
                <>
                  <span className="mono">
                    {formatearCoordenada(usuario.ultima_latitud)}, {formatearCoordenada(usuario.ultima_longitud)}
                  </span>
                  <BadgeOrigen origen={usuario.ultimo_origen} />
                  <small>{antiguedad(usuario.ultima_fecha_hora)}</small>
                </>
              ) : (
                "sin datos"
              )}
            </span>
          </div>
        </div>
      </div>
```

**Explicación de las líneas 68-127:**

- **Líneas 68-70**: guardas de render: spinner durante la carga; alerta de error si falló la
  consulta; "Usuario no encontrado." si la ficha no se resolvió (usuario inexistente o `usuarioId`
  vacío).
- **Líneas 72-73**: contenedor de la página.
- **Líneas 74-76**: enlace "Volver a usuarios" (clase `volver`).
- **Líneas 78-127**: panel de ficha del usuario:
  - **Líneas 79-85**: cabecera con avatar grande (iniciales del nombre), nombre y `device_id`.
  - **Líneas 86-126**: rejilla de datos con seis pares etiqueta/valor: Teléfono, Registrado
    (fecha formateada), Suscripción (insignia + plan), Vence (fecha de expiración o "—"),
    Ubicaciones totales (formato es-AR) y Última ubicación (coordenadas a 6 decimales, insignia de
    origen y antigüedad relativa si existe; "sin datos" en caso contrario).
- [NOTA] `formatearFecha` recibe `subscription_expires_at`, que puede ser `null` → devuelve "—".

Bloque 5 (líneas 129-167) — Historial de ubicaciones:

```tsx
      <div className="panel">
        <h2 className="panel-title">Historial de ubicaciones ({ubicaciones.length})</h2>
        {ubicaciones.length === 0 ? (
          <p className="sin-datos">Sin ubicaciones registradas.</p>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha (servidor)</th>
                  <th>Coordenadas</th>
                  <th>Origen</th>
                  <th>Precisión</th>
                  <th>Permiso</th>
                  <th>Dirección</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {ubicaciones.map((u) => (
                  <tr key={u.id}>
                    <td>{formatearFecha(u.fecha_hora_servidor)}</td>
                    <td className="mono">
                      {u.latitud != null ? `${formatearCoordenada(u.latitud)}, ${formatearCoordenada(u.longitud)}` : "—"}
                    </td>
                    <td>
                      <BadgeOrigen origen={u.origen} />
                    </td>
                    <td>{formatearDistancia(u.precision_metros)}</td>
                    <td>{u.permiso_ubicacion ?? "—"}</td>
                    <td>{u.direccion_confirmada || u.direccion_estimada || "—"}</td>
                    <td className="mono">{u.ip ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
```

**Explicación de las líneas 129-167:**

- **Líneas 130**: título con el número de ubicaciones cargadas (máx. 100).
- **Líneas 131-133**: aviso "Sin ubicaciones registradas." si no hay datos.
- **Líneas 134-165**: tabla con siete columnas:
  - Fecha (servidor) formateada a hora local (línea 150).
  - Coordenadas a 6 decimales o "—" (líneas 151-153).
  - Origen con insignia (líneas 154-156).
  - Precisión con `formatearDistancia` ("150 m"/"1,25 km") (línea 157).
  - Estado del permiso de ubicación en crudo (GRANTED/DENIED/…) o "—" (línea 158).
  - Dirección: prioriza `direccion_confirmada`, luego `direccion_estimada`, o "—" (línea 159).
  - IP de la solicitud o "—" (línea 160).
- [NOTA] La tabla expone datos personales y de geolocalización exactos (IP + dirección +
  coordenadas) de los últimos 100 reportes del usuario (ver Seguridad).

Bloque 6 (líneas 169-237) — Consentimientos y accesos técnicos:

```tsx
      <div className="grid-2">
        <div className="panel">
          <h2 className="panel-title">Consentimientos ({consentimientos.length})</h2>
          {consentimientos.length === 0 ? (
            <p className="sin-datos">Sin consentimientos registrados.</p>
          ) : (
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Permiso</th>
                    <th>Estado</th>
                    <th>Versión política</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {consentimientos.map((c) => (
                    <tr key={c.id}>
                      <td>{c.tipo_permiso}</td>
                      <td>
                        <BadgeConsentimiento estado={c.estado} />
                      </td>
                      <td>{c.version_politica ?? "—"}</td>
                      <td>{formatearFecha(c.fecha_hora)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <h2 className="panel-title">Accesos técnicos ({accesos.length})</h2>
          {accesos.length === 0 ? (
            <p className="sin-datos">Sin accesos registrados.</p>
          ) : (
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>IP</th>
                    <th>Ruta</th>
                    <th>Dispositivo</th>
                    <th>SO</th>
                    <th>Ubicación IP</th>
                  </tr>
                </thead>
                <tbody>
                  {accesos.map((a) => (
                    <tr key={a.id}>
                      <td>{formatearFecha(a.fecha_hora)}</td>
                      <td className="mono">{a.ip ?? "—"}</td>
                      <td className="mono">{a.ruta_consultada ?? "—"}</td>
                      <td>{a.tipo_dispositivo ?? a.navegador_aproximado ?? "—"}</td>
                      <td>{a.sistema_operativo_aproximado ?? "—"}</td>
                      <td>
                        {[a.pais_ip, a.ciudad_ip].filter(Boolean).join(", ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Explicación de las líneas 169-240:**

- **Líneas 169-200**: panel "Consentimientos" (máx. los que devuelva el endpoint, sin límite
  explícito en esta llamada): tabla con Permiso (`tipo_permiso`), Estado (insignia traducida:
  OTORGADO/RECHAZADO/REVOCADO/NO_SOLICITADO), Versión política (o "—") y Fecha. Cada fila usa `id`
  como clave.
- **Líneas 202-236**: panel "Accesos técnicos" (máx. 50): tabla con Fecha, IP (mono), Ruta
  consultada (mono), Dispositivo (usa `tipo_dispositivo` o, en su defecto,
  `navegador_aproximado`), SO aproximado y Ubicación de IP (país + ciudad concatenados con coma o
  "—").
- **Líneas 237-240**: cierre de la rejilla, del contenedor y del componente.

## Fichas de funciones y métodos

### UsuarioDetalle (líneas 30-240)

- Firma (código original): `export default function UsuarioDetalle() { ... }`
- Propósito técnico y funcional: presentar la ficha y los historiales de un usuario a partir del
  parámetro de ruta `usuarioId`.
- Parámetros: ninguno (lee `useParams()`). Retorno: JSX. Excepciones: no lanza.
- Dependencias: `fetchUsuarios`, `fetchUbicacionesUsuario`, `fetchConsentimientos`,
  `fetchAccesos` y utilidades de formato/insignias.
- Desde dónde se llama: `App.tsx`, ruta `/usuarios/:usuarioId` (navegada desde `Usuarios.tsx`).
- Efectos secundarios: cuatro peticiones GET en paralelo por cada apertura/recarga.
- Riesgos: exposición de datos personales del usuario (ver Seguridad).

### cargar (líneas 39-62)

- Firma (código original): `const cargar = useCallback(async () => { ... }, [usuarioId]);`
- Propósito: descargar ficha y tres historiales en paralelo.
- Parámetros: ninguno. Retorno: `Promise<void>`. Excepciones: capturadas y guardadas en `error`.
- Dependencias: cuatro funciones de la capa API; invocada desde el efecto (líneas 64-66).
- Efectos secundarios: actualización de los cinco estados; `Promise.all` falla completo si una
  sola petición falla (si el usuario existe pero una consulta da error, no se muestra nada salvo el
  error).

## Clases / interfaces / tipos

| Tipo | Responsabilidad | Campos usados en esta pantalla |
| --- | --- | --- |
| `UsuarioAdmin` (`lib/api.ts` 13-32) | Ficha del usuario | `device_id`, `name`, `phone`, `registered_at`, `subscription_status`, `plan_type`, `subscription_expires_at`, `ultima_latitud`, `ultima_longitud`, `ultimo_origen`, `ultima_fecha_hora`, `total_ubicaciones` |
| `UbicacionMapa` (`lib/api.ts` 34-49) | Registro de ubicación | `id`, `fecha_hora_servidor`, `latitud`, `longitud`, `precision_metros`, `origen`, `permiso_ubicacion`, `ip`, `direccion_estimada`, `direccion_confirmada` |
| `Consentimiento` (`lib/api.ts` 51-57) | Registro de consentimiento | `id`, `tipo_permiso`, `estado`, `version_politica`, `fecha_hora` |
| `AccesoTecnico` (`lib/api.ts` 59-74) | Registro de acceso técnico | `id`, `fecha_hora`, `ip`, `ruta_consultada`, `tipo_dispositivo`, `navegador_aproximado`, `sistema_operativo_aproximado`, `pais_ip`, `ciudad_ip` |

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] La ficha del usuario se obtiene reutilizando `fetchUsuarios` con
  `busqueda: usuarioId` y luego filtrando con igualdad exacta (líneas 44 y 49): depende de que el
  `device_id` coincida literalmente y descarta coincidencias parciales. No existe un endpoint de
  detalle dedicado en la capa API. Impacto: ineficiencia menor (consulta `LIKE` sobre la tabla
  completa con subconsulta de última ubicación para traer 1 fila).
- [OBSERVACIÓN TÉCNICA] `Promise.all` hace que el fallo de cualquiera de las cuatro peticiones
  descarte todas las demás: si el historial de accesos falla, la ficha y las ubicaciones ya
  descargadas no se muestran.
- [OBSERVACIÓN TÉCNICA] La pantalla no refresca automáticamente (a diferencia de Dashboard); solo
  carga al montar/cambiar `usuarioId`.
- [NIVEL DE CERTEZA: Confirmado por código] La ruta recibe el identificador URL-codificado desde
  `Usuarios.tsx` (encodeURIComponent) y React Router lo decodifica antes de `useParams`.

## Seguridad

- [MEDIO] Exposición de datos personales y de geolocalización muy sensibles: coordenadas exactas
  (6 decimales), direcciones (estimada y confirmada), IPs de cada ubicación, teléfono y datos de
  accesos técnicos (user-agent derivado, país/ciudad de IP). Acceso controlado únicamente por la
  clave compartida `X-Admin-Key`; no hay roles ni registro de auditoría de quién consultó el
  detalle.
- [INFORMATIVO] Los datos salen por HTTPS hacia el backend configurado; el `device_id` viaja en la
  URL de la ruta (visible en historial del navegador del operador), no en query string de la API
  (la capa `request` lo codifica con `encodeURIComponent`).
- [BAJO] El mensaje "Usuario no encontrado." filtra la inexistencia del `device_id` (información
  mínima; el listado ya permite deducirla).
- [INFORMATIVO] No se observan secretos, tokens ni datos en claro adicionales en el código.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Datos de ubicación/IP/dirección sin capa adicional de protección: recomendación de
  auditoría de accesos del panel (quién, a quién, cuándo) y, si aplica, cifrado en reposo y
  minimización de columnas visibles (p. ej. ocultar dirección/IP tras interacción explícita).
- [RECOMENDACIÓN] Añadir un endpoint de detalle de usuario dedicado (`GET
  /api/v1/admin/usuarios/<device_id>`) para evitar la consulta `LIKE` con límite 1.
- [RECOMENDACIÓN] Gestionar los errores de forma independiente por sección (o reintentar) en lugar
  de un único `Promise.all` que descarta todo ante un fallo parcial.
- [INFORMATIVO] Considerar refresco periódico o manual del detalle si se usa como monitor en vivo.
