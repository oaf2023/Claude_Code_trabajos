# Archivo: src/services/AccesoRegistroService.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/AccesoRegistroService.ts | 60 | TypeScript 5.9 | 2532 | Telemetría de acceso (registro de accesos técnicos y metadatos de dispositivo) | [POTENCIALMENTE NO UTILIZADO] | [NIVEL DE CERTEZA: Altamente probable] |

## Objetivo

Servicio de telemetría de accesos según el "Prompt Maestro": captura metadatos del dispositivo y de la sesión (tipo de dispositivo, sistema operativo, idioma, zona horaria, dimensiones de pantalla, método de autenticación) y los registra en el backend de PythonAnywhere mediante `LocationApiClient.registrarAcceso`, de forma no bloqueante (fire & forget). Está pensado para invocarse al inicio de una sesión/usuario.

## Clasificación y estado

- Código implementado, pero **sin llamadores encontrados**: la búsqueda con grep en todo el repositorio (patrones `AccesoRegistroService`, `registrarAccesoInicial`) solo encuentra el propio archivo. `LocationApiClient.registrarAcceso` sí se usa desde aquí, y el propio `LocationApiClient` es usado por otros servicios (PrivacyService), pero este servicio concreto no aparece importado por ninguna pantalla. [NIVEL DE CERTEZA: Altamente probable]
- Etiqueta: [POTENCIALMENTE NO UTILIZADO] — posible funcionalidad preparada para integrarse en el onboarding/arranque (no hay TODO ni comentario de pendiente que lo confirme).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `Platform`, `Dimensions` de `react-native` | estándar (externo) | `detectarDispositivo`, `detectarNavegador`, `registrarAccesoInicial` | Sí |
| `* as Localization` de `expo-localization` | externa | Idioma y zona horaria | Sí |
| `LocationApiClient` de `./LocationApiClient` | interna | `registrarAcceso(payload)` | Sí |
| `AccesoPayload` de `../types/Location` | interna (tipo) | Tipado del payload | Sí (solo tipo) |

## Componentes que dependen de este archivo

- No se encontraron componentes que lo importen (grep en todo el proyecto). [NIVEL DE CERTEZA: Altamente probable]
- El tipo `AccesoPayload` y el cliente `LocationApiClient` sí tienen uso real en otras partes (PrivacyService usa `LocationApiClient.registrarConsentimiento`/`revocarConsentimiento`), pero no a través de este servicio.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `profundidad_color` | `24` (literal) | number | Profundidad de color reportada (valor fijo, no medido) | Línea 53 |
| `pagina_consultada` | `'app'` (literal) | string | Identifica que el acceso proviene de la app | Línea 42 |
| `metodo_autenticacion` | `'firebase_anonimo'` / `'no_autenticado'` | string | Según exista `userId` | Línea 54 |

Significado inferido a partir del contexto: `profundidad_color: 24` es un valor estático (bit depth típico) y no se obtiene del dispositivo real. [NIVEL DE CERTEZA: Inferido]

## Estructura (funciones / clases / tipos)

- Función privada `detectarDispositivo(): string` (líneas 16–24).
- Función privada `detectarNavegador(): string` (líneas 26–31).
- Objeto exportado `AccesoRegistroService` (líneas 33–59):
  - `registrarAccesoInicial(userId?, sesionId?): Promise<void>` (líneas 34–59).

## Análisis línea por línea

**Bloque 1 (líneas 1–31): cabecera, imports y detectores privados.**

```ts
/* ============================================================================
* Archivo         : AccesoRegistroService.ts
* Descripción     : Servicio para registrar accesos técnicos y metadatos
*                   del dispositivo según Prompt Maestro.
* Autor           : oafon
* Fecha           : 2026-07-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* ============================================================================ */

import { Platform, Dimensions } from 'react-native';
import * as Localization from 'expo-localization';
import { LocationApiClient } from './LocationApiClient';
import { AccesoPayload } from '../types/Location';

function detectarDispositivo(): string {
  const platform = Platform.OS;
  const isTablet =
    (Platform as { isPad?: boolean }).isPad === true ||
    (Platform.OS === 'android' &&
      (Platform.constants as { isTablet?: boolean })?.isTablet === true);
  if (isTablet) return 'tablet';
  return platform === 'android' ? 'telefono' : platform === 'ios' ? 'telefono' : 'desktop';
}

function detectarNavegador(): string {
  const ua = Platform.constants?.reactNativeVersion
    ? `React Native ${Platform.constants.reactNativeVersion.major}.${Platform.constants.reactNativeVersion.minor}`
    : 'React Native';
  return ua;
}
```

