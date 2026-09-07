# Archivo: src/components/PaymentModal.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/components/PaymentModal.tsx | 559 | TypeScript 5.9 / TSX (React Native) | 18903 | Componente UI de modal de suscripción/pago | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Modal de suscripción de SafeAlert con selector de plan **mensual/anual** y doble flujo de pago:

1. **Flujo de producción** (dispositivo real + `PAYMENTS_ENABLED`): llama a la Firebase Function `createPaymentOrder` para obtener la *init point* de Mercado Pago, abre la pasarela en el navegador externo (`Linking.openURL`) y, al confirmar el usuario, notifica al backend PythonAnywhere (`PaymentService.confirmPayment`), genera el ticket correlativo real (`PaymentService.createTicket`) y muestra el comprobante con `PaymentTicket`.
2. **Flujo de bypass** (emulador, `__DEV__`, demo habilitada o pagos desactivados por config): omite la pasarela y registra el dispositivo en PythonAnywhere (`PaymentService.registerDevice`), crea un ticket correlativo real y muestra el comprobante sin cargo real, para pruebas corporativas de extremo a extremo.

Es el componente central del ciclo de vida comercial de la app: decide el modo de pago según entorno, gestiona todo el estado del proceso (plan, carga, URL, suscripción, ticket) y delega la creación de comprobantes al backend.

## Clasificación y estado

- `FUNCIONALIDAD EXISTENTE`: componente exportado, tipado y **conectado en tres puntos**:
  - `app/_layout.tsx` (import línea 34; render líneas 399–410): modal global; `onSuccess` activa `hasSubscription` y limpia `paymentOverdue` en el store.
  - `app/(tabs)/index.tsx` (import línea 30; render líneas 380–387): pantalla principal.
  - `app/contacts/[id].tsx` (import línea 37; render líneas 267–276, condicionado a `PAYMENTS_ENABLED`).
