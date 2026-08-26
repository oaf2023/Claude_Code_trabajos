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

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '../theme/Icon';
import { color, spacing, borderRadius, typography } from '../theme/tokens';
import { SERVER_SPECS, WEB_LIMITATIONS } from '../config/webBanner';

export function WebModeBanner() {
  const [expanded, setExpanded] = useState(true);

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

          {/* Footer */}
          <View style={styles.footer}>
            <Icon name="phone-android" size={16} color={color.textSecondary} />
            <Text style={styles.footerText}>
              La experiencia completa está disponible en la app móvil.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

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
