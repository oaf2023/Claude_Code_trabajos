# Archivo: src/components/PaymentOverdueModal.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/components/PaymentOverdueModal.tsx | 243 | TypeScript 5.9 / TSX (React Native) | 7862 | Componente UI de modal (aviso de deuda) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Modal de aviso de suscripción **vencida** (deuda) que se muestra en dos escenarios:
1. `afterAlert === true`: la alerta SOS se disparó sin suscripción activa y solo se notificó al contacto principal (modo de emergencia).
2. `afterAlert === false`: el usuario abre la app con deuda previa persistida (`paymentOverdue`) y sin suscripción.

Ofrece dos acciones: **"Ir a pagar"** (delega en el callback `onPay`, que en el layout raíz abre `PaymentModal`) y **"Cerrar aplicación"** (persiste el flag `paymentOverdue` en `useSettingsStore` y, en Android, sale de la app con `BackHandler.exitApp()`). La persistencia del flag garantiza que el aviso reaparezca en cada apertura hasta que el pago se complete. A diferencia de `TrialExpiredModal`, este componente **sí ejecuta lógica propia**: escritura en el store global y cierre de la aplicación.

## Clasificación y estado

- `FUNCIONALIDAD EXISTENTE`: componente definido, exportado y conectado en `app/_layout.tsx` (import en línea 33; render en líneas 386–396), donde se controla mediante los estados `showOverdueModal` y `overdueIsAfterAlert`.
- Orquestación real en `_layout.tsx`:
  - Líneas 131–136: al abrir la app, si `paymentOverdue && !hasSubscription`, muestra el modal con `afterAlert=false`.
  - Líneas 139–145: si `AlertService` disparó una alerta con pago vencido (`showOverdueAlert` de `useGuardStore`), muestra el modal con `afterAlert=true`.
  - Líneas 389–392: `onPay` cierra este modal y abre `PaymentModal`.
  - Líneas 393–395: `onDismissed` oculta el modal.
