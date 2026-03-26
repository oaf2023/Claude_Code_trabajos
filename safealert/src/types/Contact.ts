/* ============================================================================
* Archivo         : Contact.ts
* Descripción     : Tipos del dominio de contactos de confianza.
* Autor           : oafon
* Fecha           : 2026-03-26
* Versión         : 1.2.0
* Lenguaje        : TypeScript 5.9
* Uso             : Modelos usados por contactos, alertas y persistencia local.
* ============================================================================ */

export interface Contact {
  id: string;
  name: string;
  phone: string; // E.164 format: +15551234567
  active: boolean;
  priority: number; // 0 = principal, números mayores = menor prioridad
  addedAt: number; // timestamp ms
}

export interface ContactFormData {
  name: string;
  phone: string;
}
