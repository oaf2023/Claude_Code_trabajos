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

interface TrialExpiredModalProps {
  /** Controla la visibilidad del modal */
  visible: boolean;
  /** Callback al presionar "Suscribirse" */
  onSuscribirse: () => void;
  /** Callback al presionar "Cerrar" (continúa con funcionalidad limitada) */
  onCerrar: () => void;
}

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
      <SafeAreaView style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.icon}>⏰</Text>

          <Text style={styles.title}>Terminó el período de prueba</Text>

          <Text style={styles.body}>
            Tu prueba gratuita de 10 días ha finalizado.{'\n\n'}
            Para seguir usando SafeAlert y proteger a tus seres queridos,
            activá tu suscripción.
          </Text>

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
        </View>
      </SafeAreaView>
    </Modal>
  );
};

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
