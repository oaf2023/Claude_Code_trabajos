# Archivo: src/services/DeviceDiagnostic.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/DeviceDiagnostic.ts | 139 | TypeScript 5.9 | 4256 | Diagnóstico continuo de disponibilidad del sistema de protección | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Servicio de diagnóstico no intrusivo que evalúa periódicamente la disponibilidad del sistema de protección SafeAlert: conectividad de red, permisos de ubicación/notificaciones/micrófono y nivel de batería. Combina los resultados en un nivel de protección (`active`, `limited`, `stopped`) con mensajes legibles para el usuario. Su propósito es informar en la pantalla principal si la protección está lista sin interferir con el flujo de alerta. No lee ubicación ni envía datos personales; solo comprueba capacidades.

## Clasificación y estado

`FUNCIONALIDAD EXISTENTE` — Consumido por `app/(tabs)/index.tsx` (líneas 45, 120–121): ejecuta `DeviceDiagnostic.run()` al montar y `DeviceDiagnostic.startPolling(30000)` para refrescar cada 30 s; usa el nivel devuelto para la insignia `ProtectionBadge`.

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `Platform` de `react-native` | externa | Selección de permisos por SO | Sí |
| `* as Notifications` de `expo-notifications` | externa | Chequeo de permiso de notificaciones | Sí |
| `check`, `PERMISSIONS`, `RESULTS` de `react-native-permissions` | externa | Permisos de ubicación y micrófono | Sí |
| `expo-battery` (import dinámico) | externa | Nivel de batería | Sí |
| `fetch` global | estándar | Chequeo de conectividad a `clients3.google.com/generate_204` | Sí |

## Componentes que dependen de este archivo

- `app/(tabs)/index.tsx` (líneas 45, 120–121): `run()` y `startPolling(30000)`; usa el tipo `ProtectionLevel` (línea 60) para el badge de protección.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `lastResult` | `null` inicial | DiagnosticResult \| null | Último resultado del diagnóstico (acceso sin re-ejecutar) | Líneas 92, 126, 131 |

Valores literales de contexto: umbral de batería `0.05` (5%); timeout de red `3000` ms; URL de conectividad `https://clients3.google.com/generate_204`; intervalo de polling por defecto `30000` ms (30 s).

## Estructura (funciones / clases / tipos)

Tipo exportado y función auxiliar:

- `ProtectionLevel` (18)
- `DiagnosticResult` (20–30)
- `hasNetwork()` (32–45)
- `hasLocationPermission()` (47–58)
- `hasNotificationPermission()` (60–67)
- `hasMicrophonePermission()` (69–80)
- `hasLowBattery()` (82–90)

Objeto exportado `DeviceDiagnostic`:

- `run()` (95–128)
- `getLastResult()` (130–132)
- `startPolling(intervalMs)` (134–138)

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : DeviceDiagnostic.ts
* Descripción     : Diagnóstico continuo de disponibilidad del sistema.
*                   Evalúa batería, red, permisos, micrófono y servicio
*                   para determinar si la protección está activa, limitada
*                   o detenida. No interfiere con el flujo de alerta.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : DeviceDiagnostic.run()
* ============================================================================ */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions';

export type ProtectionLevel = 'active' | 'limited' | 'stopped';

export interface DiagnosticResult {
  level: ProtectionLevel;
  checks: {
    network: boolean;
    location: boolean;
    notifications: boolean;
    microphone: boolean;
    battery: boolean;
  };
  messages: string[];
}
```

**Explicación de las líneas 1–30:**

- **Líneas 1–12**: Cabecera estándar del proyecto; describe el propósito de diagnóstico continuo sin interferir con la alerta.
- **Línea 14**: `Platform` para permisos por SO.
- **Línea 15**: Notificaciones Expo.
- **Línea 16**: Funciones de chequeo de `react-native-permissions`.
- **Línea 18**: Nivel de protección: `active`, `limited`, `stopped`.
- **Líneas 20–30**: `DiagnosticResult` agrega nivel, mapa booleano de cinco comprobaciones y mensajes descriptivos.

```ts
async function hasNetwork(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}
```

**Explicación de las líneas 32–45:**

- **Línea 33**: Crea un `AbortController` para limitar la espera.
- **Línea 34**: Timeout de 3 s que aborta la petición.
- **Líneas 35–39**: Petición `HEAD` al endpoint de conectividad de Google (`generate_204`), que responde 204 sin contenido.
- **Línea 40**: Si la petición completó, limpia el timeout (evita abortar una petición ya terminada).
- **Línea 41**: `res.ok` es verdadero si el estado es 2xx (204 incluido).
- **Líneas 42–44**: Ante error o aborto retorna `false`.
- `[OBSERVACIÓN TÉCNICA]`: el chequeo depende de un servicio de terceros (Google). Si la red del usuario bloquea Google pero permite otros dominios (o viceversa), el diagnóstico puede ser incorrecto; además expone la IP del dispositivo a Google en cada ejecución (cada 30 s en la pantalla principal).
- **[NOTA]**: el patrón de timeout con `AbortController` está bien implementado: si la petición resuelve antes del timeout se limpia el temporizador.

```ts
async function hasLocationPermission(): Promise<boolean> {
  try {
    const result = await check(
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
    );
    return result === RESULTS.GRANTED || result === RESULTS.LIMITED;
  } catch {
    return false;
  }
}