**Explicación de las líneas 1–31:**
- **Líneas 1–9**: cabecera documental. Indica que registra "accesos técnicos y metadatos del dispositivo según Prompt Maestro".
- **Línea 11**: importa `Platform` (detección de SO) y `Dimensions` (tamaños de pantalla/ventana).
- **Línea 12**: importa `expo-localization` para idioma y zona horaria.
- **Línea 13**: importa el cliente HTTP de ubicación/accesos/consentimientos.
- **Línea 14**: importa el tipo `AccesoPayload` (solo tipos).
- **Líneas 16–24**: `detectarDispositivo`: detecta tablet (por `isPad` en iOS o `isTablet` en Android), devuelve `'tablet'`; si no, `'telefono'` en Android/iOS y `'desktop'` en el resto (web).
- **Líneas 26–31**: `detectarNavegador`: construye una cadena `React Native X.Y` a partir de `Platform.constants.reactNativeVersion`; en caso de ausencia devuelve `'React Native'`. Pese al nombre, no detecta un navegador real, sino la versión del runtime RN. [OBSERVACIÓN TÉCNICA]

**Bloque 2 (líneas 33–60): `registrarAccesoInicial`.**

```ts
export const AccesoRegistroService = {
  async registrarAccesoInicial(userId?: string, sesionId?: string): Promise<void> {
    const { width: ventanaAncho, height: ventanaAlto } = Dimensions.get('window');
    const { width: pantallaAncho, height: pantallaAlto } = Dimensions.get('screen');

    const payload: AccesoPayload = {
      usuario_id: userId,
      sesion_id: sesionId,
      device_id_app: sesionId,
      pagina_consultada: 'app',
      navegador_aproximado: detectarNavegador(),
      sistema_operativo_aproximado: `${Platform.OS} ${Platform.Version}`,
      tipo_dispositivo: detectarDispositivo(),
      idioma: Localization.getLocales()?.[0]?.languageTag || 'es',
      zona_horaria: Localization.getCalendars()?.[0]?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      offset_utc_minutos: new Date().getTimezoneOffset(),
      pantalla_ancho: pantallaAncho,
      pantalla_alto: pantallaAlto,
      ventana_ancho: ventanaAncho,
      ventana_alto: ventanaAlto,
      profundidad_color: 24,
      metodo_autenticacion: userId ? 'firebase_anonimo' : 'no_autenticado',
    };

    /* No bloqueante: enviar en segundo plano */
    LocationApiClient.registrarAcceso(payload).catch(() => {});
  },
};
```

**Explicación de las líneas 33–60:**
- **Línea 33**: apertura del objeto exportado `AccesoRegistroService`.
- **Línea 34**: firma: `registrarAccesoInicial(userId?, sesionId?)` — ambos opcionales; devuelve `Promise<void>`.
- **Líneas 35–36**: obtiene dimensiones de ventana y pantalla mediante `Dimensions.get('window')` y `Dimensions.get('screen')`.
- **Líneas 38–55**: construye el payload `AccesoPayload`:
  - `usuario_id`: UID de Firebase si existe.
  - `sesion_id` y `device_id_app`: se usa el mismo `sesionId` para ambos (reutilización del id de sesión como id de dispositivo de la app). [OBSERVACIÓN TÉCNICA]
  - `pagina_consultada: 'app'`: acceso desde la app.
  - `navegador_aproximado`: versión del runtime RN.
  - `sistema_operativo_aproximado`: `Platform.OS` + versión del SO.
  - `tipo_dispositivo`: resultado de `detectarDispositivo`.
  - `idioma`: primer locale del dispositivo o `'es'` por defecto.
  - `zona_horaria`: zona del calendario local o la resuelta por `Intl`.
  - `offset_utc_minutos`: desfase UTC en minutos (negativo al oeste).
  - `pantalla_*`/`ventana_*`: dimensiones en puntos.
  - `profundidad_color: 24`: valor fijo (no medido realmente).
  - `metodo_autenticacion`: `'firebase_anonimo'` si hay `userId`, si no `'no_autenticado'`.
- **Líneas 57–58**: envío no bloqueante: `LocationApiClient.registrarAcceso(payload).catch(() => {})` — si falla, el error se ignora silenciosamente (sin log).
- **Línea 59**: cierre del objeto.

## Fichas de funciones y métodos

### detectarDispositivo (líneas 16–24)
- Firma: `function detectarDispositivo(): string`.
- Propósito técnico: clasificar el dispositivo en `tablet`/`telefono`/`desktop`.
- Parámetros: ninguno.
- Retorno: `'tablet' | 'telefono' | 'desktop'`.
- Dependencias: `Platform`.
- Efectos secundarios: ninguno.
- Riesgos: el cast de `Platform.constants.isTablet` depende de la implementación de RN; en web `isPad`/`isTablet` pueden no existir y caer en `desktop` solo si `Platform.OS` no es android/ios.

