# Archivo: src/components/PaymentTicket.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/components/PaymentTicket.tsx | 406 | TypeScript 5.9 / TSX (React Native) | 12002 | Componente UI de comprobante/ticket de pago | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Renderiza el **comprobante visual de pago** ("ticket") de SafeAlert en un `Modal`: muestra el número de ticket correlativo (proveniente del backend PythonAnywhere), fecha, hora (UTC), tipo de plan, monto en ARS y email de contacto; permite **compartir** el comprobante mediante el sistema nativo del dispositivo (`Share`) o **cerrarlo**. Además, exporta la interfaz `TicketData`, que es el *contrato de datos* del comprobante utilizado por `PaymentService.createTicket` (que lo produce) y por `PaymentModal` (que lo consume y muestra). Es un componente presentacional: no llama servicios ni tiene lógica de negocio, salvo el formateo de datos para mostrar/compartir y el render condicional cuando no hay ticket.

## Clasificación y estado

- `FUNCIONALIDAD EXISTENTE`: componente exportado, tipado y conectado al flujo real de pago.
- Referencias reales:
  - `src/components/PaymentModal.tsx` línea 34: `import { PaymentTicket, TicketData } from './PaymentTicket';` — render del ticket (líneas 397–404) sobre el modal de pago.
  - `src/services/PaymentService.ts` línea 18: `import type { TicketData } from '../components/PaymentTicket';` — el backend normaliza su respuesta a `TicketData` (líneas 168–191).
