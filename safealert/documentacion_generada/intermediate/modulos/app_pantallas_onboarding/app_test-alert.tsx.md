# Archivo: app/test-alert.tsx

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | app/test-alert.tsx |
| Líneas totales | 195 |
| Lenguaje | TypeScript 5.9 / TSX (React Native) |
| Tamaño (bytes) | 7077 |
| Categoría | Pantalla de prueba de alerta (expo-router, ruta `/test-alert`, modal) |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Pantalla que permite al usuario ejecutar una alerta de prueba (test) contra el
flujo canónico de alerta de SafeAlert, sin enviar SMS/WhatsApp reales ni grabar
audio. Explica de antemano qué hará la prueba, muestra la cantidad y el detalle de
los contactos activos que recibirían el mensaje, invoca el disparador de prueba
(`triggerTest` del hook `useAlert`, que llama a `AlertService.send('test', true)`),
refleja el estado en vivo del envío (obteniendo ubicación → enviando → enviado) y
presenta el resultado con el enlace de mapas de la última alerta.

## Clasificación y estado

- Estado: `FUNCIONALIDAD EXISTENTE` — ruta registrada en `app/_layout.tsx` (líneas
  375–378) como modal con título "Probar Alerta".
- Acceso detectado: `app/(tabs)/index.tsx` líneas 359–362, botón "Probar alerta
  (sin SMS real)" que navega con `router.push('/test-alert')`.
- [NIVEL DE CERTEZA: Confirmado por código]
- La pantalla no dispara SMS reales por sí misma: delega en `AlertService.send`
  con el modo test, cuya semántica de "sin SMS real" está en el servicio.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `React, useState` | estándar (React) | Estado de la prueba ejecutada | Sí |
| `react-native` (View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert) | estándar | UI y alertas | Sí |
| `router` de `expo-router` | externa | Volver (`router.back`) | Sí |
| `useAlert` de `../src/hooks/useAlert` | interna | `triggerTest`, `alertPhase`, `lastAlert` | Sí |
| `useContactsStore` de `../src/stores/useContactsStore` | interna | Lista de contactos activos (`activeContacts()`) | Sí |
| `color, spacing` de `../src/theme` | interna | Tokens visuales | Sí |
| `borderRadius, shadow` de `../src/theme` | interna | Sin uso real (estilos con literales) | No (`[POTENCIALMENTE NO UTILIZADO]`) |
| `Icon` de `../src/theme/Icon` | interna | Íconos informativos y de estado | Sí |

## Componentes que dependen de este archivo

- `app/_layout.tsx`: registro del `Stack.Screen` modal (líneas 375–378).
- `app/(tabs)/index.tsx`: botón "Probar alerta (sin SMS real)" → `router.push('/test-alert')` (líneas 359–362).
- El hook `useAlert` (src/hooks/useAlert.ts) es la fachada que conecta con `AlertService` y `useGuardStore`.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `contacts` | `useContactsStore((s) => s.activeContacts())` | Contact[] | Contactos activos que recibirían la alerta | líneas 18, 22, 70–76 |
| `ran` | estado inicial `false` | boolean | Marca que la prueba ya se ejecutó (habilita el bloque de éxito) | líneas 19, 31, 79 |
| `alertPhase` | store de guardia | string | Fase del flujo de alerta (`capturing`, `sending`, `sent`, etc.) | líneas 17, 79, 97–117 |
| `lastAlert` | store de guardia | Alert \| undefined | Última alerta (contactos alcanzados y `mapsLink`) | líneas 17, 79–91 |
| Fase `'capturing'` | literal | string | Obteniendo ubicación GPS | líneas 97–117 |
| Fase `'sending'` | literal | string | Enviando alerta | líneas 97–117 |
| Fase `'sent'` | literal | string | Alerta enviada con éxito | líneas 79 |

## Estructura (funciones / clases / tipos)

- Componente `TestAlertScreen` (export default, líneas 16–130).
- Función interna: `handleTest` (21–35).
- No hay clases ni interfaces propias. `StyleSheet.create` (líneas 132–195).

## Análisis línea por línea

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAlert } from '../src/hooks/useAlert';
import { useContactsStore } from '../src/stores/useContactsStore';
import { color, spacing, borderRadius, shadow } from '../src/theme';
import { Icon } from '../src/theme/Icon';

