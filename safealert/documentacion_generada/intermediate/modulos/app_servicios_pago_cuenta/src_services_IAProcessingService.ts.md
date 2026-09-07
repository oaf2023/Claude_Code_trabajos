# Archivo: src/services/IAProcessingService.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/IAProcessingService.ts | 71 | TypeScript 5.9 | 2951 | Orquestación de análisis de IA sobre audios de alerta (simulada) | PARCIALMENTE IMPLEMENTADA (simulación / sin endpoint real) | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Orquestar el análisis de IA de los audios de alerta: transcripción, emoción detectada, puntuación de urgencia, nivel de urgencia, palabras clave, contexto de ruido de fondo y acción recomendada; luego persistir el resultado en el documento Firestore de la alerta (`iaAnalysis`). **Estado real verificado: no realiza ninguna llamada a un endpoint de IA** — simula la respuesta con un `mockAnalysis` fijo tras un retardo de 3 segundos y escribe ese resultado simulado en Firestore. Los comentarios del código indican que en producción debería invocarse una Cloud Function (Gemini/OpenAI o Firebase GenKit) para no saturar el cliente, pero esa integración no está implementada.

## Clasificación y estado

- `PARCIALMENTE IMPLEMENTADA` — el flujo (invocación desde `AlertService`, actualización de Firestore, retorno tipado) existe y se ejecuta, pero el "motor de IA" es un mock duro en el cliente.
- Referencias reales:
  - `src/services/AlertService.ts` (línea 23 import; línea 292 `IAProcessingService.processAlertAudio(userId, alertId, audioUpload.audioUrl).catch(...)` tras subir el audio).
  - `src/services/__tests__/AlertService.test.ts` (líneas 51–52: mock del servicio en tests de AlertService).