### detectarNavegador (líneas 26–31)
- Firma: `function detectarNavegador(): string`.
- Propósito técnico: reportar la versión del runtime React Native.
- Retorno: cadena `React Native X.Y` o `'React Native'`.
- Dependencias: `Platform.constants.reactNativeVersion`.
- Efectos secundarios: ninguno.
- Riesgos: nombre engañoso (no detecta navegador); en web el valor sería `'React Native'`, incorrecto semánticamente.

### registrarAccesoInicial (líneas 34–59)
- Firma: `async registrarAccesoInicial(userId?: string, sesionId?: string): Promise<void>`.
- Propósito técnico/funcional: registrar un evento de acceso inicial con metadatos del dispositivo en el backend de telemetría.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| userId | string (opcional) | UID de Firebase del usuario. |
| sesionId | string (opcional) | Id de sesión; se reutiliza como `device_id_app`. |

- Retorno: `Promise<void>`.
- Excepciones: no lanza (catch silencioso interno en el envío).
- Dependencias: `Dimensions`, `Localization`, `detectarDispositivo`, `detectarNavegador`, `LocationApiClient.registrarAcceso`.
- Flujo interno: medir pantallas → componer payload → envío fire & forget.
- Desde dónde se llama: sin llamadores encontrados. [POTENCIALMENTE NO UTILIZADO]
- Efectos secundarios: POST de telemetría a PythonAnywhere (vía `LocationApiClient` que añade header `Authorization: Bearer` si hay token de Firebase).
- Riesgos: al reutilizar `sesionId` como `device_id_app` se pierde la distinción entre sesión y dispositivo; el catch silencioso impide auditar fallos de telemetría.

## Clases / interfaces / tipos

- No define clases ni interfaces propias; utiliza `AccesoPayload` de `../types/Location` (tipo compartido: `usuario_id`, `sesion_id`, `device_id_app`, `pagina_consultada`, `navegador_aproximado`, `sistema_operativo_aproximado`, `tipo_dispositivo`, `idioma`, `zona_horaria`, `offset_utc_minutos`, dimensiones, `profundidad_color`, `metodo_autenticacion`). [NIVEL DE CERTEZA: Confirmado por código]

## Observaciones técnicas

- [POTENCIALMENTE NO UTILIZADO] Sin importadores en el repositorio (grep). Es probablemente un servicio preparado para integrarse en el flujo de inicio (onboarding/root layout) pero aún no conectado. [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] `sesion_id` y `device_id_app` reciben el mismo valor; si el objetivo es trazar el dispositivo de forma estable, debería usarse el `device_id` persistente de `DeviceService` en lugar del id de sesión (que cambia por sesión). [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] `profundidad_color: 24` es un valor fijo no derivado del hardware real; puede falsear métricas de telemetría. [NIVEL DE CERTEZA: Inferido]
- [OBSERVACIÓN TÉCNICA] El envío se hace con `LocationApiClient.registrarAcceso`, que enruta a `POST {PA_API_URL}/api/v1/accesos` con autenticación Bearer opcional (si `getIdToken` lo permite). El fallo se ignora sin log. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] No hay tests para este servicio. [NIVEL DE CERTEZA: Confirmado por código]

## Seguridad

- [MEDIO] Recolección de metadatos del dispositivo (SO, versión, idioma, zona horaria, dimensiones, método de autenticación y opcionalmente `usuario_id`) enviados a un backend de terceros; son datos de telemetría que pueden considerarse datos personales según marco (RGPD/DAMMA) y deben declararse en la política de privacidad. [NIVEL DE CERTEZA: Confirmado por código]
- [INFORMATIVO] No envía claves, tokens ni contenido sensible; el token de Firebase, si existe, viaja como `Authorization: Bearer` (gestionado por `LocationApiClient`). [NIVEL DE CERTEZA: Confirmado por código]
- [INFORMATIVO] No hay validación de la respuesta del servidor; diseño fire & forget con pérdida silenciosa de eventos. [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Si la telemetría es un requisito del Prompt Maestro, conectar el servicio al arranque (p. ej. en `_layout.tsx` tras `ensureAuthenticated`) y usar el `device_id` persistente de `DeviceService` como identificador de dispositivo. [RECOMENDACIÓN]
- [RIESGO] Medir `profundidad_color` real o eliminarlo del payload para no reportar datos falsos. [RECOMENDACIÓN]
- [INFORMATIVO] Registrar en log (al menos a nivel debug) los fallos del envío para poder auditar la cobertura de telemetría. [RECOMENDACIÓN]
- [INFORMATIVO] Añadir tests para los detectores (tablet/teléfono/desktop y versión RN) con `Platform` mockeado. [RECOMENDACIÓN]