- [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `React` (de `'react'`) | Estándar (externo) | `React.FC` y JSX | Sí |
| `View`, `Text`, `StyleSheet`, `TouchableOpacity`, `Share`, `Image`, `Modal`, `SafeAreaView`, `ScrollView` (de `'react-native'`) | Estándar (externo) | Render del ticket, compartir y logo | Sí |
| `require('../../assets/icon.png')` | Recurso interno estático | Logo en la cabecera del ticket | Sí (asset verificado: `safealert/assets/icon.png`) |

No usa `color`/tokens del tema: la paleta del ticket está definida localmente con la constante `SAFEALERT_RED` y literales.

## Componentes que dependen de este archivo

| Consumidor | Tipo de uso |
| --- | --- |
| `src/components/PaymentModal.tsx` | Importa `PaymentTicket` y `TicketData`; renderiza el ticket sobre el modal de pago (líneas 397–404) |
| `src/services/PaymentService.ts` | Importa `TicketData` solo como tipo para tipar la respuesta de `createTicket` (líneas 18, 190) |

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `TicketData` | Interfaz exportada | Tipo | Contrato de datos del comprobante | Líneas 26–33 |
| `SAFEALERT_RED` | `'#C0392B'` | `string` (const) | Color rojo corporativo de la marca, usado en estilos | Línea 236 |
| `styles` | Objeto de estilos | `StyleSheet` | Estilos del ticket | Líneas 238–406 |

Valores mágicos: `18` (número de triángulos del borde dentado, líneas 137 y 168), `padStart(6, '0')` (relleno a 6 dígitos del número de ticket), `Array.from({ length: 18 })`, import del logo `'../../assets/icon.png'`. No hay secretos ni datos de configuración en este archivo.

## Estructura (funciones / clases / tipos)

- Interfaz exportada `TicketData` (líneas 26–33).
- Interfaz interna `PaymentTicketProps` (líneas 35–39).
- Funciones de utilidad: `formatAmount` (líneas 52–54) y `planLabel` (líneas 67–69).
- Función asíncrona `handleShare` (líneas 83–108).
- Componente exportado `PaymentTicket` (líneas 110–211).
- Subcomponente interno `TicketRow` (líneas 220–234).
- Objeto de estilos `styles` (líneas 238–406).
- No hay hooks, estado interno ni llamadas a servicios.

## Análisis línea por línea

**Bloque L1–L11 — Cabecera de archivo (comentario):**

```tsx
/* ============================================================================
* Archivo         : PaymentTicket.tsx
* Descripción     : Ticket visual de pago de SafeAlert. Muestra número correlativo,
*                   fecha, hora, plan, monto y email de contacto. Permite compartir
*                   o cerrar. El número de ticket proviene del endpoint PA.
* Autor           : oafon
* Fecha           : 2026-04-07
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : <PaymentTicket ticket={ticketData} onClose={() => {}} />
* ============================================================================ */
```

**Explicación de las líneas 1–11:**
Cabecera documental. Declara el propósito del componente y el origen del número de ticket (endpoint "PA" = PythonAnywhere, vía `PaymentService.createTicket`). El ejemplo de uso de la línea 10 no incluye `visible`; la API real incluye `visible` (líneas 35–39).

**Bloque L13–L24 — Importaciones:**

```tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
```

**Explicación de las líneas 13–24:**
- **Línea 13**: React para `React.FC` y JSX.
- **Líneas 14–23**: primitivas de React Native. `Share` habilita el share nativo del dispositivo; `Image` muestra el logo corporativo; `Modal` envuelve el ticket como capa superior; `ScrollView` garantiza el desplazamiento en pantallas pequeñas.
- No se importa ningún servicio ni store: componente autocontenido.

**Bloque L26–L33 — Interfaz TicketData (contrato de datos):**

```tsx
export interface TicketData {
  ticket_number: number;
  date: string;
  time: string;
  plan_type: 'monthly' | 'annual';
  amount: number;
  contact_email: string;
}
```

**Explicación de las líneas 26–33:**
- **Línea 26**: `export` hace que la interfaz sea consumible por `PaymentService` (backend) y `PaymentModal`.
- **Línea 27** (`ticket_number`): número correlativo emitido por el backend.
- **Líneas 28–29** (`date`, `time`): fecha y hora (UTC) como cadenas ya formateadas por el backend (el componente las muestra tal cual y agrega la marca "UTC" en la UI).
- **Línea 30** (`plan_type`): union type estricto `'monthly' | 'annual'`.
- **Líneas 31–32** (`amount`, `contact_email`): monto en ARS y email de contacto corporativo del comprobante.
- [NOTA] La interfaz refleja el *shape* plano que `PaymentService.createTicket` normaliza desde la respuesta del backend (`data.ticket ?? data`), es decir, el cliente ya recibe un objeto `TicketData` directo.

**Bloque L35–L39 — Props del componente:**

```tsx
interface PaymentTicketProps {
  visible: boolean;
  ticket: TicketData | null;
  onClose: () => void;
}
```

**Explicación de las líneas 35–39:**
- **Línea 36** (`visible`): controla el `Modal`.
- **Línea 37** (`ticket: TicketData | null`): datos del comprobante; si es `null` el componente no renderiza nada (guard en línea 111).
- **Línea 38** (`onClose`): cierra el ticket. En `PaymentModal` el `onClose` oculta el ticket y cierra también el modal de pago (líneas 400–403).

**Bloque L41–L54 — Utilidad formatAmount:**

```tsx
/* ============================================================================
* Función         : formatAmount
* Descripción     : Formatea un número como moneda ARS con separadores de miles.
* Fecha           : 2026-04-07
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : PaymentTicket
* Ingesta         : n: number
* Devolución      : string (ej: "$7.500")
* Uso             : formatAmount(7500) → "$7.500"
* ============================================================================ */
function formatAmount(n: number): string {
  return '$' + n.toLocaleString('es-AR');
}
```

**Explicación de las líneas 41–54:**
- **Líneas 42–52**: cabecera documental de la función.
- **Línea 53**: antepone el símbolo `$` y formatea con separador de miles según la configuración regional `es-AR` (`toLocaleString('es-AR')`), p. ej. 7500 → `$7.500`.
- [NOTA] `toLocaleString('es-AR')` depende de la ICU del runtime de cada plataforma; en algunos dispositivos Android antiguos el resultado puede diferir del punto como separador de miles. Impacto potencial: formato inconsistente entre dispositivos. [NIVEL DE CERTEZA: Inferido]

**Bloque L56–L69 — Utilidad planLabel:**

```tsx
/* ============================================================================
* Función         : planLabel
* Descripción     : Convierte el identificador interno del plan a texto legible.
* Fecha           : 2026-04-07
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : PaymentTicket
* Ingesta         : plan: string
* Devolución      : string
* Uso             : planLabel('monthly') → "Suscripción Mensual"
* ============================================================================ */
function planLabel(plan: string): string {
  return plan === 'annual' ? 'Suscripción Anual' : 'Suscripción Mensual';
}
```

**Explicación de las líneas 56–69:**
- **Líneas 57–67**: cabecera documental.
- **Línea 68**: función pura que traduce el identificador interno a texto legible; cualquier valor distinto de `'annual'` (incluidos `'monthly'` y valores inválidos) se muestra como "Suscripción Mensual".
- [OBSERVACIÓN TÉCNICA] El parámetro se tipa como `string`, no como el union `'monthly' | 'annual'` de `TicketData`; un valor inesperado se enmascara silenciosamente como mensual. Impacto: solo cosmético.

**Bloque L71–L108 — Función asíncrona handleShare:**

```tsx
/* ============================================================================
* Función         : handleShare
* Descripción     : Comparte el texto del ticket usando el sistema nativo de
*                   compartir del dispositivo (WhatsApp, email, etc.).
* Fecha           : 2026-04-07
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : Share (React Native), TicketData
* Ingesta         : ticket: TicketData
* Devolución      : Promise<void>
* Uso             : onPress={() => handleShare(ticket)}
* ============================================================================ */
async function handleShare(ticket: TicketData): Promise<void> {
  const texto = [
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '        🛡️  SAFEALERT',
    '   Comprobante de Pago',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    `📋 Ticket N°: ${String(ticket.ticket_number).padStart(6, '0')}`,
    `📅 Fecha:     ${ticket.date}`,
    `🕐 Hora:      ${ticket.time} (UTC)`,
    `📦 Plan:      ${planLabel(ticket.plan_type)}`,
    `💰 Monto:     ${formatAmount(ticket.amount)} ARS`,
    `📧 Contacto:  ${ticket.contact_email}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    'Gracias por confiar en SafeAlert.',
    'Tu suscripción se activará en minutos.',
  ].join('\n');

  try {
    await Share.share({
      message: texto,
      title: `Ticket SafeAlert #${ticket.ticket_number}`,
    });
  } catch (err) {
    // El usuario canceló el share — no es error
  }
}
```

**Explicación de las líneas 71–108:**
- **Líneas 72–83**: cabecera documental; la conexión declarada es la API `Share` de React Native.
- **Líneas 84–98**: construye el texto plano del comprobante como array de líneas unidas con `\n`, con formato de "ticket" usando caracteres de bloque (━━━) y emojis. Contenido: marca, número con `padStart(6, '0')`, fecha, hora con la marca `(UTC)`, plan legible, monto formateado + "ARS", email de contacto y mensaje final ("Tu suscripción se activará en minutos").
- **Líneas 100–104**: invoca `Share.share` con `message` y `title`. El share nativo permite enviar el comprobante por WhatsApp, email, etc.
- **Líneas 105–107**: captura el error y lo ignora con comentario explícito ("El usuario canceló el share — no es error").
- [OBSERVACIÓN TÉCNICA] El catch traga cualquier error (no solo cancelaciones); un fallo real de `Share` pasaría desapercibido sin feedback al usuario. Impacto: bajo.
- [NOTA] El texto compartido incluye el email de contacto corporativo y el número de ticket; no incluye datos personales del comprador (solo el número emitido por el backend). [NIVEL DE CERTEZA: Confirmado por código]

**Bloque L110–L115 — Componente y apertura del Modal:**

```tsx
export const PaymentTicket: React.FC<PaymentTicketProps> = ({ visible, ticket, onClose }) => {
  if (!ticket) return null;

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="pageSheet" transparent>
```

**Explicación de las líneas 110–115:**
- **Línea 110**: exporta el componente tipado desestructurando `visible`, `ticket`, `onClose`.
- **Línea 111** (`if (!ticket) return null`): guard crítico: sin datos de ticket no se renderiza nada, evitando `undefined` en el acceso a propiedades del ticket.
- **Línea 114**: configuración del `Modal`: `animationType="fade"`, `presentationStyle="pageSheet"` (formato de hoja en iOS) y `transparent`.
- [OBSERVACIÓN TÉCNICA] Combinar `presentationStyle="pageSheet"` con `transparent` puede producir comportamientos inconsistentes entre plataformas (en iOS `pageSheet` define una presentación de tarjeta; en Android se ignora). El modal además no define `onRequestClose`: en Android, el botón *back* cerrará el modal por defecto sin ejecutar `onClose` del padre, dejando a `PaymentModal` en un estado interno inconsistente. [NIVEL DE CERTEZA: Inferido]

**Bloque L116–L133 — Contenedor y cabecera del ticket:**

```tsx
      <SafeAreaView style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Tarjeta del ticket ─── */}
          <View style={styles.card}>
            {/* Franja superior decorativa */}
            <View style={styles.cardHeader}>
              <View style={styles.headerStripe} />
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.brandName}>Safealert</Text>
              <Text style={styles.brandSub}>Comprobante de Pago</Text>
              <View style={styles.headerStripe} />
            </View>