- Ambos flujos (producción y bypass) están implementados y operativos según el entorno detectado.
- [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `React`, `useState` (de `'react'`) | Estándar (externo) | Estado del modal y `useEffect` | Sí |
| `Modal`, `StyleSheet`, `View`, `TouchableOpacity`, `Text`, `SafeAreaView`, `Linking`, `Alert`, `ActivityIndicator`, `ScrollView` (de `'react-native'`) | Estándar (externo) | Render, apertura de navegador y alertas | Sí |
| `functions` (de `'../config/firebase'`) | Interna | `httpsCallable('createPaymentOrder')` | Sí |
| `PaymentService`, `PlanType` (de `'../services/PaymentService'`) | Interna | `registerDevice`, `confirmPayment`, `createTicket`; tipo de plan | Sí |
| `PaymentTicket`, `TicketData` (de `'./PaymentTicket'`) | Interna | Render del comprobante y su tipo de datos | Sí |
| `DeviceService` (de `'../services/DeviceService'`) | Interna | `isEmulator()` para decidir el bypass | Sí |
| `color` (de `'../theme'`) | Interna | `ActivityIndicator` (color de carga) | Sí |
| `PAYMENTS_DEMO_ENABLED`, `PAYMENTS_ENABLED` (de `'../config/features'`) | Interna | Flags que deciden el modo bypass | Sí |

Todas las importaciones se usan. No se importan secretos en este archivo (las claves de backend viven en `PaymentService`/entorno).

## Componentes que dependen de este archivo

| Consumidor | Tipo de uso |
| --- | --- |
| `app/_layout.tsx` | Modal global de pago; `onSuccess` actualiza el store (`setHasSubscription(true)`, `setPaymentOverdue(false)`) |
| `app/(tabs)/index.tsx` | Modal de pago en pantalla principal; `onSuccess` activa `hasSubscription` |
| `app/contacts/[id].tsx` | Modal de pago en edición de contacto, solo si `PAYMENTS_ENABLED` |
| `src/components/TrialExpiredModal.tsx` y `PaymentOverdueModal.tsx` | Conectan a este modal vía callbacks en `_layout` (referencias documentales) |

El flujo de expiración/deuda depende de este modal: `PaymentOverdueModal` y `TrialExpiredModal` abren `PaymentModal` cuando el usuario decide pagar, y el cierre exitoso aquí limpia los flags de deuda/prueba en el store.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `isBypassMode` | `__DEV__ \|\| PAYMENTS_DEMO_ENABLED \|\| !PAYMENTS_ENABLED` (inicial) | `boolean` (estado) | Decide si se omite la pasarela de pago | Líneas 59–61, 75 |
| `selectedPlan` | `'monthly'` (inicial) | `PlanType` (estado) | Plan elegido por el usuario | Línea 62 |
| `loading` | `false` (inicial) | `boolean` (estado) | Indicador de operación en curso | Línea 63 |
| `paymentUrl` | `null` (inicial) | `string \| null` (estado) | URL de pago (init point) de Mercado Pago | Línea 64 |
| `subscriptionId` | `null` (inicial) | `string \| null` (estado) | Id de suscripción devuelto por la Function | Línea 65 |
| `ticket` | `null` (inicial) | `TicketData \| null` (estado) | Datos del comprobante a mostrar | Línea 66 |
| `ticketVisible` | `false` (inicial) | `boolean` (estado) | Visibilidad del `PaymentTicket` | Línea 67 |
| `styles` | Objeto de estilos | `StyleSheet` | Estilos del modal | Líneas 409–558 |

Valores mágicos (duplicados en varias funciones): importes `7500` (mensual) y `75000` (anual) en líneas 101, 121 y 227; precios visibles `$7.500`/`$75.000` (líneas 305, 320); email de contacto de respaldo `'safealert_contacto@manejadatos.com'` (línea 122); número de ticket de respaldo `9999` (línea 117); nombre de la Firebase Function `'createPaymentOrder'` (línea 148). Color de carga `color.warning` (línea 338).

## Estructura (funciones / clases / tipos)

- Interfaz `PaymentModalProps` (líneas 40–47).
- Componente exportado `PaymentModal` (líneas 49–407) con 7 estados y 1 efecto.
- Efecto de detección de emulador `useEffect` (líneas 69–78).
- Handlers: `handleDevBypass` (94–129), `handleGeneratePayment` (143–174), `handleOpenBrowser` (187–200), `handleConfirmPayment` (215–248), `handleClose` (261–268).
- Render JSX: selector de plan, banner de bypass, botones de ambos flujos y montaje de `PaymentTicket`.
- Objeto de estilos `styles` (líneas 409–558).
- Tipos consumidos: `PlanType` (`'monthly' | 'annual'`) y `TicketData` (definidos en `PaymentService` y `PaymentTicket` respectivamente).

## Análisis línea por línea

**Bloque L1–L17 — Cabecera de archivo (comentario):**

```tsx
/* ============================================================================
* Archivo         : PaymentModal.tsx
* Descripción     : Modal de suscripción a SafeAlert con selector de plan
*                   mensual/anual. En producción llama a Firebase Function para
*                   generar la URL de pago y luego abre MercadoPago en el
*                   navegador externo. Tras confirmación genera y muestra el
*                   ticket de pago (PaymentTicket).
*                   En modo __DEV__ la pasarela se omite: el dispositivo se
*                   registra en PA, se crea el ticket correlativo real y se
*                   muestra el comprobante sin cargo real.
* Autor           : oafon
* Fecha           : 2026-04-07
* Versión         : 3.2.0
* Lenguaje        : TypeScript 5.9
* Uso             : <PaymentModal visible={...} deviceId={...} userName={...}
*                     userPhone={...} onClose={...} onSuccess={...} />
* ============================================================================ */
```

**Explicación de las líneas 1–17:**
Cabecera documental de la versión 3.2.0 que describe fielmente el comportamiento dual del componente (producción con pasarela Mercado Pago vs. bypass en `__DEV__` con registro en PythonAnywhere "PA"). Documenta también el contrato de props del ejemplo de uso.

**Bloque L19–L37 — Importaciones:**

```tsx
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Linking,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { functions } from '../config/firebase';
import { PaymentService, PlanType } from '../services/PaymentService';
import { PaymentTicket, TicketData } from './PaymentTicket';
import { DeviceService } from '../services/DeviceService';
import { color } from '../theme';
import { PAYMENTS_DEMO_ENABLED, PAYMENTS_ENABLED } from '../config/features';
```

**Explicación de las líneas 19–37:**
- **Línea 19**: React y el hook `useState`.
- **Líneas 20–31**: primitivas de React Native. Destacan `Linking` (abrir la URL de Mercado Pago en el navegador externo) y `Alert` (errores al usuario).
- **Línea 32**: `functions` (config de Firebase) para invocar la Cloud Function `createPaymentOrder` vía `httpsCallable`.
- **Línea 33**: `PaymentService` (backend PythonAnywhere: registro, confirmación y tickets) y el tipo `PlanType`.
- **Línea 34**: `PaymentTicket` (comprobante visual) y el tipo `TicketData` de su contrato.
- **Línea 35**: `DeviceService.isEmulator()` para decidir el flujo según dispositivo real o emulador.
- **Línea 36**: token de color del tema.
- **Línea 37**: feature flags de pagos (`PAYMENTS_DEMO_ENABLED`, `PAYMENTS_ENABLED`) que participan en la decisión de bypass.

**Bloque L39–L47 — Comentario y contrato de props:**

```tsx
// ─── Lógica de bypass dinámica (Emulador saltará pasarela) ──────────────
interface PaymentModalProps {
  visible: boolean;
  deviceId: string;
  userName: string;
  userPhone: string;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Explicación de las líneas 39–47:**
- **Línea 39**: comentario que anuncia la lógica de bypass dinámico (el emulador salta la pasarela).
- **Línea 40**: interfaz de props.
- **Líneas 41–46**: `visible` controla el modal; `deviceId`, `userName`, `userPhone` son los datos del dispositivo/usuario que se envían al backend y a la Function; `onClose` cierra; `onSuccess` notifica al padre que el pago/proceso terminó (en `_layout` activa la suscripción y limpia la deuda).

**Bloque L49–L67 — Declaración del componente y estado inicial:**

```tsx
export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  deviceId,
  userName,
  userPhone,
  onClose,
  onSuccess,
}) => {
  // Se inicializa en true preventivamente si estamos en __DEV__ para no
  // bloquear al desarrollador mientras carga el chequeo de DeviceInfo.
  const [isBypassMode, setIsBypassMode] = useState(
    __DEV__ || PAYMENTS_DEMO_ENABLED || !PAYMENTS_ENABLED
  );
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [ticketVisible, setTicketVisible] = useState(false);
```

**Explicación de las líneas 49–67:**
- **Líneas 49–56**: componente funcional tipado que desestructura las seis props.
- **Líneas 57–58**: comentario que explica la decisión de inicializar el bypass en `true` en desarrollo para no bloquear al desarrollador mientras el chequeo asíncrono de `DeviceInfo` termina.
- **Líneas 59–61** (`isBypassMode`): inicializado en `true` si estamos en `__DEV__`, o si la demo está habilitada (`PAYMENTS_DEMO_ENABLED`), o si los pagos están desactivados por config (`!PAYMENTS_ENABLED`).
- **Línea 62** (`selectedPlan`): plan por defecto mensual.
- **Línea 63** (`loading`): desactiva botones y muestra `ActivityIndicator` durante operaciones asíncronas.
- **Línea 64** (`paymentUrl`): guarda la *init point* de Mercado Pago cuando la Function responde.
- **Línea 65** (`subscriptionId`): id de suscripción devuelto por la Function, usado como referencia del pago.
- **Línea 66** (`ticket`): datos del comprobante producido por el backend.
- **Línea 67** (`ticketVisible`): controla la superposición del `PaymentTicket`.

**Bloque L69–L78 — Efecto de detección de emulador:**

```tsx
  React.useEffect(() => {
    if (visible) {
      // Verificamos si es emulador o dispositivo real para decidir el flujo
      DeviceService.isEmulator().then(emu => {
        // Si es emulador O pago de muestra habilitado O pagos desactivados
        // por config, forzamos bypass
        setIsBypassMode(emu || PAYMENTS_DEMO_ENABLED || !PAYMENTS_ENABLED);
      });
    }
  }, [visible]);
```

**Explicación de las líneas 69–78:**
- **Línea 69**: `useEffect` dependiente de `visible`.
- **Línea 70**: solo actúa cuando el modal está visible.
- **Líneas 72–76**: consulta `DeviceService.isEmulator()` (basado en `react-native-device-info`) y recalcula el modo: emulador O demo habilitada O pagos desactivados → bypass.
- **Línea 77**: cierre del efecto.
- [NOTA] La promesa no tiene `catch`: si `isEmulator()` fallara, el estado conserva el valor inicial (que ya es `true` en `__DEV__`, pero en un build de producción con pagos habilitados quedaría `false` sin actualizar). `DeviceService.isEmulator` internamente captura errores y devuelve `false` (según `src/services/DeviceService.ts` líneas 160–166), por lo que el riesgo de estado colgado es bajo. [NIVEL DE CERTEZA: Altamente probable]

**Bloque L80–L93 — Cabecera documental de handleDevBypass:**

```tsx
  /* ============================================================================
  * Función         : handleDevBypass
  * Descripción     : Simula un pago aprobado en modo __DEV__ sin llamar a
  *                   Firebase Functions ni MercadoPago. Registra el dispositivo
  *                   en PA y genera el ticket correlativo real para verificar
  *                   el flujo completo de extremo a extremo.
  * Fecha           : 2026-04-07
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : PaymentService.registerDevice, PaymentService.createTicket
  * Ingesta         : void
  * Devolución      : Promise<void>
  * Uso             : onPress={handleDevBypass}
  * ============================================================================ */
```

**Explicación de las líneas 80–93:**
Cabecera documental. Confirma que el bypass simula un pago aprobado sin pasar por Firebase Functions ni Mercado Pago, pero **registra el dispositivo en PythonAnywhere y crea un ticket correlativo real** (para probar el flujo extremo a extremo, incluido el backend).

**Bloque L94–L129 — Implementación de handleDevBypass:**

```tsx
  const handleDevBypass = async () => {
    setLoading(true);
    try {
      // Registrar dispositivo en PA (valida conectividad con el backend)
      await PaymentService.registerDevice(deviceId, userName, userPhone);

      // Crear ticket real en PythonAnywhere
      const amount = selectedPlan === 'annual' ? 75000 : 7500;
      const ticketData = await PaymentService.createTicket(
        deviceId,
        userName,
        selectedPlan,
        amount
      );
      setTicket(ticketData);
      setTicketVisible(true);
      onSuccess();
    } catch (err) {
      console.error('[PaymentModal][DEV] Error en bypass:', err);
      // Si PA no responde, ticket local para no bloquear el flujo
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      setTicket({
        ticket_number: 9999,
        date: `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`,
        time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
        plan_type: selectedPlan,
        amount: selectedPlan === 'annual' ? 75000 : 7500,
        contact_email: 'safealert_contacto@manejadatos.com',
      });
      setTicketVisible(true);
      onSuccess();
    } finally {
      setLoading(false);
    }
  };
```

**Explicación de las líneas 94–129:**
- **Línea 95**: activa el indicador de carga.
- **Línea 98**: registra el dispositivo en PythonAnywhere (valida conectividad y deja constancia del dispositivo; si el backend responde `status: 'active'`, `PaymentService.registerDevice` además activa `hasSubscription` en el store).
- **Líneas 101–107**: calcula el importe (75000 anual / 7500 mensual) y crea el **ticket correlativo real** en el backend (`PaymentService.createTicket`, que envía la cabecera `X-Internal-Key` desde el entorno).
- **Líneas 108–110**: guarda el ticket, lo muestra y llama `onSuccess()` (en `_layout` activa la suscripción y limpia la deuda).
- **Líneas 111–125** (fallback si el backend no responde): construye un ticket **local** con número fijo `9999`, fecha/hora formateada del dispositivo, plan, importe y un email de contacto corporativo hardcodeado; lo muestra igualmente y llama `onSuccess()` para no bloquear el flujo de desarrollo.
- **Línea 112**: log de error con prefijo del módulo.
- **Líneas 126–128** (`finally`): siempre desactiva la carga.
- [OBSERVACIÓN TÉCNICA] En el fallback, `onSuccess()` se invoca igual aunque el backend no haya registrado nada: en `__DEV__` es aceptable (entorno de prueba), pero si el bypass llegara a activarse en un build de producción con flags mal configurados, equivaldría a "activar suscripción sin registro ni pago" (ver Seguridad).
- [OBSERVACIÓN TÉCNICA] Duplicación de los importes 7500/75000 y del cálculo de fecha con `pad` local; también duplicado en `handleConfirmPayment` (línea 227).

**Bloque L131–L142 — Cabecera documental de handleGeneratePayment:**

```tsx
  /* ============================================================================
  * Función         : handleGeneratePayment
  * Descripción     : Llama a la Firebase Function createPaymentOrder para obtener
  *                   la URL de pago de MercadoPago según el plan seleccionado.
  * Fecha           : 2026-04-07
  * Versión         : 3.2.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : Firebase Functions createPaymentOrder, PaymentService.registerDevice
  * Ingesta         : void
  * Devolución      : Promise<void>
  * Uso             : onPress={handleGeneratePayment}
  * ============================================================================ */
```

**Explicación de las líneas 131–142:**
Cabecera documental de `handleGeneratePayment`: conecta con la Firebase Function `createPaymentOrder` y con `PaymentService.registerDevice`.

**Bloque L143–L174 — Implementación de handleGeneratePayment:**

```tsx
  const handleGeneratePayment = async () => {
    setLoading(true);
    try {
      await PaymentService.registerDevice(deviceId, userName, userPhone);

      const createPayment = functions().httpsCallable('createPaymentOrder');
      const response = await createPayment({
        userName: userName.trim() || 'Usuario SafeAlert',
        phoneNumber: userPhone,
        deviceId,
        planType: selectedPlan,
      });

      const data = response.data as {
        success: boolean;
        initPoint: string;
        subscriptionId: string;
      };

      if (data.success && data.initPoint) {
        setPaymentUrl(data.initPoint);
        setSubscriptionId(data.subscriptionId || null);
      } else {
        Alert.alert('Error', 'No se pudo generar el enlace de pago. Intenta de nuevo.');
      }
    } catch (e: any) {
      console.error('[PaymentModal] Error al generar pago:', e);
      Alert.alert('Error de pago', e.message || 'Error conectando con Mercado Pago.');
    } finally {
      setLoading(false);
    }
  };
```

**Explicación de las líneas 143–174:**
- **Línea 145**: carga activa.
- **Línea 147**: registra el dispositivo en PA antes de generar el pago (el backend asocia la orden al dispositivo).
- **Líneas 149–154**: invoca la Cloud Function `createPaymentOrder` con `userName` (con `trim()` y respaldo `'Usuario SafeAlert'`), `phoneNumber`, `deviceId` y `planType`.
- **Líneas 156–160**: castea la respuesta a `{ success, initPoint, subscriptionId }`.
- **Líneas 162–167**: si la Function responde `success` con `initPoint`, guarda la URL de pago y el id de suscripción; si no, muestra `Alert` de error genérico.
- **Líneas 168–170**: captura cualquier error (tipado como `any`), lo registra en consola y muestra `Alert` con `e.message` del error o un mensaje genérico de conexión.
- **Líneas 171–173** (`finally`): desactiva la carga.
- [OBSERVACIÓN TÉCNICA] Uso de `any` para el error y exposición de `e.message` en la alerta: puede filtrar detalles internos de la red/Function al usuario final. Impacto: bajo-informativo.

**Bloque L176–L186 — Cabecera documental de handleOpenBrowser:**

```tsx
  /* ============================================================================
  * Función         : handleOpenBrowser
  * Descripción     : Abre la URL de pago en el navegador externo del dispositivo.
  * Fecha           : 2026-04-01
  * Versión         : 2.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : Linking (React Native), paymentUrl
  * Ingesta         : void
  * Devolución      : Promise<void>
  * Uso             : onPress={handleOpenBrowser}
  * ============================================================================ */
```

**Explicación de las líneas 176–186:**
Cabecera documental del handler que abre la pasarela en el navegador externo.

**Bloque L187–L200 — Implementación de handleOpenBrowser:**

```tsx
  const handleOpenBrowser = async () => {
    if (!paymentUrl) return;
    try {
      const canOpen = await Linking.canOpenURL(paymentUrl);
      if (canOpen) {
        await Linking.openURL(paymentUrl);
      } else {
        Alert.alert('Error', 'No se pudo abrir el enlace de pago.');
      }
    } catch (err) {
      console.error('[PaymentModal] Error al abrir URL:', err);
      Alert.alert('Error', 'Ocurrió un error al intentar abrir el pago.');
    }
  };
```

**Explicación de las líneas 187–200:**
- **Línea 188**: guard de seguridad: sin URL no hace nada.
- **Líneas 190–195**: verifica con `Linking.canOpenURL` que la URL (https de Mercado Pago) pueda abrirse y la abre con `Linking.openURL` en el navegador externo; si no puede, alerta.
- **Líneas 196–199**: ante errores, log y alerta genérica.
- [NOTA] El pago ocurre fuera de la app; el retorno al flujo se gestiona con el botón "Ya completé el pago" (no hay *deep link* de retorno ni webhook de confirmación en la app).

**Bloque L202–L214 — Cabecera documental de handleConfirmPayment:**

```tsx
  /* ============================================================================
  * Función         : handleConfirmPayment
  * Descripción     : Notifica al backend que el usuario completó el pago,
  *                   genera el ticket correlativo en PythonAnywhere y muestra
  *                   el comprobante visual.
  * Fecha           : 2026-04-07
  * Versión         : 3.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : PaymentService.confirmPayment, PaymentService.createTicket
  * Ingesta         : void
  * Devolución      : Promise<void>
  * Uso             : onPress={handleConfirmPayment}
  * ============================================================================ */
```

**Explicación de las líneas 202–214:**
Cabecera documental de `handleConfirmPayment`: notifica al backend la finalización del pago y genera el ticket correlativo.

**Bloque L215–L248 — Implementación de handleConfirmPayment:**

```tsx
  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      const confirmed = await PaymentService.confirmPayment(
        deviceId,
        selectedPlan,
        subscriptionId ?? undefined
      );
      if (!confirmed) {
        throw new Error('El backend no confirmó el pago.');
      }

      const amount = selectedPlan === 'annual' ? 75000 : 7500;
      const ticketData = await PaymentService.createTicket(
        deviceId,
        userName,
        selectedPlan,
        amount
      );
      setTicket(ticketData);
      setTicketVisible(true);
      onSuccess();
    } catch (err) {
      console.error('[PaymentModal] Error al confirmar pago:', err);
      // No llamar onSuccess(): el pago no quedó confirmado.
      Alert.alert(
        'No se pudo confirmar el pago',
        'Ocurrió un problema al confirmar tu suscripción. Verificá tu pago y volvé a intentarlo.',
        [{ text: 'Cerrar' }]
      );
    } finally {
      setLoading(false);
    }
  };
