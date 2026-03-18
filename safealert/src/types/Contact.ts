export interface Contact {
  id: string;
  name: string;
  phone: string; // E.164 format: +15551234567
  active: boolean;
  addedAt: number; // timestamp ms
}

export interface ContactFormData {
  name: string;
  phone: string;
}
