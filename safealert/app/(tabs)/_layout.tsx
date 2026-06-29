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

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  label: { fontSize: 10, marginTop: 2, color: color.neutral400 },
  labelFocused: { color: color.danger, fontWeight: '600' },
});
