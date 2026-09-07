# Archivo: app/permissions.tsx

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | app/permissions.tsx |
| Líneas totales | 296 |
| Lenguaje | TypeScript 5.9 / TSX (React Native) |
| Tamaño (bytes) | 10430 |
| Categoría | Pantalla de gestión de permisos (expo-router, ruta `/permissions`, modal) |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Pantalla de "Permisos requeridos" que muestra el estado en vivo de los permisos
del MVP (micrófono, ubicación en primer plano, notificaciones y, condicionalmente,
ubicación en segundo plano), permite solicitarlos o abrir la configuración del
sistema cuando están bloqueados, informa el origen de la última ubicación conocida
("Prompt Maestro") y da acceso a la carga manual de ubicación. También actúa como
cierre del flujo de onboarding/permisos: cuando todos los permisos críticos están
concedidos habilita el botón "Todo listo" que vuelve a la pantalla anterior.

## Clasificación y estado

- Estado: `FUNCIONALIDAD EXISTENTE` — ruta declarada en `app/_layout.tsx` (líneas
  371–374) como modal con título "Permisos requeridos".
- Accesos detectados: `app/(tabs)/index.tsx` línea 179 (acción "Ver Permisos"
  dentro del `Alert` de error de activación de guardia) y `app/(tabs)/settings.tsx`
  línea 160 (`router.push('/permissions')`, enlace "Ver estado de permisos").
- [NIVEL DE CERTEZA: Confirmado por código]
- Los permisos críticos según el servicio son `locationForeground` y
  `notifications` (ver `areAllCriticalGranted` en `PermissionsService.ts`); el
  micrófono se declara opcional en esta pantalla.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `React, useEffect, useState` | estándar (React) | Estado y refresco inicial | Sí |
| `react-native` (View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator) | estándar | UI de la pantalla | Sí |
| `router` de `expo-router` | externa | Volver (`router.back`) y navegar a `/ubicacion/manual` | Sí |
| `PermissionsService, PermissionsStatus` de `../src/services/PermissionsService` | interna | Chequeo, solicitud, apertura de settings y estado tipado | Sí |
| `color, spacing` de `../src/theme` | interna | Tokens visuales | Sí |
| `borderRadius, shadow` de `../src/theme` | interna | Sin uso real (estilos con literales) | No (`[POTENCIALMENTE NO UTILIZADO]`) |
| `Icon` de `../src/theme/Icon` | interna | Íconos de estado y acciones | Sí |
| `BACKGROUND_LOCATION_ENABLED` de `../src/config/features` | interna | Condiciona la tarjeta de ubicación en segundo plano | Sí |
| `useGuardStore` de `../src/stores/useGuardStore` | interna | Lee `lastLocation` para el panel de origen de ubicación | Sí |

## Componentes que dependen de este archivo

- `app/_layout.tsx`: registro del `Stack.Screen` modal (líneas 371–374).
- `app/(tabs)/index.tsx`: `router.push('/permissions')` desde el `Alert` de error de la guardia (línea 179).
- `app/(tabs)/settings.tsx`: `router.push('/permissions')` desde el enlace "Ver estado de permisos" (línea 160).
- `app/permissions.tsx` mismo navega a `app/ubicacion/manual.tsx` (línea 223).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `PermissionItem` | tipo | type | Contrato de cada tarjeta de permiso | líneas 30–37 |
| `status` | estado inicial `null` | PermissionsStatus \| null | Snapshot del estado de todos los permisos | líneas 52, 56–61 |
| `loading` | estado inicial `true` | boolean | Indica chequeo en curso | líneas 53, 56–61, 140–146 |
| `lastLocation` | selector de store | AlertLocation \| undefined | Última ubicación conocida (origen, precisión, antigüedad) | líneas 54, 216–220 |
| `permissions` | array construido | PermissionItem[] | Tarjetas de permiso a renderizar | líneas 67–118 |
| `BACKGROUND_LOCATION_ENABLED` | flag de features | boolean | Si se agrega la tarjeta de background location | líneas 105–118 |
| Estados de permiso | `'granted' \| 'denied' \| 'blocked' \| 'unavailable'` | string | Valores gestionados por el helper | líneas 120–138 |

