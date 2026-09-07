# Archivo: app/(tabs)/history.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| app/(tabs)/history.tsx | 233 | TypeScript 5.9 / TSX (React Native + expo-router) | 7630 | Pantalla de historial de alertas (tab Historial) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Muestra el historial de alertas del usuario con estado de entrega por contacto. Lee en tiempo real (Firestore `onSnapshot`) las últimas 20 alertas de la colección `users/{userId}/alerts` ordenadas por `triggeredAt` descendente, y presenta cada una con: estado global (enviada/envío parcial/pendiente/falló), fecha y hora (locale `es-AR`), palabra que la activó, enlace de mapa (si existe), marca de prueba y el detalle de entregas por contacto (estado SMS y error si lo hay). Incluye indicador de carga, estado vacío, encabezado con el total y `RefreshControl` para refresco manual.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE — [NIVEL DE CERTEZA: Confirmado por código]. La suscripción a Firestore está activa y el render cubre todos los estados del tipo `Alert`. No hay TODO/FIXME.

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `react` (`useEffect`, `useState`, `useCallback`) | Estándar | Estado y suscripción | Sí |
| `react-native` (`View`, `Text`, `FlatList`, `StyleSheet`, `ActivityIndicator`, `RefreshControl`) | Estándar | UI de lista | Sí (todas) |
| `../../src/config/firebase` (`alertsCol`) | Interna | Colección `users/{uid}/alerts` | Sí |
| `../../src/stores/useSettingsStore` | Interna | `userId` de sesión | Sí |
| `../../src/types/Alert` (`Alert`) | Interna | Tipo de dato de alerta | Sí |
| `../../src/theme` (`color`, `spacing`) | Interna | Colores y espaciado | Sí |
| `../../src/theme/Icon` | Interna | Iconos de estado | Sí |
| `../../src/theme/Card` | Interna | Tarjeta por alerta | Sí |

## Componentes que dependen de este archivo

Ningún import directo: es la ruta `history` del grupo `(tabs)`, registrada en `app/(tabs)/_layout.tsx` (tab "Historial"). [NIVEL DE CERTEZA: Confirmado por código].

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `PAGE_SIZE` | `20` | number | Límite de alertas cargadas por consulta | Líneas 28, 105 |
| `alerts` | `[]` inicial | Alert[] | Lista visible de alertas | 94, 108-117, 151-161 |
| `loading` | `true` inicial | boolean | Estado de primera carga | 95, 100-101, 116-121, 131 |
| `refreshing` | `false` inicial | boolean | Estado del pull-to-refresh | 96, 117, 121, 127-129, 166 |
| `userId` | Store de sesión | string | Identificador para consultar alertas | 97, 100-105, 139 |
| Estados de alerta mapeados | `sent`, `partial`, `pending`, `failed` (+ default) | string | Icono/color/etiqueta por estado | 31–37 |

## Estructura (funciones / clases / tipos)

- `statusConfig(status: string)` — mapeo estado → (icono, color, etiqueta) (líneas 30–38).
- `AlertHistoryItem({ item })` — tarjeta de una alerta (líneas 40–91).
- `HistoryScreen(): JSX.Element` — pantalla por defecto (líneas 93–177), con `onRefresh` interno (líneas 127–129).
- `styles` — hoja de estilos (líneas 179–233).
- Tipo importado: `Alert` (de `src/types/Alert`), usado también con `Omit<Alert, 'id'>`.

## Análisis línea por línea

**Bloque de las líneas 1–28 (cabecera, imports y constante `PAGE_SIZE`):**

```tsx
/* ============================================================================
* Archivo         : history.tsx
* Descripción     : Historial transparente de alertas con estado de entrega
*                   por contacto. Permite ver alertas pasadas y confirmaciones.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Tab de historial en navegación inferior.
* ============================================================================ */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { alertsCol } from '../../src/config/firebase';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { Alert } from '../../src/types/Alert';
import { color, spacing } from '../../src/theme';
import { Icon } from '../../src/theme/Icon';
import { Card } from '../../src/theme/Card';

const PAGE_SIZE = 20;
```

**Explicación de las líneas 1–28:**

- **Líneas 1–10**: cabecera documental (versión 1.0.0).
- **Línea 12**: hooks de React.
- **Líneas 13–20**: primitivas de RN para lista, carga y refresco.
- **Línea 21**: `alertsCol` — colección Firestore `users/{uid}/alerts` (definida en `src/config/firebase`).
- **Líneas 22–23**: store de sesión y tipo `Alert`.
- **Líneas 24–26**: tema e iconos.
- **Línea 28**: `PAGE_SIZE = 20` — tope de la consulta inicial (no hay paginación incremental).

