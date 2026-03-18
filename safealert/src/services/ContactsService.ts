import { contactsCol } from '../config/firebase';
import { Contact, ContactFormData } from '../types/Contact';
import { toE164 } from '../utils/formatPhone';
import firestore from '@react-native-firebase/firestore';

export const ContactsService = {
  // Subscribe to real-time updates
  subscribe(
    userId: string,
    onUpdate: (contacts: Contact[]) => void
  ): () => void {
    return contactsCol(userId)
      .orderBy('addedAt', 'asc')
      .onSnapshot((snapshot) => {
        const contacts: Contact[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Contact, 'id'>),
        }));
        onUpdate(contacts);
      });
  },

  async add(userId: string, data: ContactFormData): Promise<Contact> {
    const contact: Omit<Contact, 'id'> = {
      name: data.name.trim(),
      phone: toE164(data.phone),
      active: true,
      addedAt: Date.now(),
    };
    const ref = await contactsCol(userId).add(contact);
    return { id: ref.id, ...contact };
  },

  async update(
    userId: string,
    contactId: string,
    data: Partial<ContactFormData>
  ): Promise<void> {
    const patch: Partial<Contact> = {};
    if (data.name) patch.name = data.name.trim();
    if (data.phone) patch.phone = toE164(data.phone);
    await contactsCol(userId).doc(contactId).update(patch);
  },

  async remove(userId: string, contactId: string): Promise<void> {
    await contactsCol(userId).doc(contactId).delete();
  },

  async toggleActive(
    userId: string,
    contactId: string,
    active: boolean
  ): Promise<void> {
    await contactsCol(userId).doc(contactId).update({ active });
  },

  async getAll(userId: string): Promise<Contact[]> {
    const snapshot = await contactsCol(userId).orderBy('addedAt', 'asc').get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Contact, 'id'>),
    }));
  },
};