## Estructura (funciones / clases / tipos)

- Tipo `PermissionItem` (líneas 30–37).
- Componente `PermissionsScreen` (export default, líneas 51–247).
- Funciones internas: `refresh` (56–61), efecto de montaje (63–65), `statusColor` (120–124), `statusIcon` (126–131), `statusLabel` (133–138).
- No hay clases. `StyleSheet.create` (líneas 249–296).

## Análisis línea por línea

```tsx
/* ============================================================================
* Archivo         : permissions.tsx
* Descripción     : Pantalla de permisos alineada con las capacidades del MVP.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Modal de permisos y transparencia operativa.
* ============================================================================ */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  PermissionsService,
  PermissionsStatus,
} from '../src/services/PermissionsService';
import { color, spacing, borderRadius, shadow } from '../src/theme';
import { Icon } from '../src/theme/Icon';
import { BACKGROUND_LOCATION_ENABLED } from '../src/config/features';
import { useGuardStore } from '../src/stores/useGuardStore';

type PermissionItem = {
  key: keyof PermissionsStatus;
  title: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  description: string;
  critical: boolean;
  onRequest: () => Promise<void>;
};
```

**Explicación de las líneas 1–37:**

Cabecera documental, importaciones y tipo de datos de las tarjetas de permiso.

- **Líneas 1–9**: cabecera del archivo (pantalla de permisos del MVP).
- **Línea 20** (`router`): navegación de expo-router (back y push a `/ubicacion/manual`).
- **Líneas 21–24**: `PermissionsService` encapsula el chequeo/solicitud real de permisos vía `react-native-permissions` y `expo-notifications`; `PermissionsStatus` tipa el resultado (claves `microphone`, `locationForeground`, `locationBackground`, `notifications`).
- **Línea 27**: flag de features que habilita/deshabilita la ubicación en segundo plano.
- **Línea 28**: `useGuardStore` aporta `lastLocation` para el panel de "Origen de ubicación".
- **Líneas 30–37** (`PermissionItem`): por cada permiso se declara su clave tipada contra `PermissionsStatus`, título, ícono, descripción, si es crítico y la acción de solicitud asíncrona.

```tsx
/* ============================================================================
* Función         : PermissionsScreen
* Descripción     : Presenta permisos críticos y opcionales con acciones accesibles.
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : PermissionsService, router
* Ingesta         : Sin argumentos
* Devolución      : JSX.Element
* Uso             : Pantalla /permissions
* ============================================================================ */

export default function PermissionsScreen() {
  const [status, setStatus] = useState<PermissionsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const lastLocation = useGuardStore((s) => s.lastLocation);

  const refresh = async () => {
    setLoading(true);
    const s = await PermissionsService.checkAll();
    setStatus(s);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const permissions: PermissionItem[] = [
    {
      key: 'microphone',
      title: 'Micrófono',
      icon: 'mic' as const,
      description:
        'Opcional. Solo se usa si decides adjuntar un mensaje de voz a la alerta.',
      critical: false,
      onRequest: async () => {
        await PermissionsService.requestMicrophone();
        await refresh();
      },
    },
    {
      key: 'locationForeground',
      title: 'Ubicación (cuando se usa)',
      icon: 'location-on' as const,
      description: 'Para enviar tu posición a los contactos.',
      critical: true,
      onRequest: async () => {
        await PermissionsService.requestLocationForeground();
        await refresh();
      },
    },
    {
      key: 'notifications',
      title: 'Notificaciones',
      icon: 'notifications' as const,
      description:
        'Necesarias para recordatorios locales y para avisarte del estado de la app.',
      critical: true,
      onRequest: async () => {
        await PermissionsService.requestNotifications();
        await refresh();
      },
    },
  ];
```