```

**Explicación de las líneas 215–248:**
- **Línea 217**: carga activa.
- **Líneas 219–223**: llama `PaymentService.confirmPayment(deviceId, selectedPlan, subscriptionId ?? undefined)`, que hace `POST` a `/api/payments/confirm` con `mp_reference` (el `subscriptionId` de la Function o vacío) y pone el estado `pending_verification` en el backend; devuelve `true` solo si `json.success === true`.
- **Líneas 224–226**: si el backend no confirma, lanza un error que corta el flujo.
- **Línea 228**: recalcula el importe (misma duplicación 7500/75000).
- **Líneas 229–234**: crea el ticket correlativo real en PA, lo guarda y lo muestra.
- **Línea 235**: `onSuccess()` solo si todo el proceso anterior fue exitoso.
- **Líneas 237–244**: ante error, log, y alerta informando que la suscripción no quedó confirmada y sugiriendo verificar el pago; el comentario de la línea 239 es explícito: **no** llamar `onSuccess()` si el pago no quedó confirmado (a diferencia del bypass de desarrollo).
- **Líneas 245–247** (`finally`): desactiva la carga.
- [NOTA] Este flujo asume la palabra del usuario al presionar "Ya completé el pago"; la verificación real del pago queda en `pending_verification` para revisión manual del lado del backend. [NIVEL DE CERTEZA: Altamente probable] — según la documentación interna de `PaymentService.confirmPayment` (`src/services/PaymentService.ts` líneas 120–131).

**Bloque L250–L260 — Cabecera documental de handleClose:**

```tsx
  /* ============================================================================
  * Función         : handleClose
  * Descripción     : Resetea todo el estado del modal y llama a onClose.
  * Fecha           : 2026-04-07
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : onClose prop
  * Ingesta         : void
  * Devolución      : void
  * Uso             : onPress={handleClose}
  * ============================================================================ */
