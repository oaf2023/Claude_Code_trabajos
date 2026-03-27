/* ============================================================================
* Archivo         : new.tsx
* Descripción     : Ruta explícita para alta de contactos evitando ambigüedad con el segmento dinámico.
* Autor           : oafon
* Fecha           : 2026-03-27
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Ruta /contacts/new
* ============================================================================ */

import React from 'react';
import { ContactFormScreen } from './[id]';

export default function NewContactScreen() {
  return <ContactFormScreen forcedId="new" />;
}