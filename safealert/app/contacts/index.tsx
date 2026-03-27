/* ============================================================================
* Archivo         : index.tsx
* Descripción     : Redirige la ruta /contacts al tab principal de contactos.
* Autor           : oafon
* Fecha           : 2026-03-27
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Ruta /contacts
* ============================================================================ */

import React from 'react';
import { Redirect } from 'expo-router';

export default function ContactsIndexRedirect() {
  return <Redirect href="/(tabs)/contacts" />;
}