```

**Explicación de las líneas 250–260:**
Cabecera documental de `handleClose`: resetea el estado del modal y notifica al padre.

**Bloque L261–L268 — Implementación de handleClose:**

```tsx
  const handleClose = () => {
    setPaymentUrl(null);
    setSubscriptionId(null);
    setTicket(null);
    setTicketVisible(false);
    setLoading(false);
    onClose();
  };
```

**Explicación de las líneas 261–268:**
- **Líneas 262–266**: limpia URL de pago, id de suscripción, ticket, visibilidad del ticket y carga, para que la próxima apertura arranque en estado inicial.
- **Línea 267**: notifica al padre (`onClose`), que en `_layout`/pantallas oculta el modal.
- [NOTA] `selectedPlan` y `isBypassMode` no se reinician (el plan queda en el último elegido y el modo en el detectado), comportamiento coherente con el ciclo de vida del modal persistente.

**Bloque L270–L278 — Render: apertura del Modal:**

```tsx
  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.container}>
```

**Explicación de las líneas 270–278:**
- **Líneas 270–271**: fragmento raíz que agrupa el `Modal` y el `PaymentTicket` superpuesto.
- **Líneas 272–277**: `Modal` nativo con `animationType="slide"`, `presentationStyle="pageSheet"` (hoja modal en iOS) y `onRequestClose={handleClose}` (el botón *back* de Android cierra el modal limpiando el estado).
- **Línea 278**: `SafeAreaView` con el contenedor blanco del modal.

**Bloque L279–L289 — Cabecera del modal:**

```tsx
          {/* Cabecera */}
          <View style={styles.header}>
            <Text style={styles.title}>Suscripción SafeAlert</Text>
            <TouchableOpacity
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar modal de pago"
            >
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
```

**Explicación de las líneas 279–289:**
- **Línea 281**: título visible "Suscripción SafeAlert".
- **Líneas 282–288**: botón "Cerrar" (rojo) que ejecuta `handleClose`, con `accessibilityRole="button"` y `accessibilityLabel="Cerrar modal de pago"` correctos.

**Bloque L291–L294 — Subtítulo:**

```tsx
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.subtitle}>
              Elige tu plan y completa el pago para activar todas las funciones.
            </Text>