- [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `React` (de `'react'`) | Estándar (externo) | `React.FC` y JSX | Sí |
| `Modal`, `View`, `Text`, `TouchableOpacity`, `StyleSheet`, `BackHandler`, `SafeAreaView`, `Platform` (de `'react-native'`) | Estándar (externo) | Render, cierre de app y detección de plataforma | Sí |
| `color` (de `'../theme'`) | Interna | Estilos (`color.danger`, etc.) | Sí |
| `useSettingsStore` (de `'../stores/useSettingsStore'`) | Interna | Persistir el flag `paymentOverdue` (selector `setPaymentOverdue`) | Sí |

## Componentes que dependen de este archivo

| Consumidor | Tipo de uso |
| --- | --- |
| `app/_layout.tsx` | Importa (línea 33) y renderiza el modal globalmente (líneas 386–396) con `visible`, `afterAlert`, `onPay` y `onDismissed` |

El flag `paymentOverdue` que este modal escribe se lee en `_layout.tsx` (selector `useSettingsStore((s) => s.paymentOverdue)`) para decidir la apertura al iniciar; el store incluye `paymentOverdue` en su `partialize` (persistencia), por lo que la deuda sobrevive reinicios. [NIVEL DE CERTEZA: Altamente probable] — ver `src/stores/useSettingsStore.ts`.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `PaymentOverdueModalProps` | Interfaz | Tipo | Contrato de props | Líneas 32–47 |
| `styles` | Objeto de estilos | `StyleSheet` | Estilos del modal | Líneas 166–243 |

Valores mágicos: retardo de 150 ms (`setTimeout`, línea 87) antes de `BackHandler.exitApp()` para permitir que el estado se persista y el `Modal` se cierre sin que el exit interrumpa la escritura; colores hardcodeados del tema oscuro de la tarjeta (`#1A1A1A`, `#D0D0D0`, `#FFFFFF`, `#AAA`, `#555`, `#666`) y borde `color.danger` en `card` y `btnPay`.

## Estructura (funciones / clases / tipos)

- Interfaz `PaymentOverdueModalProps` (líneas 32–47).
- Componente exportado `PaymentOverdueModal` (líneas 62–164) con selector del store en línea 68.
- Handlers internos: `handleClose` (líneas 83–91) y `handlePay` (líneas 104–106).
- Objeto de estilos `styles` (líneas 166–243).
- No hay estado local (`useState`), `useEffect` ni llamadas a servicios de red.

## Análisis línea por línea

**Bloque L1–L16 — Cabecera de archivo (comentario):**

```tsx
/* ============================================================================
* Archivo         : PaymentOverdueModal.tsx
* Descripción     : Modal de aviso de suscripción vencida. Se muestra cuando
*                   la alerta fue disparada sin suscripción activa (solo al
*                   contacto principal) o cuando el usuario abre la app con
*                   suscripción vencida sin haber pagado. Ofrece dos acciones:
*                   "Ir a pagar" (abre la pasarela) o "Cerrar" (cierra la app
*                   y registra el estado para volver a mostrar el aviso en
*                   cada apertura hasta que el pago se realice).
* Autor           : oafon
* Fecha           : 2026-04-07
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : <PaymentOverdueModal visible={...} afterAlert={...}
*                     onPay={...} onDismissed={...} />
* ============================================================================ */
```

**Explicación de las líneas 1–16:**
Cabecera documental. Define con precisión el contrato de comportamiento: el modal distingue entre alerta disparada sin suscripción (solo contacto principal) y apertura con deuda previa; "Cerrar" persiste el estado para que el aviso se repita en cada apertura hasta el pago. Este comportamiento documentado se corresponde con el código real (líneas 83–91).

**Bloque L18–L30 — Importaciones:**

```tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  SafeAreaView,
  Platform,
} from 'react-native';
import { color } from '../theme';
import { useSettingsStore } from '../stores/useSettingsStore';
```

**Explicación de las líneas 18–30:**
- **Línea 18**: React para `React.FC` y JSX.
- **Líneas 19–28**: primitivas de React Native. Destacan `BackHandler` (API de Android para salir de la app) y `Platform` (para ejecutar el exit solo en Android).
- **Línea 29**: tokens de color del design system.
- **Línea 30**: store global de Zustand `useSettingsStore` para persistir el flag de deuda `paymentOverdue`.

**Bloque L32–L47 — Interfaz de props con documentación:**

```tsx
interface PaymentOverdueModalProps {
  /** Controla la visibilidad del modal */
  visible: boolean;
  /**
   * true → la alerta ya se disparó (solo al contacto principal).
   * false → el modal aparece al abrir la app por deuda previa.
   */
  afterAlert: boolean;
  /** Callback invocado cuando el usuario elige "Ir a pagar" */
  onPay: () => void;
  /**
   * Callback invocado después de que el modal se cierra, tanto por "Cerrar"
   * (app cerrada) como en cualquier otro path de limpieza.
   */
  onDismissed: () => void;
}
```

**Explicación de las líneas 32–47:**
- **Línea 33** (`visible`): controla el modal nativo.
- **Líneas 35–39** (`afterAlert`): discrimina el texto del aviso. Es un flag booleano informativo, no un estado: quien lo decide es el padre (`_layout.tsx`) según el origen de la apertura.
- **Línea 41** (`onPay`): acción "Ir a pagar".
- **Líneas 42–46** (`onDismissed`): limpieza posterior al cierre, invocada tanto por el botón "Cerrar aplicación" como por el cierre con botón *back* de Android (`onRequestClose`), ya que ambos derivan en `handleClose`.

**Bloque L49–L61 — Cabecera documental del componente:**

```tsx
/* ============================================================================
* Función         : PaymentOverdueModal
* Descripción     : Renderiza el aviso de suscripción vencida con las acciones
*                   "Ir a pagar" y "Cerrar". Al cerrar, persiste el flag
*                   paymentOverdue y sale de la app.
* Fecha           : 2026-04-07
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : useSettingsStore, PaymentModal (via onPay callback)
* Ingesta         : PaymentOverdueModalProps
* Devolución      : JSX.Element
* Uso             : <PaymentOverdueModal visible onPay={...} afterAlert onDismissed={...} />
* ============================================================================ */
```

**Explicación de las líneas 49–61:**
Comentario de función según convención: documenta conexiones reales (`useSettingsStore`, `PaymentModal` vía `onPay`), entradas, salida y uso. Sin efecto en ejecución.

**Bloque L62–L68 — Declaración del componente y acceso al store:**

```tsx
export const PaymentOverdueModal: React.FC<PaymentOverdueModalProps> = ({
  visible,
  afterAlert,
  onPay,
  onDismissed,
}) => {
  const setPaymentOverdue = useSettingsStore((s) => s.setPaymentOverdue);
```

**Explicación de las líneas 62–68:**
- **Líneas 62–67**: desestructuración de las cuatro props.
- **Línea 68**: selecciona el setter `setPaymentOverdue` del store Zustand. El uso del selector suscribe el componente a cambios del store; como el setter es una referencia estable, no provoca re-renders espurios.

**Bloque L70–L82 — Cabecera documental de handleClose:**

```tsx
/* ============================================================================
* Función         : handleClose
* Descripción     : Persiste el flag de deuda y cierra la aplicación.
*                   La próxima vez que el usuario abra la app verá este mismo
*                   aviso hasta que complete el pago.
* Fecha           : 2026-04-07
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : useSettingsStore.setPaymentOverdue, BackHandler.exitApp
* Ingesta         : Sin argumentos
* Devolución      : void
* Uso             : handleClose()
* ============================================================================ */
```

**Explicación de las líneas 70–82:**
Documentación del handler de cierre. Declara el flujo completo: persistir deuda y salir de la app para que el aviso se repita en cada apertura.

**Bloque L83–L91 — Implementación de handleClose:**

```tsx
  const handleClose = () => {
    setPaymentOverdue(true);
    onDismissed();
    if (Platform.OS === 'android') {
      setTimeout(() => {
        BackHandler.exitApp();
      }, 150);
    }
  };
```

**Explicación de las líneas 83–91:**
- **Línea 84** (`setPaymentOverdue(true)`): marca la deuda en el store global; al estar `paymentOverdue` incluido en la persistencia del store (`partialize`), el flag queda guardado entre sesiones.
- **Línea 85** (`onDismissed()`): avisa al padre (`_layout.tsx`) para que oculte el modal y actualice sus estados.
- **Líneas 86–90**: solo en Android programa con 150 ms el `BackHandler.exitApp()`.
  - El retardo evita que el cierre de la app interrumpa la escritura síncrona del store y la actualización del padre, dejando tiempo a que React procese el cambio antes del exit.
  - [OBSERVACIÓN TÉCNICA] En iOS no existe `exitApp`; el modal simplemente se oculta y la app continúa abierta. El texto del botón ("Cerrar aplicación") resulta entonces inexacto en iOS: el aviso se cierra pero la app no. Al estar el flag persistido, el aviso reaparecerá en la próxima apertura, lo que coincide con la nota al pie del modal.
- **Línea 91**: cierre del handler.
- [NOTA] Riesgo UX de bloqueo: si el usuario no paga, en Android se fuerza la salida de la app en cada apertura sin alternativa de uso limitado (a diferencia de `TrialExpiredModal`).

**Bloque L93–L106 — handlePay:**

```tsx
  /* ============================================================================
  * Función         : handlePay
  * Descripción     : Limpia el estado de aviso y delega al callback de pago.
  * Fecha           : 2026-04-07
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : onPay callback → PaymentModal
  * Ingesta         : Sin argumentos
  * Devolución      : void
  * Uso             : handlePay()
  * ============================================================================ */
  const handlePay = () => {
    onPay();
  };
```

**Explicación de las líneas 93–106:**
- **Líneas 94–104**: cabecera documental; indica que la conexión es el callback `onPay` que abre `PaymentModal` (orquestado en `_layout.tsx` líneas 389–392).
- **Líneas 105–106**: `handlePay` delega directamente en `onPay()`. Es un wrapper trivial que no limpia el flag `paymentOverdue`: la limpieza ocurre recién en `_layout.tsx` cuando `PaymentModal` dispara `onSuccess` (`setPaymentOverdue(false)`), es decir, cuando el pago se confirma de verdad.
- [OBSERVACIÓN TÉCNICA] El handler es una indirección sin lógica adicional; podría usarse `onPay` directamente como `onPress`. Impacto: nulo (código redundante).

**Bloque L108–L119 — Apertura del Modal y cabecera visual:**

```tsx
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.card}>
          {/* Icono de advertencia */}
          <Text style={styles.icon}>⚠️</Text>
```

**Explicación de las líneas 108–119:**
- **Línea 110** (`visible`): control del modal.
- **Línea 111** (`transparent`): permite el overlay semitransparente propio.
- **Línea 112** (`animationType="fade"`): fundido.
- **Línea 113** (`statusBarTranslucent`): el overlay cubre la zona de la barra de estado (Android).
- **Línea 114** (`onRequestClose={handleClose}`): el botón *back* de Android ejecuta `handleClose`, es decir, **persiste la deuda y sale de la app**; no hay forma de cerrar el aviso por *back* sin salir (comportamiento de bloqueo deliberado).
- **Líneas 116–117**: `SafeAreaView` con el overlay oscuro y la tarjeta central.
- **Línea 118**: comentario del ícono de advertencia.
- **Línea 119**: ícono de advertencia (⚠️) como refuerzo visual.

**Bloque L121–L137 — Título y cuerpo condicional según afterAlert:**

```tsx
          <Text style={styles.title}>Suscripción vencida</Text>

          {afterAlert ? (
            <Text style={styles.body}>
              Tu suscripción está vencida.{'\n\n'}
              La alerta fue enviada <Text style={styles.bold}>únicamente al contacto principal</Text> por
              razones de emergencia.{'\n\n'}
              Para que SafeAlert notifique a todos tus contactos en la próxima alerta,
              poné al día tu suscripción.
            </Text>
          ) : (
            <Text style={styles.body}>
              Tu suscripción está vencida.{'\n\n'}
              SafeAlert no puede protegerte completamente hasta que renueves el servicio.{'\n\n'}
              Poné al día tu suscripción para volver a tener protección completa.
            </Text>
          )}
```

**Explicación de las líneas 121–137:**
- **Línea 121**: título del aviso.
- **Líneas 123–130** (rama `afterAlert === true`): texto que informa que la alerta de emergencia se envió **solo al contacto principal** (decisión de seguridad en modo deuda) y exhorta a regularizar la suscripción para que la próxima alerta notifique a todos los contactos. El fragmento `<Text style={styles.bold}>` resalta "únicamente al contacto principal".
- **Líneas 131–136** (rama `afterAlert === false`): texto genérico de deuda al abrir la app ("SafeAlert no puede protegerte completamente..."). `{'\n\n'}` genera párrafos dentro del mismo nodo `Text`.
- [NOTA] Los textos constituyen avisos informativos de restricción de servicio, no consentimientos ni solicitudes de permisos.
- [NIVEL DE CERTEZA: Confirmado por código] — la ramificación condicional reproduce exactamente la lógica documentada en la interfaz.

**Bloque L139–L155 — Botones de acción:**

```tsx
          {/* Botón principal: pagar */}
          <TouchableOpacity
            style={styles.btnPay}
            onPress={handlePay}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPayText}>💳  Ir a pagar</Text>
          </TouchableOpacity>

          {/* Botón secundario: cerrar app */}
          <TouchableOpacity
            style={styles.btnClose}
            onPress={handleClose}
            activeOpacity={0.75}
          >
            <Text style={styles.btnCloseText}>Cerrar aplicación</Text>
          </TouchableOpacity>
```

**Explicación de las líneas 139–155:**
- **Líneas 140–146**: botón primario "Ir a pagar" (fondo `color.danger` rojo) que ejecuta `handlePay` → `onPay` → abre `PaymentModal` en el padre.
- **Líneas 149–155**: botón secundario "Cerrar aplicación" (borde sutil) que ejecuta `handleClose`: persiste deuda, oculta el modal y, en Android, sale de la app.
- [OBSERVACIÓN TÉCNICA] Ambos botones carecen de `accessibilityRole="button"` y `accessibilityLabel`, inconsistente con la política de accesibilidad presente en otros componentes del módulo.

**Bloque L157–L164 — Nota al pie y cierre:**

```tsx
          <Text style={styles.footnote}>
            Al cerrar, este aviso aparecerá cada vez que abras SafeAlert hasta que completes el pago.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
```

**Explicación de las líneas 157–164:**
- **Líneas 157–159**: nota al pie que anticipa al usuario el comportamiento de reaparición del aviso en cada apertura hasta completar el pago (coherente con `setPaymentOverdue(true)` persistido).
- **Líneas 160–163**: cierre de tarjeta, `SafeAreaView`, `Modal` y `return`.
- **Línea 164**: cierre del componente.

**Bloque L166–L206 — Estilos (1.ª parte):**

```tsx
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    borderWidth: 1.5,
    borderColor: color.danger,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    color: '#D0D0D0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  bold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
```

**Explicación de las líneas 166–206:**
- **Líneas 167–173** (`overlay`): cortina negra al 82 % (`rgba(0,0,0,0.82)`), más oscura que la de otros modales; centra la tarjeta.
- **Líneas 174–184** (`card`): tarjeta de tema oscuro propio (`#1A1A1A`, no usa token de color), ancho hasta 400 px y borde de 1.5 px en `color.danger` (rojo corporativo) que comunica urgencia.
- **Líneas 185–188** (`icon`): tamaño del ícono de advertencia.
- **Líneas 189–195** (`title`): título blanco en negrita (800), centrado.
- **Líneas 196–202** (`body`): cuerpo en gris claro `#D0D0D0` con interlineado 22 para lectura confortable sobre fondo oscuro.
- **Líneas 203–206** (`bold`): resaltado en blanco y peso 700 para "únicamente al contacto principal".
- [NOTA] El componente mezcla colores hardcodeados con tokens del tema (`color.danger`), lo que dificulta el mantenimiento del tema oscuro.

**Bloque L207–L243 — Estilos (2.ª parte):**

```tsx
  btnPay: {
    backgroundColor: color.danger,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  btnPayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnClose: {
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  btnCloseText: {
    color: '#AAA',
    fontSize: 15,
    fontWeight: '500',
  },
  footnote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 17,
  },
});
```

**Explicación de las líneas 207–243:**
- **Líneas 207–215** (`btnPay`): botón CTA a ancho completo con fondo `color.danger`; jerarquía visual principal.
- **Líneas 216–221** (`btnPayText`): texto blanco en negrita con `letterSpacing` 0.3.
- **Líneas 222–231** (`btnClose`): botón secundario con borde gris `#555` y sin fondo; jerarquía visual secundaria.
- **Líneas 232–236** (`btnCloseText`): texto en gris `#AAA`.
- **Líneas 237–242** (`footnote`): nota al pie pequeña y discreta en gris `#666`.
- **Línea 243**: cierre del `StyleSheet`.

## Fichas de funciones y métodos

### handleClose (líneas 83–91)

- Firma: `const handleClose = () => { ... };` (sin parámetros, retorno `void`).
- Propósito técnico: escribir el flag de deuda en el store global, notificar al padre y (solo Android) salir de la app tras 150 ms.
- Propósito funcional: convertir el aviso en bloqueante hasta el pago: al cerrar, el flag persistido hace que el aviso reaparezca en la próxima apertura.
- Parámetros: ninguno. Retorno: `void`. Excepciones: ninguna explícita.
- Dependencias: `useSettingsStore.setPaymentOverdue`, `onDismissed` (prop), `Platform.OS`, `BackHandler.exitApp` (Android).
- Flujo interno: 1) `setPaymentOverdue(true)`; 2) `onDismissed()`; 3) si Android, `setTimeout` 150 ms y `exitApp()`.
- Funciones que llama: `setPaymentOverdue`, `onDismissed`, `BackHandler.exitApp`. Desde dónde se llama: botón "Cerrar aplicación" (línea 151) y `onRequestClose` del `Modal` (línea 114).
- Efectos secundarios: persistencia de estado global; cierre forzoso de la app en Android; en iOS el texto "Cerrar aplicación" no cierra la app.
- Riesgos: bloqueo del usuario sin vía de uso limitado; el retardo fijo de 150 ms es frágil si el store persistiera de forma asíncrona (aquí la escritura de Zustand es síncrona, por lo que el riesgo es bajo).

