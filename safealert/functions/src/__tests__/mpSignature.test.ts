/* ============================================================================
* Archivo         : mpSignature.test.ts
* Descripción     : Pruebas unitarias (node:test) del módulo mpSignature
*                   (verificación de firma de webhooks de Mercado Pago).
* Autor           : Equipo SafeAlert
* Fecha           : 2026-09-06
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.3 (Node 20+)
* Uso             : npm run test (compila con tsc y ejecuta node --test)
* ============================================================================ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'crypto';
import {
  VENTANA_FIRMA_MS,
  parsearCabeceraFirma,
  firmaDentroDeVentana,
  firmasIgualesEnTiempoConstante,
  verificarFirmaWebhookMercadoPago,
} from '../mpSignature';

const SECRETO_PRUEBA = 'S3CR3T0-PRUEBA-WEBHOOK-2026';
const AHORA_MS = 1_760_000_000_000; // fecha fija de prueba

function firmar(
  secreto: string,
  dataId: string,
  xRequestId: string,
  ts: string
): string {
  const plantilla = `id:${dataId};request-id:${xRequestId};ts:${ts}`;
  return createHmac('sha256', secreto).update(plantilla, 'utf-8').digest('hex');
}

function tsActualSegundos(): string {
  return String(Math.floor(AHORA_MS / 1000));
}

test('acepta una firma correcta dentro de la ventana', () => {
  const dataId = 'pago-123';
  const rid = 'req-abc';
  const ts = tsActualSegundos();
  const xSignature = `ts=${ts},v1=${firmar(SECRETO_PRUEBA, dataId, rid, ts)}`;
  const r = verificarFirmaWebhookMercadoPago({
    xSignature,
    xRequestId: rid,
    dataId,
    secreto: SECRETO_PRUEBA,
    ahoraMs: AHORA_MS,
  });
  assert.equal(r.valida, true);
  assert.equal(r.motivo, 'ok');
});

test('rechaza cuando el secreto no coincide', () => {
  const dataId = 'pago-123';
  const rid = 'req-abc';
  const ts = tsActualSegundos();
  const xSignature = `ts=${ts},v1=${firmar(SECRETO_PRUEBA, dataId, rid, ts)}`;
  const r = verificarFirmaWebhookMercadoPago({
    xSignature,
    xRequestId: rid,
    dataId,
    secreto: 'OTRO-SECRETO',
    ahoraMs: AHORA_MS,
  });
  assert.equal(r.valida, false);
  assert.equal(r.motivo, 'firma_invalida');
});

test('rechaza una firma manipulada (v1 alterado)', () => {
  const dataId = 'pago-123';
  const rid = 'req-abc';
  const ts = tsActualSegundos();
  const firmaOk = firmar(SECRETO_PRUEBA, dataId, rid, ts);
  const v1Alterado = (firmaOk[0] === 'a' ? 'b' : 'a') + firmaOk.slice(1);
  const xSignature = `ts=${ts},v1=${v1Alterado}`;
  const r = verificarFirmaWebhookMercadoPago({
    xSignature,
    xRequestId: rid,
    dataId,
    secreto: SECRETO_PRUEBA,
    ahoraMs: AHORA_MS,
  });
  assert.equal(r.valida, false);
  assert.equal(r.motivo, 'firma_invalida');
});

test('rechaza un ts fuera de la ventana anti-replay', () => {
  const dataId = 'pago-123';
  const rid = 'req-abc';
  const ts = String(Math.floor((AHORA_MS - VENTANA_FIRMA_MS * 2) / 1000));
  const xSignature = `ts=${ts},v1=${firmar(SECRETO_PRUEBA, dataId, rid, ts)}`;
  const r = verificarFirmaWebhookMercadoPago({
    xSignature,
    xRequestId: rid,
    dataId,
    secreto: SECRETO_PRUEBA,
    ahoraMs: AHORA_MS,
  });
  assert.equal(r.valida, false);
  assert.equal(r.motivo, 'ventana_expirada');
});

test('rechaza cabecera sin ts o sin v1', () => {
  const r = verificarFirmaWebhookMercadoPago({
    xSignature: 'ts=123',
    xRequestId: 'req-abc',
    dataId: 'pago-123',
    secreto: SECRETO_PRUEBA,
    ahoraMs: AHORA_MS,
  });
  assert.equal(r.valida, false);
  assert.equal(r.motivo, 'cabecera_incompleta');
});

test('rechaza cuando faltan x-request-id o data.id', () => {
  const ts = tsActualSegundos();
  const xSignature = `ts=${ts},v1=${firmar(SECRETO_PRUEBA, 'pago-123', 'req-abc', ts)}`;
  const r1 = verificarFirmaWebhookMercadoPago({
    xSignature,
    xRequestId: '',
    dataId: 'pago-123',
    secreto: SECRETO_PRUEBA,
    ahoraMs: AHORA_MS,
  });
  const r2 = verificarFirmaWebhookMercadoPago({
    xSignature,
    xRequestId: 'req-abc',
    dataId: '',
    secreto: SECRETO_PRUEBA,
    ahoraMs: AHORA_MS,
  });
  assert.equal(r1.valida, false);
  assert.equal(r2.valida, false);
  assert.equal(r1.motivo, 'datos_incompletos');
});

test('rechaza cuando no hay secreto configurado', () => {
  const r = verificarFirmaWebhookMercadoPago({
    xSignature: 'ts=1,v1=x',
    xRequestId: 'req-abc',
    dataId: 'pago-123',
    secreto: '',
    ahoraMs: AHORA_MS,
  });
  assert.equal(r.valida, false);
  assert.equal(r.motivo, 'sin_secreto');
});

test('parsearCabeceraFirma descompone ts y v1', () => {
  const partes = parsearCabeceraFirma('ts=1700000000,v1=abc123');
  assert.deepEqual(partes, { ts: '1700000000', v1: 'abc123' });
  assert.equal(parsearCabeceraFirma(''), null);
  assert.equal(parsearCabeceraFirma('solo=valor'), null);
});

test('firmaDentroDeVentana valida el rango', () => {
  const tsOk = String(Math.floor(AHORA_MS / 1000));
  assert.equal(firmaDentroDeVentana(tsOk, AHORA_MS), true);
  assert.equal(firmaDentroDeVentana('no-numerico', AHORA_MS), false);
  assert.equal(
    firmaDentroDeVentana(
      String(Math.floor((AHORA_MS - VENTANA_FIRMA_MS * 3) / 1000)),
      AHORA_MS
    ),
    false
  );
});

test('comparación de firmas en tiempo constante', () => {
  assert.equal(firmasIgualesEnTiempoConstante('a1b2', 'a1b2'), true);
  assert.equal(firmasIgualesEnTiempoConstante('AB12', 'ab12'), true);
  assert.equal(firmasIgualesEnTiempoConstante('a1b2', 'a1b3'), false);
  assert.equal(firmasIgualesEnTiempoConstante('a1b2', 'a1b'), false);
  assert.equal(firmasIgualesEnTiempoConstante('a1b2', 'zz12'), false);
  assert.equal(firmasIgualesEnTiempoConstante('abc', 'abc'), false);
  assert.equal(firmasIgualesEnTiempoConstante('', ''), false);
});