```

**Explicación de las líneas 291–294:**
- **Línea 291**: `ScrollView` con `keyboardShouldPersistTaps="handled"` para contenido desplazable.
- **Líneas 292–294**: subtítulo de instrucciones al usuario.

**Bloque L296–L324 — Selector de plan:**

```tsx
            {/* Selector de plan */}
            <View style={styles.plansRow}>
              <TouchableOpacity
                style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
                onPress={() => setSelectedPlan('monthly')}
                disabled={!!paymentUrl}
              >
                <Text style={styles.planName}>Mensual</Text>
                <Text style={[styles.planPrice, selectedPlan === 'monthly' && styles.planPriceSelected]}>
                  $7.500
                </Text>
                <Text style={styles.planPriceSub}>ARS / mes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.planCard, selectedPlan === 'annual' && styles.planCardSelected]}
                onPress={() => setSelectedPlan('annual')}
                disabled={!!paymentUrl}
              >
                <View style={styles.savingBadge}>
                  <Text style={styles.savingText}>2 meses gratis</Text>
                </View>
                <Text style={styles.planName}>Anual</Text>
                <Text style={[styles.planPrice, selectedPlan === 'annual' && styles.planPriceSelected]}>
                  $75.000
                </Text>
                <Text style={styles.planPriceSub}>ARS / año</Text>
              </TouchableOpacity>
            </View>
```

**Explicación de las líneas 296–324:**
- **Línea 297**: fila con las dos tarjetas de plan.
- **Líneas 298–308** (tarjeta Mensual): `onPress` fija `selectedPlan` en `'monthly'`; el estilo de selección se aplica condicionalmente (`planCardSelected` si es el plan activo). `disabled={!!paymentUrl}` bloquea el cambio de plan una vez generada la URL de pago. Precio visible: `$7.500` ARS/mes.
- **Líneas 310–323** (tarjeta Anual): misma mecánica con `'annual'`; incluye la insignia de ahorro "2 meses gratis" (`savingBadge`) y el precio `$75.000` ARS/año.
- [NOTA] Los precios visibles (`$7.500`, `$75.000`) son literales de UI separados de los importes de lógica (7500/75000), con riesgo de divergencia (ver Riesgos).
- [OBSERVACIÓN TÉCNICA] Las tarjetas carecen de `accessibilityRole="button"` y `accessibilityLabel`; el estado seleccionado no se anuncia a lectores de pantalla.

**Bloque L326–L335 — Banner de modo bypass:**

```tsx
            {/* Banner modo bypass (emulador/development) */}
            {isBypassMode && (
              <View style={styles.devBanner}>
                <Text style={styles.devBannerTitle}>⚙️ ENTORNO DE PRUEBA / EMULADOR</Text>
                <Text style={styles.devBannerText}>
                  La pasarela de pago real se omite en este entorno.
                  El ticket se generará sin cargo real para pruebas corporativas.
                </Text>
              </View>
            )}
```

**Explicación de las líneas 326–335:**
- **Líneas 327–335**: banner ámbar visible solo en modo bypass. Texto clave visible para el usuario: "ENTORNO DE PRUEBA / EMULADOR", "La pasarela de pago real se omite en este entorno", "El ticket se generará sin cargo real para pruebas corporativas". Comunica de forma explícita que no hay cargo real.

**Bloque L337–L339 — Indicador de carga:**

```tsx
            {loading && (
              <ActivityIndicator size="large" color={color.warning} style={styles.loader} />
            )}
```

**Explicación de las líneas 337–339:**
`ActivityIndicator` en ámbar (`color.warning`) mientras `loading` es verdadero; reemplaza visualmente a los botones de acción.

**Bloque L341–L351 — Flujo de bypass (botón de prueba):**

```tsx
            {/* —— Flujo BYPASS —— */}
            {isBypassMode && !loading && (
              <TouchableOpacity
                style={styles.devBypassButton}
                onPress={handleDevBypass}
                accessibilityRole="button"
                accessibilityLabel="Confirmar suscripción de prueba"
              >
                <Text style={styles.devBypassButtonText}>✅ Confirmar suscripción de prueba</Text>
              </TouchableOpacity>
            )}
```

**Explicación de las líneas 341–351:**
- **Línea 342**: solo se muestra en bypass sin carga.
- **Líneas 343–350**: botón gris "Confirmar suscripción de prueba" que dispara `handleDevBypass` (registro + ticket real sin cargo), con accesibilidad correcta.

**Bloque L353–L363 — Flujo de producción (primera etapa):**

```tsx
            {/* —— Flujo PRODUCCIÓN —— */}
            {!isBypassMode && !loading && !paymentUrl && (
              <TouchableOpacity
                style={styles.payButton}
                onPress={handleGeneratePayment}
                accessibilityRole="button"
                accessibilityLabel={`Pagar plan ${selectedPlan === 'monthly' ? 'mensual' : 'anual'}`}
              >
                <Text style={styles.payButtonText}>💳 Ir a pagar</Text>
              </TouchableOpacity>
            )}
```

**Explicación de las líneas 353–363:**
- **Línea 354**: se muestra solo en producción, sin carga y antes de tener URL de pago.
- **Líneas 355–362**: botón azul "Ir a pagar" que dispara `handleGeneratePayment`; la etiqueta de accesibilidad describe el plan elegido.

**Bloque L365–L385 — Flujo de producción (segunda etapa: pasarela y confirmación):**

```tsx
            {!isBypassMode && !loading && !!paymentUrl && (
              <>
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={handleOpenBrowser}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir MercadoPago en el navegador"
                >
                  <Text style={styles.payButtonText}>💳 Abrir MercadoPago</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.successButton}
                  onPress={handleConfirmPayment}
                  accessibilityRole="button"
                  accessibilityLabel="Confirmar que ya completé el pago"
                >
                  <Text style={styles.successButtonText}>✅ Ya completé el pago</Text>
                </TouchableOpacity>
              </>
            )}