```

**Explicación de las líneas 116–133:**
- **Línea 116**: `SafeAreaView` con overlay oscuro (`rgba(0,0,0,0.65)`).
- **Líneas 117–119**: `ScrollView` con contenido centrado (`flexGrow: 1`, `justifyContent: 'center'`) y teclado tolerado (`keyboardShouldPersistTaps="handled"`, sin teclado real aquí).
- **Líneas 120–121**: tarjeta blanca del ticket.
- **Líneas 123–133** (`cardHeader`): cabecera del comprobante con dos franjas rojas decorativas (`headerStripe`), el logo de la app (`require('../../assets/icon.png')`, asset verificado en `safealert/assets/icon.png`), el nombre de marca "Safealert" y el subtítulo "Comprobante de Pago".
- [NOTA] El nombre de marca visible dice "Safealert" (minúscula en la "a" media), mientras que en el share text se escribe "SAFEALERT" y en otras pantallas "SafeAlert". Inconsistencia menor de marca entre superficies.

**Bloque L135–L143 — Borde dentado superior:**

```tsx
            {/* Separador dentado */}
            <View style={styles.zigzagRow}>
              {Array.from({ length: 18 }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.zigzagTriangle, i % 2 === 0 ? styles.zigzagUp : styles.zigzagDown]}
                />
              ))}
            </View>
