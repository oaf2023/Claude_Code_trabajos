# Archivo: app/(tabs)/_layout.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| app/(tabs)/_layout.tsx | 100 | TypeScript 5.9 / TSX (React Native + expo-router) | 2900 | Layout de pestañas (navegación inferior) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Define el navegador de pestañas inferior (`Tabs` de expo-router) con las cuatro secciones principales de la aplicación: Inicio (`index`), Historial (`history`), Contactos (`contacts`) y Configuración (`settings`). Centraliza el estilo visual de la barra de pestañas y de las cabeceras (color corporativo rojo, tipografía, altura de barra) usando el design system `src/theme`, e implementa el componente `TabIcon` que combina icono Material + etiqueta para cada pestaña.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE — [NIVEL DE CERTEZA: Confirmado por código]. El archivo es el `_layout.tsx` del grupo `(tabs)`, cargado automáticamente por expo-router como layout de las rutas hijas. Las cuatro pestañas que declara existen como archivos en `app/(tabs)/` (verificado con glob).

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `react` (`React`) | Estándar | JSX y tipos de props | Sí |
| `expo-router` (`Tabs`) | Externa | Navegador de pestañas | Sí |
| `react-native` (`View`, `Text`, `StyleSheet`) | Estándar | Componente `TabIcon` y estilos | Sí |
| `../../src/theme/Icon` (`Icon`) | Interna | Iconos Material de cada tab | Sí |
| `../../src/theme` (`color`) | Interna | Colores del tema (danger, neutral400, surface, border, textInverse) | Sí |

## Componentes que dependen de este archivo

Ningún import directo: expo-router lo resuelve como layout del grupo `(tabs)`. Sus rutas hijas son `index`, `history`, `contacts` y `settings` (archivos existentes). El layout raíz `app/_layout.tsx` lo registra como pantalla `(tabs)` sin cabecera propia. [NIVEL DE CERTEZA: Confirmado por código].

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `color.danger`, `color.neutral400`, `color.surface`, `color.border`, `color.textInverse` | Paleta del tema `src/theme` | string | Colores de tabs activas/inactivas, barra y cabeceras | Líneas 28, 38-48 |
| Estilos `tabItem`, `label`, `labelFocused` | Definidos en `StyleSheet.create` | StyleSheet | Disposición de icono + etiqueta | Líneas 92-99 |
| Altura de barra | 65 (línea 43) y `paddingBottom: 8` | number | Tamaño de la barra inferior | Línea 43 |
| Tamaño de icono | 22 (línea 28) | number | Dimensión del icono Material en la tab | Línea 28 |
| Tamaño de etiqueta | 10 (línea 98) | number | Texto bajo el icono | Línea 98 |

## Estructura (funciones / clases / tipos)

- `TabIcon({ label, iconName, focused })` — componente interno que pinta icono + etiqueta de una pestaña.
- `TabsLayout(): JSX.Element` — layout por defecto con el navegador `Tabs` y sus cuatro pantallas.
- Tipado de props de `TabIcon` (inline: `label: string`, `iconName`, `focused: boolean`).
- Sin clases ni interfaces con nombre propio.

## Análisis línea por línea

**Bloque de las líneas 1–32 (cabecera, imports y componente `TabIcon`):**

```tsx
/* ============================================================================
* Archivo         : _layout.tsx (tabs)
* Descripción     : Layout de las cuatro tabs principales con iconos Material.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 2.1.0
* Lenguaje        : TypeScript 5.9
* Uso             : Layout compartido de las pestañas Inicio, Historial, Contactos y Ajustes.
* ============================================================================ */

import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../../src/theme/Icon';
import { color } from '../../src/theme';

function TabIcon({
  label,
  iconName,
  focused,
}: {
  label: string;
  iconName: React.ComponentProps<typeof Icon>['name'];
  focused: boolean;
}) {
  return (
    <View style={styles.tabItem}>
      <Icon name={iconName} size={22} color={focused ? color.danger : color.neutral400} />
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
    </View>
  );
}
```

**Explicación de las líneas 1–32:**

- **Líneas 1–9**: cabecera documental (versión 2.1.0; el layout pasó por varias iteraciones del tema).
- **Líneas 11–15**: imports de React, `Tabs`, primitivas de RN y los elementos del design system (`Icon` y paleta `color`).
- **Líneas 17–25**: firma de `TabIcon`: recibe la etiqueta, el nombre del icono (tipado contra las props de `Icon`) y el estado `focused`.
- **Líneas 26–31**: render del icono (22px, rojo `color.danger` si está enfocada, gris `neutral400` si no) y de la etiqueta con estilo condicional `labelFocused`. Con `tabBarShowLabel: false` a nivel de `Tabs`, esta etiqueta interna es el único texto visible bajo el icono.
- **Línea 32**: cierre de `TabIcon`.

**Bloque de las líneas 34–90 (navegador `Tabs` y sus cuatro pantallas):**

