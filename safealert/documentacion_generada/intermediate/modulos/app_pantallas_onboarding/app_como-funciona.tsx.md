# Archivo: app/como-funciona.tsx

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | app/como-funciona.tsx |
| Líneas totales | 315 |
| Lenguaje | TypeScript 5.9 / TSX (React Native) |
| Tamaño (bytes) | 10827 |
| Categoría | Pantalla informativa estática (expo-router, ruta `/como-funciona`) |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Pantalla informativa "Cómo Funciona SafeAlert" que explica al usuario el flujo
operativo de la aplicación mediante una guía visual en pasos numerados y secciones
temáticas (primeros pasos, emergencia, funciones avanzadas, período de prueba y
consejos). Es contenido puramente estático: no hay lógica de negocio, permisos,
ni acceso a servicios; su fin es educativo y de transparencia dentro del flujo de
onboarding/aprendizaje de la app.

## Clasificación y estado

- Estado: `FUNCIONALIDAD EXISTENTE` — ruta declarada en `app/_layout.tsx` (líneas
  379–382) como `<Stack.Screen name="como-funciona" ... presentation='modal'>` y
  navegada desde `app/(tabs)/settings.tsx` (líneas 148–149,
  `router.push('/como-funciona')`).
- [NIVEL DE CERTEZA: Confirmado por código]
- Importaciones `borderRadius` y `shadow` del tema (línea 19) sin uso real en el
  cuerpo ni en estilos → `[POTENCIALMENTE NO UTILIZADO]`.
- La sección visual (código fuente) no varía entre usuarios ni muestra estado de
  la app; es documentación embebida en la UI.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `React` | estándar (React) | JSX del componente | Sí |
| `react-native` (View, Text, ScrollView, StyleSheet) | estándar | Contenedores y textos | Sí |
| `color, spacing` de `../src/theme` | interna | Tokens de estilo | Sí |
| `borderRadius, shadow` de `../src/theme` | interna | Sin uso en el archivo | No (`[POTENCIALMENTE NO UTILIZADO]`) |
| `Icon` de `../src/theme/Icon` | interna | Íconos decorativos de pasos, encabezado y consejos | Sí |

## Componentes que dependen de este archivo

- `app/_layout.tsx`: registra la ruta `como-funciona` con `presentation: 'modal'`
  y título "Cómo Funciona SafeAlert" (líneas 379–382).
- `app/(tabs)/settings.tsx`: enlace "Cómo funciona SafeAlert →" que navega con
  `router.push('/como-funciona')` (líneas 148–153).
- No se hallaron otras referencias de navegación.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `PasoProps` | interfaz | type | Contrato de props del componente `Paso` | líneas 22–27 |
| `numero` | string | prop | Número del paso (p. ej. "1", o emoji en pasos con ícono) | líneas 40, 47 |
| `icon` | nombre de ícono (opcional) | prop | Ícono Material que reemplaza al número | líneas 24, 44–48 |
| `titulo` | string | prop | Título del paso | líneas 25, 51 |
| `detalle` | string | prop | Descripción del paso | líneas 26, 52 |
| Textos de pasos | literales 1–9 | string | Contenido educativo de la guía | líneas 89–194 |

## Estructura (funciones / clases / tipos)

- Interfaz `PasoProps` (líneas 22–27).
- Función componente `Paso` (líneas 40–56): renderiza un paso de la guía.
- Función componente `ComoFuncionaScreen` (export default, líneas 70–202):
  pantalla completa.
- `StyleSheet.create` con estilos de secciones (líneas 204–315).

## Análisis línea por línea

```tsx
/* ============================================================================
* Archivo         : como-funciona.tsx
* Descripción     : Pantalla informativa "Cómo Funciona SafeAlert" con guía
*                   paso a paso del flujo operativo de la aplicación.
* Autor           : oafon
* Fecha           : 2026-04-10
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Navegación desde Ajustes via router.push('/como-funciona')
* ============================================================================ */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { color, spacing, borderRadius, shadow } from '../src/theme';
import { Icon } from '../src/theme/Icon';

interface PasoProps {
  numero: string;
  icon?: React.ComponentProps<typeof Icon>['name'];
  titulo: string;
  detalle: string;
}
```

**Explicación de las líneas 1–27:**

Cabecera documental, importaciones y definición del contrato de props del
componente interno `Paso`.

