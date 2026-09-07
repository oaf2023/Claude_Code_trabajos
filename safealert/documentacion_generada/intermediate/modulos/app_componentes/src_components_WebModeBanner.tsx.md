# Archivo: src/components/WebModeBanner.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/components/WebModeBanner.tsx | 176 | TypeScript 5.9 / TSX (React Native) | 5147 | Componente UI de banner informativo (web) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Banner informativo colapsable que se muestra **solo en la variante web (PWA)** de la app SafeAlert, para advertir al usuario de que está en un entorno "Modo Limitado". Muestra, por un lado, las especificaciones del servidor de hosting (CPU, RAM, almacenamiento, transferencia) y, por otro, la lista de funcionalidades no disponibles fuera de Android (Wake Word, grabación de audio, notificaciones programadas, ubicación en segundo plano, identificación de dispositivo nativa). Los datos provienen de la configuración centralizada `src/config/webBanner.ts` (`SERVER_SPECS`, `WEB_LIMITATIONS`), no de constantes locales. El componente gestiona únicamente un estado local de expansión/colapso (`expanded`).

## Clasificación y estado

- `FUNCIONALIDAD EXISTENTE`: componente definido, exportado y renderizado en la pantalla principal `app/(tabs)/index.tsx` línea 229, condicionado a `Platform.OS === 'web'` (línea 229 del consumidor).
- Referencias reales:
  - `app/(tabs)/index.tsx` línea 46: `import { WebModeBanner } from '../../src/components/WebModeBanner';`
  - `app/(tabs)/index.tsx` línea 229: `{Platform.OS === 'web' && <WebModeBanner />}`
- [NIVEL DE CERTEZA: Confirmado por código]
- [NOTA] El propio componente **no verifica** `Platform.OS`; la decisión de mostrarlo solo en web recae en el punto de llamada. La cabecera del archivo ("solo se renderiza cuando Platform.OS === 'web'") describe la intención, materializada en el consumidor.

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `React`, `useState` (de `'react'`) | Estándar (externo) | Estado local `expanded` | Sí |
| `View`, `Text`, `TouchableOpacity`, `StyleSheet` (de `'react-native'`) | Estándar (externo) | Render del banner | Sí |
| `Icon` (de `'../theme/Icon'`) | Interna | Íconos del header, specs, limitaciones y footer | Sí |
| `color`, `spacing`, `borderRadius`, `typography` (de `'../theme/tokens'`) | Interna | Estilos | `color`, `spacing`, `borderRadius` sí; `typography` no |
| `SERVER_SPECS`, `WEB_LIMITATIONS` (de `'../config/webBanner'`) | Interna | Datos del banner | Sí |

## Componentes que dependen de este archivo

| Consumidor | Tipo de uso |
| --- | --- |
| `app/(tabs)/index.tsx` | Importa (línea 46) y renderiza solo en web (línea 229) |

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `expanded` | `true` (inicial) | `boolean` (estado) | Controla si el cuerpo del banner está desplegado | Línea 20 |
| `SERVER_SPECS` | Definido en `src/config/webBanner.ts` | `ServerSpec[]` | Especificaciones del hosting (1 vCPU, 2 GB RAM, 40 GB NVMe, 2 TB) | Línea 48 |
| `WEB_LIMITATIONS` | Definido en `src/config/webBanner.ts` | `WebLimitation[]` | Funciones no disponibles en web | Línea 61 |
| `styles` | Objeto de estilos | `StyleSheet` | Estilos del banner | Líneas 82–176 |

Valores mágicos: tamaños de íconos (16–22), `StyleSheet.hairlineWidth` para el borde del footer (línea 167). No hay secretos ni datos sensibles. El componente usa tokens de tema (`color.warningLight`, `color.warningDark`, `color.warning`, `color.danger`, etc.).

## Estructura (funciones / clases / tipos)

- Componente exportado `WebModeBanner` (líneas 19–80), función declarada (no arrow), sin props.
- Estado local `expanded` (línea 20) y handler inline de toggle en el header.
- Objeto de estilos `styles` (líneas 82–176).
- No hay clases, interfaces propias ni llamadas a servicios.

## Análisis línea por línea

**Bloque L1–L11 — Cabecera de archivo (comentario):**

```tsx
/* ============================================================================
* Archivo         : WebModeBanner.tsx
* Descripción     : Banner informativo que se muestra solo en modo web.
*                   List las especificaciones del servidor y las funcionalidades
*                   que no están disponibles fuera de Android.
* Autor           : oafon
* Fecha           : 2026-08-26
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : <WebModeBanner /> — solo se renderiza cuando Platform.OS === 'web'
* ============================================================================ */
```