```

**Explicación de las líneas 365–385:**
- **Línea 365**: visible solo en producción con URL de pago ya generada.
- **Líneas 367–374**: botón "Abrir MercadoPago" (`handleOpenBrowser`) que abre la pasarela en el navegador externo.
- **Líneas 376–383**: botón verde "Ya completé el pago" (`handleConfirmPayment`) que el usuario presiona al regresar de la pasarela para notificar al backend y obtener su ticket.
- [NOTA] No existe verificación automática del pago (webhook/deep link): la app depende de la acción manual del usuario y de la revisión `pending_verification` del backend.

**Bloque L387–L391 — Nota legal de suscripción:**

```tsx
            <Text style={styles.footNote}>
              Al suscribirte aceptás los{' '}
              <Text style={styles.footNoteLink}>Términos y Condiciones</Text>
              {' '}de SafeAlert.
            </Text>
```

**Explicación de las líneas 387–391:**
- **Líneas 387–391**: texto visible de aceptación: "Al suscribirte aceptás los Términos y Condiciones de SafeAlert." Los `{' '}` controlan los espacios entre nodos `Text`.
- [OBSERVACIÓN TÉCNICA] "Términos y Condiciones" (`footNoteLink`) se estiliza como enlace (subrayado rojo) pero **no tiene `onPress` ni navegación**: es texto muerto que sugiere un enlace inexistente. Impacto: bajo (UX/legal, no funcional).

**Bloque L392–L394 — Cierre del modal:**

```tsx
          </ScrollView>
        </SafeAreaView>
      </Modal>
```

**Explicación de las líneas 392–394:**
Cierran `ScrollView`, `SafeAreaView` y `Modal`.

**Bloque L396–L407 — Montaje del PaymentTicket:**

```tsx
      {/* Ticket de pago — se muestra sobre el modal de pago */}
      <PaymentTicket
        visible={ticketVisible}
        ticket={ticket}
        onClose={() => {
          setTicketVisible(false);
          handleClose();
        }}
      />
    </>
  );
};
```

**Explicación de las líneas 396–407:**
- **Líneas 397–404**: monta `PaymentTicket` **fuera** del `Modal` de pago (hermano dentro del fragmento), superpuesto sobre él. `onClose` oculta el ticket y ejecuta `handleClose` (que además limpia el estado del modal de pago y llama `onClose`).
- **Líneas 405–407**: cierran el fragmento, el `return` y el componente.

**Bloque L409–L459 — Estilos (1.ª parte):**

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeText: {
    fontSize: 16,
    color: '#C0392B',
    fontWeight: '600',
  },
  body: {
    padding: 20,
    gap: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },
  plansRow: {
    flexDirection: 'row',
    gap: 12,
  },
  planCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  planCardSelected: {
    borderColor: '#C0392B',
    backgroundColor: '#fff5f5',
  },
```

**Explicación de las líneas 409–459:**
- **Líneas 410–413** (`container`): fondo blanco a pantalla completa del modal.
- **Líneas 414–422** (`header`): barra superior con título a la izquierda y botón "Cerrar" a la derecha, con borde inferior gris.
- **Líneas 423–427** (`title`): título en gris oscuro `#1a1a1a`, peso 700.
- **Líneas 428–432** (`closeText`): "Cerrar" en rojo corporativo `#C0392B`.
- **Líneas 433–436** (`body`): contenido del `ScrollView` con `gap` 16.
- **Líneas 437–442** (`subtitle`): instrucción centrada en gris `#555`.
- **Líneas 443–446** (`plansRow`): fila de tarjetas de plan.
- **Líneas 447–455** (`planCard`): tarjeta de plan con borde 2 px gris y fondo claro.
- **Líneas 456–459** (`planCardSelected`): tarjeta activa con borde rojo corporativo y fondo rosado pálido.

**Bloque L460–L508 — Estilos (2.ª parte):**

```tsx
  planName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
  },
  planPriceSelected: {
    color: '#C0392B',
  },
  planPriceSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  savingBadge: {
    backgroundColor: '#27AE60',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  savingText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  devBanner: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFC107',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  devBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 4,
  },
  devBannerText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
```

**Explicación de las líneas 460–508:**
- **Líneas 460–465** (`planName`): nombre del plan.
- **Líneas 466–470** (`planPrice`): precio grande (22 px, peso 800).
- **Líneas 471–473** (`planPriceSelected`): precio activo en rojo corporativo.
- **Líneas 474–478** (`planPriceSub`): unidad ("ARS / mes", "ARS / año") en gris.
- **Líneas 479–485** (`savingBadge`): insignia verde `#27AE60` "2 meses gratis".
- **Líneas 486–490** (`savingText`): texto de la insignia en blanco.
- **Líneas 491–497** (`devBanner`): banner de modo prueba en ámbar (`#FFF3CD` con borde `#FFC107`).
- **Líneas 498–503** (`devBannerTitle`): título del banner en ámbar oscuro.
- **Líneas 504–508** (`devBannerText`): cuerpo del banner.

**Bloque L509–L558 — Estilos (3.ª parte: botones y nota):**

```tsx
  loader: {
    marginVertical: 16,
  },
  devBypassButton: {
    backgroundColor: '#6C757D',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  devBypassButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  payButton: {
    backgroundColor: '#009EE3',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  successButton: {
    backgroundColor: '#27AE60',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footNote: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
  footNoteLink: {
    color: '#C0392B',
    textDecorationLine: 'underline',
  },
});
```

**Explicación de las líneas 509–558:**
- **Líneas 509–511** (`loader`): márgenes del indicador de carga.
- **Líneas 512–518** (`devBypassButton`): botón de bypass en gris `#6C757D` (semántica "no real").
- **Líneas 519–523** (`devBypassButtonText`): texto blanco.
- **Líneas 524–530** (`payButton`): botón de pago en azul `#009EE3` (color de Mercado Pago).
- **Líneas 531–535** (`payButtonText`): texto blanco del botón de pago.
- **Líneas 536–542** (`successButton`): botón de confirmación en verde `#27AE60`.
- **Líneas 543–547** (`successButtonText`): texto blanco del botón de confirmación.
- **Líneas 548–553** (`footNote`): nota legal pequeña en gris `#999`.
- **Líneas 554–557** (`footNoteLink`): "Términos y Condiciones" en rojo subrayado (sin enlace real).
- **Línea 558**: cierre del `StyleSheet`.
- [NOTA] Todos los estilos usan colores literales; no se consume el design system (`color`, `spacing`, etc.) salvo el `color.warning` del indicador de carga.