- **Línea 9** (`Uso`): documenta que la navegación proviene de Ajustes mediante `router.push('/como-funciona')`, coherente con `settings.tsx`.
- **Líneas 12–18**: `React` y componentes básicos de `react-native` (no requiere `TouchableOpacity`, `Alert`, etc.: pantalla sin interacción).
- **Línea 19**: tokens `color`, `spacing`, `borderRadius`, `shadow`. Sólo `color` y `spacing` se usan → `[POTENCIALMENTE NO UTILIZADO]` para los otros dos.
- **Líneas 22–27**: `PasoProps` tipa las props de la fila de paso: `numero` (string), `icon` opcional (nombre de ícono del set de `Icon`), `titulo` y `detalle`.

```tsx
/* ============================================================================
* Función         : Paso
* Descripción     : Renderiza un paso de la guía con ícono numerado y descripción.
* Fecha           : 2026-04-10
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : ComoFuncionaScreen
* Ingesta         : numero, icon?, titulo, detalle
* Devolución      : JSX.Element
* Uso             : <Paso numero="1" titulo="..." detalle="..." />
* ============================================================================ */
function Paso({ numero, icon: pasoIcon, titulo, detalle }: PasoProps) {
  return (
    <View style={styles.paso}>
      <View style={styles.pasoNumero}>
        {pasoIcon ? (
          <Icon name={pasoIcon} size={18} color={color.textInverse} />
        ) : (
          <Text style={styles.pasoNumeroText}>{numero}</Text>
        )}
      </View>
      <View style={styles.pasoContenido}>
        <Text style={styles.pasoTitulo}>{titulo}</Text>
        <Text style={styles.pasoDetalle}>{detalle}</Text>
      </View>
    </View>
  );
}
```

**Explicación de las líneas 29–56:**

Componente presentacional `Paso`.

- **Líneas 29–39**: cabecera documental de la función.
- **Línea 40** (`function Paso(...)`): desestructura props; renombra `icon` a `pasoIcon` para evitar colisión con el componente `Icon` importado.
- **Línea 44–48**: dentro del círculo numerado, si existe `pasoIcon` renderiza el ícono; si no, renderiza el texto del número (los pasos 1–6 usan número; los de "Funciones avanzadas" usan ícono con emoji como `numero` de respaldo).
- **Líneas 50–53**: contenido del paso: título en negrita y detalle en gris.
- [NOTA] Los pasos 7–9 reciben `numero="🔑"`/`"📍"`/`"🎙️"`/`"🔔"` como texto aunque no se muestra porque tienen `icon`; el emoji queda como dato ocioso.

```tsx
/* ============================================================================
* Función         : ComoFuncionaScreen
* Descripción     : Pantalla con guía completa de uso de SafeAlert organizada
*                   en pasos numerados y secciones temáticas.
* Fecha           : 2026-04-10
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : _layout.tsx (Stack.Screen), settings.tsx
* Ingesta         : Sin argumentos
* Devolución      : JSX.Element
* Uso             : Accesible desde Ajustes → "Cómo Funciona"
* ============================================================================ */
export default function ComoFuncionaScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Encabezado */}
      <View style={styles.header}>
        <Icon name="shield" size={48} color={color.textInverse} />
        <Text style={styles.headerTitle}>Cómo Funciona SafeAlert</Text>
        <Text style={styles.headerSub}>
          Tu escudo de emergencia personal. Fácil, rápido y silencioso.
        </Text>
      </View>

      {/* Sección: Primeros pasos */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Primeros pasos</Text>

        <Paso
          numero="1"
          titulo="Agregá tus contactos de confianza"
          detalle='Andá a la pestaña "Contactos" y agregá al menos una persona de confianza con su nombre y teléfono. Esta persona recibirá las alertas de emergencia.'
        />

        <Paso
          numero="2"
          titulo="Verificá los permisos"
          detalle='SafeAlert necesita acceso al micrófono, ubicación y notificaciones. Andá a "Ajustes → Ver estado de permisos" y asegurate de que todos estén activos.'
        />

        <Paso
          numero="3"
          titulo="Activá el modo guardia"
          detalle='En la pantalla principal, presioná el botón grande "ACTIVAR GUARDIA". El escudo quedará encendido y la app comenzará a escuchar palabras de activación.'
        />
      </View>
```

**Explicación de las líneas 58–106:**

Componente raíz y primera sección de contenido (primeros pasos).