async function hasNotificationPermission(): Promise<boolean> {
  try {
    const response = await Notifications.getPermissionsAsync();
    return (response as any).granted;
  } catch {
    return false;
  }
}

async function hasMicrophonePermission(): Promise<boolean> {
  try {
    const result = await check(
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.MICROPHONE
        : PERMISSIONS.ANDROID.RECORD_AUDIO
    );
    return result === RESULTS.GRANTED || result === RESULTS.LIMITED;
  } catch {
    return false;
  }
}
```

**Explicación de las líneas 47–80:**

- **Líneas 47–58**: `hasLocationPermission`: chequea `LOCATION_WHEN_IN_USE`/`ACCESS_FINE_LOCATION`; considera `GRANTED` o `LIMITED` como válidos. Ante error (módulo nativo ausente) retorna `false` (diagnóstico conservador).
- **Líneas 60–67**: `hasNotificationPermission`: consulta estado de notificaciones y retorna `(response as any).granted` (cast `as any`).
- **Líneas 69–80**: `hasMicrophonePermission`: chequea `MICROPHONE`/`RECORD_AUDIO`; misma semántica de `GRANTED`/`LIMITED`.
- **[NOTA]**: `LIMITED` en ubicación iOS puede implicar precisión reducida; aquí se reporta como disponible.

```ts
async function hasLowBattery(): Promise<boolean> {
  try {
    const Battery = await import('expo-battery');
    const level = await Battery.getBatteryLevelAsync();
    return level > 0.05;
  } catch {
    return true;
  }
}
```

**Explicación de las líneas 82–90:**

- **Línea 83**: Importación dinámica de `expo-battery` (solo se carga al ejecutar el diagnóstico).
- **Línea 84**: Obtiene el nivel de batería (0–1).
- **Línea 86**: Retorna `true` si el nivel supera el 5%; es decir, la función devuelve `true` cuando **la batería está suficiente** (no baja).
- **Líneas 87–89**: Ante error (módulo no disponible, p. ej. web), retorna `true` (asume batería OK para no bloquear el diagnóstico).
- `[OBSERVACIÓN TÉCNICA]`: el nombre `hasLowBattery` es engañoso: devuelve `true` cuando la batería **no** está baja (semántica invertida respecto de su nombre). En `run()` se usa como "batería OK" (`if (!battery) messages.push('Batería baja...')`), por lo que el comportamiento es correcto aunque la nomenclatura confunde al lector. En simuladores/emuladores el nivel puede ser 1 o el módulo fallar → siempre `true`.

```ts
let lastResult: DiagnosticResult | null = null;