**Bloque de las líneas 30–68 (mapeo de estado e inicio de la tarjeta de alerta):**

```tsx
function statusConfig(status: string) {
  switch (status) {
    case 'sent': return { icon: 'check-circle' as const, color: color.safe, label: 'Enviada' };
    case 'partial': return { icon: 'warning' as const, color: color.warning, label: 'Envío parcial' };
    case 'pending': return { icon: 'schedule' as const, color: color.warning, label: 'Pendiente' };
    case 'failed': return { icon: 'close' as const, color: color.danger, label: 'Falló' };
    default: return { icon: 'help' as const, color: color.neutral400, label: status };
  }
}

function AlertHistoryItem({ item }: { item: Alert }) {
  const cfg = statusConfig(item.status);
  const date = new Date(item.triggeredAt);
  const isTest = item.isTest;

  return (
    <Card style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <Icon name={cfg.icon} size={20} color={cfg.color} />
        <View style={{ flex: 1 }}>
          <Text style={styles.alertStatus}>{cfg.label}</Text>
          {isTest ? (
            <Text style={styles.alertTestBadge}>PRUEBA</Text>
          ) : null}
        </View>
        <Text style={styles.alertDate}>
          {date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
        </Text>
        <Text style={styles.alertTime}>
          {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <Text style={styles.alertTrigger}>
        Activada por: <Text style={{ fontWeight: '700' }}>{item.triggerWord}</Text>
      </Text>

      {item.mapsLink ? (
        <Text style={styles.alertLink} numberOfLines={1}>{item.mapsLink}</Text>
      ) : null}
```

**Explicación de las líneas 30–68:**

- **Líneas 30–38**: `statusConfig` — tabla de estados: `sent` → "Enviada" (verde, check), `partial` → "Envío parcial" (ámbar, warning), `pending` → "Pendiente" (ámbar, reloj), `failed` → "Falló" (rojo, close); desconocidos → icono de ayuda con la etiqueta cruda.
- **Línea 40**: `AlertHistoryItem` recibe una alerta tipada.
- **Líneas 41–43**: calcula configuración visual, `Date` de `triggeredAt` y si es alerta de prueba.
- **Líneas 45–61**: tarjeta: cabecera con icono de estado, etiqueta ("Enviada", etc.), insignia "PRUEBA" cuando `isTest`, y fecha/día-mes y hora en formato `es-AR`.
- **Líneas 63–65**: texto "Activada por:" con la palabra de activación en negrita.
- **Líneas 67–69**: si existe `mapsLink`, lo muestra en una línea (truncado). [NOTA] El enlace de mapa puede contener coordenadas de ubicación del usuario; se muestra como texto plano (no es un enlace clicable aquí).

**Bloque de las líneas 71–91 (detalle de entregas por contacto y cierre de la tarjeta):**

```tsx
      {item.contacts.length > 0 ? (
        <View style={styles.contactsSection}>
          <Text style={styles.contactsTitle}>Entregas:</Text>
          {item.contacts.map((contact, idx) => (
            <View key={idx} style={styles.contactRow}>
              <Icon
                name={contact.smsStatus === 'sent' ? 'check-circle' : contact.smsStatus === 'failed' ? 'close' : 'schedule'}
                size={14}
                color={contact.smsStatus === 'sent' ? color.safe : contact.smsStatus === 'failed' ? color.danger : color.warning}
              />
              <Text style={styles.contactName}>{contact.name}</Text>
              {contact.lastError ? (
                <Text style={styles.contactError} numberOfLines={1}>{contact.lastError}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
```

**Explicación de las líneas 71–91:**

- **Líneas 71–88**: sección "Entregas:" con una fila por contacto: icono según `smsStatus` (`sent` verde check, `failed` rojo close, resto ámbar reloj), nombre del contacto y, si hay `lastError`, el texto del error en una línea (color `danger`). [NOTA] `key={idx}` usa el índice como clave (ver Observaciones).
- **Líneas 89–91**: cierre de la tarjeta y de `AlertHistoryItem`.

**Bloque de las líneas 93–125 (pantalla: estado y suscripción en tiempo real):**

```tsx
export default function HistoryScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const userId = useSettingsStore((s) => s.userId);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const ref = alertsCol(userId).orderBy('triggeredAt', 'desc').limit(PAGE_SIZE);

    const unsub = ref.onSnapshot((snapshot) => {
      const items: Alert[] = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as Omit<Alert, 'id'>;
        if (data) {
          items.push({ id: doc.id, ...data });
        }
      });
      setAlerts(items);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.warn('[HistoryScreen] Error fetching alerts:', error);
      setLoading(false);
      setRefreshing(false);
    });

    return unsub;
  }, [userId]);
```

