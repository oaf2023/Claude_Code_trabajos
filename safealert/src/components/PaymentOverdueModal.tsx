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
export const PaymentOverdueModal: React.FC<PaymentOverdueModalProps> = ({
  visible,
  afterAlert,
  onPay,
  onDismissed,
}) => {
  const setPaymentOverdue = useSettingsStore((s) => s.setPaymentOverdue);

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
  const handleClose = () => {
    setPaymentOverdue(true);
    onDismissed();
    if (Platform.OS === 'android') {
      setTimeout(() => {
        BackHandler.exitApp();
      }, 150);
    }
  };

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

          <Text style={styles.footnote}>
            Al cerrar, este aviso aparecerá cada vez que abras SafeAlert hasta que completes el pago.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

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