export const DeviceDiagnostic = {
  async run(): Promise<DiagnosticResult> {
    const messages: string[] = [];

    const [network, location, notifications, microphone, battery] =
      await Promise.all([
        hasNetwork(),
        hasLocationPermission(),
        hasNotificationPermission(),
        hasMicrophonePermission(),
        hasLowBattery(),
      ]);

    if (!network) messages.push('Sin conexión a internet. Las alertas se encolarán localmente.');
    if (!location) messages.push('Permiso de ubicación no concedido. Las alertas se enviarán sin coordenadas.');
    if (!notifications) messages.push('Permiso de notificaciones no concedido.');
    if (!microphone) messages.push('Permiso de micrófono no concedido. El audio no se grabará.');
    if (!battery) messages.push('Batería baja. Algunas funciones en segundo plano pueden estar restringidas.');

    const criticalPass = network;
    const allCritical = location && notifications;
    const optionalMissing = !microphone || !battery;

    let level: ProtectionLevel;
    if (!criticalPass) {
      level = 'stopped';
    } else if (!allCritical || optionalMissing) {
      level = 'limited';
    } else {
      level = 'active';
    }

    lastResult = { level, checks: { network, location, notifications, microphone, battery }, messages };
    return lastResult;
  },
```

**Explicación de las líneas 92–128:**

- **Línea 92**: Variable de módulo que guarda el último resultado.
- **Línea 95**: Método principal que ejecuta el diagnóstico completo.
- **Línea 96**: Arreglo local de mensajes.
- **Líneas 98–105**: Ejecuta las cinco comprobaciones en paralelo (`Promise.all`) y desestructura los resultados.
- **Líneas 107–111**: Acumula mensajes legibles por cada comprobación fallida.
- **Línea 113**: `criticalPass = network`: sin red, la protección se considera detenida (`stopped`), ya que una alerta SOS sin conexión solo puede encolarse.
- **Línea 114**: `allCritical = location && notifications`: ambos se consideran críticos.
- **Línea 115**: `optionalMissing = !microphone || !battery`: micrófono y batería se consideran opcionales para este cálculo.
- **Líneas 117–124**: Regla de decisión: sin red → `stopped`; con red pero faltando críticos u opcionales → `limited`; todo OK → `active`.
- `[OBSERVACIÓN TÉCNICA]` (líneas 113–124): la semántica contradice parcialmente los mensajes: un nivel `stopped` se alcanza solo sin red, no sin permisos (que dan `limited`). Además, la ausencia de micrófono (indispensable para SOS por voz) solo degrada a `limited`, coherente con la decisión de diseño de `PermissionsService.areAllCriticalGranted`.
- **Línea 126**: Almacena el resultado (incluidos mensajes) para acceso posterior.
- **Línea 127**: Devuelve el resultado.

```ts
  getLastResult(): DiagnosticResult | null {
    return lastResult;
  },

  startPolling(intervalMs = 30000): () => void {
    this.run();
    const interval = setInterval(() => this.run(), intervalMs);
    return () => clearInterval(interval);
  },
};
```

**Explicación de las líneas 130–138:**

- **Líneas 130–132**: `getLastResult`: devuelve el último resultado sin re-ejecutar.
- **Líneas 134–138**: `startPolling(intervalMs = 30000)`: ejecuta un diagnóstico inmediato y luego programa otro cada `intervalMs`; retorna una función de limpieza (`clearInterval`).
- `[OBSERVACIÓN TÉCNICA]` (línea 136): `this.run()` depende de que `startPolling` se invoque como método del objeto (`DeviceDiagnostic.startPolling(...)`); si alguien extrae el método (`const { startPolling } = DeviceDiagnostic`), `this` quedaría indefinido. En `index.tsx` se usa correctamente como método.
- **[NOTA]**: el polling no captura resultados para notificar cambios a la UI (la pantalla invoca `run()` por su cuenta); `run()` interno de `startPolling` actualiza `lastResult` pero no dispara eventos.

## Fichas de funciones y métodos

### hasNetwork (líneas 32–45)

- Firma: `async function hasNetwork(): Promise<boolean>`
- Propósito: verificar conectividad a internet contra `clients3.google.com/generate_204` con timeout de 3 s.
- Efectos: petición de red HEAD (expone IP a Google). Riesgo: dependencia de terceros.

### hasLocationPermission (líneas 47–58)

- Firma: `async function hasLocationPermission(): Promise<boolean>`
- Propósito: comprobar permiso de ubicación en primer plano (sin solicitar).

### hasNotificationPermission (líneas 60–67)

- Firma: `async function hasNotificationPermission(): Promise<boolean>`
- Propósito: comprobar permiso de notificaciones vía expo-notifications.

### hasMicrophonePermission (líneas 69–80)

- Firma: `async function hasMicrophonePermission(): Promise<boolean>`
- Propósito: comprobar permiso de micrófono.

### hasLowBattery (líneas 82–90)

- Firma: `async function hasLowBattery(): Promise<boolean>`
- Propósito: devolver `true` si la batería supera el 5% (nombre engañoso; ver observaciones).

### DeviceDiagnostic.run (líneas 95–128)

- Firma: `async run(): Promise<DiagnosticResult>`
- Propósito: ejecutar el diagnóstico completo y devolver nivel + comprobaciones + mensajes.
- Llamado desde: `index.tsx` (líneas 120–121) y `startPolling`.
- Efectos: petición de red; importación dinámica de `expo-battery`; actualiza `lastResult`.

### DeviceDiagnostic.getLastResult (líneas 130–132)

- Firma: `getLastResult(): DiagnosticResult | null`
- Propósito: acceso al último resultado sin re-ejecutar.

### DeviceDiagnostic.startPolling (líneas 134–138)

- Firma: `startPolling(intervalMs = 30000): () => void`
- Propósito: diagnóstico periódico con limpieza. Llamado desde: `index.tsx` (línea 121).
- Riesgo: dependencia de `this` (ver observaciones).

## Clases / interfaces / tipos

| Tipo | Responsabilidad | Campos/valores |
| --- | --- | --- |
| `ProtectionLevel` | Nivel de protección | `'active' \| 'limited' \| 'stopped'` |
| `DiagnosticResult` | Resultado del diagnóstico | `level`, `checks` (`network`, `location`, `notifications`, `microphone`, `battery`), `messages` |

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` (líneas 82–90): el nombre `hasLowBattery` tiene la semántica invertida (devuelve `true` cuando la batería está bien); no es un bug funcional (el uso en `run()` es coherente) pero dificulta el mantenimiento.
- `[OBSERVACIÓN TÉCNICA]` (líneas 32–45): dependencia de un tercero (Google) para el chequeo de red y exposición periódica de la IP del dispositivo; alternativa recomendada: endpoint propio o `@react-native-community/netinfo` combinado con un ping al backend propio.
- `[OBSERVACIÓN TÉCNICA]` (líneas 113–124): sin red → `stopped`; sin permisos críticos → `limited`. Un usuario con permiso de ubicación y notificaciones denegados verá "protección limitada" mientras que sin red verá "detenida". Semántica razonable pero conviene revisar mensajes para que el usuario entienda la gravedad.
- `[OBSERVACIÓN TÉCNICA]` (línea 136): `this.run()` dentro de `startPolling` rompe si el método se desestructura; usar referencia directa al objeto (`DeviceDiagnostic.run()`) sería más robusto.
- `[NOTA]` En web, `hasNetwork` funciona (fetch), `hasLowBattery` retorna `true` (expo-battery no disponible), y los permisos nativos fallan → `false`; en la PWA el diagnóstico mostrará faltas de permisos que la UI web debe interpretar con otra lógica.
- `[NIVEL DE CERTEZA: Confirmado por código]` El diagnóstico no lee ubicación, contactos ni audio; solo comprueba permisos y capacidades.