**Explicación de las líneas 1–11:**
Cabecera documental. Define el propósito (banner de modo web) y el contenido (specs del servidor y limitaciones fuera de Android). [NOTA] Errata menor en línea 4: "List las especificaciones" por "Lista las especificaciones". La afirmación de la línea 10 sobre el renderizado condicional se materializa en el consumidor, no en este archivo.

**Bloque L13–L17 — Importaciones:**

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '../theme/Icon';
import { color, spacing, borderRadius, typography } from '../theme/tokens';
import { SERVER_SPECS, WEB_LIMITATIONS } from '../config/webBanner';
```

**Explicación de las líneas 13–17:**
- **Línea 13**: React y `useState` para el estado de expansión.
- **Línea 14**: primitivas de vista y estilo.
- **Línea 15**: `Icon` del design system para los pictogramas.
- **Línea 16**: tokens de diseño. [OBSERVACIÓN TÉCNICA] `typography` se importa pero **no se usa** en ninguna línea del archivo (los estilos definen `fontSize`/`fontWeight` literales); es una importación aparentemente innecesaria. [POTENCIALMENTE NO UTILIZADO]
- **Línea 17**: datos del banner desde la configuración centralizada.

**Bloque L19–L20 — Declaración del componente y estado:**

```tsx
export function WebModeBanner() {
  const [expanded, setExpanded] = useState(true);
```

**Explicación de las líneas 19–20:**
- **Línea 19**: componente funcional declarado con `export function` (sin props ni tipado de `React.FC`).
- **Línea 20**: estado local `expanded` inicializado en `true`: el banner se muestra **desplegado** por defecto (el cuerpo visible ocupa espacio en la pantalla principal en web). El toggle lo alterna.

**Bloque L22–L41 — Contenedor y header colapsable:**

```tsx
  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Colapsar panel de modo web' : 'Expandir panel de modo web'}
      >
        <View style={styles.headerLeft}>
          <Icon name="info-outline" size={20} color={color.warningDark} />
          <Text style={styles.headerTitle}>SafeAlert Web — Modo Limitado</Text>
        </View>
        <Icon
          name={expanded ? 'expand-less' : 'expand-more'}
          size={22}
          color={color.warningDark}
        />
      </TouchableOpacity>
```

**Explicación de las líneas 22–41:**
- **Línea 23**: contenedor raíz con fondo `color.warningLight`, borde `color.warning` y radio `borderRadius.md` (estilo `container`).
- **Líneas 25–41**: el header completo es un `TouchableOpacity` que actúa de botón de expandir/colapsar:
  - **Línea 27**: `onPress` alterna el estado (`setExpanded(!expanded)`).
  - **Línea 29**: `accessibilityRole="button"`.
  - **Línea 30**: `accessibilityLabel` dinámica según el estado ("Colapsar panel de modo web" / "Expandir panel de modo web"), correcta para lectores de pantalla.
  - **Línea 33**: ícono `info-outline` de advertencia informativa.
  - **Línea 34**: título "SafeAlert Web — Modo Limitado", que comunica la limitación desde el primer vistazo.
  - **Líneas 36–40**: ícono chevron que indica el estado (`expand-less` cuando está desplegado, `expand-more` cuando está colapsado).

**Bloque L43–L54 — Cuerpo desplegable: sección de especificaciones del servidor:**

```tsx
      {expanded && (
        <View style={styles.body}>
          {/* Server specs */}
          <Text style={styles.sectionLabel}>Servidor de hosting</Text>
          <View style={styles.specsRow}>
            {SERVER_SPECS.map((spec) => (
              <View key={spec.label} style={styles.specItem}>
                <Icon name={spec.icon as any} size={18} color={color.neutral600} />
                <Text style={styles.specValue}>{spec.value}</Text>
              </View>
            ))}
          </View>
```

**Explicación de las líneas 43–54:**
- **Línea 43**: render condicional del cuerpo; si `expanded === false` solo se ve el header.
- **Línea 45**: comentario de sección.
- **Línea 46**: etiqueta de sección "Servidor de hosting".
- **Líneas 47–53**: mapea `SERVER_SPECS` (4 elementos de `src/config/webBanner.ts`) a chips visuales con ícono y valor (1 vCPU, 2 GB RAM, 40 GB NVMe, 2 TB). El detalle completo de cada spec vive en el archivo de configuración, no aquí.
- **Línea 50**: `Icon name={spec.icon as any}`. [OBSERVACIÓN TÉCNICA] El cast `as any` se usa porque `spec.icon` es `string` y el componente `Icon` espera un nombre tipado (`IconName`); el cast silencia el chequeo de tipos en lugar de tipar `ServerSpec.icon` como `IconName` en la configuración.
- **Línea 51**: valor legible de la spec (el `label` solo se usa como `key`; no se muestra en pantalla). [NOTA] El campo `label` de cada spec (CPU, RAM, etc.) no se renderiza; solo el `value`, lo que hace la información menos autoexplicativa.

**Bloque L56–L67 — Divisor y lista de limitaciones:**

```tsx
          {/* Divider */}
          <View style={styles.divider} />

          {/* Limitations */}
          <Text style={styles.sectionLabel}>Funciones no disponibles en web</Text>
          {WEB_LIMITATIONS.map((item) => (
            <View key={item.feature} style={styles.limitationRow}>
              <Icon name="cancel" size={16} color={color.danger} />
              <Text style={styles.limitationFeature}>{item.feature}</Text>
              <Text style={styles.limitationNote}>({item.note})</Text>
            </View>
          ))}
```

**Explicación de las líneas 56–67:**
- **Línea 57**: divisor visual entre secciones.
- **Línea 60**: etiqueta de sección "Funciones no disponibles en web".
- **Líneas 61–67**: recorre `WEB_LIMITATIONS` (5 elementos de la configuración): Wake Word/Guardia por voz (Solo Android), Grabación de audio (Solo Android), Notificaciones programadas (No soportado en web), Ubicación en segundo plano (No soportado en web), Identificación de dispositivo nativa (No soportado en web).
- **Línea 63**: ícono `cancel` en rojo (`color.danger`) como marcador de función no disponible.
- **Líneas 64–65**: nombre de la funcionalidad y nota aclaratoria entre paréntesis.
- [NOTA] Esta lista es la pieza de comunicación clave del banner: gestiona las expectativas del usuario web frente a funciones que solo existen en Android.

**Bloque L69–L76 — Footer:**

```tsx
          {/* Footer */}
          <View style={styles.footer}>
            <Icon name="phone-android" size={16} color={color.textSecondary} />
            <Text style={styles.footerText}>
              La experiencia completa está disponible en la app móvil.
            </Text>
          </View>
        </View>
      )}
```

**Explicación de las líneas 69–76:**
- **Líneas 70–75**: pie del banner con ícono `phone-android` y texto "La experiencia completa está disponible en la app móvil."; refuerza la llamada a usar la app nativa de Android.
- **Líneas 76–77**: cierran el cuerpo condicional y el `expanded &&`.

**Bloque L78–L80 — Cierre del componente:**

```tsx
    </View>
  );
}
```

**Explicación de las líneas 78–80:**
Cierre del contenedor, del `return` y de la función. No hay más lógica: el banner es presentacional con un único estado booleano.

**Bloque L82–L137 — Estilos (1.ª parte):**

```tsx
const styles = StyleSheet.create({
  container: {
    backgroundColor: color.warningLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: color.warning,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: color.warningDark,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: color.neutral600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: color.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '600',
    color: color.textPrimary,
  },
```

**Explicación de las líneas 82–137:**
- **Líneas 83–89** (`container`): fondo ámbar claro (`color.warningLight`) con borde y radio del token; `overflow: 'hidden'` para recortar los bordes del contenido interno al colapsar.
- **Líneas 90–96** (`header`): fila con separación entre título (izquierda) y chevron (derecha).
- **Líneas 97–101** (`headerLeft`): agrupa ícono y título con `gap` del token.
- **Líneas 102–106** (`headerTitle`): título en tono ámbar oscuro (`color.warningDark`), peso 700.
- **Líneas 107–111** (`body`): relleno inferior y `gap` vertical entre secciones.
- **Líneas 112–118** (`sectionLabel`): etiquetas en mayúsculas con `letterSpacing`, gris neutro.
- **Líneas 119–123** (`specsRow`): fila con *wrap* para que los chips de specs fluyan en varias líneas en pantallas web estrechas.
- **Líneas 124–132** (`specItem`): chip de spec con fondo `color.surface`, esquinas redondeadas pequeñas.
- **Líneas 133–137** (`specValue`): texto del valor de la spec.
- [NOTA] Uso consistente de tokens de diseño (`color`, `spacing`, `borderRadius`), a diferencia de otros componentes del módulo; solo la tipografía se define con literales (pese a importar `typography`).

**Bloque L138–L176 — Estilos (2.ª parte):**

```tsx
  divider: {
    height: 1,
    backgroundColor: color.warning,
    opacity: 0.3,
    marginVertical: spacing.xs,
  },
  limitationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 3,
  },
  limitationFeature: {
    fontSize: 14,
    fontWeight: '500',
    color: color.textPrimary,
    flex: 1,
  },
  limitationNote: {
    fontSize: 12,
    color: color.textSecondary,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.warning,
  },
  footerText: {
    fontSize: 13,
    color: color.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
});
```

**Explicación de las líneas 138–176:**
- **Líneas 138–143** (`divider`): línea divisoria ámbar al 30 % de opacidad.
- **Líneas 144–149** (`limitationRow`): fila por limitación con alineación centrada y `gap` pequeño.
- **Líneas 150–155** (`limitationFeature`): nombre de la funcionalidad con `flex: 1` para ocupar el espacio restante y empujar la nota al extremo.
- **Líneas 156–160** (`limitationNote`): nota entre paréntesis en cursiva y gris secundario.
- **Líneas 161–169** (`footer`): pie con borde superior de un píxel físico (`StyleSheet.hairlineWidth`) ámbar.
- **Líneas 170–175** (`footerText`): texto del pie en cursiva.
- **Línea 176**: cierre del `StyleSheet`.

## Fichas de funciones y métodos

El archivo no contiene funciones con lógica relevante (el único handler es el `onPress` inline `() => setExpanded(!expanded)` de la línea 27). No se documentan fichas de funciones.

## Clases / interfaces / tipos

- El componente no define interfaces, clases ni tipos propios; consume los tipos `ServerSpec` y `WebLimitation` declarados en `src/config/webBanner.ts`.
- Estado interno: `expanded: boolean` (línea 20), inicializado en `true`.

## Observaciones técnicas

- [POTENCIALMENTE NO UTILIZADO] Importación `typography` (línea 16): no se referencia en ninguna línea del archivo. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] Uso de `spec.icon as any` (línea 50): se fuerza el tipo para pasar el nombre de ícono a `Icon`, evadiendo el tipado `IconName`. Impacto potencial: un nombre de ícono inválido en `webBanner.ts` solo fallaría en runtime/calidad, no en compilación. Recomendación: tipar `ServerSpec.icon` como `IconName`.
- [OBSERVACIÓN TÉCNICA] El campo `label` de `SERVER_SPECS` no se muestra en pantalla (solo se usa como `key`), de modo que los chips muestran únicamente el valor ("1 vCPU") sin su nombre ("CPU"). Impacto: información parcialmente ambigua para el usuario. Archivo: `src/components/WebModeBanner.tsx` líneas 47–53 y `src/config/webBanner.ts`.
- [NOTA] La condición `Platform.OS === 'web'` no está dentro del componente sino en el consumidor (`app/(tabs)/index.tsx` línea 229); si otro punto lo importara sin esa guarda, el banner se mostraría también en Android/iOS.
- [NOTA] Estado inicial `expanded = true`: en la pantalla principal web el banner ocupa espacio desplegado desde el arranque, lo que empuja el contenido principal hacia abajo (relevante en la PWA).
- [NOTA] Errata de texto en la cabecera ("List las especificaciones", línea 4). Sin impacto funcional.

## Seguridad

- No se encontraron hallazgos de seguridad en este archivo: no maneja datos de usuario, no realiza llamadas de red, no registra logs ni contiene secretos.
- [INFORMATIVO] El banner no filtra datos sensibles: muestra especificaciones de infraestructura del hosting (1 vCPU, 2 GB RAM, 40 GB NVMe, 2 TB) al usuario final en la PWA. La exposición de detalles de infraestructura es de bajo riesgo en este contexto (datos genéricos sin direcciones IP ni credenciales), pero conviene revisar si interesa mostrarlos al público.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Mostrar specs de infraestructura al usuario final puede considerarse información interna innecesaria; recomendación: evaluar si el público objetivo (usuarios de la PWA de demostración) necesita esa información o si es mejor restringirla a entornos de prueba.
- [RECOMENDACIÓN] Tipar `ServerSpec.icon` como `IconName` (de `../theme/Icon`) para eliminar el `as any` y validar los nombres en compilación.
- [RECOMENDACIÓN] Renderizar también `spec.label` junto al valor para que los chips sean autoexplicativos, o renombrar el campo si no se usa.
- [RECOMENDACIÓN] Mover la guarda `Platform.OS === 'web'` al interior del componente (retornar `null` si no es web) para que el banner sea seguro por diseño en cualquier punto de montaje.
- [RECOMENDACIÓN] Eliminar la importación `typography` no utilizada y usar `typography` del token para los textos si se busca consistencia total con el design system.
