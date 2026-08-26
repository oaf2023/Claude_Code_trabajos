/* ============================================================================
* Archivo         : webBanner.ts
* Descripción     : Datos centralizados para el banner informativo del modo web.
*                   Specs del servidor y lista de funcionalidades no disponibles
*                   cuando SafeAlert se ejecuta en el navegador.
* Autor           : oafon
* Fecha           : 2026-08-26
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Importado por WebModeBanner.tsx para renderizar el panel.
* ============================================================================ */

export interface ServerSpec {
  icon: string;
  label: string;
  value: string;
}

export interface WebLimitation {
  feature: string;
  note: string;
}

export const SERVER_SPECS: ServerSpec[] = [
  { icon: 'developer-board', label: 'CPU', value: '1 vCPU' },
  { icon: 'memory', label: 'RAM', value: '2 GB RAM' },
  { icon: 'storage', label: 'Almacenamiento', value: '40 GB NVMe' },
  { icon: 'public', label: 'Transferencia', value: '2 TB' },
];

export const WEB_LIMITATIONS: WebLimitation[] = [
  { feature: 'Wake Word / Guardia por voz', note: 'Solo Android' },
  { feature: 'Grabación de audio', note: 'Solo Android' },
  { feature: 'Notificaciones programadas', note: 'No soportado en web' },
  { feature: 'Ubicación en segundo plano', note: 'No soportado en web' },
  { feature: 'Identificación de dispositivo nativa', note: 'No soportado en web' },
];
