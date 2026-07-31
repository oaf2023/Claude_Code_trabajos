/* ============================================================================
* Archivo         : Location.ts
* Descripción     : Tipos para el sistema de ubicaciones del Prompt Maestro.
*                   Clasificación de origen, consentimientos y metadatos.
* Autor           : oafon
* Fecha           : 2026-07-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* ============================================================================ */

import { LocationSource, PermissionStatusValue } from './Alert';

export interface LocationPayload {
  usuario_id: string;
  sesion_id?: string;
  device_id_app?: string;
  fecha_hora_dispositivo?: string;
  latitud: number;
  longitud: number;
  precision_metros?: number;
  altitud_metros?: number;
  velocidad_metros_segundo?: number;
  rumbo_grados?: number;
  origen: LocationSource;
  permiso_ubicacion: PermissionStatusValue;
  direccion_estimada?: string;
  direccion_confirmada?: string;
  proveedor_geocodificacion?: string;
  observaciones?: string;
  navegador_aproximado?: string;
  sistema_operativo_aproximado?: string;
  tipo_dispositivo?: string;
  idioma?: string;
  zona_horaria?: string;
  offset_utc_minutos?: number;
  pantalla_ancho?: number;
  pantalla_alto?: number;
  ventana_ancho?: number;
  ventana_alto?: number;
  profundidad_color?: number;
  metadatos?: Record<string, unknown>;
}

export interface ConsentPayload {
  usuario_id: string;
  sesion_id?: string;
  tipo_permiso: 'UBICACION' | 'CAMARA' | 'MICROFONO' | 'CONTACTOS' | 'NOTIFICACIONES';
  estado: 'OTORGADO' | 'RECHAZADO' | 'REVOCADO' | 'NO_SOLICITADO';
  texto_mostrado?: string;
  version_politica?: string;
}

export interface AccesoPayload {
  usuario_id?: string;
  sesion_id?: string;
  device_id_app?: string;
  pagina_consultada?: string;
  navegador_aproximado?: string;
  sistema_operativo_aproximado?: string;
  tipo_dispositivo?: string;
  idioma?: string;
  idiomas?: string[];
  zona_horaria?: string;
  offset_utc_minutos?: number;
  pantalla_ancho?: number;
  pantalla_alto?: number;
  ventana_ancho?: number;
  ventana_alto?: number;
  profundidad_color?: number;
  metodo_autenticacion?: string;
}

/** Versión actual de la política de privacidad */
export const POLITICA_PRIVACIDAD_VERSION = '1.0.0';
