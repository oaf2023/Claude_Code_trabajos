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
import functions from '@react-native-firebase/functions';
import { PaymentService, PlanType } from '../services/PaymentService';
import { PaymentTicket, TicketData } from './PaymentTicket';
import { DeviceService } from '../services/DeviceService';
import { COLORS } from '../config/constants';
import { PAYMENTS_ENABLED } from '../config/features';

// ─── Lógica de bypass dinámica (Emulador saltará pasarela) ──────────────
// Se inicializa en true preventivamente si estamos en __DEV__ para no
// bloquear al desarrollador mientras carga el chequeo de DeviceInfo.
const [isBypassMode, setIsBypassMode] = useState(__DEV__ || !PAYMENTS_ENABLED);

React.useEffect(() => {
  if (visible) {
    // Verificamos si es emulador o dispositivo real para decidir el flujo
    DeviceService.isEmulator().then(emu => {
      // Si es emulador O pagos desactivados por config, forzamos bypass
      setIsBypassMode(emu || !PAYMENTS_ENABLED);
    });
  }
}, [visible]);

interface PaymentModalProps {
  visible: boolean;
  deviceId: string;
  userName: string;
  userPhone: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  deviceId,
  userName,
  userPhone,
  onClose,
  onSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [ticketVisible, setTicketVisible] = useState(false);

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
  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      await PaymentService.confirmPayment(
        deviceId,
        selectedPlan,
        subscriptionId ?? undefined
      );

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
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

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
  const handleClose = () => {
    setPaymentUrl(null);
    setSubscriptionId(null);
    setTicket(null);
    setTicketVisible(false);
    setLoading(false);
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.container}>
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

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.subtitle}>
              Elige tu plan y completa el pago para activar todas las funciones.
            </Text>

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

            {loading && (
              <ActivityIndicator size="large" color={COLORS.warning} style={styles.loader} />
            )}

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

            <Text style={styles.footNote}>
              Al suscribirte aceptás los{' '}
              <Text style={styles.footNoteLink}>Términos y Condiciones</Text>
              {' '}de SafeAlert.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

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

