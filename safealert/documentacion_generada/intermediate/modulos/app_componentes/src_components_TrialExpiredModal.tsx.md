# Archivo: src/components/TrialExpiredModal.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/components/TrialExpiredModal.tsx | 149 | TypeScript 5.9 / TSX (React Native) | 4348 | Componente UI de modal (aviso) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Modal de aviso que informa al usuario que su período de prueba gratuito (10 días) ha terminado y no ha pagado la suscripción. Es un componente **de presentación sin estado interno**: recibe por props la visibilidad y dos callbacks (`onSuscribirse`, `onCerrar`) y no ejecuta servicios ni lógica de negocio por sí mismo. La detección de la expiración ocurre en el layout raíz (`app/_layout.tsx`), que invoca `TrialService.checkPrueba(deviceId)` y muestra este modal cuando el resultado indica prueba expirada sin pago.

## Clasificación y estado

- `FUNCIONALIDAD EXISTENTE`: componente definido, exportado y conectado al layout raíz.
- Referencias reales encontradas por grep en `app/_layout.tsx`:
  - Línea 35: `import { TrialExpiredModal } from '../src/components/TrialExpiredModal';`
  - Líneas 413–420: renderizado condicional con `visible`, `onSuscribirse` (que cierra el modal y abre `PaymentModal`) y `onCerrar` (que solo lo cierra).
