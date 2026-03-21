/* ============================================================================
* Archivo         : MessageFormatter.ts
* Descripción     : Lógica de dominio para la construcción de mensajes de alerta.
* Autor           : oafon
* Fecha           : 2026-03-21
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : MessageFormatter.format(template, data)
* ============================================================================ */

interface MessageData {
  mapsLink: string;
  isStale: boolean;
  staleMinutes?: number;
  contactName?: string;
}

/* ============================================================================
* Función         : format
* Descripción     : Reemplaza placeholders en el template por datos reales de ubicación y tiempo.
* Fecha            : 2026-03-21
* Versión          : 1.0.0
* Lenguaje         : TypeScript 5.9
* Conexiones      : AlertService.ts
* Ingesta          : template: string, data: MessageData
* Devolución      : string
* Uso             : MessageFormatter.format(template, { mapsLink, isStale, ... })
* ============================================================================ */
export const MessageFormatter = {
  format(template: string, data: MessageData): string {
    const time = new Date().toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let locationText = data.mapsLink;
    if (data.isStale && data.staleMinutes) {
      locationText = `${data.mapsLink} (ubicación de hace ${data.staleMinutes} min)`;
    }

    return template
      .replace('{location}', locationText)
      .replace('{time}', time)
      .replace('{name}', data.contactName || 'Tu contacto');
  }
};
