# Archivo: admin/src/pages/PagoSimulado.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/src/pages/PagoSimulado.tsx | 284 | TypeScript 5.9 / TSX (React 19) | 10181 | Pantalla de generación de pagos simulados (pruebas) | FUNCIONALIDAD EXISTENTE (herramienta de pruebas) | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Pantalla de pruebas del panel (ruta `/pagos-simulados`, montada en `App.tsx` línea 37). Permite
buscar usuarios por dirección MAC (vía el mismo endpoint de listado del admin), seleccionar uno y
generar un "pago simulado" que activa su suscripción sin cobro real. Envía `POST
/api/v1/admin/pagos/simular` con el `device_id`, el tipo de plan (mensual/anual) y, opcionalmente,
una duración en días; el backend activa la suscripción del usuario, registra el evento de pago
simulado en `payment_events` y crea un ticket correlativo en `tickets`. No interviene Mercado Pago
ni ninguna pasarela de cobro. Muestra el ticket generado (número, fecha, plan y monto) y el nuevo
estado de la suscripción.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Importado únicamente desde `App.tsx`. Backend verificado en
`flask_app.py` líneas 1323-1407 (`admin_pago_simulado`): actualiza `users`, inserta en
`payment_events` con `event_type='admin_simulated'` y en `tickets`, sin llamadas a Mercado Pago.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `useCallback`, `useEffect`, `useState` de `react` | externa | Líneas 30-72: estado y selección automática | Sí |
| `fetchUsuarios`, `simularPago`, `ApiError`, `type ResultadoPagoSimulado`, `type UsuarioAdmin` de `../lib/api` | interna | Líneas 42-105: búsqueda por MAC y generación | Sí |
| `formatearFecha`, `iniciales` de `../lib/format` | interna | Líneas 167, 211, 276: formato | Sí |
| `BadgeEstadoSuscripcion` de `../components/Badges` | interna | Líneas 174, 206, 271: estado de suscripción | Sí |
| `ErrorAlerta` de `../components/Alerta` | interna | Línea 144: errores | Sí |
| Tipo local `PlanType` | tipo | Línea 27: unión de planes soportados | Sí |

## Componentes que dependen de este archivo

| Componente/archivo | Relación |
| --- | --- |
| `admin/src/App.tsx` | Lo importa (línea 19) y lo monta en la ruta `/pagos-simulados` |

