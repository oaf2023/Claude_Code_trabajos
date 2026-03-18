import React, { useState } from 'react';
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
  onEdit,
  onDelete,
  onToggle,
}: {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (active: boolean) => void;
}) {
  return (
    <View style={styles.contactCard}>
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
      </View>
      <Switch
        value={contact.active}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.border, true: COLORS.safeLight }}
        thumbColor={contact.active ? COLORS.safe : COLORS.neutral}
      />
      <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
        <Text style={styles.actionBtnText}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
        <Text style={styles.actionBtnText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ContactsScreen() {
  const { contacts, loading, removeContact, toggleContact } = useContacts();

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
          data={contacts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ContactItem
              contact={item}
              onEdit={() => router.push(`/contacts/${item.id}`)}
              onDelete={() => handleDelete(item)}
              onToggle={(active) => toggleContact(item.id, active)}
            />
          )}
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              {contacts.filter((c) => c.active).length} de {contacts.length}{' '}
              contactos activos
            </Text>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/contacts/new')}
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
    marginBottom: 8,
    textAlign: 'center',
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