## Seguridad

- `[BAJO]` Privacidad: cada ejecución de `run()` (y cada 30 s con el polling activo en la pantalla principal) envía una petición `HEAD` a `https://clients3.google.com/generate_204`, revelando la IP pública del usuario a Google. No se envían otros datos, pero es un contacto de red no declarado con un tercero.
- `[INFORMATIVO]` No lee ni transmite datos personales (ubicación, contactos, audio); solo consulta estados de permisos y batería, que permanecen en el dispositivo.
- `[INFORMATIVO]` No hay autenticación, secretos ni logging de datos personales en este servicio.
- `[INFORMATIVO]` El diagnóstico puede revelar indirectamente (en la UI) si el usuario tiene permisos denegados; es información mostrada al propio usuario.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Dependencia de Google para el chequeo de red: si el endpoint está bloqueado o caído, el diagnóstico marcará "sin conexión" erróneamente (falsos `stopped`). Recomendar un chequeo dual (Google + endpoint propio) o solo endpoint propio.
- `[RIESGO]` Polling cada 30 s: consumo de batería/red innecesario mientras la pantalla principal está abierta; considerar pausar el polling cuando la app pasa a segundo plano.
- `[RECOMENDACIÓN]` Renombrar `hasLowBattery` a algo como `hasSufficientBattery` o `batteryOk` para claridad.
- `[RECOMENDACIÓN]` Vincular el resultado del polling a un estado global (Zustand) para que la insignia de protección reaccione sin que cada pantalla ejecute su propio `run()`.
- `[RECOMENDACIÓN]` Documentar en la política de privacidad el contacto con `clients3.google.com/generate_204` o sustituirlo por infraestructura propia.