[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `PlanType` (tipo) | `"monthly" \| "annual"` | tipo unión | Restringe el plan al backend | Línea 27 |
| Precios UI (literales) | Mensual `$7.500 ARS`, Anual `$75.000 ARS` | string | Texto del selector y del botón | Líneas 108-109, 224-225, 240 |
| Días por defecto (texto UI) | "32 mensual / 380 anual" | string | Aviso al operador de la duración automática | Línea 229 |
| Límites del campo días | `min=1`, `max=3650` | number | Validación cliente del número de días | Línea 232 |
| `MAC_LABEL` | Record mensual/anual con precios | Record | Etiqueta del botón con precio | Líneas 107-110, 240 |
| Estado local | — | — | `mac`, `plan`, `dias`, `usuarios`, `total`, `buscando`, `buscado`, `error`, `seleccionado`, `generando`, `resultado` | Líneas 30-40 |

## Estructura (funciones / clases / tipos)

| Nombre | Tipo | Líneas |
| --- | --- | --- |
| `PagoSimulado` (exportada por defecto) | Componente de página | 29-284 |
| `buscar` | Callback de búsqueda por MAC (`useCallback`, async) | 42-66 |
| (hook) `useEffect` de preselección | Selecciona el primer usuario tras buscar | 68-72 |
| `generar` | Handler de generación del pago simulado (async) | 74-105 |
| `MAC_LABEL` | Constante de etiquetas con precio | 107-110 |

No hay clases ni interfaces propias (además del tipo local `PlanType`); se consumen
`ResultadoPagoSimulado` y `UsuarioAdmin` de `lib/api.ts`.

## Análisis línea por línea

Bloque 1 (líneas 1-13) — Cabecera documental:

```tsx
/* ============================================================================
 * Archivo         : PagoSimulado.tsx
 * Descripción     : Generación de pagos simulados (pruebas) desde el panel
 *                   admin. Permite buscar usuarios por dirección MAC,
 *                   seleccionar uno y activar su suscripción con un pago
 *                   simulado: genera ticket correlativo y registra el evento
 *                   sin cobro real (no toca MercadoPago).
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-08-01
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : Ruta /pagos-simulados
 * ========================================================================== */
```

**Explicación de las líneas 1-13:**

Cabecera del proyecto (fecha 2026-08-01, posterior a las demás pantallas). Documenta la intención
explícita: herramienta de pruebas que activa suscripciones y genera ticket correlativo "sin cobro
real (no toca MercadoPago)".

Bloque 2 (líneas 15-27) — Importaciones y tipo local:

```tsx
import { useCallback, useEffect, useState } from "react";
import {
  fetchUsuarios,
  simularPago,
  ApiError,
  type ResultadoPagoSimulado,
  type UsuarioAdmin,
} from "../lib/api";
import { formatearFecha, iniciales } from "../lib/format";
import { BadgeEstadoSuscripcion } from "../components/Badges";
import { ErrorAlerta } from "../components/Alerta";

type PlanType = "monthly" | "annual";
```

**Explicación de las líneas 15-27:**

- **Línea 15**: hooks de React.
- **Líneas 16-22**: funciones de la capa API: `fetchUsuarios` (búsqueda por MAC) y `simularPago`
  (POST `/admin/pagos/simular`), más los tipos de respuesta y de usuario.
- **Líneas 23-25**: utilidades de formato e insignias.
- **Línea 27**: tipo unión que limita los planes al par mensual/anual soportado por el backend.

Bloque 3 (líneas 29-72) — Estado, búsqueda y preselección:

```tsx
export default function PagoSimulado() {
  const [mac, setMac] = useState("");
  const [plan, setPlan] = useState<PlanType>("monthly");
  const [dias, setDias] = useState<number>(0);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState("");
  const [seleccionado, setSeleccionado] = useState<UsuarioAdmin | null>(null);
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoPagoSimulado | null>(null);

  const buscar = useCallback(async (macActual: string) => {
    setError("");
    setResultado(null);
    setSeleccionado(null);
    if (!macActual.trim()) {
      setUsuarios([]);
      setBuscado(false);
      return;
    }
    setBuscando(true);
    try {
      const data = await fetchUsuarios({ mac: macActual.trim(), limite: 100 });
      setUsuarios(data.usuarios);
      setTotal(data.total);
      setBuscado(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Sesión expirada. Volvé a ingresar.");
      } else {
        setError(err instanceof Error ? err.message : "Error al buscar por MAC.");
      }
    } finally {
      setBuscando(false);
    }
  }, []);

  useEffect(() => {
    if (buscado && !seleccionado && usuarios.length > 0) {
      setSeleccionado(usuarios[0]);
    }
  }, [buscado, seleccionado, usuarios]);
```

**Explicación de las líneas 29-72:**

- **Líneas 30-40**: estado local: MAC a buscar, plan seleccionado (por defecto mensual), días
  (0 = automático), lista de usuarios coincidentes, total, banderas de búsqueda, error, usuario
  seleccionado, bandera de generación y resultado del último pago simulado.
- **Líneas 42-66**: `buscar` (memoizado):
  - **Líneas 43-45**: limpia error, resultado y selección previos.
  - **Líneas 46-50**: si la MAC está vacía, vacía la lista y marca "no buscado" (la pantalla vuelve
    al estado inicial).
  - **Línea 51**: activa la bandera de búsqueda.
  - **Líneas 52-62**: `fetchUsuarios({ mac: macActual.trim(), limite: 100 })` → `GET
    /api/v1/admin/usuarios?mac=…&limite=100`. El backend normaliza la MAC (quita separadores y la
    pasa a minúsculas, función `normalizar_mac` en `flask_app.py` líneas 1248-1253) y busca con
    `LIKE` sobre `replace(lower(mac_address),':','')`. Guarda la lista y el total; en fallo
    distingue 401 ("Sesión expirada. Volvé a ingresar.").
  - **Líneas 63-65**: `finally` desactiva la búsqueda.
- **Líneas 68-72**: efecto de preselección: cuando ya se buscó, no hay selección y hay
  resultados, selecciona automáticamente el primer usuario (`usuarios[0]`). Evita fricción cuando
  la MAC coincide con un único usuario (caso habitual).
- [NOTA] El operador escribe la MAC con formato típico (`AA:BB:CC:DD:EE:FF`, placeholder línea
  134), pero el backend acepta cualquier formato por la normalización.

Bloque 4 (líneas 74-110) — Generación del pago simulado y etiquetas:

```tsx
  const generar = async () => {
    if (!seleccionado) return;
    setGenerando(true);
    setError("");
    setResultado(null);
    try {
      const res = await simularPago({
        device_id: seleccionado.device_id,
        plan_type: plan,
        dias: dias || undefined,
      });
      setResultado(res);
      setSeleccionado((prev) =>
        prev
          ? {
              ...prev,
              subscription_status: res.usuario.subscription_status,
              plan_type: res.usuario.plan_type,
              subscription_expires_at: res.usuario.subscription_expires_at,
            }
          : prev
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Sesión expirada. Volvé a ingresar.");
      } else {
        setError(err instanceof Error ? err.message : "Error al generar el pago simulado.");
      }
    } finally {
      setGenerando(false);
    }
  };

  const MAC_LABEL: Record<PlanType, string> = {
    monthly: "Plan mensual — $7.500 ARS",
    annual: "Plan anual — $75.000 ARS",
  };
```

**Explicación de las líneas 74-110:**

- **Líneas 74-105**: `generar` (handler de la generación):
  - **Línea 75**: si no hay usuario seleccionado, no hace nada.
  - **Líneas 76-78**: marca generación, limpia error y resultado anterior.
  - **Líneas 79-84**: `simularPago` con `device_id` del usuario seleccionado, `plan_type` (solo
    monthly/annual) y `dias` (0 → se omite para que el backend aplique el valor automático: 32
    mensual / 380 anual). Envía el JSON por `POST /api/v1/admin/pagos/simular`.
  - **Líneas 85-95**: guarda el resultado y actualiza en el estado la ficha del usuario
    seleccionado con el estado/plan/vencimiento devueltos por el backend (así la UI refleja al
    instante la suscripción activada).
  - **Líneas 96-101**: manejo de errores (401 diferenciado).
  - **Líneas 102-104**: `finally` desactiva la bandera.
- **Líneas 107-110**: `MAC_LABEL` (nombre engañoso: en realidad es la etiqueta del botón por plan
  con su precio) con los montos que muestra la UI: mensual 7.500 ARS y anual 75.000 ARS. Estos
  precios coinciden con los montos que inserta el backend en `tickets.amount` (línea 1378 de
  `flask_app.py`: 75000 anual / 7500 mensual). [OBSERVACIÓN TÉCNICA] En esta pantalla la búsqueda
  se hace por MAC pero el envío usa `device_id`: la MAC sirve solo para localizar al usuario.

Bloque 5 (líneas 112-151) — Formulario de búsqueda por MAC:

```tsx
  return (
    <div className="stack">
      <div className="panel">
        <h2 className="panel-title">Pago simulado por MAC</h2>
        <p className="panel-sub">
          Buscá un usuario por dirección MAC, seleccionalo y generá un pago simulado
          para activar su suscripción sin cobro real (herramienta de pruebas).
        </p>

        <form
          className="form-config"
          onSubmit={(e) => {
            e.preventDefault();
            void buscar(mac);
          }}
        >
          <label className="campo">
            <span>Dirección MAC</span>
            <input
              type="text"
              value={mac}
              onChange={(e) => setMac(e.target.value)}
              placeholder="AA:BB:CC:DD:EE:FF"
              className="mono"
              autoComplete="off"
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={buscando || !mac.trim()}>
            {buscando ? "Buscando…" : "Buscar por MAC"}
          </button>
        </form>

        {error && <ErrorAlerta mensaje={error} />}

        {buscado && !buscando && (
          <p className="contador">
            {total.toLocaleString("es-AR")} usuario{total === 1 ? "" : "s"} con esa MAC
          </p>
        )}
      </div>
```

**Explicación de las líneas 112-151:**

- **Líneas 113-151**: primer panel:
  - **Líneas 115-119**: título y subtítulo que advierten al operador: "sin cobro real
    (herramienta de pruebas)".
  - **Líneas 121-142**: formulario de búsqueda: campo de texto para la MAC (fuente mono,
    `autoComplete="off"`, sin validación de formato en cliente) y botón "Buscar por MAC"
    (deshabilitado mientras busca o si el campo está vacío).
  - **Línea 144**: alerta de error si la búsqueda falló.
  - **Líneas 146-150**: contador de coincidencias con pluralización ("1 usuario con esa MAC").
- [NOTA] La búsqueda se dispara solo al enviar el formulario (no por tecleo), a diferencia de la
  pantalla de Usuarios.

Bloque 6 (líneas 153-187) — Lista de selección y ausencia de resultados:

```tsx
      {buscado && !buscando && usuarios.length > 0 && (
        <div className="panel">
          <h2 className="panel-title">Seleccionar usuario</h2>
          <div className="lista-seleccion">
            {usuarios.map((u) => (
              <button
                key={u.device_id}
                type="button"
                className={`item-seleccion${seleccionado?.device_id === u.device_id ? " item-seleccion-active" : ""}`}
                onClick={() => {
                  setSeleccionado(u);
                  setResultado(null);
                }}
              >
                <span className="avatar">{iniciales(u.name)}</span>
                <span className="item-seleccion-body">
                  <strong>{u.name}</strong>
                  <small className="mono">{u.device_id}</small>
                  <small className="mono">{u.mac_address || "sin MAC"}</small>
                </span>
                <span>
                  <BadgeEstadoSuscripcion estado={u.subscription_status} />
                  {u.plan_type && <small className="plan-tag">{u.plan_type}</small>}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {buscado && !buscando && usuarios.length === 0 && (
        <div className="panel">
          <p className="sin-datos">No se encontraron usuarios con esa MAC.</p>
        </div>
      )}
```

**Explicación de las líneas 153-187:**

- **Líneas 153-181**: panel de selección (solo si hay resultados): cada usuario es un botón de
  lista (`item-seleccion`) con avatar de iniciales, nombre, `device_id`, `mac_address` (o
  "sin MAC") e insignia de estado de suscripción con su plan. Al pulsarlo se fija `seleccionado` y
  se limpia el resultado anterior. La clase `item-seleccion-active` marca la selección actual
  (incluida la automática del efecto).
- **Líneas 183-187**: aviso "No se encontraron usuarios con esa MAC." cuando la búsqueda no dio
  resultados.
- [NOTA] El backend rechaza con 409 si la MAC coincide con varios usuarios y se envía solo la MAC;
  la UI evita ese caso porque siempre envía `device_id` del usuario elegido (el 409 solo aplicaría
  si se usara el endpoint con `mac_address`, flujo no expuesto en esta pantalla).

Bloque 7 (líneas 189-244) — Panel de generación del pago simulado:

```tsx
      {seleccionado && (
        <div className="panel">
          <h2 className="panel-title">
            Generar pago simulado para {seleccionado.name}
          </h2>
          <div className="grid-datos">
            <div>
              <span className="dato-titulo">Dispositivo</span>
              <span className="mono">{seleccionado.device_id}</span>
            </div>
            <div>
              <span className="dato-titulo">MAC</span>
              <span className="mono">{seleccionado.mac_address || "—"}</span>
            </div>
            <div>
              <span className="dato-titulo">Suscripción</span>
              <span>
                <BadgeEstadoSuscripcion estado={seleccionado.subscription_status} />
              </span>
            </div>
            <div>
              <span className="dato-titulo">Vence</span>
              <span>{formatearFecha(seleccionado.subscription_expires_at)}</span>
            </div>
          </div>

          <div className="form-config">
            <label className="campo">
              <span>Plan</span>
              <select
                className="input input-select"
                value={plan}
                onChange={(e) => setPlan(e.target.value as PlanType)}
                aria-label="Plan de pago simulado"
              >
                <option value="monthly">Mensual — $7.500 ARS</option>
                <option value="annual">Anual — $75.000 ARS</option>
              </select>
            </label>
            <label className="campo">
              <span>Duración (días) — vacío = 32 mensual / 380 anual</span>
              <input
                type="number"
                min={1}
                max={3650}
                value={dias || ""}
                onChange={(e) => setDias(e.target.value === "" ? 0 : Number(e.target.value))}
                placeholder="Automático"
              />
            </label>
            <button className="btn btn-peligro" type="button" onClick={generar} disabled={generando}>
              {generando ? "Generando…" : `✅ Generar pago simulado (${MAC_LABEL[plan]})`}
            </button>
          </div>
        </div>
      )}
```

**Explicación de las líneas 189-244:**

- **Líneas 189-243**: panel de generación, visible cuando hay usuario seleccionado:
  - **Líneas 191-193**: título con el nombre del usuario destino.
  - **Líneas 194-213**: rejilla de confirmación: `device_id`, MAC (o "—"), estado de suscripción
    actual (insignia) y vencimiento actual.
  - **Líneas 215-242**: controles del pago:
    - **Líneas 216-227**: selector de plan (accesible) con los dos precios: mensual 7.500 ARS y
      anual 75.000 ARS.
    - **Líneas 228-238**: campo numérico de duración en días: vacío se envía como 0 → el backend
      aplica automático (32 mensual / 380 anual); `min=1`, `max=3650` en cliente; convierte cadena
      vacía en 0.
    - **Líneas 239-241**: botón rojo `btn-peligro` que dispara `generar`; texto "Generando…"
      mientras opera, y con el precio del plan seleccionado en reposo. [NOTA] El uso de la clase de
      peligro busca subrayar que la acción modifica la suscripción del usuario.
- [NOTA] Los días se validan en cliente con `min`/`max` del input numérico, pero el navegador no
  impide escribir valores fuera de rango por teclado sin envío de formulario; el backend no acota
  el máximo de días (ver Riesgos).

Bloque 8 (líneas 246-284) — Resultado del pago simulado:

```tsx
      {resultado && (
        <div className="panel">
          <h2 className="panel-title">Pago simulado generado</h2>
          <div className="grid-datos">
            <div>
              <span className="dato-titulo">N° de ticket</span>
              <span className="mono">#{String(resultado.ticket.ticket_number).padStart(6, "0")}</span>
            </div>
            <div>
              <span className="dato-titulo">Fecha</span>
              <span>
                {resultado.ticket.date} {resultado.ticket.time} UTC
              </span>
            </div>
            <div>
              <span className="dato-titulo">Plan</span>
              <span>{resultado.ticket.plan_type === "annual" ? "Anual" : "Mensual"}</span>
            </div>
            <div>
              <span className="dato-titulo">Monto</span>
              <span>${resultado.ticket.amount.toLocaleString("es-AR")} ARS</span>
            </div>
            <div>
              <span className="dato-titulo">Estado suscripción</span>
              <span>
                <BadgeEstadoSuscripcion estado={resultado.usuario.subscription_status} />
              </span>
            </div>
            <div>
              <span className="dato-titulo">Vence</span>
              <span>{formatearFecha(resultado.usuario.subscription_expires_at)}</span>
            </div>
          </div>
          <p className="ok-msg">La app de ese dispositivo reflejará la suscripción activa al consultar su estado.</p>
        </div>
      )}
    </div>
  );
}
```

**Explicación de las líneas 246-284:**

- **Líneas 246-281**: panel de resultado (visible tras una generación exitosa):
  - Número de ticket formateado con ceros a la izquierda a 6 dígitos (línea 252).
  - Fecha y hora UTC devueltas por el backend (líneas 255-258).
  - Plan traducido (Mensual/Anual, línea 262).
  - Monto con formato es-AR y sufijo ARS (línea 266); es el monto del ticket, no un cobro.
  - Estado de suscripción actualizado (insignia) y nuevo vencimiento (líneas 269-277).
  - **Línea 279**: mensaje informativo: "La app de ese dispositivo reflejará la suscripción activa
    al consultar su estado." (confirmación de que el efecto es real en producción de datos, no una
    mera demo local).
