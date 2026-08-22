/* ============================================================================
* Archivo         : PaymentService.test.ts
* Descripción     : Tests unitarios de PaymentService: registro de dispositivo,
*                   consulta de suscripción, confirmación de pago y creación
*                   de ticket correlativo (fetch mockeado).
* Autor           : oafon
* Fecha           : 2026-08-22
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9 / Jest
* Uso             : npx jest src/services/__tests__/PaymentService.test.ts
* ============================================================================ */

import { PaymentService, SubscriptionStatus } from '../PaymentService';
import { useSettingsStore } from '../../stores/useSettingsStore';

// ─── Mocks ────────────────────────────────────────────────────────────────

jest.mock('../DeviceService', () => ({
  DeviceService: {
    getMacAddress: jest.fn().mockResolvedValue('AA:BB:CC:DD:EE:FF'),
    getDeviceUniqueId: jest.fn().mockResolvedValue('unique-device-001'),
    getDeviceId: jest.fn().mockResolvedValue('sa-test-device'),
    isEmulator: jest.fn().mockResolvedValue(false),
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function mockResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('PaymentService', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    useSettingsStore.setState({
      hasSubscription: false,
      userId: 'uid-test',
      userPhone: '+5491100000000',
      userName: 'Test User',
    });
  });

  describe('checkSubscription', () => {
    it('should return not_registered fallback without deviceId', async () => {
      const result = await PaymentService.checkSubscription('');
      expect(result.status).toBe('not_registered');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should set hasSubscription=true when status is active', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          device_id: 'sa-1',
          status: 'active',
          plan_type: 'monthly',
          expires_at: '2026-09-01T00:00:00',
        })
      );

      const result = await PaymentService.checkSubscription('sa-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/status/sa-1')
      );
      expect(result.status).toBe('active');
      expect(useSettingsStore.getState().hasSubscription).toBe(true);
    });

    it('should keep hasSubscription=false when status is not active', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          device_id: 'sa-1',
          status: 'expired',
          plan_type: 'monthly',
          expires_at: null,
        })
      );

      await PaymentService.checkSubscription('sa-1');

      expect(useSettingsStore.getState().hasSubscription).toBe(false);
    });

    it('should return fallback on network error', async () => {
      mockFetch.mockRejectedValue(new Error('network down'));

      const result = await PaymentService.checkSubscription('sa-1');

      expect(result.status).toBe('not_registered');
      expect(useSettingsStore.getState().hasSubscription).toBe(false);
    });
  });

  describe('registerDevice', () => {
    it('should POST device data and set subscription when active', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ success: true, status: 'active' })
      );

      const status = await PaymentService.registerDevice(
        'sa-1',
        'Test User',
        '+5491100000000'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/register'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.device_id).toBe('sa-1');
      expect(body.mac_address).toBe('AA:BB:CC:DD:EE:FF');
      expect(body.device_unique_id).toBe('unique-device-001');
      expect(status).toBe('active');
      expect(useSettingsStore.getState().hasSubscription).toBe(true);
    });

    it('should return not_registered on HTTP failure', async () => {
      mockFetch.mockResolvedValue(mockResponse({ error: 'boom' }, false, 500));

      const status = await PaymentService.registerDevice(
        'sa-1',
        'Test User',
        '+5491100000000'
      );

      expect(status).toBe('not_registered');
    });

    it('should return not_registered on network error', async () => {
      mockFetch.mockRejectedValue(new Error('timeout'));

      const status = await PaymentService.registerDevice(
        'sa-1',
        'Test User',
        '+5491100000000'
      );

      expect(status).toBe('not_registered');
    });
  });

  describe('confirmPayment', () => {
    it('should POST confirmation and return success', async () => {
      mockFetch.mockResolvedValue(mockResponse({ success: true }));

      const ok = await PaymentService.confirmPayment(
        'sa-1',
        'monthly',
        'mp-ref-123'
      );

      expect(ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/payments/confirm'),
        expect.objectContaining({ method: 'POST' })
      );
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.device_id).toBe('sa-1');
      expect(body.plan_type).toBe('monthly');
      expect(body.mp_reference).toBe('mp-ref-123');
    });

    it('should return false when backend rejects', async () => {
      mockFetch.mockResolvedValue(mockResponse({ error: 'no' }, false, 400));

      const ok = await PaymentService.confirmPayment('sa-1', 'annual');

      expect(ok).toBe(false);
    });
  });

  describe('createTicket', () => {
    it('should POST with internal key and return ticket data', async () => {
      process.env.EXPO_PUBLIC_PA_INTERNAL_KEY = 'clave-interna-test';
      mockFetch.mockResolvedValue(
        mockResponse({
          success: true,
          ticket: {
            ticket_number: 42,
            date: '22/08/2026',
            time: '12:00',
            plan_type: 'monthly',
            amount: 7500,
            contact_email: 'safealert_contacto@manejadatos.com',
          },
        })
      );

      const ticket = await PaymentService.createTicket(
        'sa-1',
        'Test User',
        'monthly',
        7500
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tickets/create'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Internal-Key': 'clave-interna-test',
          }),
        })
      );
      expect(ticket.ticket_number).toBe(42);
      expect(ticket.amount).toBe(7500);
    });

    it('should throw on HTTP error', async () => {
      mockFetch.mockResolvedValue(mockResponse({ error: 'denied' }, false, 401));

      await expect(
        PaymentService.createTicket('sa-1', 'Test User', 'monthly', 7500)
      ).rejects.toThrow(/401/);
    });
  });

  describe('type safety (SubscriptionStatus)', () => {
    it('should accept all valid subscription statuses', () => {
      const statuses: SubscriptionStatus[] = [
        'active',
        'pending',
        'pending_verification',
        'expired',
        'not_registered',
      ];
      expect(statuses).toHaveLength(5);
    });
  });
});
