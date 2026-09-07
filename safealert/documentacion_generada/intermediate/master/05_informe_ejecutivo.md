# 2. Informe ejecutivo

## 2.1. Qué es la aplicación

**SafeAlert** es una aplicación móvil de **alerta SOS** (Android/iOS + web PWA)
que permite a un usuario avisar automáticamente a sus contactos de confianza
cuando se encuentra en peligro, enviando SMS con su ubicación y, opcionalmente,
un mensaje de voz. La app complementa ese núcleo con un modelo de
**suscripción de pago** (Mercado Pago), un **backend REST** de administración y
telemetría (Flask + SQLite, desplegable en Google Cloud Run), **Cloud Functions
de Firebase** (SMS, pagos, sincronización y purga) y un **panel de
administración web**.

## 2.2. Arquitectura en una frase

Cliente Expo/React Native + Firebase (Auth/Firestore/Storage/Functions) +
backend Flask (con doble despliegue: Cloud Run actual y PythonAnywhere legado)
+ panel admin React/Vite, con pagos Mercado Pago y SMS por Twilio.

## 2.3. Situación actual del proyecto (según el código analizado)

| Dimensión | Estado |
| --- | --- |
| Madurez | MVP/publicable en evolución; versiones en app.json 1.2.0 (raíz) y 1.0.0 (variante iphone) |
| Flujo SOS manual + SMS | Implementado y conectado |
| Alerta por voz | Implementada (react-native-wakeword) pero **solo en primer plano** |
| Alerta con pantalla bloqueada / llamada autónoma | No implementadas (objetivo del producto, aún pendiente) |
| Pagos y prueba gratuita | Implementados; con riesgos de seguridad y de coherencia de estados |
| Backend | Monolito Flask con 27 endpoints; doble canal de datos; esquema duplicado |
| Variante `iphone/` | App "delgada" que reutiliza la app principal mediante reexports |
| Documentación existente | Parcialmente desactualizada respecto del código real |

## 2.4. Fortalezas principales

- Arquitectura clara por capas (UI/estado/servicios) con expo-router y Zustand.
- Separación correcta de secretos de servidor (Secret Manager en Cloud Run,
  variables de entorno de Functions) en la mayoría de los canales de backend.
- SQL del backend 100 % parametrizado (sin inyección SQL detectada).
- Cloud Functions validadas con esquemas Zod para alertas.
- Proceso de publicación a Play Store documentado y automatizado (PowerShell).
- Reglas de Firestore/Storage orientadas a aislar datos por usuario.

## 2.5. Riesgos principales (resumen)

1. **Webhook de Mercado Pago sin verificación de firma** (CRÍTICO).
2. **Secretos incrustados en el binario de la app** (`EXPO_PUBLIC_*`) (ALTO).
3. **Incoherencia entre creación de orden y webhook de pago** que puede dejar
   suscripciones invisibles para el cliente (ALTO).
4. **Simulación/bypass de pagos activable en producción** (ALTO).
5. **Datos personales en claro** (AsyncStorage, SQLite) y **doble canal de
   envío de contactos** a un backend externo (MEDIO/ALTO).
6. **Purga masiva y simulación de pagos administrativos** protegidos solo por
   una clave compartida (ALTO).
7. **Deuda de mantenimiento**: código muerto/legado abundante, esquema SQL
   duplicado y documentación desactualizada (MEDIO).

> La relación detallada y la clasificación por severidad están en el capítulo 6
> y en los anexos A–G.

## 2.6. Alcance de esta documentación

- 253 archivos relevantes inventariados (se excluyen dependencias y artefactos
  generados: ~114.000 archivos en directorios de solo conteo).
- 189 documentos de análisis línea por línea generados (uno por archivo o
  grupo), distribuidos en 18 módulos de análisis y 7 anexos `.docx`.
- Nivel de cobertura objetivo: 100 % de los archivos relevantes.

## 2.7. Lectura recomendada

1. Capítulo 1 (metodología) → 2 (este informe) → 3 (técnico) → 6 (seguridad).
2. Anexo A: núcleo de la app móvil. Anexo C: backend. Anexo D: Cloud
   Functions. Anexo E: panel admin.