```

**Explicación de las líneas 135–143:**
- **Líneas 136–142**: genera 18 triángulos alternados (`Array.from({ length: 18 })`) que simulan el borde dentado de un ticket físico; los pares usan `zigzagUp` y los impares `zigzagDown`. Es decorativo, sin lógica funcional.

**Bloque L145–L164 — Cuerpo de datos del ticket:**

```tsx
            {/* Cuerpo del ticket */}
            <View style={styles.body}>
              <TicketRow
                label="N° de Ticket"
                value={`#${String(ticket.ticket_number).padStart(6, '0')}`}
                highlight
              />
              <View style={styles.divider} />
              <TicketRow label="Fecha" value={ticket.date} />
              <TicketRow label="Hora" value={`${ticket.time} UTC`} />
              <View style={styles.divider} />
              <TicketRow label="Plan" value={planLabel(ticket.plan_type)} />
              <TicketRow
                label="Monto"
                value={`${formatAmount(ticket.amount)} ARS`}
                highlight
              />
              <View style={styles.divider} />
              <TicketRow label="Contacto" value={ticket.contact_email} small />
            </View>
```

**Explicación de las líneas 145–164:**
- **Líneas 147–151**: fila destacada con el número de ticket precedido de `#` y rellenado a 6 dígitos (`padStart(6, '0')`), consistente con el texto compartido.
- **Línea 152**: divisor fino.
- **Líneas 153–154**: fecha y hora; la UI agrega la marca "UTC" a la hora devuelta por el backend.
- **Líneas 156–161**: plan legible (`planLabel`) y monto en ARS formateado (`formatAmount`), este último destacado.
- **Línea 163**: email de contacto en tamaño reducido (`small`), con `numberOfLines={2}` en el subcomponente para evitar desbordes con emails largos.
- [NOTA] El cuerpo reproduce íntegramente los campos de `TicketData`; no hay campos extra ni datos del usuario más allá del email de contacto corporativo.