- **Líneas 282-284**: cierre del contenedor y del componente.

## Fichas de funciones y métodos

### PagoSimulado (líneas 29-284)

- Firma (código original): `export default function PagoSimulado() { ... }`
- Propósito técnico y funcional: búsqueda por MAC, selección de usuario y generación de pagos
  simulados de suscripción.
- Parámetros: ninguno. Retorno: JSX. Excepciones: no lanza.
- Dependencias: `fetchUsuarios`, `simularPago`, `BadgeEstadoSuscripcion`, utilidades de formato.
- Desde dónde se llama: `App.tsx`, ruta `/pagos-simulados`.
- Efectos secundarios: modifica de forma persistente la suscripción del usuario en el backend y
  crea registros en `payment_events` y `tickets`.
- Riesgos: ver sección Seguridad (activación de suscripciones sin cobro).

### buscar (líneas 42-66)

- Firma (código original): `const buscar = useCallback(async (macActual: string) => { ... }, []);`
- Propósito: localizar usuarios por dirección MAC mediante el listado admin.
- Parámetros: `macActual` (MAC tal como la escribe el operador). Retorno: `Promise<void>`.
  Excepciones: capturadas.
- Dependencias: `fetchUsuarios` (con `mac` y `limite: 100`). Invocado desde el `onSubmit` del
  formulario (líneas 123-126).