- **Líneas 58–69**: cabecera documental que declara las conexiones con `_layout.tsx` y `settings.tsx` (confirmado por grep).
- **Línea 70**: componente exportado por defecto.
- **Líneas 72–75**: `ScrollView` raíz con los estilos `container` y `content`.
- **Líneas 76–83** (header): bloque rojo con ícono de escudo, título y subtítulo.
- **Líneas 85–106** (Primeros pasos): pasos 1–3. Explican alta de contactos de confianza (recibirán alertas), verificación de permisos (micrófono, ubicación, notificaciones) y activación del modo guardia con escucha de palabras de activación.
- [OBSERVACIÓN TÉCNICA] El paso 1 menciona "recibirá las alertas" y el paso 6 menciona envío por WhatsApp; el contenido informativo puede diferir de los canales reales de envío (SMS/WhatsApp) implementados en otras pantallas; conviene contrastar con el servicio real de alertas.

```tsx
      {/* Sección: Durante una emergencia */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Durante una emergencia</Text>

        <Paso
          numero="4"
          titulo="Activación por voz"
          detalle='Di en voz alta las palabras configuradas (como "socorro", "ayuda" o tu propia palabra clave). SafeAlert las detectará aunque estés en una conversación.'
        />

        <Paso
          numero="5"
          titulo="Botón SOS manual"
          detalle='Si preferís, presioná el botón grande en la pantalla principal. Tenés unos segundos para cancelar si fue accidental antes de que se envíe la alerta.'
        />

        <Paso
          numero="6"
          titulo="SafeAlert envía la alerta"
          detalle='Automáticamente se envía un mensaje WhatsApp con tu ubicación GPS, la hora y tu mensaje de emergencia a todos tus contactos activos. Si configuraste audio, también se graba un clip de voz.'
        />
      </View>

      {/* Sección: Funciones avanzadas */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Funciones avanzadas</Text>

        <Paso
          numero="🔑"
          icon="vpn-key"
          titulo="Palabras de activación personalizadas"
          detalle='Podés agregar tus propias palabras en "Ajustes → Activación por voz". El modelo de voz español escucha continuamente cuando la guardia está activa.'
        />

        <Paso
          numero="📍"
          icon="location-on"
          titulo="Ubicación en tiempo real"
          detalle='Tu ubicación GPS se adjunta automáticamente a cada alerta. Cuanto más precisa sea la señal GPS, más rápido podrán encontrarte.'
        />

        <Paso
          numero="🎙️"
          icon="mic"
          titulo="Grabación de audio de 60 segundos"
          detalle='Cuando se activa la alerta, SafeAlert graba 60 segundos del entorno y los sube al servidor seguro. Tus contactos pueden solicitar el audio si es necesario.'
        />

        <Paso
          numero="🔔"
          icon="notifications"
          titulo="Recordatorios diarios"
          detalle='Activá los recordatorios desde Ajustes para recibir una notificación diaria que te recuerde revisar que la guardia esté activa y los contactos actualizados.'
        />
      </View>
```

**Explicación de las líneas 108–162:**

Secciones "Durante una emergencia" (pasos 4–6) y "Funciones avanzadas" (pasos 7–9,
con íconos `vpn-key`, `location-on`, `mic`, `notifications`).

- **Línea 115** (paso 4): activación por voz con palabras configuradas (detector activo en conversación).
- **Líneas 118–121** (paso 5): botón SOS manual con cuenta regresiva de cancelación ("unos segundos"), coherente con `ALERT_COUNTDOWN_SECONDS = 3` de `src/config/constants.ts`.
- **Líneas 124–128** (paso 6): envío automático de mensaje con ubicación GPS, hora y mensaje a contactos activos, más grabación de audio si está configurada.
- **Líneas 135–140** (paso 7): palabras de activación personalizadas (modelo de voz español).
- **Líneas 142–147** (paso 8): ubicación GPS adjunta a cada alerta.
- **Líneas 149–154** (paso 9): grabación de 60 segundos subida a servidor; los contactos pueden solicitar el audio.
- **Líneas 156–161** (paso 10): recordatorios diarios configurables desde Ajustes.
- [OBSERVACIÓN TÉCNICA] El paso 6 describe envío por WhatsApp y grabación de audio de forma incondicionada ("Si configuraste audio, también se graba un clip"), afirmaciones dependientes de flags de características (`WAKE_WORD_ENABLED`, `AUDIO_GUARD_ENABLED`) y de la configuración real del usuario; el texto puede prometer comportamiento que el MVP no siempre cumple.