**Explicación de las líneas 93–125:**

- **Líneas 94–96**: estado local: lista, carga inicial y refresco.
- **Línea 97**: `userId` desde el store de sesión.
- **Líneas 99–103**: sin `userId` no consulta: solo apaga `loading` (luego la UI muestra "Sesión no disponible").
- **Líneas 105–106**: referencia a `users/{userId}/alerts` ordenada por `triggeredAt` descendente y limitada a `PAGE_SIZE` (20).
- **Líneas 107–122**: suscripción `onSnapshot` en tiempo real: reconstruye la lista con `{ id: doc.id, ...data }` (conversión `Omit<Alert, 'id'>`); al recibir datos o error apaga `loading` y `refreshing`. El error se registra con `console.warn` (no se muestra al usuario).
- **Líneas 124–125**: devuelve `unsub` como limpieza (cancelar suscripción al desmontar o cambiar `userId`).

**Bloque de las líneas 127–177 (refresco y render condicional con lista):**

```tsx
  const onRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={color.danger} size="large" />
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.centered}>
        <Icon name="error" size={48} color={color.neutral400} />
        <Text style={styles.emptyTitle}>Sesión no disponible</Text>
        <Text style={styles.emptySub}>Iniciá sesión para ver tu historial.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {alerts.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="history" size={64} color={color.neutral400} />
          <Text style={styles.emptyTitle}>Sin alertas aún</Text>
          <Text style={styles.emptySub}>
            Las alertas que envíes aparecerán aquí con el detalle de entregas.
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <AlertHistoryItem item={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.danger} />
          }
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              {alerts.length} alerta{alerts.length !== 1 ? 's' : ''}
            </Text>
          }
        />
      )}
    </View>
  );
}
```

**Explicación de las líneas 127–177:**

- **Líneas 127–129**: `onRefresh` — activa `refreshing`; la recarga real ocurre porque al hacer pull se re-emite un snapshot de la suscripción existente (el callback apaga `refreshing`). No re-ejecuta la consulta explícitamente. [NIVEL DE CERTEZA: Inferido].
- **Líneas 131–137**: spinner mientras la primera carga.
- **Líneas 139–147**: sin sesión: icono de error y textos "Sesión no disponible" / "Iniciá sesión para ver tu historial.".
- **Líneas 149–158**: contenedor principal; lista vacía → estado vacío "Sin alertas aún" con icono de historial y subtítulo explicativo.
- **Líneas 160–174**: `FlatList`: clave por `item.id`, `renderItem` con `AlertHistoryItem`, `RefreshControl` con tinte rojo, y cabecera "N alertas" (plural correcto).

**Bloque de las líneas 179–233 (hoja de estilos):**

```tsx
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 40, gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: color.textPrimary },
  emptySub: {
    fontSize: 14, color: color.textSecondary, textAlign: 'center', lineHeight: 20,
  },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 100 },
  listHeader: {
    fontSize: 13, color: color.textSecondary, textAlign: 'center',
    marginBottom: spacing.sm,
  },

  alertCard: { gap: spacing.sm },
  alertHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  alertStatus: { fontSize: 15, fontWeight: '600', color: color.textPrimary },
  alertTestBadge: {
    fontSize: 11, fontWeight: '700', color: color.warning, marginTop: 1,
  },
  alertDate: {
    fontSize: 12, color: color.textSecondary,
  },
  alertTime: {
    fontSize: 12, color: color.textSecondary,
  },

  alertTrigger: {
    fontSize: 13, color: color.textSecondary,
  },
  alertLink: {
    fontSize: 12, color: color.safe, marginTop: -4,
  },

  contactsSection: {
    borderTopWidth: 1, borderTopColor: color.border, paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  contactsTitle: {
    fontSize: 12, fontWeight: '600', color: color.textSecondary,
  },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
  },
  contactName: {
    fontSize: 13, color: color.textPrimary, flex: 1,
  },
  contactError: {
    fontSize: 11, color: color.danger, maxWidth: '40%',
  },
});
```

**Explicación de las líneas 179–233:**

- **Líneas 180–188**: contenedor, estados centrados y textos vacíos.
- **Líneas 189–193**: lista con padding inferior amplio (100, para no tapar la barra de tabs) y cabecera centrada.
- **Líneas 195–207**: tarjeta de alerta, cabecera de fila y tipografías de estado/prueba/fecha/hora.
- **Líneas 210–215**: línea de palabra de activación y enlace de mapa (verde, sin ajuste de línea por defecto).
- **Líneas 217–232**: sección de entregas separada con borde superior, nombre en flex 1 y error limitado al 40% del ancho con truncado.

