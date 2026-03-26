/* ============================================================================
* Archivo         : PaymentModal.tsx
* Descripción     : Modal para iniciar el Checkout Pro de Mercado Pago (browser externo).
* Autor           : oafon
* Fecha           : 2026-03-24
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Uso             : <PaymentModal url={...} onClose={...} onSuccess={...} />
* Nota            : Usa Linking.openURL en lugar de WebView para evitar dependencia
*                   de react-native-webview no incluido en el APK de debug.
* ============================================================================ */

import React from 'react';
import { Modal, StyleSheet, View, TouchableOpacity, Text, SafeAreaView, Linking, Alert } from 'react-native';

interface PaymentModalProps {
  visible: boolean;
  paymentUrl: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ visible, paymentUrl, onClose, onSuccess }) => {
  if (!visible || !paymentUrl) return null;

  /* ============================================================================
  * Función         : handleOpenBrowser
  * Descripción     : Abre la URL de pago en el navegador externo del dispositivo
  * Fecha           : 2026-03-24
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : Linking (React Native), paymentUrl prop
  * Ingesta          : void (usa paymentUrl del closure)
  * Devolución      : Promise<void>
  * Uso             : Llamada al presionar el botón "Ir a pagar"
  * ============================================================================ */
  const handleOpenBrowser = async () => {
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Suscripción SafeAlert</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.body}>
          <Text style={styles.infoText}>
            Se abrirá Mercado Pago en el navegador para completar tu suscripción.
          </Text>
          <TouchableOpacity style={styles.payButton} onPress={handleOpenBrowser}>
            <Text style={styles.payButtonText}>Ir a pagar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.successButton} onPress={onSuccess}>
            <Text style={styles.successButtonText}>Ya completé el pago</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginBottom: 16,
  },
  payButton: {
    backgroundColor: '#009EE3',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  successButton: {
    borderWidth: 1,
    borderColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    color: '#16a34a',
    fontSize: 15,
    fontWeight: '600',
  },
});