```tsx
      {/* Sección: Período de prueba */}
      <View style={[styles.seccion, styles.seccionDestacada]}>
        <Text style={styles.seccionTitulo}>Período de prueba gratuita</Text>
        <Text style={styles.seccionCuerpo}>
          Desde que cargás tu primer contacto de emergencia, comenzás a disfrutar
          de <Text style={styles.bold}>10 días gratis</Text> con todas las funciones
          habilitadas.{'\n\n'}
          Al finalizar el período, podés suscribirte para continuar protegiendo
          a los tuyos sin interrupciones.
        </Text>
      </View>

      {/* Sección: Consejos */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Consejos de uso</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="lightbulb" size={16} color={color.warning} />
          <Text style={styles.consejo}>Cargá siempre el teléfono antes de salir solo/a.</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="lightbulb" size={16} color={color.warning} />
          <Text style={styles.consejo}>Informale a tus contactos que los agregaste para que reconozcan los mensajes.</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="lightbulb" size={16} color={color.warning} />
          <Text style={styles.consejo}>Activá la guardia cuando estés en situaciones de riesgo o lugares desconocidos.</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="lightbulb" size={16} color={color.warning} />
          <Text style={styles.consejo}>Practicá una alerta de prueba con un contacto de confianza para verificar que funciona.</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SafeAlert — Versión MVP · Tu seguridad, siempre.</Text>
      </View>
    </ScrollView>
  );
}
```

**Explicación de las líneas 164–202:**

Sección destacada del período de prueba, consejos y pie de página.