- [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `IAAnalysis`, `IAProcessResult` de `../types/IAAnalysis` | interna (tipos) | Tipado de entrada/salida | Sí (solo tipos) |
| `alertsCol` de `../config/firebase` | interna | `alertsCol(userId).doc(alertId).update(...)` | Sí |

No hay dependencias de SDK de IA (Gemini/OpenAI/GenKit) ni de fetch hacia servicios externos en este archivo. [NIVEL DE CERTEZA: Confirmado por código]

## Componentes que dependen de este archivo

- `src/services/AlertService.ts`: dispara el análisis post-upload de audio (fire & forget con `.catch`).
- `src/services/__tests__/AlertService.test.ts`: lo mockea.
- El resultado se consume indirectamente en Firestore (campo `iaAnalysis` del documento de alerta).

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `3000` | ms | number | Retardo simulado de procesamiento | Línea 33 |
| `'¡Ayuda, me están siguiendo!'` | literal | string | Transcripción mock (fija) | Línea 36 |
| `0.95` | 0–1 | number | Puntuación de urgencia mock | Línea 38 |
| `'critical'` | UrgencyLevel | string | Nivel de urgencia mock | Línea 39 |
| Valores del fallo: `urgencyScore: 0`, `'low'`, `[]` | — | — | Análisis vacío en caso de error | Líneas 62–64 |

Todos son valores mock/simulados; ninguno es secreto. [NIVEL DE CERTEZA: Confirmado por código]

## Estructura (funciones / clases / tipos)

- Objeto exportado `IAProcessingService` (líneas 25–70):
  - `processAlertAudio(userId: string, alertId: string, audioUrl: string): Promise<IAProcessResult>` (líneas 26–69).

## Análisis línea por línea

**Bloque 1 (líneas 1–30): cabecera, imports y apertura del método.**

```ts
/* ============================================================================
* Archivo         : IAProcessingService.ts
* Descripción     : Orquestación del análisis de IA mediante APIs asíncronas.
* Autor           : oafon
* Fecha           : 2026-03-21
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : IAProcessingService.processAlertAudio(alertId, audioUri)
* ============================================================================ */

import { IAAnalysis, IAProcessResult } from '../types/IAAnalysis';
import { alertsCol } from '../config/firebase';

/* ============================================================================
* Función         : processAlertAudio
* Descripción     : Envía el audio de una alerta para transcripción y análisis de urgencia.
* Fecha            : 2026-03-21
* Versión          : 1.0.0
* Lenguaje         : TypeScript 5.9
* Conexiones      : AlertService, Firebase AI Functions
* Ingesta          : alertId: string, audioUri: string
* Devolución      : Promise<IAProcessResult>
* Uso             : asíncrono, ideal para segundo plano o post-envío de SMS.
* ============================================================================ */
export const IAProcessingService = {
  async processAlertAudio(userId: string, alertId: string, audioUrl: string): Promise<IAProcessResult> {
    console.log(`[IAProcessingService] Iniciando análisis IA para alerta: ${alertId}`);
    
    // Simulación de llamada a API de IA (ej. Gemini/OpenAI o Firebase GenKit)
    // En producción esto se llamaría mediante una Cloud Function para no saturar el cliente
    try {
```

**Explicación de las líneas 1–30:**
- **Líneas 1–9**: cabecera documental. La descripción ("mediante APIs asíncronas") describe la intención; la implementación real es una simulación (ver líneas 29–30).
- **Líneas 11–12**: importa tipos de análisis y el helper de colección de alertas de Firebase.
- **Líneas 14–24**: cabecera de la función. **Discrepancia documental**: la cabecera indica firma `(alertId, audioUri)` y "Conexiones: Firebase AI Functions", pero la firma real (línea 26) es `(userId, alertId, audioUrl)`. [OBSERVACIÓN TÉCNICA]
- **Línea 25**: apertura del objeto exportado.
- **Línea 26**: firma real con tres parámetros: `userId`, `alertId` y `audioUrl`.
- **Línea 27**: log del inicio del análisis con el id de alerta.
- **Líneas 29–30**: comentarios clave que revelan el estado: la llamada a la API de IA (Gemini/OpenAI/GenKit) está **simulada**; en producción se haría mediante una Cloud Function.
- **Línea 31**: apertura del `try`.

**Bloque 2 (líneas 32–56): simulación, mock y escritura en Firestore.**

```ts
      // 1. Simular delay de procesamiento asíncrono
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockAnalysis: IAAnalysis = {
        transcript: "¡Ayuda, me están siguiendo!",
        detectedEmotion: "Miedo / Ansiedad",
        urgencyScore: 0.95,
        urgencyLevel: 'critical',
        keyKeywords: ["ayuda", "siguiendo"],
        backgroundNoiseContext: "Calle con tráfico",
        recommendedAction: "Notificar a autoridades locales inmediatamente",
        processedAt: Date.now()
      };

      // 2. Actualizar el documento en Firestore con los resultados del análisis
      // La urgencia analizada no debe sobrescribir el estado operativo del envío SOS.
      await alertsCol(userId).doc(alertId).update({
        iaAnalysis: mockAnalysis,
      });

      return {
        alertId,
        analysis: mockAnalysis,
        status: 'success'
      };
    } catch (error) {
```

**Explicación de las líneas 32–56:**
- **Líneas 32–33**: simula el retardo de un procesamiento asíncrono (3 segundos) con `setTimeout`. Bloquea la promesa durante 3 s; al ser invocado con `.catch()` desde `AlertService` sin `await`, no bloquea el envío de la alerta.
- **Líneas 35–44**: construye `mockAnalysis` con contenido fijo: transcripción "¡Ayuda, me están siguiendo!", emoción "Miedo / Ansiedad", `urgencyScore: 0.95`, `urgencyLevel: 'critical'`, keywords `["ayuda","siguiendo"]`, contexto "Calle con tráfico", acción recomendada y `processedAt: Date.now()`.
- **Líneas 46–47**: comentario que advierte que la urgencia analizada no debe sobrescribir el estado operativo del envío SOS (solo actualiza el subcampo `iaAnalysis`).
- **Líneas 48–50**: actualiza en Firestore `alertsCol(userId).doc(alertId)` con `{ iaAnalysis: mockAnalysis }`. La ruta real es `users/{userId}/alerts/{alertId}`.
- **Líneas 52–56**: retorna `IAProcessResult` con `status: 'success'`, el `alertId` y el análisis.
- [OBSERVACIÓN TÉCNICA] `audioUrl` (parámetro) **nunca se usa** dentro del método; no se envía el audio a ningún servicio. El único efecto persistente es escribir el mock en Firestore.

**Bloque 3 (líneas 57–71): manejo de error y cierre.**

```ts
    } catch (error) {
      console.error('[IAProcessingService] Error en análisis IA:', error);
      return {
        alertId,
        analysis: {
          urgencyScore: 0,
          urgencyLevel: 'low',
          keyKeywords: [],
          processedAt: Date.now()
        },
        status: 'failed'
      };
    }
  }
};
```

**Explicación de las líneas 57–71:**
- **Líneas 57–58**: ante cualquier error (p. ej. fallo de red/Firestore), log del error.
- **Líneas 59–67**: retorna un `IAProcessResult` con `status: 'failed'` y un análisis "vacío" (`urgencyScore: 0`, `urgencyLevel: 'low'`, keywords vacías, `processedAt` actual). No incluye `transcript` ni `detectedEmotion` (campos opcionales de `IAAnalysis`).
- **Líneas 68–70**: cierre del catch, del método y del objeto.

## Fichas de funciones y métodos

### processAlertAudio (líneas 26–69)
- Firma: `async processAlertAudio(userId: string, alertId: string, audioUrl: string): Promise<IAProcessResult>`.
- Propósito técnico: orquestar un análisis de IA asíncrono y persistirlo; propósito funcional (deseado): enriquecer la alerta con análisis de urgencia del audio. Estado real: simulación con mock + escritura Firestore.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| userId | string | UID del usuario (se usa para resolver la colección). |
| alertId | string | Id del documento de la alerta. |
| audioUrl | string | URL del audio subido — **no se usa** en la implementación actual. |

- Retorno: `IAProcessResult` (`success` o `failed`; nunca lanza hacia el llamador, aunque sí devuelve `failed`).
- Excepciones: capturadas internamente (el método no rechaza; el `.catch` del llamador en `AlertService` es defensivo).
- Dependencias: `alertsCol`, tipos `IAAnalysis`/`IAProcessResult`, `setTimeout`.
- Flujo interno: log → delay 3 s → construir mock → update Firestore `iaAnalysis` → retornar success; en error, retornar failed con análisis vacío.
- Desde dónde se llama: `AlertService.ts` línea 292 (post-upload de audio; sin `await`).
- Efectos secundarios: escritura en Firestore del documento de la alerta (campo `iaAnalysis`).
- Riesgos: persiste análisis **falsos** en datos de producción si la simulación queda activa; el retardo de 3 s retiene la tarea 3 s (irrelevante al no bloquear); el parámetro `audioUrl` no utilizado puede inducir a error sobre el estado de la integración.

## Clases / interfaces / tipos

- No define tipos propios; utiliza (de `src/types/IAAnalysis.ts`):
  - `IAAnalysis`: `transcript?`, `detectedEmotion?`, `urgencyScore` (0–1), `urgencyLevel` (`low|medium|high|critical`), `keyKeywords[]`, `backgroundNoiseContext?`, `recommendedAction?`, `processedAt`.
  - `IAProcessResult`: `{ alertId, analysis: IAAnalysis, status: 'success' | 'failed' }`.
- [NIVEL DE CERTEZA: Confirmado por código]

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] **No hay endpoint de IA real**: el método no realiza `fetch` ni llama a Cloud Functions; el comentario (líneas 29–30) lo declara simulación ("En producción esto se llamaría mediante una Cloud Function"). El único "envío" es la escritura Firestore del mock. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] El parámetro `audioUrl` no se utiliza en absoluto, pese a que la cabecera dice "Envía el audio de una alerta para transcripción". Si se activara una IA real, el audio debería enviarse a una Cloud Function/endpoint que aún no existe. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] Discrepancia entre la firma documentada en la cabecera (`alertId, audioUri`) y la firma real (`userId, alertId, audioUrl`); el llamador real (`AlertService`) usa la firma correcta. [NIVEL DE CERTEZA: Confirmado por código]
- [RIESGO] Persistencia de datos ficticios en producción: si esta simulación no se reemplaza antes de liberar, los documentos de alerta quedarán con análisis IA inventados (transcripción fija "¡Ayuda...!", urgencia 0.95) que podrían mostrarse al usuario o alimentar reportes. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] El retorno en caso de error (`urgencyLevel: 'low'`) podría interpretarse como "sin urgencia" cuando en realidad hubo un fallo técnico; conviene distinguir "no analizado" de "baja urgencia". [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] No se encontró test propio de `IAProcessingService` (solo se mockea en `AlertService.test.ts`). [NIVEL DE CERTEZA: Confirmado por código]