- Efectos secundarios: actualización de la lista, total, flags y limpieza de selección/resultado.

### generar (líneas 74-105)

- Firma (código original): `const generar = async () => { ... }`
- Propósito: invocar `POST /api/v1/admin/pagos/simular` y reflejar el resultado.
- Parámetros: ninguno (usa estado). Retorno: `Promise<void>`. Excepciones: capturadas.
- Dependencias: `simularPago`; actualiza `resultado` y la ficha de `seleccionado`.
- Efectos secundarios: activa la suscripción del usuario en backend (UPDATE `users`), inserta un
  evento en `payment_events` y un ticket correlativo en `tickets`.

## Clases / interfaces / tipos

| Tipo | Responsabilidad | Campos usados en esta pantalla |
| --- | --- | --- |
| `PlanType` (local, línea 27) | Restringe planes | `"monthly"`, `"annual"` |
| `UsuarioAdmin` (`lib/api.ts` 13-32) | Ficha del usuario buscado | `device_id`, `name`, `mac_address`, `subscription_status`, `plan_type`, `subscription_expires_at` |
| `ResultadoPagoSimulado` (`lib/api.ts` 209-220) | Respuesta de `simularPago` | `success`, `ticket` (ticket_number, date, time, plan_type, amount, contact_email), `usuario` (estado actualizado) |

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] La pantalla permite activar suscripciones de usuarios reales sin cobro:
  el efecto sobre el estado de suscripción del usuario es idéntico al de un pago legítimo (la app
  consulta `subscription_status` y lo verá "active"). La única diferencia interna es el registro
  con `event_type='admin_simulated'` y `simulado: True` en `payment_events`. No hay cobro real
  [NIVEL DE CERTEZA: Confirmado por código en backend, líneas 1367-1372 de `flask_app.py`].
