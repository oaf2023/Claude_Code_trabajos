# Archivo: src/types/Location.ts

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | src/types/Location.ts |
| Líneas totales | 74 |
| Lenguaje | TypeScript 5.9 |
| Tamaño (bytes) | 2282 |
| Categoría | Definición de tipos del sistema de ubicaciones, consentimientos y accesos (telemetría) |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Define los contratos de envío de datos hacia el backend de telemetría/ubicaciones del
Prompt Maestro: `LocationPayload` (una ubicación con metadatos de dispositivo y entorno),
`ConsentPayload` (registro de consentimiento de permisos), `AccesoPayload` (registro de
acceso/página consultada) y la constante `POLITICA_PRIVACIDAD_VERSION` (versión vigente de
la política de privacidad). Los nombres de campo usan el convenio snake_case del backend.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Los tres payloads y la constante se importan de forma real en
`LocationApiClient.ts`, `PrivacyService.ts` y `AccesoRegistroService.ts`. Además el
archivo reexporta tipos base desde `Alert.ts` (`LocationSource`, `PermissionStatusValue`).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `LocationSource` desde `./Alert` | interna (tipo) | Campo `origen` de `LocationPayload` | Sí |
| `PermissionStatusValue` desde `./Alert` | interna (tipo) | Campo `permiso_ubicacion` de `LocationPayload` | Sí |

## Componentes que dependen de este archivo

Referencias reales encontradas con búsqueda sobre el código fuente:

- `src/services/LocationApiClient.ts` (línea 16): `import { LocationPayload, ConsentPayload, AccesoPayload } from '../types/Location'` — métodos `enviarUbicacion`, `enviarUbicacionManual`, `registrarAcceso` y `registrarConsentimiento`.
- `src/services/PrivacyService.ts` (líneas 15-16): `import { ConsentPayload } ...` e `import { POLITICA_PRIVACIDAD_VERSION } from '../types/Location'` — construye `payload: ConsentPayload` con `version_politica: POLITICA_PRIVACIDAD_VERSION` (líneas 75-80).
- `src/services/AccesoRegistroService.ts` (línea 14): `import { AccesoPayload } from '../types/Location'` — construye `const payload: AccesoPayload` (línea 38).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `POLITICA_PRIVACIDAD_VERSION` | `'1.0.0'` | string (constante exportada) | Identifica la versión de política de privacidad vigente al registrar consentimientos | `PrivacyService.ts` (línea 16 y 80) |

## Estructura (funciones / clases / tipos)