export default function TestAlertScreen() {
  const { triggerTest, alertPhase, lastAlert } = useAlert();
  const contacts = useContactsStore((s) => s.activeContacts());
  const [ran, setRan] = useState(false);

  const handleTest = async () => {
    if (contacts.length === 0) {
      Alert.alert(
        'Sin contactos',
        'Agrega contactos antes de probar la alerta.'
      );
      return;
    }
    try {
      await triggerTest();
      setRan(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo ejecutar la prueba.');
    }
  };
```

**Explicación de las líneas 1–35:**

Importaciones, estado y función de ejecución de la prueba.

- **Línea 11** (`router`): se usa sólo en el enlace Volver (línea 122).
- **Línea 12** (`useAlert`): hook de fachada del flujo de alerta; expone `triggerTest` (dispara `AlertService.send('test', true)`), `alertPhase` (fase actual del store de guardia) y `lastAlert`.
- **Línea 13** (`useContactsStore`): se selecciona `activeContacts()`, método del store que devuelve contactos con `active === true` ordenados por prioridad.
- **Línea 17**: desestructura el hook `useAlert`.
- **Línea 18**: contactos activos actuales (reactivo: se actualiza si cambia el store).
- **Línea 19** (`ran`): bandera local; tras una prueba exitosa se muestra el bloque de confirmación.
- **Líneas 21–35** (`handleTest`): lógica del botón:
  - Líneas 22–28: si no hay contactos activos, alerta "Sin contactos" y corta (validación previa).
  - Línea 30: `await triggerTest()` ejecuta el flujo real de alerta en modo test (captura ubicación, registra alerta en base de datos, notifica a contactos con marcado de prueba, sin audio).
  - Línea 31: si no lanza, marca `ran = true`.
  - Líneas 32–34: en error muestra `e.message` (mensaje propagado del servicio) o texto genérico.

```tsx
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Icon name="science" size={48} color={color.textPrimary} />
        <Text style={styles.title}>Prueba de alerta</Text>
        <Text style={styles.subtitle}>
          Simula el envío de una alerta real. Los mensajes tendrán el prefijo
          [TEST] para que los contactos sepan que es una prueba.
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>¿Qué hará esta prueba?</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2 }}>
          <Icon name="location-on" size={16} color={color.textSecondary} />
          <Text style={styles.infoItem}>Capturará tu ubicación GPS</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2 }}>
          <Icon name="chat" size={16} color={color.textSecondary} />
          <Text style={styles.infoItem}>Registrará una alerta en la base de datos</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2 }}>
          <Icon name="smartphone" size={16} color={color.textSecondary} />
          <Text style={styles.infoItem}>Los contactos recibirán un SMS con [TEST]</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2 }}>
          <Icon name="mic-off" size={16} color={color.textSecondary} />
          <Text style={styles.infoItem}>No grabará audio</Text>
        </View>
      </View>
```

**Explicación de las líneas 37–66:**

Encabezado y caja informativa de la prueba.

- **Línea 38**: `ScrollView` raíz.
- **Líneas 39–46** (header): ícono `science`, título "Prueba de alerta" y subtítulo que avisa que los mensajes llevarán el prefijo [TEST].
- **Líneas 48–66** (infoBox): lista de expectativas con íconos: captura de ubicación GPS, registro de alerta en base de datos, SMS a contactos con [TEST], y ausencia de grabación de audio (`mic-off`).
- [OBSERVACIÓN TÉCNICA] El texto promete prefijo "[TEST]" en los SMS, mientras que en `src/config/constants.ts` el prefijo definido para pruebas es `SMS_TEST_PREFIX = '🧪 PRUEBA'`. Depende del servicio de envío cómo se marcan las pruebas; conviene contrastar para evitar promesas distintas a la implementación. [NIVEL DE CERTEZA: Inferido]

```tsx
      <View style={styles.contactsPreview}>
        <Text style={styles.contactsTitle}>
          Se enviará a {contacts.length} contacto{contacts.length !== 1 ? 's' : ''}:
        </Text>
        {contacts.map((c) => (
          <Text key={c.id} style={styles.contactItem}>
            • {c.priority === 0 ? '[Principal] ' : ''}{c.name} ({c.phone})
          </Text>
        ))}
      </View>

      {ran && alertPhase === 'sent' && lastAlert ? (
        <View style={styles.successBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon name="check-circle" size={20} color={color.safe} />
            <Text style={styles.successTitle}>Prueba completada</Text>
          </View>
          <Text style={styles.successSub}>
            Alerta enviada a {lastAlert.contacts.length} contactos con el
            prefijo [TEST].
          </Text>
          <Text style={styles.successSub}>
            Ubicación: {lastAlert.mapsLink}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.testButton,
            alertPhase === 'capturing' || alertPhase === 'sending'
              ? styles.testButtonDisabled
              : null,
          ]}
          onPress={handleTest}
          disabled={
            alertPhase === 'capturing' || alertPhase === 'sending'
          }
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon
              name={alertPhase === 'capturing' ? 'location-on' : alertPhase === 'sending' ? 'send' : 'science'}
              size={20} color={color.textInverse}
            />
            <Text style={styles.testButtonText}>
              {alertPhase === 'capturing'
                ? 'Obteniendo ubicación...'
                : alertPhase === 'sending'
                ? 'Enviando...'
                : 'Ejecutar prueba'}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Icon name="arrow-back" size={16} color={color.textSecondary} />
          <Text style={styles.backLinkText}>Volver</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}