- **Líneas 165–174**: caja destacada (fondo `dangerLight`, borde `danger`) que informa "10 días gratis" desde el alta del primer contacto y la posterior suscripción.
- [OBSERVACIÓN TÉCNICA] La promesa de "10 días gratis con todas las funciones" es una condición comercial escrita como texto estático; si la lógica de trial cambia (flag de features o backend de pagos) el texto queda desactualizado sin aviso.
- **Líneas 177–195** (Consejos): cuatro filas con ícono `lightbulb` y consejos operativos; el último invita a practicar con una alerta de prueba (accesible desde la pantalla principal vía `/test-alert`).
- **Líneas 197–199**: pie con la leyenda "SafeAlert — Versión MVP".
- **Línea 200**: cierre del `ScrollView`; **línea 201**: cierre del componente.

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },

  header: {
    backgroundColor: color.danger,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: color.textInverse,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 19,
  },

  seccion: {
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
  },
  seccionDestacada: {
    backgroundColor: color.dangerLight,
    borderWidth: 1,
    borderColor: color.danger,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: color.textPrimary,
    marginBottom: 4,
  },
  seccionCuerpo: {
    fontSize: 14,
    color: color.textPrimary,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: color.danger,
  },

  paso: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  pasoNumero: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.danger,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pasoNumeroText: {
    color: color.textInverse,
    fontWeight: '700',
    fontSize: 14,
  },
  pasoContenido: {
    flex: 1,
    gap: 4,
  },
  pasoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: color.textPrimary,
  },
  pasoDetalle: {
    fontSize: 13,
    color: color.textSecondary,
    lineHeight: 19,
  },

  consejo: {
    fontSize: 13,
    color: color.textPrimary,
    lineHeight: 20,
  },

  footer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: color.textSecondary,
  },
});
```

**Explicación de las líneas 204–315:**

Hoja de estilos. Usa el tema (`color.background`, `color.surface`, `color.danger`,
`color.dangerLight`, `color.textInverse`, etc.) con radios y sombras literales.

- **Líneas 205–213** (`container`, `content`): contenedor y espaciado del scroll (padding 20, `gap: 16`, padding inferior 40).
- **Líneas 215–233** (`header` y textos): encabezado rojo redondeado con textos centrados.
- **Líneas 235–250** (`seccion`, `seccionDestacada`): tarjetas de superficie con `elevation`/sombra; la variante destacada usa `dangerLight` con borde rojo.
- **Líneas 251–265** (`seccionTitulo`, `seccionCuerpo`, `bold`): títulos y cuerpo de sección.
- **Líneas 267–299** (`paso*`): fila de paso con círculo rojo de 36px (el número o ícono) y columna de contenido flexible.
- **Líneas 301–305** (`consejo`) y 307–315 (`footer`, `footerText`): estilos de consejos y pie.
- [NOTA] Los estilos usan `borderRadius` numéricos literales y sombras nativas en lugar de los tokens `borderRadius` y `shadow` importados, por eso esos imports resultan no utilizados.

## Fichas de funciones y métodos

### Paso (líneas 40–56)

- Firma: `function Paso({ numero, icon: pasoIcon, titulo, detalle }: PasoProps): JSX.Element`.
- Propósito técnico: componente presentacional reutilizable que renderiza una fila numerada de la guía; propósito funcional: presentar cada paso del instructivo.
- Parámetros: `numero` (string), `icon` opcional (nombre de ícono), `titulo` (string), `detalle` (string).
- Retorno: JSX con el indicador circular y el contenido textual. Excepciones: no lanza.
- Dependencias: `Icon`, estilos `styles.paso*`.
- Flujo: si hay `icon` renderiza ícono en el círculo; si no, el número; luego el título y detalle.
- Llamado desde: `ComoFuncionaScreen` (10 instancias).
- Efectos secundarios: ninguno (componente puro).
- Riesgos: ninguno relevante.

### ComoFuncionaScreen (líneas 70–202)

- Firma: `export default function ComoFuncionaScreen(): JSX.Element`.
- Propósito técnico: pantalla raíz de la ruta `/como-funciona`; propósito funcional: documentar el uso de la app.
- Parámetros: ninguno. Retorno: JSX. Excepciones: no lanza.
- Dependencias: `Paso`, `Icon`, estilos; sin stores ni servicios (no reactiva).
- Flujo: render secuencial de encabezado, secciones temáticas, prueba/descarga y pie dentro de un `ScrollView`.
- Llamado desde: expo-router (ruta registrada en `_layout.tsx`; navegación desde `settings.tsx`).
- Efectos secundarios: ninguno.
- Riesgos: contenidos que pueden divergir de la implementación real (canales de alerta, prueba gratis, grabación de audio).

## Clases / interfaces / tipos

- `PasoProps` (líneas 22–27): campos `numero: string`, `icon?: React.ComponentProps<typeof Icon>['name']`, `titulo: string`, `detalle: string`. `icon` está tipado contra el set de nombres del componente `Icon`, lo que garantiza en compilación que los nombres usados existan.
- Sin clases ni otros tipos.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Importaciones `borderRadius` y `shadow` sin uso (línea 19); los estilos usan valores literales. Impacto: bajo.
- [OBSERVACIÓN TÉCNICA] El contenido informativo describe funcionalidades (WhatsApp, grabación de 60 s, escucha continua, trial de 10 días) que dependen de flags de configuración (`WAKE_WORD_ENABLED`, `AUDIO_GUARD_ENABLED`, `PAYMENTS_ENABLED`) y del estado real del usuario. [NIVEL DE CERTEZA: Altamente probable] El texto no se adapta a la configuración activa.
- [OBSERVACIÓN TÉCNICA] Los emojis en `numero` de los pasos con ícono (`🔑`, `📍`, `🎙️`, `🔔`) son redundantes porque sólo se renderiza el ícono; se mantienen como respaldo de texto.
- [NIVEL DE CERTEZA: Confirmado por código] Pantalla sin estado, sin efectos secundarios y sin acceso a datos.

## Seguridad

| Severidad | Hallazgo |
| --- | --- |
| INFORMATIVO | Pantalla 100% estática: no recopila, transmite ni almacena datos; no hay secretos, tokens ni endpoints en el archivo. |
| BAJO | El texto declara comportamientos de la app (audio subido a "servidor seguro", contacto recibe mensajes) que podrían inducir expectativas de privacidad; la redacción no constituye una política formal pero conviene alinearla con la política de privacidad real. |
| INFORMATIVO | No se imprimen logs ni datos personales. Sin hallazgos de seguridad de código. |

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Desalineación entre el texto de ayuda y el comportamiento real condicionado por flags: recomendar generar el contenido desde la configuración activa o revisarlo en cada release.
- [RIESGO] Promesa comercial ("10 días gratis") estática: mantenerla sincronizada con la lógica de trial del backend de pagos para evitar reclamos.
- [RECOMENDACIÓN] Eliminar imports no usados (`borderRadius`, `shadow`).
- [RECOMENDACIÓN] Añadir accesibilidad básica (por ejemplo, no depender del color rojo únicamente para el indicador de paso) y revisar contraste de textos grises.
- [RECOMENDACIÓN] Considerar enlazar la pantalla a la política de privacidad desde el texto de transparencia.