**Bloque L166–L174 — Borde dentado inferior:**

```tsx
            {/* Separador dentado inferior */}
            <View style={[styles.zigzagRow, { transform: [{ rotate: '180deg' }] }]}>
              {Array.from({ length: 18 }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.zigzagTriangle, i % 2 === 0 ? styles.zigzagUp : styles.zigzagDown]}
                />
              ))}
            </View>
```

**Explicación de las líneas 166–174:**
- **Línea 167**: mismo patrón dentado rotado 180 grados para cerrar la tarjeta por abajo (efecto visual de ticket desprendible).
- **Líneas 168–173**: idéntica generación de 18 triángulos alternados.

**Bloque L176–L185 — Pie de la tarjeta:**

```tsx
            {/* Pie del ticket */}
            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>
                Gracias por confiar en SafeAlert 🛡️
              </Text>
              <Text style={styles.footerSub}>
                Tu suscripción se activará en minutos.
              </Text>
            </View>
          </View>
```

**Explicación de las líneas 176–185:**
- **Líneas 178–180**: mensaje de agradecimiento con el escudo de la marca.
- **Líneas 181–183**: nota "Tu suscripción se activará en minutos".
- [NOTA] El mensaje de activación "en minutos" es una promesa de negocio cuyo cumplimiento depende de la verificación del pago en el backend (estado `pending_verification` según `PaymentService.confirmPayment`); el ticket se muestra antes de esa verificación manual.

**Bloque L187–L206 — Botones de acción:**

```tsx
          {/* ─── Botones ─── */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => handleShare(ticket)}
              accessibilityRole="button"
              accessibilityLabel="Compartir comprobante"
            >
              <Text style={styles.shareButtonText}>📤  Compartir comprobante</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar comprobante"
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
```

**Explicación de las líneas 187–206:**
- **Líneas 189–196**: botón primario rojo "Compartir comprobante" que invoca `handleShare(ticket)` con accesibilidad correcta (`accessibilityRole="button"` y `accessibilityLabel`).
- **Líneas 198–205**: botón secundario "Cerrar" que ejecuta `onClose`; en `PaymentModal` esto oculta el ticket y cierra el modal de pago (líneas 400–403 de ese archivo).
- **Línea 206**: cierre de la fila de acciones.

**Bloque L207–L211 — Cierre del componente:**

```tsx
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
```

**Explicación de las líneas 207–211:**
Cierre de `ScrollView`, `SafeAreaView`, `Modal`, `return` y componente. No hay lógica posterior.

**Bloque L213–L234 — Subcomponente interno TicketRow:**

```tsx
/* ─── Fila de dato ─── */
interface TicketRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  small?: boolean;
}
const TicketRow: React.FC<TicketRowProps> = ({ label, value, highlight, small }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, small && styles.rowLabelSmall]}>{label}</Text>
    <Text
      style={[
        styles.rowValue,
        highlight && styles.rowValueHighlight,
        small && styles.rowValueSmall,
      ]}
      numberOfLines={2}
    >
      {value}
    </Text>
  </View>
);
```

**Explicación de las líneas 213–234:**
- **Líneas 214–219** (`TicketRowProps`): fila de datos con `label` (izquierda), `value` (derecha) y modificadores `highlight` (destaca valor en rojo) y `small` (reduce tamaño, usado en el email).
- **Líneas 220–234**: componente funcional sin estado que renderiza una fila `label`/`value`. `numberOfLines={2}` limita el valor a dos líneas. Es la unidad de render repetida del cuerpo del ticket.
- [NOTA] `TicketRow` no se exporta (uso interno exclusivo).

**Bloque L236 — Constante de color de marca:**

```tsx
const SAFEALERT_RED = '#C0392B';
```

**Explicación de la línea 236:**
Define el rojo corporativo `#C0392B` (mismo valor usado en `PaymentModal` para acentos y en el color de "Cerrar") como constante local única para los estilos del ticket. No se usa el token `color.danger` del tema; verificar si `color.danger` coincide con `#C0392B`. [NIVEL DE CERTEZA: No determinado]