## Seguridad

- [MEDIO] Riesgo de integridad de datos: los campos `iaAnalysis` de Firestore se escriben desde el cliente con datos no verificados por backend; si se sustituyera el mock por un cliente de IA embebido, la credencial de IA quedaría en el bundle. La arquitectura recomendada (Cloud Function) evita ambos problemas. [NIVEL DE CERTEZA: Confirmado por código]
- [INFORMATIVO] No se manejan secretos ni tokens en este archivo; no hay logs de contenido de audio. El log (línea 27) solo incluye el id de alerta. [NIVEL DE CERTEZA: Confirmado por código]
- [INFORMATIVO] Si en el futuro se procesara audio real, el audio (dato personal potencialmente sensible) debería tratarse conforme al marco de privacidad (RGPD/DAMMA) y no persistirse transcripciones sin consentimiento explícito. [NIVEL DE CERTEZA: Inferido]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Reemplazar la simulación por una Cloud Function (`onCall`) que reciba el audio (o su referencia de Storage), ejecute la IA server-side y escriba el resultado; retirar el mock antes de producción. [RECOMENDACIÓN]
- [RIESGO] Eliminar o anotar el parámetro `audioUrl` no usado y corregir la cabecera documental para reflejar la firma real. [RECOMENDACIÓN]
- [INFORMATIVO] Introducir un estado explícito "análisis pendiente/fallido" distinto de `urgencyLevel: 'low'` para no confundir fallo con baja urgencia. [RECOMENDACIÓN]
- [INFORMATIVO] Añadir tests unitarios propios con el patrón de mocks del proyecto (fetch/Firestore mockeados). [RECOMENDACIÓN]