**Explicación de las líneas 39–103:**

Componente principal, estado, refresco inicial y definición de las tres tarjetas
base de permiso.

- **Línea 51**: componente exportado por defecto.
- **Línea 52** (`status`): snapshot del estado de permisos; `null` antes del primer chequeo.
- **Línea 53** (`loading`): controla el spinner inicial.
- **Línea 54**: suscripción al selector `lastLocation` del store de guardia (ubicación reciente).
- **Líneas 56–61** (`refresh`): ejecuta `PermissionsService.checkAll()` y actualiza estado; la pantalla queda en `loading` durante el chequeo.
- **Líneas 63–65**: `useEffect` de montaje que dispara el primer `refresh()` (sin dependencias → una sola vez).
- **Líneas 67–103**: array `permissions` con las tarjetas base:
  - `microphone` (líneas 69–79): opcional (`critical: false`), sólo para adjuntar audio a la alerta. Solicita con `requestMicrophone()` y refresca.
  - `locationForeground` (líneas 81–90): crítico, para enviar la posición a contactos. Solicita `requestLocationForeground()`.
  - `notifications` (líneas 92–102): crítico, para recordatorios y avisos. Solicita `requestNotifications()`.

```tsx
  if (BACKGROUND_LOCATION_ENABLED) {
    permissions.push({
      key: 'locationBackground',
      title: 'Ubicación en segundo plano',
      icon: 'map' as const,
      description:
        'Opcional. Solo se habilita en compilaciones que realmente usen seguimiento en segundo plano.',
      critical: false,
      onRequest: async () => {
        await PermissionsService.requestLocationBackground();
        await refresh();
      },
    });
  }

  const statusColor = (s: string) => {
    if (s === 'granted') return color.safe;
    if (s === 'blocked') return color.danger;
    return color.warning;
  };

  const statusIcon = (s: string): React.ComponentProps<typeof Icon>['name'] => {
    if (s === 'granted') return 'check-circle';
    if (s === 'blocked') return 'cancel';
    if (s === 'denied') return 'warning';
    return 'help';
  };

  const statusLabel = (s: string) => {
    if (s === 'granted') return 'Concedido';
    if (s === 'blocked') return 'Bloqueado';
    if (s === 'denied') return 'No concedido';
    return 'No disponible';
  };
```

**Explicación de las líneas 105–138:**

Tarjeta condicional de ubicación en segundo plano y helpers de presentación de
estado.

- **Líneas 105–118**: si `BACKGROUND_LOCATION_ENABLED` es verdadero se agrega la tarjeta `locationBackground` (opcional), con `requestLocationBackground()` que internamente devuelve `'unavailable'` si el flag está apagado.
- **Líneas 120–124** (`statusColor`): mapea estado a color: concedido → verde (`safe`), bloqueado → rojo (`danger`), resto (denied/unavailable) → ámbar (`warning`).
- **Líneas 126–131** (`statusIcon`): ícono por estado: `check-circle`, `cancel`, `warning` o `help`.
- **Líneas 133–138** (`statusLabel`): etiqueta en español por estado.