**Bloque L238–L292 — Estilos (1.ª parte):**

```tsx
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  cardHeader: {
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    gap: 8,
  },
  headerStripe: {
    width: '100%',
    height: 4,
    backgroundColor: SAFEALERT_RED,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginTop: 12,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    fontStyle: 'italic',
    color: SAFEALERT_RED,
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 12,
    color: '#888',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
```

**Explicación de las líneas 238–292:**
- **Líneas 239–243** (`overlay`): cortina negra al 65 % centrada verticalmente.
- **Líneas 244–248** (`scrollContent`): contenido centrado con padding 20; permite scroll en pantallas pequeñas.
- **Líneas 249–260** (`card`): tarjeta blanca con radio 16, borde gris claro, `overflow: 'hidden'` (necesario para el borde dentado) y sombra/elevación.
- **Líneas 261–267** (`cardHeader`): cabecera gris claro (`#FAFAFA`) centrada.
- **Líneas 268–272** (`headerStripe`): franja roja decorativa de 4 px a todo lo ancho.
- **Líneas 273–278** (`logo`): logo de 72x72 con esquinas redondeadas.
- **Líneas 279–285** (`brandName`): nombre "Safealert" en rojo corporativo, cursiva y negrita (800).
- **Líneas 286–292** (`brandSub`): subtítulo en mayúsculas con espaciado entre letras.

**Bloque L293–L339 — Estilos (2.ª parte: dentado y filas):**

```tsx
  /* Borde dentado tipo ticket */
  zigzagRow: {
    flexDirection: 'row',
    height: 12,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  zigzagTriangle: {
    flex: 1,
    height: 12,
  },
  zigzagUp: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  zigzagDown: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  body: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  rowLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    flex: 1,
  },
  rowLabelSmall: {
    fontSize: 11,
  },
```

**Explicación de las líneas 293–339:**
- **Líneas 294–299** (`zigzagRow`): contenedor de 12 px de alto con fondo gris claro; los triángulos se recortan con `overflow: 'hidden'`.
- **Líneas 300–303** (`zigzagTriangle`): cada unidad ocupa un ancho flexible (`flex: 1`) para repartir los 18 triángulos.
- **Líneas 304–308** (`zigzagUp`): triángulo "hacia arriba" simulando la muesca mediante radios inferiores sobre fondo blanco.
- **Líneas 309–313** (`zigzagDown`): triángulo "hacia abajo" complementario.
- **Líneas 314–319** (`body`): cuerpo del ticket con padding horizontal 24 y `gap: 10` entre filas.
- **Líneas 320–324** (`divider`): línea fina gris entre secciones de datos.
- **Líneas 325–330** (`row`): fila con etiqueta a la izquierda y valor a la derecha (`space-between`).
- **Líneas 331–336** (`rowLabel`): etiqueta en gris `#888` con `flex: 1`.
- **Líneas 337–339** (`rowLabelSmall`): reduce la etiqueta a 11 px (email de contacto).

**Bloque L340–L373 — Estilos (3.ª parte: valores y pie):**

```tsx
  rowValue: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  rowValueHighlight: {
    color: SAFEALERT_RED,
    fontSize: 15,
    fontWeight: '800',
  },
  rowValueSmall: {
    fontSize: 11,
    color: '#666',
  },
  cardFooter: {
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#444',
    fontWeight: '600',
    textAlign: 'center',
  },
  footerSub: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
```

**Explicación de las líneas 340–373:**
- **Líneas 340–346** (`rowValue`): valor en gris oscuro `#222`, `flex: 2` (más ancho que la etiqueta) y alineado a la derecha.
- **Líneas 347–351** (`rowValueHighlight`): valores destacados (número de ticket y monto) en rojo corporativo y peso 800.
- **Líneas 352–355** (`rowValueSmall`): valor pequeño para el email.
- **Líneas 356–362** (`cardFooter`): pie gris claro de la tarjeta.
- **Líneas 363–368** (`footerText`): agradecimiento centrado.
- **Líneas 369–373** (`footerSub`): nota de activación en gris `#999`.