## Fichas de funciones y métodos

### Efecto de detección de emulador (líneas 69–78)

- Firma: `React.useEffect(() => { if (visible) { DeviceService.isEmulator().then(...); } }, [visible]);`.
- Propósito técnico: recalcular `isBypassMode` cuando el modal se abre, según el dispositivo real o emulador y los flags de configuración.
- Propósito funcional: garantizar que en emulador/demo el desarrollador no se tope con la pasarela real.
- Dependencias: `DeviceService.isEmulator`, `PAYMENTS_DEMO_ENABLED`, `PAYMENTS_ENABLED`, estado `isBypassMode`.
- Flujo: al hacerse `visible` verdadero, consulta el emulador y actualiza el estado con `emu || PAYMENTS_DEMO_ENABLED || !PAYMENTS_ENABLED`.
- Efectos secundarios: ninguno. Riesgos: sin `catch` explícito; mitigado porque `DeviceService.isEmulator` captura errores y devuelve `false`.

### handleDevBypass (líneas 94–129)

- Firma: `const handleDevBypass = async () => { ... };` (`Promise<void>`).
- Propósito técnico: flujo de prueba sin pasarela que valida la integración de extremo a extremo con el backend PythonAnywhere.
- Propósito funcional: permitir pruebas corporativas de suscripción y comprobante sin cargo real.
- Parámetros: ninguno. Retorno: `Promise<void>`.
- Dependencias: `PaymentService.registerDevice`, `PaymentService.createTicket`, estados `selectedPlan`, `loading`, `ticket`, `ticketVisible`, prop `onSuccess`.
- Flujo: 1) `setLoading(true)`; 2) `registerDevice(deviceId, userName, userPhone)`; 3) calcular importe (75000/7500); 4) `createTicket(...)`; 5) `setTicket`, `setTicketVisible(true)`, `onSuccess()`; 6) en error: ticket local (`9999`, fecha/hora local, email corporativo) + `onSuccess()`; 7) `finally` `setLoading(false)`.
- Funciones que llama: `PaymentService.registerDevice`, `PaymentService.createTicket`. Desde dónde se llama: botón "Confirmar suscripción de prueba" (línea 345).
- Efectos secundarios: registro de dispositivo en backend, creación de ticket real, activación de suscripción vía `onSuccess`.
- Riesgos: en un build no-dev con flags mal configurados, `onSuccess` se dispara sin pago ni registro real de suscripción; importes duplicados; email corporativo hardcodeado en el fallback.

### handleGeneratePayment (líneas 143–174)

- Firma: `const handleGeneratePayment = async () => { ... };` (`Promise<void>`).
- Propósito técnico: obtener la URL de pago (init point) de Mercado Pago vía la Cloud Function `createPaymentOrder`.
- Propósito funcional: iniciar el flujo de pago real del plan elegido.
- Parámetros: ninguno. Retorno: `Promise<void>`.
- Dependencias: `PaymentService.registerDevice`, `functions().httpsCallable('createPaymentOrder')`, estados `loading`, `paymentUrl`, `subscriptionId`, prop `selectedPlan`, `deviceId`, `userName`, `userPhone`.
- Flujo: 1) carga; 2) `registerDevice`; 3) llamada a la Function con `userName.trim() || 'Usuario SafeAlert'`, `phoneNumber`, `deviceId`, `planType`; 4) si `success` e `initPoint`, guarda URL e id de suscripción; 5) si no, alerta; 6) errores: log + alerta con `e.message`; 7) `finally` sin carga.
- Efectos secundarios: registro del dispositivo; apertura posterior del navegador con la URL de pago. Riesgos: alerta con `e.message` puede exponer detalles internos.

### handleOpenBrowser (líneas 187–200)

- Firma: `const handleOpenBrowser = async () => { ... };` (`Promise<void>`).
- Propósito técnico: abrir la URL de pago en el navegador externo del dispositivo mediante `Linking`.
- Parámetros: ninguno. Retorno: `Promise<void>`.
- Dependencias: `paymentUrl`, `Linking.canOpenURL`, `Linking.openURL`, `Alert`.
- Flujo: 1) guard sin URL; 2) `canOpenURL`; 3) `openURL` o alerta; 4) errores: log + alerta.
- Efectos secundarios: abandono temporal de la app hacia el navegador. Riesgos: no hay verificación automática del pago al volver.

### handleConfirmPayment (líneas 215–248)

- Firma: `const handleConfirmPayment = async () => { ... };` (`Promise<void>`).
- Propósito técnico: notificar la finalización del pago al backend, generar el ticket correlativo y mostrarlo.
- Propósito funcional: completar la suscripción tras el pago manual en Mercado Pago.
- Parámetros: ninguno. Retorno: `Promise<void>`.
- Dependencias: `PaymentService.confirmPayment`, `PaymentService.createTicket`, estados `loading`, `ticket`, `ticketVisible`, props `deviceId`, `userName`, `onSuccess`.
- Flujo: 1) carga; 2) `confirmPayment(deviceId, plan, subscriptionId ?? undefined)`; 3) si no confirma, lanza error; 4) `createTicket` con importe del plan; 5) `setTicket`, `setTicketVisible(true)`, `onSuccess()`; 6) en error: log + alerta **sin** `onSuccess`; 7) `finally` sin carga.
- Efectos secundarios: estado `pending_verification` en el backend; creación de ticket real; activación de suscripción en el padre.
- Riesgos: confía en la palabra del usuario ("Ya completé el pago") sin verificación automática local; importes duplicados.

### handleClose (líneas 261–268)

- Firma: `const handleClose = () => { ... };` (retorno `void`).
- Propósito técnico/funcional: resetear el estado del proceso de pago y notificar al padre.
- Parámetros: ninguno. Retorno: `void`.
- Dependencias: todos los setters de estado y la prop `onClose`.
- Flujo: limpia `paymentUrl`, `subscriptionId`, `ticket`, `ticketVisible`, `loading` y ejecuta `onClose()`.
- Efectos secundarios: ninguna persistencia; el padre oculta el modal. Riesgos: si el usuario cierra con la URL generada sin pagar, no queda ninguna marca de pago pendiente local (el backend conserva la orden si la hubo).

## Clases / interfaces / tipos

### PaymentModalProps (líneas 40–47)

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `visible` | `boolean` | Sí | Visibilidad del modal |
| `deviceId` | `string` | Sí | Id del dispositivo (registro y tickets) |
| `userName` | `string` | Sí | Nombre del usuario |
| `userPhone` | `string` | Sí | Teléfono del usuario |
| `onClose` | `() => void` | Sí | Cierre del modal (con limpieza de estado) |
| `onSuccess` | `() => void` | Sí | Proceso completado; el padre activa la suscripción |

