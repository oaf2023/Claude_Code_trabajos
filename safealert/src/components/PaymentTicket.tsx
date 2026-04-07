/* ============================================================================
* Archivo         : PaymentTicket.tsx
* Descripción     : Ticket visual de pago de SafeAlert. Muestra número correlativo,
*                   fecha, hora, plan, monto y email de contacto. Permite compartir
*                   o cerrar. El número de ticket proviene del endpoint PA.
* Autor           : oafon
* Fecha           : 2026-04-07
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : <PaymentTicket ticket={ticketData} onClose={() => {}} />
* ============================================================================ */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';

export interface TicketData {
  ticket_number: number;
  date: string;
  time: string;
  plan_type: 'monthly' | 'annual';
  amount: number;
  contact_email: string;
}

interface PaymentTicketProps {
  visible: boolean;
  ticket: TicketData | null;
  onClose: () => void;
}

/* ============================================================================
* Función         : formatAmount
* Descripción     : Formatea un número como moneda ARS con separadores de miles.
* Fecha           : 2026-04-07
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : PaymentTicket
* Ingesta         : n: number
* Devolución      : string (ej: "$7.500")
* Uso             : formatAmount(7500) → "$7.500"
* ============================================================================ */
function formatAmount(n: number): string {
  return '$' + n.toLocaleString('es-AR');
}

/* ============================================================================
* Función         : planLabel
* Descripción     : Convierte el identificador interno del plan a texto legible.
* Fecha           : 2026-04-07
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : PaymentTicket
* Ingesta         : plan: string
* Devolución      : string
* Uso             : planLabel('monthly') → "Suscripción Mensual"
* ============================================================================ */
function planLabel(plan: string): string {
  return plan === 'annual' ? 'Suscripción Anual' : 'Suscripción Mensual';
}

/* ============================================================================
* Función         : handleShare
* Descripción     : Comparte el texto del ticket usando el sistema nativo de
*                   compartir del dispositivo (WhatsApp, email, etc.).
* Fecha           : 2026-04-07
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : Share (React Native), TicketData
* Ingesta         : ticket: TicketData
* Devolución      : Promise<void>
* Uso             : onPress={() => handleShare(ticket)}
* ============================================================================ */
async function handleShare(ticket: TicketData): Promise<void> {
  const texto = [
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '        🛡️  SAFEALERT',
    '   Comprobante de Pago',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    `📋 Ticket N°: ${String(ticket.ticket_number).padStart(6, '0')}`,
    `📅 Fecha:     ${ticket.date}`,
    `🕐 Hora:      ${ticket.time} (UTC)`,
    `📦 Plan:      ${planLabel(ticket.plan_type)}`,
    `💰 Monto:     ${formatAmount(ticket.amount)} ARS`,
    `📧 Contacto:  ${ticket.contact_email}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    'Gracias por confiar en SafeAlert.',
    'Tu suscripción se activará en minutos.',
  ].join('\n');

  try {
    await Share.share({
      message: texto,
      title: `Ticket SafeAlert #${ticket.ticket_number}`,
    });
  } catch (err) {
    // El usuario canceló el share — no es error
  }
}

export const PaymentTicket: React.FC<PaymentTicketProps> = ({ visible, ticket, onClose }) => {
  if (!ticket) return null;

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="pageSheet" transparent>
      <SafeAreaView style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Tarjeta del ticket ─── */}
          <View style={styles.card}>
            {/* Franja superior decorativa */}
            <View style={styles.cardHeader}>
              <View style={styles.headerStripe} />
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.brandName}>Safealert</Text>
              <Text style={styles.brandSub}>Comprobante de Pago</Text>
              <View style={styles.headerStripe} />
            </View>

            {/* Separador dentado */}
            <View style={styles.zigzagRow}>
              {Array.from({ length: 18 }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.zigzagTriangle, i % 2 === 0 ? styles.zigzagUp : styles.zigzagDown]}
                />
              ))}
            </View>

            {/* Cuerpo del ticket */}
            <View style={styles.body}>
              <TicketRow
                label="N° de Ticket"
                value={`#${String(ticket.ticket_number).padStart(6, '0')}`}
                highlight
              />
              <View style={styles.divider} />
              <TicketRow label="Fecha" value={ticket.date} />
              <TicketRow label="Hora" value={`${ticket.time} UTC`} />
              <View style={styles.divider} />
              <TicketRow label="Plan" value={planLabel(ticket.plan_type)} />
              <TicketRow
                label="Monto"
                value={`${formatAmount(ticket.amount)} ARS`}
                highlight
              />
              <View style={styles.divider} />
              <TicketRow label="Contacto" value={ticket.contact_email} small />
            </View>

            {/* Separador dentado inferior */}
            <View style={[styles.zigzagRow, { transform: [{ rotate: '180deg' }] }]}>
              {Array.from({ length: 18 }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.zigzagTriangle, i % 2 === 0 ? styles.zigzagUp : styles.zigzagDown]}
                />
              ))}
            </View>

            {/* Pie del ticket */}
            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>
                Gracias por confiar en SafeAlert 🛡️
              </Text>
              <Text style={styles.footerSub}>
                Tu suscripción se activará en minutos.
              </Text>
            </View>
          </View>

          {/* ─── Botones ─── */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => handleShare(ticket)}
              accessibilityRole="button"
              accessibilityLabel="Compartir comprobante"
            >
              <Text style={styles.shareButtonText}>📤  Compartir comprobante</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar comprobante"
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

/* ─── Fila de dato ─── */
interface TicketRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  small?: boolean;
}
const TicketRow: React.FC<TicketRowProps> = ({ label, value, highlight, small }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, small && styles.rowLabelSmall]}>{label}</Text>
    <Text
      style={[
        styles.rowValue,
        highlight && styles.rowValueHighlight,
        small && styles.rowValueSmall,
      ]}
      numberOfLines={2}
    >
      {value}
    </Text>
  </View>
);

const SAFEALERT_RED = '#C0392B';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  cardHeader: {
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    gap: 8,
  },
  headerStripe: {
    width: '100%',
    height: 4,
    backgroundColor: SAFEALERT_RED,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginTop: 12,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    fontStyle: 'italic',
    color: SAFEALERT_RED,
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 12,
    color: '#888',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  /* Borde dentado tipo ticket */
  zigzagRow: {
    flexDirection: 'row',
    height: 12,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  zigzagTriangle: {
    flex: 1,
    height: 12,
  },
  zigzagUp: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  zigzagDown: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  body: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  rowLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    flex: 1,
  },
  rowLabelSmall: {
    fontSize: 11,
  },
  rowValue: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  rowValueHighlight: {
    color: SAFEALERT_RED,
    fontSize: 15,
    fontWeight: '800',
  },
  rowValueSmall: {
    fontSize: 11,
    color: '#666',
  },
  cardFooter: {
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#444',
    fontWeight: '600',
    textAlign: 'center',
  },
  footerSub: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  /* Botones */
  actions: {
    marginTop: 20,
    gap: 10,
  },
  shareButton: {
    backgroundColor: SAFEALERT_RED,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: SAFEALERT_RED,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  closeButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  closeButtonText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 14,
  },
});