```tsx
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={color.danger} size="large" />
      </View>
    );
  }

  const allCriticalGranted =
    status && PermissionsService.areAllCriticalGranted(status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Permisos requeridos</Text>
      <Text style={styles.subtitle}>
        SafeAlert solo pide permisos vinculados al MVP real: ubicación para el SOS,
        notificaciones para recordatorios y micrófono opcional para audio.
      </Text>

      {permissions.map((perm) => {
        const currentStatus = status?.[perm.key] ?? 'unavailable';
        const isGranted = currentStatus === 'granted';
        const isBlocked = currentStatus === 'blocked';

        return (
          <View key={perm.key} style={styles.permCard}>
            <View style={styles.permHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                <Icon name={perm.icon} size={20} color={color.textPrimary} />
                <Text style={styles.permTitle}>
                  {perm.title}
                  {perm.critical && (
                    <Text style={styles.requiredBadge}> (requerido)</Text>
                  )}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name={statusIcon(currentStatus)} size={16} color={statusColor(currentStatus)} />
                <Text style={[styles.permStatus, { color: statusColor(currentStatus) }]}>
                  {statusLabel(currentStatus)}
                </Text>
              </View>
            </View>
            <Text style={styles.permDesc}>{perm.description}</Text>
            {!isGranted && (
              <TouchableOpacity
                style={[
                  styles.permButton,
                  isBlocked && styles.permButtonBlocked,
                ]}
                onPress={
                  isBlocked
                    ? () => PermissionsService.openAppSettings()
                    : perm.onRequest
                }
                accessibilityRole="button"
                accessibilityLabel={isBlocked ? `Abrir configuración para ${perm.title}` : `Conceder permiso de ${perm.title}`}
                accessibilityHint={perm.critical ? 'Es un permiso necesario para el funcionamiento principal del MVP' : 'Es un permiso opcional para funciones complementarias'}
              >
                <Text style={styles.permButtonText}>
                  {isBlocked ? 'Abrir configuración' : 'Conceder permiso'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
```

**Explicación de las líneas 140–206:**

Render condicional de carga, cálculo de permisos críticos y mapeo de tarjetas.

- **Líneas 140–146**: durante el primer chequeo muestra sólo un `ActivityIndicator` centrado.
- **Líneas 148–149**: `allCriticalGranted` = `status` existe y `areAllCriticalGranted` devuelve verdadero (exige `locationForeground === 'granted'` y `notifications === 'granted'`; el micrófono no cuenta).
- **Líneas 151–157**: cabecera de la pantalla y subtítulo de transparencia ("solo pide permisos vinculados al MVP real").
- **Línea 159**: itera sobre `permissions`.
- **Línea 160**: `currentStatus` con fallback `'unavailable'` si aún no hay snapshot.
- **Líneas 161–162**: banderas de presentación.
- **Líneas 165–204** (tarjeta por permiso): encabezado con ícono y título (marcando "(requerido)" si `critical`), estado coloreado a la derecha, descripción y, si no está concedido, un botón de acción:
  - Líneas 190–194: si `blocked`, el botón abre la configuración del sistema (`PermissionsService.openAppSettings()`); en otro caso ejecuta `perm.onRequest` (solicitud + refresco).
  - Líneas 195–197: accesibilidad explícita con `accessibilityRole`, `accessibilityLabel` e `accessibilityHint` según el estado.
  - Líneas 199–202: texto del botón "Abrir configuración" o "Conceder permiso".

```tsx
      {/* Prompt Maestro: mostrar origen de ubicación actual */}
      <View style={styles.permCard}>
        <View style={styles.permHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
            <Icon name="my-location" size={20} color={color.textPrimary} />
            <Text style={styles.permTitle}>Origen de ubicación</Text>
          </View>
        </View>
        <Text style={styles.permDesc}>
          {lastLocation?.source
            ? `Origen: ${lastLocation.source}${lastLocation.accuracy ? ` · Precisión: ${Math.round(lastLocation.accuracy)}m` : ''}${lastLocation.isStale ? ' · (dato previo)' : ''}`
            : 'Sin ubicación registrada aún'}
        </Text>
        <TouchableOpacity
          style={styles.permButton}
          onPress={() => router.push('/ubicacion/manual')}
          accessibilityRole="button"
          accessibilityLabel="Ingresar ubicación manualmente"
        >
          <Text style={styles.permButtonText}>Ingresar ubicación manual</Text>
        </TouchableOpacity>
      </View>

      {allCriticalGranted && (
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Cerrar pantalla de permisos"
          accessibilityHint="Vuelve a la pantalla anterior porque los permisos críticos ya están listos"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon name="check-circle" size={20} color={color.textInverse} />
            <Text style={styles.doneButtonText}>Todo listo</Text>
          </View>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
```

