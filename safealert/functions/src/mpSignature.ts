/* ============================================================================
* Archivo         : mpSignature.ts
* Descripción     : Utilidades de verificación de firma de webhooks de Mercado
*                   Pago (cabecera x-signature) para Cloud Functions.
*                   Replica el algoritmo de backend/flask_app.py
*                   (verify_mp_signature): HMAC-SHA256 sobre la plantilla
*                   "id:<dataId>;request-id:<xRequestId>;ts:<ts>" usando el
*                   secreto MP_WEBHOOK_SECRET.
* Autor           : oafon / Equipo SafeAlert
* Fecha           : 2026-09-06
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.3 (Node 20)
* Uso             : import { verificarFirmaWebhookMercadoPago } from './mpSignature';
* ============================================================================ */

import { createHmac, timingSafeEqual } from 'crypto';

/** Ventana de validez del timestamp de la firma (anti-replay): 5 minutos. */
export const VENTANA_FIRMA_MS = 5 * 60 * 1000;

/* ============================================================================
* Función         : parsearCabeceraFirma
* Descripción     : Descompone la cabecera x-signature "ts=...,v1=..." en sus
*                   partes. Devuelve null si falta ts o v1.
* Fecha           : 2026-09-06
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.3
* Conexiones      : verificarFirmaWebhookMercadoPago
* Ingesta         : xSignature: string (valor de la cabecera x-signature)
* Devolución      : { ts: string; v1: string } | null
* Uso             : const partes = parsearCabeceraFirma(xSignature);
* ============================================================================ */
export function parsearCabeceraFirma(
  xSignature: string
): { ts: string; v1: string } | null {
  if (!xSignature || typeof xSignature !== 'string') {
    return null;
  }
  const partes: Record<string, string> = {};
  for (const item of xSignature.split(',')) {
    const idx = item.indexOf('=');
    if (idx > 0) {
      partes[item.slice(0, idx).trim()] = item.slice(idx + 1).trim();
    }
  }
  const ts = partes['ts'] ?? '';
  const v1 = partes['v1'] ?? '';
  if (!ts || !v1) {
    return null;
  }
  return { ts, v1 };
}

/* ============================================================================
* Función         : firmaDentroDeVentana
* Descripción     : Verifica que el timestamp ts (segundos) de la firma esté
*                   dentro de la ventana configurable (anti-replay).
* Fecha           : 2026-09-06
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.3
* Conexiones      : verificarFirmaWebhookMercadoPago
* Ingesta         : ts: string; ahoraMs?: number; ventanaMs?: number
* Devolución      : boolean
* Uso             : const ok = firmaDentroDeVentana(ts, Date.now());
* ============================================================================ */
export function firmaDentroDeVentana(
  ts: string,
  ahoraMs: number = Date.now(),
  ventanaMs: number = VENTANA_FIRMA_MS
): boolean {
  const tsMs = Number(ts) * 1000;
  if (!Number.isFinite(tsMs) || tsMs <= 0) {
    return false;
  }
  return Math.abs(ahoraMs - tsMs) <= ventanaMs;
}

/* ============================================================================
* Función         : firmasIgualesEnTiempoConstante
* Descripción     : Compara dos firmas hex en tiempo constante para evitar
*                   ataques de temporización.
* Fecha           : 2026-09-06
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.3
* Conexiones      : verificarFirmaWebhookMercadoPago
* Ingesta         : esperada: string; recibida: string
* Devolución      : boolean
* Uso             : const ok = firmasIgualesEnTiempoConstante(a, b);
* ============================================================================ */
export function firmasIgualesEnTiempoConstante(
  esperada: string,
  recibida: string
): boolean {
  if (
    typeof esperada !== 'string' ||
    typeof recibida !== 'string' ||
    esperada.length === 0 ||
    esperada.length !== recibida.length ||
    esperada.length % 2 !== 0 ||
    !/^[0-9a-fA-F]+$/.test(esperada) ||
    !/^[0-9a-fA-F]+$/.test(recibida)
  ) {
    return false;
  }
  const a = Buffer.from(esperada.toLowerCase(), 'hex');
  const b = Buffer.from(recibida.toLowerCase(), 'hex');
  if (a.length === 0 || a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

/* ============================================================================
* Función         : verificarFirmaWebhookMercadoPago
* Descripción     : Valida la firma x-signature de un webhook de Mercado Pago.
*                   Rechaza si: no hay secreto, faltan cabeceras/datos, la
*                   firma no coincide (tiempo constante) o el ts está fuera de
*                   la ventana anti-replay.
* Fecha           : 2026-09-06
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.3
* Conexiones      : parsearCabeceraFirma, firmaDentroDeVentana,
*                   firmasIgualesEnTiempoConstante
* Ingesta         : { xSignature, xRequestId, dataId, secreto, ahoraMs?,
*                     ventanaMs? }
* Devolución      : { valida: boolean; motivo: string }
*                   motivos: 'ok' | 'sin_secreto' | 'datos_incompletos' |
*                   'cabecera_incompleta' | 'firma_invalida' | 'ventana_expirada'
* Uso             : const r = verificarFirmaWebhookMercadoPago(opts);
* ============================================================================ */
export interface OpcionesVerificacionFirma {
  xSignature: string;
  xRequestId: string;
  dataId: string;
  secreto: string;
  ahoraMs?: number;
  ventanaMs?: number;
}

export function verificarFirmaWebhookMercadoPago(
  opciones: OpcionesVerificacionFirma
): { valida: boolean; motivo: string } {
  const { xSignature, xRequestId, dataId, secreto } = opciones;

  if (!secreto) {
    return { valida: false, motivo: 'sin_secreto' };
  }
  if (!xRequestId || !dataId) {
    return { valida: false, motivo: 'datos_incompletos' };
  }
  const partes = parsearCabeceraFirma(xSignature);
  if (!partes) {
    return { valida: false, motivo: 'cabecera_incompleta' };
  }
  if (!firmaDentroDeVentana(
    partes.ts,
    opciones.ahoraMs ?? Date.now(),
    opciones.ventanaMs ?? VENTANA_FIRMA_MS
  )) {
    return { valida: false, motivo: 'ventana_expirada' };
  }

  // Plantilla idéntica a backend/flask_app.py::verify_mp_signature
  const plantilla = `id:${dataId};request-id:${xRequestId};ts:${partes.ts}`;
  const esperada = createHmac('sha256', secreto)
    .update(plantilla, 'utf-8')
    .digest('hex');

  if (!firmasIgualesEnTiempoConstante(esperada, partes.v1)) {
    return { valida: false, motivo: 'firma_invalida' };
  }
  return { valida: true, motivo: 'ok' };
}
