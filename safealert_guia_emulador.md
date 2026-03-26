# Guía de Ejecución: Modo Prueba (Emulador Android)

Como **Tecnólogo Creativo Senior**, he preparado estos pasos precisos para que puedas validar SafeAlert en tu entorno de desarrollo.

## 1. Requisitos Previos

- Tener el **Android Emulator** abierto y funcionando.
- Tener instalado **Node.js** y el CLI de **Expo**.

## 2. Configuración de Credenciales

Asegúrate de tener el archivo `.env` en la raíz con:

```env
EXPO_PUBLIC_DAVOICE_SDK_KEY=tu_clave_de_davoice
```

*(Puedes obtener una clave gratuita en [DaVoice.io](https://davoice.io/))*.

## 3. Preparación del Entorno

Ejecuta los siguientes comandos en tu terminal dentro de la carpeta `safealert`:

```bash
# 1. Instalar dependencias si no lo hiciste
npm install

# 2. Preparar los módulos nativos (Crítico para Wake Word y Linking)
npx expo prebuild

# 3. Iniciar la aplicación en el emulador de Android
npx expo run:android
```

## 4. Pasos para la Prueba E2E

Una vez que la aplicación cargue en el emulador:

1. **Onboarding**: Completa tu nombre y teléfono (puedes usar datos ficticios para la prueba).
2. **Permisos**: Acepta todos los permisos (Micrófono, Ubicación y Notificaciones).
3. **Contactos**: Ve a la pestaña de **Contactos** y agrega uno de prueba. Asegúrate de activarlo con el switch.
4. **Modo Guardia**: En la pantalla de **Inicio**, presiona el botón central para **ACTIVAR GUARDIA**.
5. **Detección**:
   - Como el emulador a veces tiene problemas con el micrófono, usa el botón **TEST ALERTA** en la parte inferior.
   - Si el micrófono funciona, intenta decir "Ayuda" (asegúrate de que el emulador tenga acceso al micrófono del PC).
6. **Verificación de Alerta**:
   - Como estamos en fase de prueba, la palabra de activación temporal es: **"Step Back"** (provista por el modelo `step_back.onnx`).
   - Di claramente "Step Back" cerca del micrófono.
   - Verás un contador regresivo de 3 segundos (configurable en Ajustes).
   - Pasados los 3 segundos, la app intentará abrir el discador telefónico con el número de tu contacto.
   - En consola (Logs) verás que se intentó enviar el SMS y subir el audio.

---

*Nota: Para ver los logs en tiempo real mientras pruebas, mantén abierta la terminal donde ejecutaste `npx expo run:android`.*