- [OBSERVACIÓN TÉCNICA] El botón de generación usa la clase visual `btn-peligro` y muestra un
  indicador de verificación, pero no hay segunda confirmación en la UI (a diferencia de la purga en
  Admin.tsx): un clic genera el pago simulado directamente.
- [OBSERVACIÓN TÉCNICA] El campo de días se valida solo en cliente con `min`/`max` del input
  numérico; el backend acepta cualquier entero positivo sin tope y lanza `int()` sin captura
  (línea 1332 de `flask_app.py`): un valor no numérico produciría un error 500.
- [OBSERVACIÓN TÉCNICA] El nombre de la constante `MAC_LABEL` no describe su contenido (etiqueta
  de botón con plan y precio); menor impacto en mantenibilidad.
- [OBSERVACIÓN TÉCNICA] `PagoSimulado` y `Usuarios` comparten `fetchUsuarios`; la pantalla de
  MAC fija `limite: 100`, la de usuarios `limite: 300`.
- [NIVEL DE CERTEZA: Confirmado por código] Montos coherentes UI-backend (7.500 / 75.000 ARS en
  ambas capas), aunque el valor vive duplicado en dos lugares (TSX y Python) y puede desincronizarse.

## Seguridad

- [ALTO] Funcionalidad de "pago simulado" capaz de activar suscripciones reales (estado `active` +
  vencimiento futuro) sin ningún cobro ni verificación de entorno: si el panel se despliega contra
  el backend de producción, cualquier poseedor de la clave puede regalar suscripciones de forma
  indefinida (p. ej. `dias=3650`). La etiqueta de "pruebas" es informativa; el backend no distingue
  entornos.
