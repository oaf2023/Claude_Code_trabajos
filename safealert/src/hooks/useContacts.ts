import { useEffect } from 'react';
import { useContactsStore } from '../stores/useContactsStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { ensureAuthenticated } from '../config/firebase';
import { ContactsService } from '../services/ContactsService';
import { ContactFormData } from '../types/Contact';

/* ============================================================================
* Función         : resolveUserId
* Descripción     : Garantiza que exista una sesión Firebase válida y sincroniza el userId operativo con la sesión real.
* Fecha           : 2026-03-25
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : ensureAuthenticated, useSettingsStore
* Ingesta         : Sin argumentos
* Devolución      : Promise<string>
* Uso             : const userId = await resolveUserId()
* ============================================================================ */
async function resolveUserId(): Promise<string> {
  const authenticatedUserId = await ensureAuthenticated();

  if (useSettingsStore.getState().userId !== authenticatedUserId) {
    useSettingsStore.getState().setUserId(authenticatedUserId);
  }

  return authenticatedUserId;
}

export function useContacts() {
  const contacts = useContactsStore((s) => s.contacts);
  const loading = useContactsStore((s) => s.loading);
  const setContacts = useContactsStore((s) => s.setContacts);
  const setLoading = useContactsStore((s) => s.setLoading);
  const userId = useSettingsStore((s) => s.userId);

  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    let unsubscribe = () => {};

    const bootstrapSubscription = async () => {
      try {
        const resolvedUserId = userId || (await resolveUserId());
        if (cancelled) {
          return;
        }

        unsubscribe = ContactsService.subscribe(resolvedUserId, (updated) => {
          setContacts(updated);
          setLoading(false);
        });
      } catch (error) {
        if (!cancelled) {
          console.error('[useContacts] No se pudieron cargar los contactos:', error);
          setLoading(false);
        }
      }
    };

    void bootstrapSubscription();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [setContacts, setLoading, userId]);

  const addContact = async (data: ContactFormData) => {
    const resolvedUserId = await resolveUserId();
    return ContactsService.add(resolvedUserId, data);
  };

  const updateContact = async (id: string, data: Partial<ContactFormData>) => {
    const resolvedUserId = await resolveUserId();
    return ContactsService.update(resolvedUserId, id, data);
  };

  const removeContact = async (id: string) => {
    const resolvedUserId = await resolveUserId();
    return ContactsService.remove(resolvedUserId, id);
  };

  const toggleContact = async (id: string, active: boolean) => {
    const resolvedUserId = await resolveUserId();
    return ContactsService.toggleActive(resolvedUserId, id, active);
  };

  const prioritizeContact = async (id: string) => {
    const resolvedUserId = await resolveUserId();
    return ContactsService.setPriority(resolvedUserId, id);
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