**Explicación de las líneas 208–247:**

Panel "Prompt Maestro" de origen de ubicación y botón de cierre.

- **Líneas 208–229**: tarjeta adicional "Origen de ubicación" que muestra, desde `lastLocation`, el origen (`GPS`, `NAVEGADOR`, `MANUAL`, `IP`, etc.), la precisión redondeada en metros si existe y la marca "(dato previo)" si `isStale`; si no hay ubicación muestra "Sin ubicación registrada aún".
- **Líneas 221–228**: botón "Ingresar ubicación manual" que navega a `router.push('/ubicacion/manual')` (la ruta de `app/ubicacion/manual.tsx`).
- **Líneas 231–244**: botón verde "Todo listo" visible sólo si `allCriticalGranted`; con `router.back()` cierra el modal de permisos.
- **Línea 246–247**: cierre del ScrollView y del componente.

```tsx
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 22, fontWeight: 'bold', color: color.textPrimary },
  subtitle: { fontSize: 14, color: color.textSecondary, lineHeight: 20 },

  permCard: {
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  permHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  permTitle: { fontSize: 15, fontWeight: '600', color: color.textPrimary, flex: 1 },
  requiredBadge: { fontSize: 12, color: color.danger, fontWeight: '400' },
  permStatus: { fontSize: 13, fontWeight: '500' },
  permDesc: { fontSize: 13, color: color.textSecondary, lineHeight: 18 },
  permButton: {
    backgroundColor: color.danger,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  permButtonBlocked: { backgroundColor: color.neutral400 },
  permButtonText: { color: color.textInverse, fontWeight: '600', fontSize: 14 },

  doneButton: {
    backgroundColor: color.safe,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: { color: color.textInverse, fontWeight: 'bold', fontSize: 16 },
});
```

**Explicación de las líneas 249–296:**

Hoja de estilos de la pantalla.

- **Líneas 250–252** (`container`, `content`, `centered`): layout base y centrado del spinner.
- **Líneas 254–255** (`title`, `subtitle`): encabezado de la pantalla.
- **Líneas 257–267** (`permCard`): tarjeta blanca de superficie con radio 12 y sombra sutil.
- **Líneas 268–274** (`permHeader`): fila con distribución entre extremos y ajuste de línea.
- **Líneas 275–277** (`permTitle`, `requiredBadge`, `permStatus`): tipografías de título, insignia "(requerido)" y estado.
- **Líneas 279–286** (`permButton`, `permButtonBlocked`, `permButtonText`): botón rojo de acción; variante gris (`neutral400`) cuando está bloqueado.
- **Líneas 288–295** (`doneButton`, `doneButtonText`): botón verde de cierre ("Todo listo").
- [NOTA] Se usan `borderRadius`, `elevation` y sombras literales; los tokens `borderRadius` y `shadow` importados no se emplean.

## Fichas de funciones y métodos

### refresh (líneas 56–61)

- Firma: `const refresh = async () => Promise<void>`.
- Propósito técnico: reconsultar el estado de todos los permisos vía `PermissionsService.checkAll()` y volcarlo en estado; propósito funcional: mantener la pantalla sincronizada tras cada solicitud.
- Parámetros: ninguno. Retorno: `Promise<void>`.
- Excepciones: no gestiona errores (si `checkAll` lanza, `loading` quedaría en true; ver riesgo).
- Dependencias: `setLoading`, `setStatus`, `PermissionsService.checkAll`.
- Flujo: 1) `setLoading(true)`; 2) `await checkAll()`; 3) `setStatus(s)`; 4) `setLoading(false)`.
- Llamado desde: efecto de montaje (63–65) y desde cada `onRequest` de las tarjetas.
- Efectos secundarios: muta estado local. Riesgos: ausencia de try/finally (riesgo de spinner infinito si el servicio falla).

