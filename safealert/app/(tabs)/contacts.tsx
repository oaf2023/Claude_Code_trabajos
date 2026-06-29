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
  ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { useContacts } from '../../src/hooks/useContacts';
import { Contact } from '../../src/types/Contact';
import { formatDisplayPhone } from '../../src/utils/formatPhone';
import { color, spacing, borderRadius, shadow } from '../../src/theme';
import { Icon } from '../../src/theme/Icon';
import { Card } from '../../src/theme/Card';
import { Button } from '../../src/theme/Button';

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
    <Card style={[styles.contactCardRow, isPriority ? styles.contactCardPriority : undefined] as ViewStyle[]}>
      <View accessible accessibilityRole="summary"
        accessibilityLabel={`${contact.name}, ${formatDisplayPhone(contact.phone)}${
          isPriority ? ', contacto prioritario para llamada asistida' : ''
        }`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}
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
        trackColor={{ false: color.border, true: color.safeLight }}
        thumbColor={contact.active ? color.safe : color.neutral400}
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
        <Icon name={isPriority ? 'star' : 'star-border'} size={20} color={color.warning} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onEdit}
        style={styles.actionBtn}
        accessibilityRole="button"
        accessibilityLabel={`Editar contacto ${contact.name}`}
      >
        <Icon name="edit" size={20} color={color.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onDelete}
        style={styles.actionBtn}
        accessibilityRole="button"
        accessibilityLabel={`Eliminar contacto ${contact.name}`}
      >
        <Icon name="delete" size={20} color={color.danger} />
      </TouchableOpacity>
    </View>
    </Card>
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

  /* ============================================================================
  * Función         : handleDelete
  * Descripción     : Confirma y elimina un contacto mostrando errores operativos si la baja falla.
  * Fecha           : 2026-03-25
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : useContacts.removeContact, Alert
  * Ingesta         : contact: Contact
  * Devolución      : void
  * Uso             : onDelete={() => handleDelete(item)}
  * ============================================================================ */
  const handleDelete = (contact: Contact) => {
    Alert.alert(
      'Eliminar contacto',
      `¿Eliminar a ${contact.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeContact(contact.id);
            } catch (error: any) {
              Alert.alert(
                'No se pudo eliminar',
                error?.message || 'La baja del contacto falló. Reintenta en unos segundos.'
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={color.danger} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="people" size={64} color={color.neutral400} />
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

      <View style={styles.fabContainer}>
        <Button
          title=""
          icon="add"
          onPress={() => router.push('/contacts/new')}
          variant="danger"
          size="lg"
          style={styles.fab}
          accessibilityLabel="Agregar nuevo contacto de confianza"
          accessibilityHint="Abre el formulario para sumar un contacto"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list: { padding: 16, gap: 8, paddingBottom: 80 },
  listHeader: {
    fontSize: 13,
    color: color.textSecondary,
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
    color: color.textSecondary,
  },

  contactCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  contactCardPriority: {
    borderWidth: 1,
    borderColor: color.warning,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: color.danger,
  },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '600', color: color.textPrimary },
  contactPhone: { fontSize: 13, color: color.textSecondary, marginTop: 2 },
  priorityBadge: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: color.warning,
  },
  actionBtn: { padding: 6 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: color.textPrimary },
  emptySub: {
    fontSize: 14,
    color: color.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

});