**Bloque L374–L406 — Estilos (4.ª parte: botones):**

```tsx
  /* Botones */
  actions: {
    marginTop: 20,
    gap: 10,
  },
  shareButton: {
    backgroundColor: SAFEALERT_RED,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: SAFEALERT_RED,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  closeButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  closeButtonText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 14,
  },
});
```

**Explicación de las líneas 374–406:**
- **Líneas 375–378** (`actions`): contenedor de botones bajo la tarjeta.
- **Líneas 379–389** (`shareButton`): botón CTA rojo con sombra/elevación propia del color de marca.
- **Líneas 390–394** (`shareButtonText`): texto blanco en negrita.
- **Líneas 395–400** (`closeButton`): botón de cierre en gris claro `#F5F5F5`.
- **Líneas 401–405** (`closeButtonText`): texto gris `#555`.
- **Línea 406**: cierre del `StyleSheet`.
- [NOTA] Todo el estilo usa literales y la constante local `SAFEALERT_RED`; no consume tokens del design system, a diferencia de `WebModeBanner`.

## Fichas de funciones y métodos

### formatAmount (líneas 52–54)

- Firma: `function formatAmount(n: number): string`.
- Propósito técnico: formatear el monto con separador de miles en locale `es-AR` y prefijo `$`.
- Propósito funcional: presentar el monto del comprobante en formato monetario argentino.
- Parámetros:
  | Nombre | Tipo | Descripción |
  | --- | --- | --- |
  | `n` | `number` | Monto en ARS |
- Retorno: `string` (p. ej. `"$7.500"`). Excepciones: ninguna.
- Dependencias: API `toLocaleString`. Desde dónde se llama: líneas 93 (share) y 159 (fila Monto).
- Efectos secundarios: ninguno. Riesgo: comportamiento dependiente de la ICU del runtime.

### planLabel (líneas 67–69)

- Firma: `function planLabel(plan: string): string`.
- Propósito técnico/funcional: traducir `'monthly' | 'annual'` a texto legible para pantalla y share.
- Parámetros:
  | Nombre | Tipo | Descripción |
  | --- | --- | --- |
  | `plan` | `string` | Identificador interno del plan |
- Retorno: `string`. Excepciones: ninguna.
- Desde dónde se llama: líneas 92 (share) y 156 (fila Plan).
- Efectos secundarios: ninguno. Riesgo: valores inesperados se muestran como "Suscripción Mensual" (ver Observaciones).

### handleShare (líneas 83–108)

- Firma: `async function handleShare(ticket: TicketData): Promise<void>`.
- Propósito técnico: componer el texto plano del comprobante y abrir el share nativo (`Share.share`).
- Propósito funcional: permitir al usuario guardar/enviar su comprobante por cualquier app del dispositivo.
- Parámetros:
  | Nombre | Tipo | Descripción |
  | --- | --- | --- |
  | `ticket` | `TicketData` | Datos del comprobante a compartir |
- Retorno: `Promise<void>`. Excepciones: capturadas internamente (ignoradas).
- Dependencias: `Share` (React Native), `formatAmount`, `planLabel`.
- Flujo interno: 1) construye `texto` con marca, número (6 dígitos), fecha, hora (UTC), plan, monto ARS y contacto; 2) `Share.share({ message, title })`; 3) cualquier error se ignora.
- Desde dónde se llama: botón "Compartir comprobante" (línea 191).
- Efectos secundarios: abre la UI de share del sistema. Riesgo: el `catch` oculta errores reales.

## Clases / interfaces / tipos

### TicketData (líneas 26–33) — exportada

Contrato de datos del comprobante, producido por el backend PythonAnywhere vía `PaymentService.createTicket` y consumido por `PaymentModal`.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `ticket_number` | `number` | Número correlativo |
| `date` | `string` | Fecha formateada |
| `time` | `string` | Hora (UTC) formateada |
| `plan_type` | `'monthly' \| 'annual'` | Plan contratado |
| `amount` | `number` | Monto en ARS |
| `contact_email` | `string` | Email de contacto del comprobante |

Relaciones: `PaymentService.createTicket` devuelve `TicketData` (normalizando `data.ticket ?? data`); `PaymentModal` almacena un `ticket: TicketData | null` y lo pasa a `PaymentTicket`.