### statusColor (líneas 120–124)

- Firma: `(s: string) => color`.
- Propósito: asignar color semántico al estado (granted → verde, blocked → rojo, resto → ámbar).
- Llamado desde: render de tarjetas. Sin efectos secundarios.

### statusIcon (líneas 126–131)

- Firma: `(s: string) => React.ComponentProps<typeof Icon>['name']`.
- Propósito: ícono por estado (`check-circle`, `cancel`, `warning`, `help`).
- Llamado desde: render de tarjetas.

### statusLabel (líneas 133–138)

- Firma: `(s: string) => string`.
- Propósito: etiqueta legible en español del estado.
- Llamado desde: render de tarjetas.

## Clases / interfaces / tipos

- `PermissionItem` (líneas 30–37): campos `key: keyof PermissionsStatus`, `title`, `icon` (tipado contra `Icon`), `description`, `critical: boolean`, `onRequest: () => Promise<void>`.
- Tipos externos usados: `PermissionsStatus` (interfaz de `PermissionsService.ts` con las cuatro claves), `AlertLocation` implícito en `lastLocation` del `useGuardStore`.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] `refresh` sin `try/finally`: un fallo de `checkAll()` dejaría `loading` en `true` y la pantalla bloqueada en el spinner. Impacto: medio.
- [OBSERVACIÓN TÉCNICA] Imports `borderRadius` y `shadow` (línea 25) sin uso → `[POTENCIALMENTE NO UTILIZADO]`.
- [OBSERVACIÓN TÉCNICA] El micrófono se declara "Opcional" en esta pantalla y no integra `areAllCriticalGranted`, pero el flujo de guardia real puede requerirlo para el reconocimiento por voz según `WAKE_WORD_ENABLED`/`AUDIO_GUARD_ENABLED`; la definición de "crítico" depende del flag de funciones. [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] `lastLocation` se muestra con `Math.round` de precisión y origen; si el origen proviene de una carga manual (`MANUAL`), la precisión es 0 y no se muestra.
- [NOTA] En plataforma web, `checkAll()` devuelve todos los estados como `'unavailable'` (ver `PermissionsService.ts`), por lo que esta pantalla en web nunca mostraría "Todo listo".
- [NIVEL DE CERTEZA: Confirmado por código] El estado crítico requerido es ubicación en primer plano + notificaciones.

## Seguridad

| Severidad | Hallazgo |
| --- | --- |
| MEDIO | La pantalla muestra al usuario datos de ubicación (origen, precisión, antigüedad) en claro en la UI; no hay riesgo de transmisión adicional porque sólo lee del store local, pero es información sensible mostrada en pantalla sin autenticación adicional (depende del bloqueo del dispositivo). |
| BAJO | Botón que abre los ajustes del sistema (`openSettings`) sin validación de regreso: tras volver, la pantalla no refresca automáticamente el estado del permiso (el usuario debe salir y reentrar o el estado queda desactualizado hasta el próximo `refresh`).
| INFORMATIVO | No hay secretos, tokens, endpoints ni logging de datos personales en este archivo. El manejo de permisos delega en `react-native-permissions` y `expo-notifications` (sistema operativo). |

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Spinner infinito ante error de `checkAll()`: envolver `refresh` en `try/catch/finally`.
- [RIESGO] Estado desactualizado tras volver de los ajustes del sistema: recomendar refrescar en el evento de reanudación de la app (AppState) o al volver.
- [RECOMENDACIÓN] Alinear el concepto de "permiso crítico" con los flags de features reales (micrófono necesario si la guardia por voz está activa) para no mostrar una pantalla contradictoria.
- [RECOMENDACIÓN] Eliminar los imports no usados (`borderRadius`, `shadow`).
- [RECOMENDACIÓN] Considerar validar en web (donde todos los permisos son `unavailable`) para no dejar la pantalla sin salida ("Todo listo" nunca aparece); ofrecer un botón de cierre incondicional.