- [ALTO] Riesgo de uso indebido/fraude: no hay confirmación en la UI ni límite por operador (solo
  rate limit por IP en el backend: `pago_sim:{ip}`); el log de backend registra `device_id`, MAC,
  plan, días y ticket (líneas 1386-1387 de `flask_app.py`), lo que facilita auditoría posterior,
  pero no hay registro en la interfaz.
- [MEDIO] El mecanismo de "activar suscripción de un usuario real desde una clave compartida"
  amplifica el daño de un compromiso de `X-Admin-Key` (localStorage/XSS): además de leer datos, el
  atacante puede modificar suscripciones y emitir tickets.
- [MEDIO] Ticket correlativo generado con `MAX(ticket_number)+1` sin transacción exclusiva ni
  constraint de unicidad comprobada (líneas 1374-1383 de `flask_app.py`): dos peticiones
  concurrentes pueden producir el mismo número de ticket [NIVEL DE CERTEZA: Inferido; requiere
  verificar el esquema de la tabla `tickets`].
- [BAJO] `contact_email` devuelto en el ticket está fijado en el backend como correo de contacto
  del proyecto; la UI no lo muestra.
- [INFORMATIVO] No interviene Mercado Pago: no se manejan datos de tarjeta, tokens de pago ni
  secretos de pasarela en esta pantalla. La prueba no registra cobro.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Permitir pagos simulados en el entorno de producción sin protección: recomendar
  habilitar el flujo solo con una clave/entorno de pruebas explícito, exigir confirmación por
  backend (flag `confirmar`), acotar el máximo de días (p. ej. 380) y registrar auditoría con
  identidad del operador.
- [RECOMENDACIÓN] Añadir una segunda confirmación en la UI (como en la purga) dado el efecto
  persistente de la acción.
- [RECOMENDACIÓN] Serializar la emisión de tickets (transacción con `BEGIN IMMEDIATE` o
  `INSERT ... SELECT MAX()+1` atómico) para evitar duplicados de `ticket_number` bajo concurrencia.
- [RECOMENDACIÓN] Validar `dias` como entero con rango en el backend y devolver 400 en lugar de
  500 ante valores no numéricos.
- [INFORMATIVO] Centralizar los precios (7.500/75.000 ARS) en una única fuente (variable de
  entorno o tabla de planes) para evitar desincronización UI/backend.
- [NOTA] La pantalla cumple su propósito documentado de herramienta de pruebas (no toca Mercado
  Pago); el riesgo principal es su disponibilidad junto al backend de producción con clave
  compartida.