- [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `React` (de `'react'`) | Estándar (externo) | `React.FC` y JSX | Sí |
| `Modal`, `View`, `Text`, `TouchableOpacity`, `StyleSheet`, `SafeAreaView` (de `'react-native'`) | Estándar (externo) | Render del modal | Sí |
| `color` (de `'../theme'`) | Interna | Estilos del modal (tokens de color) | Sí |

## Componentes que dependen de este archivo

| Consumidor | Tipo de uso |
| --- | --- |
| `app/_layout.tsx` | Importa y renderiza el modal globalmente (líneas 35, 413–420), controlado por `showTrialExpiredModal` |

Flujo de activación (contexto, código en `app/_layout.tsx` líneas 147–163): al iniciar la app, si `estado.activo && estado.expirado && !estado.pago` devuelto por `TrialService.checkPrueba(deviceId)` es verdadero, se activa `setShowTrialExpiredModal(true)`. Al presionar "Suscribirme ahora", `_layout` abre el `PaymentModal`.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `TrialExpiredModalProps` | Interfaz | Tipo | Contrato de props | Líneas 25–32 |
| `styles` | Objeto de estilos | `StyleSheet` | Estilos del modal | Líneas 92–149 |

No hay constantes numéricas ni valores mágicos en este archivo: la duración de la prueba ("10 días") es texto de UI, no lógica del componente. Los tokens de color provienen de `../theme` (re-export de `./tokens`): `color.surface`, `color.textPrimary`, `color.textSecondary`, `color.danger`, `color.textInverse`.

## Estructura (funciones / clases / tipos)

- Interfaz `TrialExpiredModalProps` (líneas 25–32).
- Componente exportado `TrialExpiredModal` (líneas 46–90).
- Objeto de estilos `styles` (líneas 92–149).
- No hay funciones internas, hooks, estado ni llamadas a servicios.

## Análisis línea por línea

**Bloque L1–L12 — Cabecera de archivo (comentario):**

```tsx
/* ============================================================================
* Archivo         : TrialExpiredModal.tsx
* Descripción     : Modal de aviso de período de prueba vencido. Se muestra
*                   cuando la app detecta al iniciar que los 10 días de prueba
*                   han expirado y el usuario no ha pagado. Ofrece la opción
*                   de suscribirse o continuar de forma limitada.
* Autor           : oafon
* Fecha           : 2026-04-10
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : <TrialExpiredModal visible onSuscribirse={...} onCerrar={...} />
* ============================================================================ */
```

**Explicación de las líneas 1–12:**
Cabecera documental con la convención del proyecto. Define la finalidad del modal: avisar de la prueba vencida detectada al iniciar la app. Aporta la semántica de los dos botones: suscribirse o continuar de forma limitada (cerrar el aviso).

**Bloque L14–L22 — Importaciones:**

```tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { color } from '../theme';
```

**Explicación de las líneas 14–22:**
- **Línea 14**: React para `React.FC` y JSX.
- **Líneas 15–21**: primitivas de React Native. `Modal` para la ventana superpuesta; `View`/`Text` para estructura y textos; `TouchableOpacity` para los botones; `StyleSheet` para estilos; `SafeAreaView` para respetar el área segura sobre el overlay.
- **Línea 23**: tokens de color del design system (`color.surface`, `color.danger`, etc.).

**Bloque L25–L32 — Interfaz de props:**

```tsx
interface TrialExpiredModalProps {
  /** Controla la visibilidad del modal */
  visible: boolean;
  /** Callback al presionar "Suscribirse" */
  onSuscribirse: () => void;
  /** Callback al presionar "Cerrar" (continúa con funcionalidad limitada) */
  onCerrar: () => void;
}
```

**Explicación de las líneas 25–32:**
- **Línea 26** (`visible`): controla si el modal se muestra u oculta; el modal se renderiza siempre que el padre lo incluya en el árbol y React Native oculta el contenido cuando `visible === false` (con `animationType="fade"`).
- **Línea 28** (`onSuscribirse`): callback del botón primario; en `_layout` cierra este modal y abre el `PaymentModal`.
- **Línea 31** (`onCerrar`): callback del botón secundario y del cierre por botón *back* de Android (`onRequestClose`); en `_layout` simplemente oculta el modal (el usuario continúa con funcionalidad limitada).

**Bloque L34–L45 — Cabecera documental del componente:**

```tsx
/* ============================================================================
* Función         : TrialExpiredModal
* Descripción     : Renderiza el aviso de período de prueba vencido con las
*                   opciones de suscribirse o cerrar el aviso.
* Fecha           : 2026-04-10
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : _layout.tsx, PaymentModal
* Ingesta         : TrialExpiredModalProps
* Devolución      : JSX.Element
* Uso             : <TrialExpiredModal visible onSuscribirse={...} onCerrar={...} />
* ============================================================================ */
```

**Explicación de las líneas 34–45:**
Comentario de función según la convención del proyecto. Documenta la conexión real del componente con `_layout.tsx` y con `PaymentModal` (vía callback), sus entradas (props) y salida (JSX). Es información de mantenimiento, sin efecto en ejecución.

**Bloque L46–L58 — Declaración del componente y apertura del Modal:**

```tsx
export const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({
  visible,
  onSuscribirse,
  onCerrar,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCerrar}
    >
```

**Explicación de las líneas 46–58:**
- **Líneas 46–50**: componente funcional tipado que desestructura las tres props.
- **Línea 52** (`visible={visible}`): prop de control del `Modal` nativo.
- **Línea 53** (`transparent`): el modal no ocupa pantalla completa con fondo propio; se ve el overlay semitransparente definido en estilos.
- **Línea 54** (`animationType="fade"`): fundido de entrada/salida.
- **Línea 55** (`statusBarTranslucent`): permite que el overlay se dibuje debajo de la barra de estado (Android).
- **Línea 56** (`onRequestClose={onCerrar}`): al pulsar *back* en Android se ejecuta `onCerrar`, no el cierre del modal; es decir, el aviso desaparece y el usuario sigue con funcionalidad limitada. [NOTA] No existe bloqueo del botón *back* forzando suscripción; el usuario puede evadir el aviso por esa vía.

**Bloque L59–L69 — Contenido del aviso (texto de consentimiento/aviso):**

```tsx
      <SafeAreaView style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.icon}>⏰</Text>

          <Text style={styles.title}>Terminó el período de prueba</Text>

          <Text style={styles.body}>
            Tu prueba gratuita de 10 días ha finalizado.{'\n\n'}
            Para seguir usando SafeAlert y proteger a tus seres queridos,
            activá tu suscripción.
          </Text>
```

**Explicación de las líneas 59–69:**
- **Línea 59**: `SafeAreaView` con el estilo `overlay` (fondo oscuro semitransparente y centrado) como contenedor de la tarjeta.
- **Línea 60**: tarjeta central `card` con fondo `color.surface`, esquinas redondeadas y sombra.
- **Línea 61**: ícono de reloj (⏰) como elemento visual de advertencia.
- **Línea 63**: título principal del aviso.
- **Líneas 65–68**: cuerpo del mensaje dirigido al usuario. Texto visible clave: "Tu prueba gratuita de 10 días ha finalizado" y llamada a activar la suscripción "para proteger a tus seres queridos". `{'\n\n'}` inserta saltos de línea explícitos dentro del `Text`. No hay aquí cláusulas de consentimiento ni permisos: es un aviso comercial/de servicio.

**Bloque L71–L85 — Botones de acción:**

```tsx
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onSuscribirse}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Suscribirme ahora</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onCerrar}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>Más tarde</Text>
          </TouchableOpacity>
```

**Explicación de las líneas 71–85:**
- **Líneas 71–77**: botón primario "Suscribirme ahora". Al pulsarlo se ejecuta `onSuscribirse`, que en `_layout.tsx` cierra este modal y abre `PaymentModal` (líneas 415–418). Estilo `primaryBtn` con fondo `color.danger` (rojo corporativo), lo que lo presenta como CTA principal.
- **Líneas 79–85**: botón secundario "Más tarde" con `onCerrar`; estilo `secondaryBtn` solo de texto (sin fondo). Permite continuar con funcionalidad limitada.
- [NOTA] Los botones no declaran `accessibilityRole="button"` ni `accessibilityLabel` explícitos; `TouchableOpacity` no aporta rol por defecto, lo que degrada la accesibilidad de estas acciones.

**Bloque L86–L90 — Cierre de elementos:**

```tsx
        </View>
      </SafeAreaView>
    </Modal>
  );
};
```

**Explicación de las líneas 86–90:**
Cierre de la tarjeta, el `SafeAreaView`, el `Modal`, el `return` y el componente. No hay lógica adicional.

**Bloque L92–L131 — Estilos (1.ª parte):**

```tsx
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: color.surface,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: color.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: color.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: color.danger,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: color.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 8,
  },
  secondaryBtnText: {
    color: color.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
```

**Explicación de las líneas 92–149:**
- **Líneas 93–99** (`overlay`): fondo negro al 60 % (`rgba(0,0,0,0.6)`) centrado; crea la cortina semitransparente tras la tarjeta.
- **Líneas 100–112** (`card`): tarjeta blanca de tema (`color.surface`), radio 20, ancho completo con margen del overlay, columna centrada con `gap: 16` y sombra/elevación para destacarla sobre el fondo oscuro. En iOS la sombra se define con `shadow*` y en Android con `elevation`.
- **Líneas 113–115** (`icon`): tamaño de ícono de aviso.
- **Líneas 116–121** (`title`): título en `color.textPrimary`, peso 700, centrado.
- **Líneas 122–127** (`body`): cuerpo del mensaje en `color.textSecondary` con interlineado 22 para legibilidad.
- **Líneas 128–135** (`primaryBtn`): botón CTA a ancho completo con fondo `color.danger` (rojo corporativo de SafeAlert).
- **Líneas 136–140** (`primaryBtnText`): texto del CTA en `color.textInverse` (blanco).
- **Líneas 141–143** (`secondaryBtn`): botón secundario sin caja (solo relleno vertical).
- **Líneas 144–148** (`secondaryBtnText`): texto secundario discreto en `color.textSecondary`.
- [NOTA] Los estilos usan los tokens del design system para colores y valores propios para radios/paddings; no hay estilos triviales con implicaciones de seguridad.

## Fichas de funciones y métodos

El archivo no contiene lógica funcional propia (sin handlers, hooks ni servicios); todo el comportamiento se delega a las props `onSuscribirse` y `onCerrar`. No se documentan fichas de funciones.

## Clases / interfaces / tipos

### TrialExpiredModalProps (líneas 25–32)

Interfaz de props. Responsabilidad: contrato de comunicación entre el layout raíz y el modal.

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `visible` | `boolean` | Sí | Visibilidad del modal |
| `onSuscribirse` | `() => void` | Sí | Acción del botón primario (abrir pago) |
| `onCerrar` | `() => void` | Sí | Acción del botón secundario y del botón *back* (continuar limitado) |

Ciclo de vida: sin estado; montado permanentemente en `_layout` y mostrado/ocultado vía prop `visible`. Relaciones: consumido por `app/_layout.tsx`; orquesta hacia `PaymentModal` en el padre.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] El modal se monta de forma incondicional en `_layout.tsx`; solo cambia su prop `visible`. Es un patrón válido, pero consume un `Modal` nativo siempre presente en el árbol. Impacto: mínimo. Archivo: `app/_layout.tsx` líneas 413–420.
- [OBSERVACIÓN TÉCNICA] Los botones carecen de `accessibilityRole="button"` y `accessibilityLabel`, a diferencia de otros componentes del proyecto (p. ej. `PaymentModal`). Impacto potencial: anuncio deficiente del control por lectores de pantalla. Archivo: `src/components/TrialExpiredModal.tsx`, líneas 71–85.
- [NOTA] No existe lógica de expiración en el componente: la duración de 10 días y el chequeo viven en `TrialService` y en `_layout.tsx`; el modal solo refleja el estado decidido por el padre. [NIVEL DE CERTEZA: Confirmado por código] (la cabecera del componente así lo declara y el grep de `checkPrueba` apunta a `_layout.tsx`).
- [NOTA] El texto visible no constituye consentimiento ni solicitud de permiso; es un aviso de renovación comercial.

## Seguridad

- No se encontraron hallazgos de seguridad en este archivo: no procesa datos personales, no ejecuta red, no registra logs y no contiene secretos.
- [INFORMATIVO] `onRequestClose={onCerrar}` permite descartar el aviso con el botón *back* de Android, por lo que la "funcionalidad limitada" post-prueba depende de las restricciones reales aplicadas en el resto de la app y no de este modal (que es solo informativo).

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Al ser puramente informativo y permitir "Más tarde" / *back*, un usuario puede usar la app en modo limitado indefinidamente si el resto de la app no aplica restricciones efectivas por suscripción. Recomendación: verificar que las funciones premium se bloqueen en origen (servicios) y no solo por UI.
- [RECOMENDACIÓN] Añadir `accessibilityRole="button"` y etiquetas de accesibilidad a ambos `TouchableOpacity`, en línea con el resto de componentes.
- [RECOMENDACIÓN] Centralizar la duración de la prueba ("10 días") y los textos del aviso en una única fuente (config o i18n) para evitar divergencias entre el mensaje y la lógica real de `TrialService`.