### handlePay (líneas 104–106)

- Firma: `const handlePay = () => { onPay(); };`.
- Propósito técnico/funcional: delegar la acción de pago al callback del padre, que abre `PaymentModal`.
- Parámetros: ninguno. Retorno: `void`.
- Dependencias: prop `onPay`. Flujo: invocación directa.
- Efectos secundarios: ninguno propio; el padre decide qué ocurre (abrir `PaymentModal`).
- Riesgos: no limpia `paymentOverdue` por sí mismo; la limpieza depende de que el flujo de pago complete `onSuccess` en `_layout.tsx`. Si el pago se cancela, el aviso volverá a aparecer, comportamiento deseado.

## Clases / interfaces / tipos

### PaymentOverdueModalProps (líneas 32–47)

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `visible` | `boolean` | Sí | Visibilidad del modal |
| `afterAlert` | `boolean` | Sí | `true`: alerta ya disparada (solo contacto principal); `false`: apertura por deuda previa |
| `onPay` | `() => void` | Sí | Acción "Ir a pagar" (abre la pasarela en el padre) |
| `onDismissed` | `() => void` | Sí | Limpieza tras el cierre (cualquier vía) |

Ciclo de vida: sin estado local; el flag de deuda vive en `useSettingsStore` (persistido). Relaciones: consumido por `app/_layout.tsx`; escribe en `useSettingsStore`; su `onPay` conecta con `PaymentModal`.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] En iOS, "Cerrar aplicación" no cierra la app (`BackHandler.exitApp` es solo Android); el modal se oculta y la app continúa. El texto visible es engañoso en iOS. Archivo: `src/components/PaymentOverdueModal.tsx`, líneas 86–90.
- [OBSERVACIÓN TÉCNICA] El aviso es bloqueante en Android: tanto el botón "Cerrar aplicación" como el botón *back* del sistema ejecutan `handleClose`, que fuerza la salida de la app; no existe opción de "usar de forma limitada". Contrasta con `TrialExpiredModal`, que sí permite continuar. Archivo: líneas 83–91 y 114.
- [OBSERVACIÓN TÉCNICA] `handlePay` es una indirección sin lógica (solo llama a `onPay()`); el botón podría invocar `onPay` directamente. Impacto: código redundante. Archivo: líneas 104–106.
- [OBSERVACIÓN TÉCNICA] Los botones no declaran `accessibilityRole` ni `accessibilityLabel`. Impacto potencial: accesibilidad deficiente. Archivo: líneas 140–155.
- [NOTA] Mezcla de colores hardcodeados (`#1A1A1A`, `#D0D0D0`, `#AAA`, `#555`, `#666`) con tokens del tema (`color.danger`); el modal no sigue el sistema de tokens de forma consistente. [NIVEL DE CERTEZA: Confirmado por código]
- [NOTA] El componente no realiza ninguna llamada de red ni lectura de suscripción: toda la decisión de mostrar el aviso la toma `_layout.tsx` a partir del flag persistido y del evento `showOverdueAlert` de `useGuardStore`.

