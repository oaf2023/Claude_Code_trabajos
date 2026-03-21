import { create } from 'zustand';
import { Contact } from '../types/Contact';

function sortContacts(contacts: Contact[]): Contact[] {
  return [...contacts].sort((left, right) => {
    if (left.active !== right.active) {
      return left.active ? -1 : 1;
    }

    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    return left.addedAt - right.addedAt;
  });
}

interface ContactsState {
  contacts: Contact[];
  loading: boolean;
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
  updateContact: (id: string, data: Partial<Contact>) => void;
  removeContact: (id: string) => void;
  setLoading: (loading: boolean) => void;
  activeContacts: () => Contact[];
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: [],
  loading: false,

  setContacts: (contacts) => set({ contacts: sortContacts(contacts) }),

  addContact: (contact) =>
    set((state) => ({ contacts: sortContacts([...state.contacts, contact]) })),

  updateContact: (id, data) =>
    set((state) => ({
      contacts: sortContacts(
        state.contacts.map((c) =>
          c.id === id ? { ...c, ...data } : c
        )
      ),
    })),

  removeContact: (id) =>
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
    })),

  setLoading: (loading) => set({ loading }),

  activeContacts: () => sortContacts(get().contacts).filter((c) => c.active),
}));
