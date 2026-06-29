/* ============================================================================
* Archivo         : MessageFormatter.test.ts
* Descripción     : Tests unitarios del formateador de mensajes de alerta.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : npx jest src/utils/__tests__/MessageFormatter.test.ts
* ============================================================================ */

import { MessageFormatter } from '../MessageFormatter';

describe('MessageFormatter', () => {
  describe('format', () => {
    it('should replace {location} placeholder with maps link', () => {
      const result = MessageFormatter.format('Ubicación: {location}', {
        mapsLink: 'https://maps.example.com/0,0',
        isStale: false,
      });

      expect(result).toContain('https://maps.example.com/0,0');
      expect(result).not.toContain('{location}');
    });

    it('should append stale info when location is stale', () => {
      const result = MessageFormatter.format('{location}', {
        mapsLink: 'https://maps.example.com/0,0',
        isStale: true,
        staleMinutes: 5,
      });

      expect(result).toContain('(ubicación de hace 5 min)');
    });

    it('should not append stale info when isStale is false', () => {
      const result = MessageFormatter.format('{location}', {
        mapsLink: 'https://maps.example.com/0,0',
        isStale: false,
      });

      expect(result).not.toContain('ubicación de hace');
    });

    it('should replace {time} placeholder with current time', () => {
      const result = MessageFormatter.format('Enviado a las {time}', {
        mapsLink: '',
        isStale: false,
      });

      expect(result).toMatch(/Enviado a las \d{2}:\d{2}/);
      expect(result).not.toContain('{time}');
    });

    it('should replace {name} placeholder with contact name', () => {
      const result = MessageFormatter.format('Alerta para {name}', {
        mapsLink: '',
        isStale: false,
        contactName: 'María',
      });

      expect(result).toBe('Alerta para María');
    });

    it('should use default text when {name} not provided', () => {
      const result = MessageFormatter.format('Alerta para {name}', {
        mapsLink: '',
        isStale: false,
      });

      expect(result).toBe('Alerta para Tu contacto');
    });

    it('should replace all placeholders simultaneously', () => {
      const result = MessageFormatter.format(
        '{name} - {location} - {time}',
        {
          mapsLink: 'https://maps.example.com',
          isStale: false,
          contactName: 'Juan',
        }
      );

      expect(result).toContain('Juan');
      expect(result).toContain('https://maps.example.com');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should handle empty template gracefully', () => {
      const result = MessageFormatter.format('', {
        mapsLink: '',
        isStale: false,
      });

      expect(result).toBe('');
    });

    it('should handle template with no placeholders', () => {
      const result = MessageFormatter.format('Mensaje fijo sin placeholders', {
        mapsLink: 'https://maps.example.com',
        isStale: true,
      });

      expect(result).toBe('Mensaje fijo sin placeholders');
    });
  });
});
