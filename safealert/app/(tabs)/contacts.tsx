/* ============================================================================
* Archivo         : contacts.tsx
* Descripción     : Gestión visible de contactos con prioridad operativa y accesibilidad.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Tab de contactos de confianza.
* ============================================================================ */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useContacts } from '../../src/hooks/useContacts';
import { Contact } from '../../src/types/Contact';
import { formatDisplayPhone } from '../../src/utils/formatPhone';
import { COLORS } from '../../src/config/constants';

function ContactItem({
  contact,
  isPriority,
  onEdit,
  onDelete,
  onToggle,
  onPrioritize,
}: {
  contact: Contact;
  isPriority: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (active: boolean) => void;
  onPrioritize: () => void;
}) {
  return (
    <View
      style={[styles.contactCard, isPriority ? styles.contactCardPriority : null]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${contact.name}, ${formatDisplayPhone(contact.phone)}${
        isPriority ? ', contacto prioritario para llamada asistida' : ''
      }`}
    >
      <View style={styles.contactAvatar}>
        <Text style={styles.contactAvatarText}>
          {contact.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactPhone}>
          {formatDisplayPhone(contact.phone)}
        </Text>
        {isPriority ? <Text style={styles.priorityBadge}>Prioritario para llamada asistida</Text> : null}
      </View>
      <Switch
        value={contact.active}
        onValueChange={onToggle}
        accessibilityLabel={`Activar o desactivar a ${contact.name}`}
        accessibilityHint="Controla si este contacto recibe alertas reales"
        trackColor={{ false: COLORS.border, true: COLORS.safeLight }}
        thumbColor={contact.active ? COLORS.safe : COLORS.neutral}
      />
      <TouchableOpacity
        onPress={onPrioritize}
        style={styles.actionBtn}
        accessibilityRole="button"
        accessibilityLabel={
          isPriority
            ? `${contact.name} ya es el contacto principal`
            : `Marcar a ${contact.name} como contacto principal`
        }
      >
        <Text style={styles.actionBtnText}>{isPriority ? '⭐' : '☆'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onEdit}
        style={styles.actionBtn}
        accessibilityRole="button"
        accessibilityLabel={`Editar contacto ${contact.name}`}
      >
        <Text style={styles.actionBtnText}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onDelete}
        style={styles.actionBtn}
        accessibilityRole="button"
        accessibilityLabel={`Eliminar contacto ${contact.name}`}
      >
        <Text style={styles.actionBtnText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ============================================================================
* Función         : sortContactsForDisplay
* Descripción     : Prioriza contactos activos manteniendo el orden operativo por alta.
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : ContactsScreen
* Ingesta         : contacts: Contact[]
* Devolución      : Contact[]
* Uso             : const ordered = sortContactsForDisplay(contacts)
* ============================================================================ */
function sortContactsForDisplay(contacts: Contact[]): Contact[] {
  return [...contacts].sort((left, right) => {
    if (left.active !== right.active) {
      return left.active ? -1 : 1;
    }

    return left.addedAt - right.addedAt;
  });
}

export default function ContactsScreen() {
  const { contacts, loading, removeContact, toggleContact, prioritizeContact } = useContacts();
  const orderedContacts = sortContactsForDisplay(contacts);
  const priorityContactId = orderedContacts.find((contact) => contact.active)?.id ?? null;

  const handleDelete = (contact: Contact) => {
    Alert.alert(
      'Eliminar contacto',
      `¿Eliminar a ${contact.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => removeContact(contact.id),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.danger} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyTitle}>Sin contactos de confianza</Text>
          <Text style={styles.emptySub}>
            Agrega personas que recibirán tu ubicación en emergencias.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orderedContacts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ContactItem
              contact={item}
              isPriority={item.id === priorityContactId}
              onEdit={() => router.push(`/contacts/${item.id}`)}
              onDelete={() => handleDelete(item)}
              onToggle={(active) => toggleContact(item.id, active)}
              onPrioritize={() => prioritizeContact(item.id)}
            />
          )}
          ListHeaderComponent={
            <View style={styles.headerCard}>
              <Text style={styles.listHeader}>
                {contacts.filter((c) => c.active).length} de {contacts.length} contactos activos
              </Text>
              <Text style={styles.headerHint}>
                El contacto principal activo se usa como prioridad para la llamada asistida.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/contacts/new')}
        accessibilityRole="button"
        accessibilityLabel="Agregar nuevo contacto de confianza"
        accessibilityHint="Abre el formulario para sumar un contacto"
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list: { padding: 16, gap: 8, paddingBottom: 80 },
  listHeader: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  headerCard: {
    gap: 6,
    marginBottom: 12,
  },
  headerHint: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: COLORS.textMuted,
  },

  contactCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  contactCardPriority: {
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  contactPhone: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  priorityBadge: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.warning,
  },
  actionBtn: { padding: 6 },
  actionBtnText: { fontSize: 18 },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  emptySub: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  fabText: { fontSize: 28, color: COLORS.white, lineHeight: 32 },
});