## Fichas de funciones y métodos

### statusConfig (líneas 30–38)

- Firma: `function statusConfig(status: string): { icon: ...; color: string; label: string }`
- Propósito: unificar la representación visual de cada estado de alerta.
- Parámetros: `status` (cadena del documento). Retorno: config icono/color/label.
- Fallback: estados desconocidos muestran la cadena original con icono `help`.

### AlertHistoryItem (líneas 40–91)

- Firma: `function AlertHistoryItem({ item }: { item: Alert })`
- Propósito: pintar una alerta del historial con su detalle de entregas.
- Parámetros: `item` (tipo `Alert`). Retorno: JSX de tarjeta.
- Dependencias: `statusConfig`, formato de fecha `es-AR`, `Icon`, `Card`.
- Riesgos: asume campos del tipo `Alert` presentes en Firestore (triggerWord, contacts, smsStatus); documentos de versiones antiguas sin estos campos renderizarían vacíos.

### HistoryScreen (líneas 93–177)

- Firma: `export default function HistoryScreen(): JSX.Element`
- Propósito: consulta en tiempo real del historial y su render.
- Parámetros: ninguno. Retorno: spinner / estado sin sesión / estado vacío / lista.
- Dependencias: `alertsCol`, `userId` del store, `FlatList`.
- Flujo: efecto por `userId` que suscribe a `onSnapshot` con orden y límite; limpieza `unsub`.
- Efectos secundarios: suscripción Firestore activa mientras la pantalla está montada; logs de error en consola.

## Clases / interfaces / tipos

- Tipo importado `Alert` (de `src/types/Alert`), usado directamente y como `Omit<Alert, 'id'>` al reconstruir documentos.
- Sin clases.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Línea 105: la consulta está limitada a las 20 alertas más recientes y no implementa paginación (`onEndReached`); el historial más antiguo queda inaccesible desde la UI. [NIVEL DE CERTEZA: Confirmado por código].
- [OBSERVACIÓN TÉCNICA] Líneas 74–85: `key={idx}` usa el índice de la lista como clave de React; si los contactos cambian de orden, React puede reutilizar filas incorrectamente. Preferible un id estable del contacto. Impacto: bajo (lista estática por alerta).
- [OBSERVACIÓN TÉCNICA] Líneas 127–129 y 107–122: el pull-to-refresh solo re-activa `refreshing`; la recarga depende de que Firestore emita un nuevo snapshot (o de un error). No fuerza una re-consulta explícita; si no hay cambios remotos el indicador puede quedarse brevemente activo hasta el siguiente evento. [NIVEL DE CERTEZA: Inferido].
- [OBSERVACIÓN TÉCNICA] El manejo de error de la suscripción (líneas 118–122) apaga los estados pero deja la lista anterior visible y no informa al usuario del fallo (solo `console.warn`).
- [NOTA] `mapsLink` se muestra como texto (posibles coordenadas del usuario); no es interactivo en esta pantalla.
- [NOTA] `lastError` del contacto (mensaje del proveedor/backend SMS) se muestra en la UI; conviene confirmar que no incluya datos internos.

## Seguridad

- [MEDIO] La consulta usa `alertsCol(userId)` con `userId` proveniente del store local. [NIVEL DE CERTEZA: Confirmado por código]. Si el `userId` se obtuvo del fallback de teléfono (ver `app/_layout.tsx`) o es manipulable, la consulta podría apuntar a alertas de otro usuario; la protección efectiva depende de las reglas de Firestore y de que el path incluya realmente el `auth.uid` verificado (backend, fuera de este archivo).
- [INFORMATIVO] Se muestran datos personales: nombres de contacto, estado de envío, errores y enlaces de mapa con ubicación. Revisar que las reglas de lectura de `users/{uid}/alerts` estén restringidas al propietario.
- [INFORMATIVO] Sin tokens/secretos en el archivo; los errores solo van a consola.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] [RECOMENDACIÓN] Implementar paginación o un rango temporal para acceder a más de 20 alertas.
- [RIESGO] [RECOMENDACIÓN] Sustituir `key={idx}` por un identificador estable de contacto.
- [RECOMENDACIÓN] Mejorar el manejo de errores de la suscripción mostrando un aviso al usuario (p. ej. banner de "sin conexión") en lugar de solo consola.
- [RECOMENDACIÓN] Confirmar reglas Firestore restrictivas sobre `users/{uid}/alerts` (propietario) dado que el `userId` proviene del cliente.