```tsx
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: color.danger,
        tabBarInactiveTintColor: color.neutral400,
        tabBarStyle: {
          backgroundColor: color.surface,
          borderTopColor: color.border,
          height: 65,
          paddingBottom: 8,
        },
        headerStyle: { backgroundColor: color.danger },
        headerTintColor: color.textInverse,
        headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'SafeAlert',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Inicio" iconName="shield" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Historial" iconName="history" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contactos',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Contactos" iconName="people" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configuración',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Config" iconName="settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
```

**Explicación de las líneas 34–90:**

- **Línea 34**: exportación por defecto `TabsLayout` (convención expo-router para layouts).
- **Líneas 36–50**: `screenOptions` globales: tintes activo/inactivo (rojo `danger` / gris `neutral400`), estilo de barra (fondo `surface`, borde superior, altura 65 con padding inferior 8), cabeceras de pantalla con fondo rojo `danger` y títulos blancos en negrita de 18px, y `tabBarShowLabel: false` (la etiqueta la pinta `TabIcon`).
- **Líneas 52–60**: pestaña `index` — ruta `app/(tabs)/index.tsx`; título de cabecera "SafeAlert"; icono `shield` con etiqueta "Inicio".
- **Líneas 61–69**: pestaña `history` — `app/(tabs)/history.tsx`; título "Historial"; icono `history` con etiqueta "Historial".
- **Líneas 70–78**: pestaña `contacts` — `app/(tabs)/contacts.tsx`; título "Contactos"; icono `people` con etiqueta "Contactos".
- **Líneas 79–87**: pestaña `settings` — `app/(tabs)/settings.tsx`; título "Configuración" pero etiqueta de tab "Config" (abreviada) e icono `settings`. [OBSERVACIÓN TÉCNICA] El título de cabecera ("Configuración") y la etiqueta inferior ("Config") difieren: incoherencia menor de etiquetado.
- **Líneas 88–90**: cierre del `Tabs` y del componente.

**Bloque de las líneas 92–100 (hoja de estilos):**

```tsx
const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  label: { fontSize: 10, marginTop: 2, color: color.neutral400 },
  labelFocused: { color: color.danger, fontWeight: '600' },
});
```

**Explicación de las líneas 92–100:**

- **Línea 92**: `StyleSheet.create` con los estilos del `TabIcon`.
- **Líneas 93–97**: `tabItem` — centra icono y etiqueta con `paddingTop: 6`.
- **Línea 98**: `label` — tipografía de 10px en gris `neutral400` por defecto.
- **Línea 99**: `labelFocused` — estado enfocado: rojo `danger` y peso 600.

## Fichas de funciones y métodos

### TabIcon (líneas 17–32)

- Firma: `function TabIcon({ label, iconName, focused }: { label: string; iconName: React.ComponentProps<typeof Icon>['name']; focused: boolean })`
- Propósito técnico: unifica la representación icono + etiqueta de cada tab; funcional: permite que la etiqueta se muestre aunque `tabBarShowLabel` esté desactivado.
- Parámetros: `label` (texto visible), `iconName` (icono Material tipado), `focused` (estado de selección). Retorno: JSX. Excepciones: ninguna.
- Dependencias: `Icon`, `color`, `styles`.
- Efectos secundarios: ninguno (componente puro de presentación).

### TabsLayout (líneas 34–90)

- Firma: `export default function TabsLayout(): JSX.Element`
- Propósito: declarar y estilizar las cuatro pestañas de la navegación inferior.
- Parámetros: ninguno. Retorno: `<Tabs>` con cuatro `Tabs.Screen`.
- Dependencias: `Tabs`, `TabIcon`, paleta `color`.
- Flujo: render directo; sin estado ni efectos.
- Efectos secundarios: ninguno.

## Clases / interfaces / tipos

- Props de `TabIcon` tipadas en línea (sin nombre exportado).
- `React.ComponentProps<typeof Icon>['name']` — tipo derivado que garantiza que solo se usen nombres de icono válidos.
- Sin clases.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Líneas 79–87: incoherencia de etiquetado entre el título de cabecera "Configuración" y la etiqueta de la tab "Config". Impacto: UX menor.
- [OBSERVACIÓN TÉCNICA] `tabBarShowLabel: false` con etiqueta dibujada manualmente en `TabIcon`: duplica el mecanismo estándar de etiquetas de React Navigation; funcional, pero si alguien reactiva `tabBarShowLabel` aparecerían etiquetas duplicadas.
- [NOTA] La altura fija 65 y `paddingBottom: 8` de la barra pueden no adaptarse a dispositivos con barra de gestos (safe area), aunque `paddingBottom: 8` sugiere un intento de compensación. [NIVEL DE CERTEZA: Inferido].
- [NOTA] No hay estado, autenticación ni lógica de negocio en este archivo: es navegación pura.

## Seguridad

- [INFORMATIVO] No se manejan datos sensibles, permisos ni secretos en este archivo. Sin hallazgos de seguridad relevantes.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Unificar la etiqueta de la tab de Ajustes con el título ("Configuración") para consistencia.
- [RECOMENDACIÓN] Evaluar el uso del mecanismo nativo de etiquetas de `Tabs` (con `tabBarLabel`) en lugar de dibujarlas manualmente, para simplificar y evitar duplicación futura.
- [RECOMENDACIÓN] Revisar la altura/insets de la barra en dispositivos con gestos (SafeArea).