- Interfaces (`export interface`): `LocationPayload`, `ConsentPayload`, `AccesoPayload`.
- Constante (`export const`): `POLITICA_PRIVACIDAD_VERSION`.

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : Location.ts
* Descripción     : Tipos para el sistema de ubicaciones del Prompt Maestro.
*                   Clasificación de origen, consentimientos y metadatos.
* Autor           : oafon
* Fecha           : 2026-07-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* ============================================================================ */
```

**Explicación de las líneas 1–9:**

- **Línea 1**: apertura del comentario de cabecera estándar del proyecto.
- **Líneas 2–8**: metadatos (autor `oafon`, fecha `2026-07-30`, versión `1.0.0`) y
  descripción: tipos del sistema de ubicaciones del Prompt Maestro con clasificación de
  origen, consentimientos y metadatos.
- **Línea 9**: cierre de la cabecera.

```ts
import { LocationSource, PermissionStatusValue } from './Alert';
```

**Explicación de la línea 11:**

- **Línea 11**: importa los tipos `LocationSource` y `PermissionStatusValue` definidos en
  `src/types/Alert.ts` para reutilizarlos en `LocationPayload`. Solo aporta tipos.

```ts
export interface LocationPayload {
  usuario_id: string;
  sesion_id?: string;
  device_id_app?: string;
  fecha_hora_dispositivo?: string;
  latitud: number;
  longitud: number;
  precision_metros?: number;
  altitud_metros?: number;
  velocidad_metros_segundo?: number;
  rumbo_grados?: number;
  origen: LocationSource;
  permiso_ubicacion: PermissionStatusValue;
  direccion_estimada?: string;
  direccion_confirmada?: string;
  proveedor_geocodificacion?: string;
  observaciones?: string;
  navegador_aproximado?: string;
  sistema_operativo_aproximado?: string;
  tipo_dispositivo?: string;
  idioma?: string;
  zona_horaria?: string;
  offset_utc_minutos?: number;
  pantalla_ancho?: number;
  pantalla_alto?: number;
  ventana_ancho?: number;
  ventana_alto?: number;
  profundidad_color?: number;
  metadatos?: Record<string, unknown>;
}
```

**Explicación de las líneas 13–42:**

- **Línea 13**: apertura de `LocationPayload`, cuerpo del envío de una ubicación al
  backend de telemetría (nombres snake_case acordes al API).
- **Línea 14**: `usuario_id` (obligatorio), identidad del usuario.
- **Líneas 15–17**: `sesion_id`, `device_id_app` y `fecha_hora_dispositivo`, opcionales,
  para correlación de sesión/dispositivo y hora local del equipo.
- **Líneas 18–19**: `latitud` y `longitud` (obligatorias).
- **Líneas 20–23**: metadatos de precisión y GPS en unidades SI y grados
  (`precision_metros`, `altitud_metros`, `velocidad_metros_segundo`, `rumbo_grados`).
- **Líneas 24–25**: `origen` (`LocationSource`) y `permiso_ubicacion`
  (`PermissionStatusValue`), ambos obligatorios; materializan la clasificación del Prompt
  Maestro.
- **Líneas 26–29**: `direccion_estimada`, `direccion_confirmada`,
  `proveedor_geocodificacion` y `observaciones`.
- **Líneas 30–35**: fingerprint del entorno: `navegador_aproximado`,
  `sistema_operativo_aproximado`, `tipo_dispositivo`, `idioma`, `zona_horaria` y
  `offset_utc_minutos`.
- **Líneas 36–40**: dimensiones de pantalla y ventana y profundidad de color, útiles para
  el análisis de la experiencia web.
- **Línea 41**: `metadatos` opcional, extensible (`Record<string, unknown>`).
- **Línea 42**: cierre de la interfaz.

```ts
export interface ConsentPayload {
  usuario_id: string;
  sesion_id?: string;
  tipo_permiso: 'UBICACION' | 'CAMARA' | 'MICROFONO' | 'CONTACTOS' | 'NOTIFICACIONES';
  estado: 'OTORGADO' | 'RECHAZADO' | 'REVOCADO' | 'NO_SOLICITADO';
  texto_mostrado?: string;
  version_politica?: string;
}
```

**Explicación de las líneas 44–51:**

- **Línea 44**: apertura de `ConsentPayload`, registro del consentimiento de un permiso.
- **Línea 45**: `usuario_id` (obligatorio).
- **Línea 46**: `sesion_id`, opcional.
- **Línea 47**: `tipo_permiso`, literal con los cinco permisos: `UBICACION`, `CAMARA`,
  `MICROFONO`, `CONTACTOS`, `NOTIFICACIONES`.
- **Línea 48**: `estado`, literal `OTORGADO | RECHAZADO | REVOCADO | NO_SOLICITADO`.
- **Línea 49**: `texto_mostrado`, opcional: texto exacto mostrado al usuario.
- **Línea 50**: `version_politica`, opcional: versión de la política; en `PrivacyService`
  se asigna `POLITICA_PRIVACIDAD_VERSION`.
- **Línea 51**: cierre de la interfaz.

```ts
export interface AccesoPayload {
  usuario_id?: string;
  sesion_id?: string;
  device_id_app?: string;
  pagina_consultada?: string;
  navegador_aproximado?: string;
  sistema_operativo_aproximado?: string;
  tipo_dispositivo?: string;
  idioma?: string;
  idiomas?: string[];
  zona_horaria?: string;
  offset_utc_minutos?: number;
  pantalla_ancho?: number;
  pantalla_alto?: number;
  ventana_ancho?: number;
  ventana_alto?: number;
  profundidad_color?: number;
  metodo_autenticacion?: string;
}
```

**Explicación de las líneas 53–71:**

- **Línea 53**: apertura de `AccesoPayload`, registro de acceso o consulta de una página.
- **Línea 54**: `usuario_id`, opcional (un acceso puede ocurrir sin sesión iniciada).
- **Líneas 55–57**: `sesion_id`, `device_id_app` y `pagina_consultada`, opcionales.
- **Líneas 58–64**: fingerprint del entorno (navegador, SO, dispositivo, `idioma`,
  `idiomas` como array, zona horaria y offset UTC).
- **Líneas 65–69**: dimensiones de pantalla/ventana y profundidad de color.
- **Línea 70**: `metodo_autenticacion`, opcional: cómo se autenticó el usuario.
- **Línea 71**: cierre de la interfaz.

```ts
/** Versión actual de la política de privacidad */
export const POLITICA_PRIVACIDAD_VERSION = '1.0.0';
```

**Explicación de las líneas 73–74:**

- **Línea 73**: comentario de documentación: "Versión actual de la política de privacidad".
- **Línea 74**: define y exporta la constante `POLITICA_PRIVACIDAD_VERSION` con valor
  `'1.0.0'`; es el único valor en runtime de este archivo y se usa en
  `PrivacyService.ts` para sellar los consentimientos con la versión de política vigente.

## Fichas de funciones y métodos

El archivo no contiene funciones.

## Clases / interfaces / tipos

### Interfaz `LocationPayload` (líneas 13–42)

| Campo | Tipo | Obligatorio | Uso real encontrado |
| --- | --- | --- | --- |
| usuario_id | string | Sí | Enviado por `LocationApiClient.enviarUbicacion` |
| sesion_id | string | No | Trazabilidad de sesión |
| device_id_app | string | No | Identificador de dispositivo |
| fecha_hora_dispositivo | string | No | Hora local del equipo |
| latitud | number | Sí | Cuerpo del envío |
| longitud | number | Sí | Cuerpo del envío |
| precision_metros | number | No | Metadato GPS |
| altitud_metros | number | No | Metadato GPS |
| velocidad_metros_segundo | number | No | Metadato GPS |
| rumbo_grados | number | No | Metadato GPS |
| origen | LocationSource | Sí | Clasificación Prompt Maestro |
| permiso_ubicacion | PermissionStatusValue | Sí | Estado del permiso |
| direccion_estimada | string | No | Geocodificación inversa |
| direccion_confirmada | string | No | Confirmación manual |
| proveedor_geocodificacion | string | No | Proveedor usado |
| observaciones | string | No | Notas libres |
| navegador_aproximado | string | No | Fingerprint entorno |
| sistema_operativo_aproximado | string | No | Fingerprint entorno |
| tipo_dispositivo | string | No | Fingerprint entorno |
| idioma | string | No | Fingerprint entorno |
| zona_horaria | string | No | Fingerprint entorno |
| offset_utc_minutos | number | No | Fingerprint entorno |
| pantalla_ancho | number | No | Fingerprint entorno |
| pantalla_alto | number | No | Fingerprint entorno |
| ventana_ancho | number | No | Fingerprint entorno |
| ventana_alto | number | No | Fingerprint entorno |
| profundidad_color | number | No | Fingerprint entorno |
| metadatos | Record\<string, unknown\> | No | Extensión libre |

- Responsabilidad: contrato del envío de ubicación al backend de telemetría.
- Relaciones: usado por `LocationApiClient` (métodos `enviarUbicacion` y `enviarUbicacionManual`).

### Interfaz `ConsentPayload` (líneas 44–51)

| Campo | Tipo | Obligatorio | Uso real encontrado |
| --- | --- | --- | --- |
| usuario_id | string | Sí | `PrivacyService.ts` (payload línea 75) |
| sesion_id | string | No | Trazabilidad |
| tipo_permiso | literal (5 valores) | Sí | Mapeado por `FEATURE_TO_TIPO` en `PrivacyService` (línea 30) |
| estado | literal (4 valores) | Sí | Estado registrado |
| texto_mostrado | string | No | Texto mostrado al usuario |
| version_politica | string | No | `POLITICA_PRIVACIDAD_VERSION` (línea 80) |

- Responsabilidad: contrato de registro de consentimientos de permisos.
- Relaciones: usado por `PrivacyService` y `LocationApiClient.registrarConsentimiento`.

### Interfaz `AccesoPayload` (líneas 53–71)

| Campo | Tipo | Obligatorio | Uso real encontrado |
| --- | --- | --- | --- |
| usuario_id | string | No | `AccesoRegistroService.ts` (payload línea 38) |
| sesion_id | string | No | Ídem |
| device_id_app | string | No | Ídem |
| pagina_consultada | string | No | Ídem |
| navegador_aproximado | string | No | Ídem |
| sistema_operativo_aproximado | string | No | Ídem |
| tipo_dispositivo | string | No | Ídem |
| idioma | string | No | Ídem |
| idiomas | string[] | No | Ídem |
| zona_horaria | string | No | Ídem |
| offset_utc_minutos | number | No | Ídem |
| pantalla_ancho | number | No | Ídem |
| pantalla_alto | number | No | Ídem |
| ventana_ancho | number | No | Ídem |
| ventana_alto | number | No | Ídem |
| profundidad_color | number | No | Ídem |
| metodo_autenticacion | string | No | Ídem |

- Responsabilidad: contrato de registro de accesos/páginas consultadas.
- Relaciones: usado por `AccesoRegistroService` y `LocationApiClient.registrarAcceso`.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA]: los tres payloads combinan datos personales de ubicación y
  fingerprint de dispositivo; al enviarse a un backend de telemetría deben tratarse según
  la política de privacidad (la constante `POLITICA_PRIVACIDAD_VERSION` sugiere que existe
  gestión de consentimiento, verificada en `PrivacyService.ts`).
- [OBSERVACIÓN TÉCNICA]: `AccesoPayload.usuario_id` es opcional mientras que
  `LocationPayload.usuario_id` y `ConsentPayload.usuario_id` son obligatorios: coherente
  con accesos pre-autenticación, pero dificulta correlacionar accesos anónimos.
- [NIVEL DE CERTEZA: Confirmado por código] para las referencias en los tres servicios
  consumidores.

## Seguridad

- INFORMATIVO: los payloads contienen geolocalización precisa, identificadores de sesión y
  fingerprint de dispositivo; son datos sensibles que deben viajar por HTTPS y respetar
  retención mínima. No hay credenciales ni secretos en el archivo.
- [NIVEL DE CERTEZA: No determinado] respecto a si el transporte añade autenticación por
  token: no se analiza aquí el cliente HTTP (`LocationApiClient`), fuera del alcance de
  este módulo.
- No se detectan hallazgos CRÍTICOS, ALTOS ni MEDIOS en este archivo de tipos.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN]: verificar que el backend registra el `version_politica` recibido para
  auditar consentimientos frente a cambios futuros de la política.
- [RECOMENDACIÓN]: confirmar que `metodo_autenticacion` y `pagina_consultada` no registran
  datos de más (p. ej. rutas con parámetros sensibles); de ser así, sanitizar antes del envío.
