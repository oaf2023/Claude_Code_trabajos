/* ============================================================================
* Archivo         : PaymentModal.tsx
* Descripción     : Modal de suscripción a SafeAlert con selector de plan mensual/anual.
*                   Llama a Firebase Function para generar la URL de pago y luego
*                   abre MercadoPago en el navegador externo. Tras confirmación
*                   genera y muestra el ticket de pago (PaymentTicket).
*                   En modo __DEV__ (emulador/desarrollo) la pasarela se omite y
*                   el ticket se genera directamente sin cargo real.
* Autor           : oafon
* Fecha           : 2026-04-07
* Versión         : 3.1on
* Fecha           : 2026-04-07
* Versión         : 3.1.0
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
// ─── Bypass de pasarela en builds de desarrollo ───────────────────────────────
// En __DEV__ (emulador o dispositivo físico con Metro) se omite la llamada a
// Firebase Functions y MercadoPago para permitir testear el flujo completo
// sin generar cargos reales.
const DEV_BYPASS_PAYMENT = __DEV__;

import { COLORS } from '../config/constants';

// ─── Bypass de pasarela en builds de desarrollo ───────────────────────────────
// En __DEV__ (emulador o dispositivo físico con Metro) se omite la llamada a
// Firebase Functions y MercadoPago para permitir testear el flujo completo
// sin generar cargos reales.
const DEV_BYPASS_PAYMENT = __DEV__;

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
  const [selectedPlan, setSeDevBypass
  * Descripción     : Simula un pago aprobado en modo desarrollo (__DEV__) sin
  *                   llamar a Firebase Functions ni MercadoPago. Registra el
  *                   dispositivo en PythonAnywhere y genera el ticket correlativo
  *                   real para verificar el flujo completo de extremo a extremo.
  * Fecha           : 2026-04-07
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : PaymentService.registerDevice, PaymentService.createTicket
  * Ingesta         : void
  * Devolución      : Promise<void>
  * Uso             : onPress={handleDevBypass}
  * ============================================================================ */
  const handleDevBypass = async () => {
    setLoading(true);
    try {
      // Registrar dispositivo (útil para validar conexión PA)
      await PaymentService.registerDevice(deviceId, userName, userPhone);

      // Crear ticket real en PythonAnywhere (prueba el endpoint end-to-end)
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
      // En dev fallamos con ticket local para no bloquear el flujo
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
  *                   El email del comprador es gestionado internamente — no se
  *                   solicita al usuario.
  * Fecha           : 2026-04-07
  * Versión         : 3.1
  /* ============================================================================
  * Función         : handleDevBypass
  * Descripción     : Simula un pago aprobado en modo desarrollo (__DEV__) sin
  *                   llamar a Firebase Functions ni MercadoPago. Registra el
  *                   dispositivo en PythonAnywhere y genera el ticket correlativo
  *                   real para verificar el flujo completo de extremo a extremo.
  * Fecha           : 2026-04-07
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : PaymentService.registerDevice, PaymentService.createTicket
  * Ingesta         : void
  * Devolución      : Promise<void>
  * Uso             : onPress={handleDevBypass}
  * ============================================================================ */
  const handleDevBypass = async () => {
    setLoading(true);
    try {
      // Registrar dispositivo (útil para validar conexión PA)
      await PaymentService.registerDevice(deviceId, userName, userPhone);

      // Crear ticket real en PythonAnywhere (prueba el endpoint end-to-end)
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
      // En dev fallamos con ticket local para no bloquear el flujo
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
  *                   El email del comprador es gestionado internamente — no se
  *                   solicita al usuario.
  * Fecha           : 2026-04-07
  * Versión         : 3.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : Firebase Functions, PaymentService.registerDevice
  * Ingesta         : void (usa estado interno del componente)
  * Devolución      : Promise<void>
  * Uso             : onPress={handleGeneratePayment}
  * ============================================================================ */
  const handleGeneratePayment = async () => {
    setLoading(true);
    try {
      // Registrar dispositivo en PythonAnywhere antes de pagar
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
  * Conexiones      : PaymentService.confirmPayment, PA /api/tickets/create, onSuccess
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

      // Generar ticket correlativo en PythonAnywhere
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
      // Continuar igualmente — el webhook activará la suscripción
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Resetear estado al cerrar
    setPaymentUrl(null);
    setSubscriptionId(null);
    setTick/* ── Banner de modo desarrollo ── */}
          {DEV_BYPASS_PAYMENT && (
            <View style={styles.devBanner}>
              <Text style={styles.devBannerTitle}>⚙️ MODO DESARROLLO</Text>
              <Text style={styles.devBannerText}>
                La pasarela de pago está desactivada. El ticket se genera
                directamente en PythonAnywhere sin cargo real.
              </Text>
            </View>
          )}

          {loading && (
            <ActivityIndicator size="large" color={COLORS.warning} style={styles.loader} />
          )}

          {/* Botón bypass — solo visible en __DEV__ */}
          {DEV_BYPASS_PAYMENT && !loading && (
            <TouchableOpacity
              style={styles.devBypassButton}
              onPress={handleDevBypass}
              accessibilityRole="button"
              accessibilityLabel="Simular pago aprobado (solo desarrollo)"
            >
              <Text style={styles.devBypassButtonText}>🧪 Simular pago aprobado</Text>
            </TouchableOpacity>
          )}

          {/* Botón principal — genera link o abre browser (solo producción) */}
          {!DEV_BYPASS_PAYMENT && !loading && !paymentUrl && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={handleGeneratePayment}
              accessibilityRole="button"
              accessibilityLabel={`Pagar plan ${selectedPlan === 'monthly' ? 'mensual' : 'anual'}`}
            >
              <Text style={styles.payButtonText}>💳 Ir a pagar</Text>
            </TouchableOpacity>
          )}

          {!DEV_BYPASS_PAYMENT &&  <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.subtitle}>
            Elige tu plan y completa el pago para activar todas las funciones.
          </Text>

          {/* Selector de plan */}
          <View style={styles.plansRow}>
            {/* Plan mensual */}
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

            {/* Plan anual */}
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

          {/* Campo de email eliminado — se gestiona internamente */}

          {/* ── Banner de modo desarrollo ── */}
          {DEV_BYPASS_PAYMENT && (
            <View style={styles.devBanner}>
              <Text style={styles.devBannerTitle}>⚙️ MODO DESARROLLO</Text>
              <Text style={styles.devBannerText}>
                La pasarela de pago está desactivada. El ticket se genera
                directamente en PythonAnywhere sin cargo real.
              </Text>
            </View>
          )}

          {loading && (
            <ActivityIndicator size="large" color={COLORS.warning} style={styles.loader} />
          )}

          {/* Botón bypass — solo visible en __DEV__ */}
          {DEV_BYPASS_PAYMENT && !loading && (
            <TouchableOpacity
              style={styles.devBypassButton}
              onPress={handleDevBypass}
              accessibilityRole="button"
              accessibilityLabel="Simular pago aprobado (solo desarrollo)"
            >
              <Text style={styles.devBypassButtonText}>🧪 Simular pago aprobado</Text>
            </TouchableOpacity>
          )}

          {/* Botón principal — genera link o abre browser (solo producción) */}
          {!DEV_BYPASS_PAYMENT && !loading && !paymentUrl && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={handleGeneratePayment}
              accessibilityRole="button"
              accessibilityLabel={`Pagar plan ${selectedPlan === 'monthly' ? 'mensual' : 'anual'}`}
            >
              <Text style={styles.payButtonText}>💳 Ir a pagar</Text>
            </TouchableOpacity>
          )}

          {!DEV_BYPASS_PAYMENT && !loading && paymentUrl && (
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
            El pago se procesa de forma segura a través de Mercado Pago.
            Tu suscripción se activa en minutos luego de la confirmación.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>

    {/* Ticket de pago — aparece tras confirmar el pago */}
    <PaymentTicket
      visible={ticketVisible}
      ticket={ticket}
      onClose={() => {
        setTicketVisible(false);
        setTicket(null);
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  body: {
    padding: 24,
    gap: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },
  plansRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 8,
  },
  planCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f9f9f9',
  },
  planCardSelected: {
    borderColor: '#009EE3',
    backgroundColor: '#EBF8FF',
  },
  planName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  planPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  planPriceSelected: {
    color: '#009EE3',
  },
  planPriceSub: {
    fontSize: 11,
    color: '#888',
  },
  savingBadge: {
    backgroundColor: '#22C55E',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  savingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  loader: {
    marginVertical: 16,
  },
  devBanner: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFC107',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
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
  devBypassButton: {
    backgroundColor: '#6C757D',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 8,
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
    fontWeight: '700',
    fontSize: 16,
  },
  successButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  footNote: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
});