### Tipos consumidos (definidos en otros módulos)

| Tipo | Origen | Uso |
| --- | --- | --- |
| `PlanType` | `src/services/PaymentService.ts` | `'monthly' \| 'annual'` para `selectedPlan` |
| `TicketData` | `src/components/PaymentTicket.tsx` | Contrato del comprobante (`ticket`) |

Relaciones: el componente consume `PaymentService` y `DeviceService`; monta `PaymentTicket`; es consumido por `_layout.tsx`, `(tabs)/index.tsx` y `contacts/[id].tsx`. Ciclo de vida: se mantiene montado en los padres y se muestra con `visible`; `handleClose` deja el estado listo para una nueva sesión.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Los importes `7500`/`75000` se duplican en `handleDevBypass` (líneas 101, 121) y `handleConfirmPayment` (línea 227), y además los precios visibles `$7.500`/`$75.000` (líneas 305, 320) son literales de UI independientes. Cualquier cambio de precio requiere tocar 5 sitios. Archivo: `src/components/PaymentModal.tsx`.
- [OBSERVACIÓN TÉCNICA] El fallback de `handleDevBypass` (líneas 111–125) muestra un ticket local con número fijo `9999` y email corporativo hardcodeado `'safealert_contacto@manejadatos.com'` y llama `onSuccess()` igualmente; un ticket local `9999` no existe en el backend (el correlativo real se pierde si PA falla tras haber creado el ticket). Impacto: posible confusión contable en pruebas.
- [OBSERVACIÓN TÉCNICA] "Términos y Condiciones" (líneas 388–390) se ve como enlace (subrayado) pero no tiene `onPress` ni navegación: no se puede consultar el contrato desde el modal. Impacto: UX/legal.
- [OBSERVACIÓN TÉCNICA] `e: any` en `handleGeneratePayment` (línea 168) y alerta con `e.message`: tipado débil y posible fuga de detalles de error al usuario.
- [OBSERVACIÓN TÉCNICA] El flujo de producción no verifica automáticamente el pago al volver de Mercado Pago (sin deep link/webhook en la app); depende del botón "Ya completé el pago" y de la revisión manual `pending_verification` del backend. [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] Las tarjetas de plan (líneas 298–323) no declaran `accessibilityRole="button"` ni `accessibilityLabel`.
- [NOTA] `isBypassMode` se activa también cuando `!PAYMENTS_ENABLED`: en un build de producción sin la variable `EXPO_PUBLIC_ENABLE_PAYMENTS` (default `false` según `src/config/features.ts`), todos los usuarios verían el flujo de prueba en lugar de la pasarela real.
- [NOTA] `console.error` con prefijos de módulo (`[PaymentModal]...`) en puntos de error; no se imprime ningún secreto en los logs analizados. [NIVEL DE CERTEZA: Confirmado por código]

## Seguridad

- No se encuentran secretos en este archivo; las claves se leen en `PaymentService` desde `process.env.EXPO_PUBLIC_*` y se envían al backend por HTTPS (fuera del alcance de este archivo, ver `src/services/PaymentService.ts`).
- [ALTO] Control de negocio del bypass: `isBypassMode` es verdadero también con `!PAYMENTS_ENABLED` y con `PAYMENTS_DEMO_ENABLED`, no solo en `__DEV__`/emulador. En un build de producción mal configurado (flag de pagos apagado), el botón "Confirmar suscripción de prueba" quedaría visible para usuarios reales, registraría el dispositivo en PA, crearía tickets correlativos reales sin cargo y dispararía `onSuccess` (que activa `hasSubscription` y limpia la deuda en `_layout`). La severidad depende de la configuración del release, pero el diseño no blinda el bypass contra builds no-dev. Archivo: `src/components/PaymentModal.tsx`, líneas 59–61, 75 y 94–129.
- [MEDIO] La confirmación de pago depende de la acción manual del usuario ("Ya completé el pago"); un usuario podría afirmar un pago inexistente. Mitigación parcial: el backend pasa a `pending_verification` (revisión manual). El ticket correlativo se crea antes de la verificación final del pago. [NIVEL DE CERTEZA: Altamente probable]
- [INFORMATIVO] `userName`, `userPhone` y `deviceId` (datos personales) se envían a la Firebase Function `createPaymentOrder` y al backend PythonAnywhere (por HTTPS); el modal no registra ni almacena estos datos localmente.
- [INFORMATIVO] El fallback de bypass expone el email corporativo `'safealert_contacto@manejadatos.com'` como literal en el bundle de la app (no es secreto, pero es información de contacto de la organización).
- [BAJO] Exposición de `e.message` en alertas y logs puede revelar detalles internos de red/backend al usuario en pantalla.
- [INFORMATIVO] No se observan vectores de inyección (XSS/SQL) desde este componente: las entradas se serializan como JSON a endpoints HTTPS; la validación fuerte debe residir en el backend y las Cloud Functions.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Bypass alcanzable en builds no-dev si los flags quedan mal configurados (ver Seguridad). Recomendación: restringir el bypass a `__DEV__` + emulador (`DeviceService.isEmulator()`), independizándolo de `PAYMENTS_ENABLED`, o hacer que `onSuccess` en bypass no active suscripciones reales.
- [RIESGO] Duplicación de precios (lógica vs. UI) puede generar cobros mostrados inconsistentes con lo facturado. Recomendación: centralizar `PRICES = { monthly: 7500, annual: 75000 }` en una constante o en la configuración y derivar tanto los textos de UI como los importes de las llamadas.
- [RIESGO] Confianza en la confirmación manual del usuario sin verificación local del pago. Recomendación: evaluar *deep link* de retorno de Mercado Pago o consultar el estado de la orden al backend antes de crear el ticket.
- [RECOMENDACIÓN] Eliminar el email corporativo y el ticket `9999` del fallback local; en su lugar mostrar un error de conexión claro sin fabricar comprobantes.
- [RECOMENDACIÓN] Hacer navegable "Términos y Condiciones" o quitarlo del estilo de enlace si aún no existe el documento.
- [RECOMENDACIÓN] Añadir `accessibilityRole`/`accessibilityLabel` y estado de selección accesible a las tarjetas de plan.
- [RECOMENDACIÓN] Tipar errores (`unknown` + narrowing) en lugar de `any`, y no exponer `e.message` crudo en `Alert`.
- [RECOMENDACIÓN] Migrar los estilos a los tokens del design system para consistencia con el resto de la app.
