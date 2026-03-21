import { useEffect } from 'react';
import { useContactsStore } from '../stores/useContactsStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { ContactsService } from '../services/ContactsService';
import { ContactFormData } from '../types/Contact';

export function useContacts() {
  const contacts = useContactsStore((s) => s.contacts);
  const loading = useContactsStore((s) => s.loading);
  const setContacts = useContactsStore((s) => s.setContacts);
  const setLoading = useContactsStore((s) => s.setLoading);
  const userId = useSettingsStore((s) => s.userId);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const unsubscribe = ContactsService.subscribe(userId, (updated) => {
      setContacts(updated);
      setLoading(false);
    });
    return unsubscribe;
  }, [userId]);

  const addContact = async (data: ContactFormData) => {
    if (!userId) throw new Error('Not authenticated');
    return ContactsService.add(userId, data);
  };

  const updateContact = async (id: string, data: Partial<ContactFormData>) => {
    if (!userId) throw new Error('Not authenticated');
    return ContactsService.update(userId, id, data);
  };

  const removeContact = async (id: string) => {
    if (!userId) throw new Error('Not authenticated');
    return ContactsService.remove(userId, id);
  };

  const toggleContact = async (id: string, active: boolean) => {
    if (!userId) throw new Error('Not authenticated');
    return ContactsService.toggleActive(userId, id, active);
  };

  const prioritizeContact = async (id: string) => {
    if (!userId) throw new Error('Not authenticated');
    return ContactsService.setPriority(userId, id);
  };

  return {
    contacts,
    loading,
    addContact,
    updateContact,
    removeContact,
    toggleContact,
    prioritizeContact,
  };
}