```

**Explicación de las líneas 68–130:**

Vista previa de destinatarios, ejecución de la prueba, resultado y navegación.

- **Líneas 68–77** (contactsPreview): texto "Se enviará a N contactos:" y una línea por contacto; si `priority === 0` antepone "[Principal] " (el contacto principal de la lista), seguido de nombre y teléfono.
- [NOTA] Aquí se muestra el número de teléfono del contacto en la UI local (información personal visible en pantalla).
- **Línea 79**: condición de éxito — se muestra el bloque verde sólo si la prueba ya corrió (`ran`), la fase del flujo es `'sent'` y existe `lastAlert`.
- **Líneas 80–92** (successBox): "Prueba completada" con la cantidad de contactos alcanzados según `lastAlert.contacts.length` y el enlace de mapas `lastAlert.mapsLink`.
- **Líneas 93–119** (botón alternativo): mientras no haya éxito se muestra el botón de prueba:
  - Líneas 94–100: si la fase es `capturing` o `sending`, aplica el estilo deshabilitado.
  - Líneas 101–104: botón `disabled` durante `capturing`/`sending` (evita doble disparo).
  - Líneas 106–110: ícono dinámico según fase (`location-on`, `send` o `science`).
  - Líneas 111–117: texto dinámico "Obteniendo ubicación...", "Enviando..." o "Ejecutar prueba".
- **Líneas 122–127**: enlace Volver con `router.back()`.
- [OBSERVACIÓN TÉCNICA] Entre el éxito y el estado inicial no hay botón para "probar de nuevo" sin volver a entrar; al quedar `ran=true` y `alertPhase='sent'`, el botón desaparece (sólo queda Volver).

```tsx
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  content: { padding: 24, gap: 20, paddingBottom: 40 },

  header: { alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: color.textPrimary },
  subtitle: {
    fontSize: 14,
    color: color.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  infoBox: {
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
  infoTitle: { fontSize: 15, fontWeight: '600', color: color.textPrimary },
  infoItem: { fontSize: 14, color: color.textSecondary },

  contactsPreview: {
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 16,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  contactsTitle: { fontSize: 14, fontWeight: '600', color: color.textPrimary },
  contactItem: { fontSize: 13, color: color.textSecondary },

  testButton: {
    backgroundColor: color.warning,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  testButtonDisabled: { backgroundColor: '#FDE68A' },
  testButtonText: { fontSize: 16, fontWeight: 'bold', color: color.textInverse },

  successBox: {
    backgroundColor: color.safeLight,
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderLeftWidth: 4,
    borderLeftColor: color.safe,
  },
  successTitle: { fontSize: 16, fontWeight: 'bold', color: color.safe },
  successSub: { fontSize: 13, color: color.textPrimary },

  backLink: { alignItems: 'center', paddingVertical: 8 },
  backLinkText: { fontSize: 15, color: color.textSecondary },
});
```

**Explicación de las líneas 132–195:**

Hoja de estilos.

- **Líneas 133–135** (`container`, `content`): layout y espaciado del scroll.
- **Líneas 137–143** (`header`, `title`, `subtitle`): encabezado centrado.
- **Líneas 145–157** (`infoBox`, `infoTitle`, `infoItem`): caja de expectativas sobre superficie con radio y sombra.
- **Líneas 159–171** (`contactsPreview`, `contactsTitle`, `contactItem`): caja de destinatarios.
- **Líneas 173–179** (`testButton`, `testButtonDisabled`, `testButtonText`): botón ámbar de prueba y su variante deshabilitada (crema).
- **Líneas 182–191** (`successBox`, `successTitle`, `successSub`): caja verde de éxito con borde izquierdo.
- **Líneas 193–195** (`backLink`, `backLinkText`): enlace de retorno.
- [NOTA] `borderRadius`, `elevation` y sombras literales; los tokens `borderRadius` y `shadow` importados no se usan.

## Fichas de funciones y métodos

### handleTest (líneas 21–35)

- Firma: `const handleTest = async () => Promise<void>`.
- Propósito técnico: validar destinatarios y ejecutar el flujo de prueba; propósito funcional: simular una alerta real sin consecuencias.
- Parámetros: ninguno. Retorno: `Promise<void>`.
- Excepciones: captura el error del disparador y lo muestra en un `Alert` con `e.message` cuando existe.
- Dependencias: `contacts`, `triggerTest`, `setRan`, `Alert`.
- Flujo: 1) si `contacts.length === 0` → alerta y retorno; 2) `await triggerTest()`; 3) `setRan(true)`; 4) en error, alerta con el mensaje.
- Llamado desde: `onPress` del botón de prueba (línea 101).
- Efectos secundarios: dispara el flujo canónico de alerta en modo test (escritura de alerta en base de datos, envío de notificación de prueba) y cambia el estado `alertPhase` del store global.
- Riesgos: si el usuario abandona la pantalla durante `capturing`/`sending`, el flujo de alerta continúa en el store (estado global); el mensaje de error crudo `e.message` podría exponer detalles internos del servicio al usuario.

## Clases / interfaces / tipos

- Sin tipos propios. Tipos externos usados implícitamente: `Contact` (de `src/types/Contact.ts`: `id`, `name`, `phone`, `active`, `priority`) y el tipo de la alerta devuelto por `useAlert.lastAlert` (con `contacts` y `mapsLink` según el uso en líneas 86–90).

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Imports `borderRadius` y `shadow` (línea 13) sin uso → `[POTENCIALMENTE NO UTILIZADO]`.
- [OBSERVACIÓN TÉCNICA] El texto de la UI dice "prefijo [TEST]" (subtítulo línea 44 e infoBox línea 60) mientras `src/config/constants.ts` define `SMS_TEST_PREFIX = '🧪 PRUEBA'`; conviene confirmar cómo marca el envío real el modo test. [NIVEL DE CERTEZA: Inferido]
- [OBSERVACIÓN TÉCNICA] Tras el éxito, la pantalla no permite repetir la prueba sin reingresar: el botón desaparece cuando `ran && alertPhase === 'sent' && lastAlert`.
- [OBSERVACIÓN TÉCNICA] La pantalla depende del estado global `alertPhase` y `lastAlert` (useGuardStore); si otra pantalla dispara una alerta mientras ésta está abierta, la UI puede reflejar estados ajenos. [NIVEL DE CERTEZA: Altamente probable]
- [NIVEL DE CERTEZA: Confirmado por código] Validación previa: requiere al menos un contacto activo para probar.

## Seguridad

| Severidad | Hallazgo |
| --- | --- |
| BAJO | Se muestran nombres y teléfonos de los contactos de confianza en la vista previa (información personal en la UI local). |
| BAJO | En caso de error se muestra `e.message` crudo al usuario (`Alert` línea 33); si el servicio propaga detalles internos (URLs, códigos), quedarían visibles. |
| INFORMATIVO | La prueba registra una alerta en la base de datos con datos de ubicación (marcada como test por el servicio); sin secretos ni tokens en este archivo. |
| INFORMATIVO | No hay logging de datos personales en esta pantalla. |

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] El usuario puede iniciar una prueba sin permiso de ubicación: el flujo depende de `AlertService`; si falla la captura GPS, la alerta puede no completarse. Recomendar revisar el manejo de ubicación en `AlertService` y orientar al usuario hacia la pantalla de permisos.
- [RIESGO] Doble disparo controlado por `disabled` durante `capturing`/`sending`, pero no se bloquea durante la fase de confirmación posterior; recomendar una bandera local de "en curso" adicional si el servicio tarda.
- [RECOMENDACIÓN] Alinear el texto del prefijo con la constante real (`SMS_TEST_PREFIX`) o viceversa.
- [RECOMENDACIÓN] Ofrecer una acción "Probar de nuevo" tras el éxito.
- [RECOMENDACIÓN] Eliminar imports no usados (`borderRadius`, `shadow`).