### PaymentTicketProps (líneas 35–39)

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `visible` | `boolean` | Sí | Visibilidad del modal |
| `ticket` | `TicketData \| null` | Sí | Datos del ticket; `null` no renderiza |
| `onClose` | `() => void` | Sí | Cierra el ticket (y el modal padre en `PaymentModal`) |

### TicketRowProps (líneas 214–219)

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `label` | `string` | Sí | Etiqueta de la fila |
| `value` | `string` | Sí | Valor a mostrar |
| `highlight` | `boolean` | No | Destaca el valor en rojo corporativo |
| `small` | `boolean` | No | Reduce el tamaño de etiqueta y valor |

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] El `Modal` del ticket combina `presentationStyle="pageSheet"` con `transparent` y no define `onRequestClose`. En Android el botón *back* cerrará el modal nativo sin invocar `onClose`, dejando `PaymentModal` con su estado interno (`ticketVisible`) sin sincronizar con la realidad. Impacto: estado inconsistente posible. Archivo: `src/components/PaymentTicket.tsx`, línea 114.
- [OBSERVACIÓN TÉCNICA] El `catch` de `handleShare` (líneas 105–107) ignora cualquier error, no solo la cancelación del usuario, sin feedback. Impacto: bajo.
- [OBSERVACIÓN TÉCNICA] `planLabel` tipa su parámetro como `string` en lugar del union `PlanType`; cualquier valor inesperado se muestra como mensual sin aviso. Impacto: cosmético.
- [NOTA] Inconsistencia de marca: el ticket muestra "Safealert" (línea 130), el share text "SAFEALERT" y otras pantallas "SafeAlert". [NIVEL DE CERTEZA: Confirmado por código]
- [NOTA] `SAFEALERT_RED = '#C0392B'` duplica el rojo usado en `PaymentModal` (`'#C0392B'` en varios estilos) y posiblemente el token `color.danger` del tema; convendría centralizar. [NIVEL DE CERTEZA: No determinado] respecto a la igualdad con `color.danger`.
- [NOTA] El mensaje "Tu suscripción se activará en minutos" se muestra antes de que el backend confirme la verificación manual del pago (estado `pending_verification`); es una promesa de negocio que conviene revisar.
- [NOTA] El asset del logo `require('../../assets/icon.png')` existe en `safealert/assets/icon.png` (verificado). [NIVEL DE CERTEZA: Confirmado por código]

## Seguridad

- No se encontraron secretos, tokens ni claves en este archivo.
- [INFORMATIVO] El ticket expone el email de contacto corporativo (`contact_email`) tanto en pantalla como en el texto compartido; no contiene datos personales del comprador (ni nombre ni teléfono). No se registra en logs.
- [INFORMATIVO] El número de ticket correlativo se muestra en claro y puede compartirse; es un identificador de comprobante de bajo riesgo, pero su validez/uso como prueba de pago depende de la verificación en el backend (el ticket se crea sin verificación previa del pago en el flujo de confirmación manual de `PaymentModal`).
- [BAJO] `Share` permite reenviar el comprobante a terceros; si en el futuro el ticket incluyera datos personales, el share nativo los difundiría sin control de la app. Hoy el contenido es seguro (solo datos del comprobante).

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] El `Modal` sin `onRequestClose` puede desincronizar el estado del flujo de pago en Android (ver Observaciones). Recomendación: añadir `onRequestClose={onClose}` para un cierre consistente en todas las plataformas.
- [RECOMENDACIÓN] Capturar solo la cancelación del share (distinguir errores) o mostrar feedback ante fallos reales.
- [RECOMENDACIÓN] Centralizar el rojo corporativo y los formatos (monto, plan) en el design system/config para evitar la duplicación con `PaymentModal` y `theme`.
- [RECOMENDACIÓN] Unificar el nombre de marca visible ("SafeAlert") entre el ticket, el share text y el resto de la app.
- [RECOMENDACIÓN] Revisar el mensaje de activación "en minutos" frente al flujo real de verificación de pago (`pending_verification` en el backend).
