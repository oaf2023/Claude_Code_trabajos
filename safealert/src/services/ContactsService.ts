/* ============================================================================
* Archivo         : ContactsService.ts
* Descripción     : Gestión de contactos con validaciones operativas para el MVP.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : ContactsService.add(userId, data) y operaciones relacionadas.
* ============================================================================ */

import { contactsCol } from '../config/firebase';
import { Contact, ContactFormData } from '../types/Contact';
import { toE164 } from '../utils/formatPhone';
import firestore from '@react-native-firebase/firestore';

function hydrateAndSortContacts(contacts: Contact[]): Contact[] {
  const byAddedAt = [...contacts].sort((left, right) => left.addedAt - right.addedAt);

  return byAddedAt
    .map((contact, index) => ({
      ...contact,
      priority:
        typeof contact.priority === 'number' && Number.isFinite(contact.priority)
          ? contact.priority
          : index,
    }))
    .sort((left, right) => {
      if (left.active !== right.active) {
        return left.active ? -1 : 1;
      }

      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }

      return left.addedAt - right.addedAt;
    });
}

async function getNormalizedContacts(userId: string): Promise<Contact[]> {
  const snapshot = await contactsCol(userId).get();
  const contacts = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Contact, 'id'>),
  }));

  return hydrateAndSortContacts(contacts);
}

async function getNextPriority(userId: string): Promise<number> {
  const contacts = await getNormalizedContacts(userId);
  if (contacts.length === 0) {
    return 0;
  }

  return Math.max(...contacts.map((contact) => contact.priority)) + 1;
}

/* ============================================================================
* Función         : assertUniquePhone
* Descripción     : Impide registrar teléfonos duplicados entre contactos de confianza.
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : ContactsService.add, ContactsService.update
* Ingesta         : userId: string, phone: string, excludedContactId?: string
* Devolución      : Promise<void>
* Uso             : await assertUniquePhone(userId, phone, contactId)
* ============================================================================ */
async function assertUniquePhone(
  userId: string,
  phone: string,
  excludedContactId?: string
): Promise<void> {
  const normalizedPhone = toE164(phone);
  const snapshot = await contactsCol(userId).get();
  const duplicated = snapshot.docs.find((doc) => {
    if (excludedContactId && doc.id === excludedContactId) {
      return false;
    }

    const current = doc.data() as Omit<Contact, 'id'>;
    return current.phone === normalizedPhone;
  });

  if (duplicated) {
    throw new Error('Ese teléfono ya está cargado como contacto de confianza.');
  }
}

export const ContactsService = {
  /* ============================================================================
  * Función         : subscribe
  * Descripción     : Suscribe la app a cambios en los contactos del usuario.
  * Fecha           : 2026-03-19
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : Firestore contacts
  * Ingesta         : userId: string, onUpdate: (contacts: Contact[]) => void
  * Devolución      : () => void
  * Uso             : const unsubscribe = ContactsService.subscribe(...)
  * ============================================================================ */
  subscribe(
    userId: string,
    onUpdate: (contacts: Contact[]) => void
  ): () => void {
    return contactsCol(userId)
      .orderBy('addedAt', 'asc')
      .onSnapshot((snapshot) => {
        const contacts = hydrateAndSortContacts(snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Contact, 'id'>),
        })));
        onUpdate(contacts);
      });
  },

  /* ============================================================================
  * Función         : add
  * Descripción     : Agrega un contacto validando unicidad y formato operativo.
  * Fecha           : 2026-03-19
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : Firestore contacts, assertUniquePhone
  * Ingesta         : userId: string, data: ContactFormData
  * Devolución      : Promise<Contact>
  * Uso             : await ContactsService.add(userId, data)
  * ============================================================================ */
  async add(userId: string, data: ContactFormData): Promise<Contact> {
    await assertUniquePhone(userId, data.phone);
    const priority = await getNextPriority(userId);

    const contact: Omit<Contact, 'id'> = {
      name: data.name.trim(),
      phone: toE164(data.phone),
      active: true,
      priority,
      addedAt: Date.now(),
    };
    const ref = await contactsCol(userId).add(contact);
    return { id: ref.id, ...contact };
  },

  /* ============================================================================
  * Función         : update
  * Descripción     : Actualiza un contacto manteniendo el teléfono único por usuario.
  * Fecha           : 2026-03-19
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : Firestore contacts, assertUniquePhone
  * Ingesta         : userId: string, contactId: string, data: Partial<ContactFormData>
  * Devolución      : Promise<void>
  * Uso             : await ContactsService.update(userId, contactId, data)
  * ============================================================================ */
  async update(
    userId: string,
    contactId: string,
    data: Partial<ContactFormData>
  ): Promise<void> {
    const patch: Partial<Contact> = {};
    if (data.name) patch.name = data.name.trim();
    if (data.phone) {
      await assertUniquePhone(userId, data.phone, contactId);
      patch.phone = toE164(data.phone);
    }

    await contactsCol(userId).doc(contactId).update(patch);
  },

  /* ============================================================================
  * Función         : remove
  * Descripción     : Elimina un contacto de confianza.
  * Fecha           : 2026-03-19
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : Firestore contacts
  * Ingesta         : userId: string, contactId: string
  * Devolución      : Promise<void>
  * Uso             : await ContactsService.remove(userId, contactId)
  * ============================================================================ */
  async remove(userId: string, contactId: string): Promise<void> {
    await contactsCol(userId).doc(contactId).delete();
  },

  /* ============================================================================
  * Función         : toggleActive
  * Descripción     : Activa o desactiva un contacto existente.
  * Fecha           : 2026-03-19
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : Firestore contacts
  * Ingesta         : userId: string, contactId: string, active: boolean
  * Devolución      : Promise<void>
  * Uso             : await ContactsService.toggleActive(userId, contactId, true)
  * ============================================================================ */
  async toggleActive(
    userId: string,
    contactId: string,
    active: boolean
  ): Promise<void> {
    await contactsCol(userId).doc(contactId).update({ active });
  },

  /* ============================================================================
  * Función         : setPriority
  * Descripción     : Reordena contactos para que uno quede como principal operativo.
  * Fecha           : 2026-03-19
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : Firestore contacts
  * Ingesta         : userId: string, contactId: string
  * Devolución      : Promise<void>
  * Uso             : await ContactsService.setPriority(userId, contactId)
  * ============================================================================ */
  async setPriority(userId: string, contactId: string): Promise<void> {
    const contacts = await getNormalizedContacts(userId);
    const target = contacts.find((contact) => contact.id === contactId);

    if (!target) {
      throw new Error('No se encontró el contacto a priorizar.');
    }

    const ordered = [
      { ...target, active: true },
      ...contacts.filter((contact) => contact.id !== contactId),
    ];

    const batch = firestore().batch();
    ordered.forEach((contact, index) => {
      batch.update(contactsCol(userId).doc(contact.id), {
        priority: index,
        active: contact.id === contactId ? true : contact.active,
      });
    });

    await batch.commit();
  },

  /* ============================================================================
  * Función         : getAll
  * Descripción     : Recupera todos los contactos ordenados por alta.
  * Fecha           : 2026-03-19
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : Firestore contacts
  * Ingesta         : userId: string
  * Devolución      : Promise<Contact[]>
  * Uso             : await ContactsService.getAll(userId)
  * ============================================================================ */
  async getAll(userId: string): Promise<Contact[]> {
    return getNormalizedContacts(userId);
  },
};