## Seguridad

- No se encontraron secretos, tokens ni datos sensibles en este archivo.
- [INFORMATIVO] El componente no autentica ni autoriza: depende de que el padre decida cuándo mostrarlo. La protección real frente a uso sin pago debe estar en los servicios/pantallas de la app y en el backend (`PaymentService.checkSubscription`, backend PythonAnywhere); este modal es solo una barrera de UI.
- [BAJO] Persistencia local del flag de deuda (`paymentOverdue`): es un marcador de negocio sin datos personales, pero si se almacenara en claro junto a otros datos podría revelar el estado de pago del usuario a quien acceda al almacenamiento del dispositivo. Verificar el `storage` usado por `useSettingsStore` (persistencia de Zustand). Impacto: bajo.
- [INFORMATIVO] Texto del modal sugiere que en estado de deuda las alertas se limitan al contacto principal; esa restricción debe verificarse en `AlertService` (fuera del alcance de este archivo) para confirmar que no es solo un mensaje.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Diseño bloqueante: un usuario con deuda no puede usar la app en Android (exit forzado en cada apertura). Puede generar abandono o, peor, que un usuario en peligro no pueda disparar una alerta SOS desde la app. Recomendación: evaluar un modo degradado que permita al menos el botón de emergencia mientras se muestra el aviso, alineado con la promesa del producto (seguridad primero).
- [RIESGO] En iOS el comportamiento "Cerrar aplicación" no se cumple; recomendación: ajustar el texto y el comportamiento por plataforma o documentar la limitación.
- [RECOMENDACIÓN] Añadir `accessibilityRole="button"` y `accessibilityLabel` a los dos `TouchableOpacity`.
- [RECOMENDACIÓN] Reemplazar colores hardcodeados por tokens del tema y centralizar la lógica de cierre/exit (retardo de 150 ms) en una constante con comentario.
- [RECOMENDACIÓN] Eliminar la indirección `handlePay` o usarla para limpiar estado previo si en el futuro el modal necesita resetear algo antes de pagar.
