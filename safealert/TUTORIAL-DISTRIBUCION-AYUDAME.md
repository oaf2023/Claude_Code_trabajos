# Tutorial de Distribución: Ayudame

## Objetivo

Este tutorial explica cómo tomar la app actual SafeAlert y publicarla con otro nombre comercial: Ayudame.

Incluye:

1. Renombre de la app.
2. Publicación en Google Play Store.
3. Publicación en App Store.
4. Distribución mediante código QR en web.

Está basado en la configuración actual del proyecto Expo en:

1. [app.json](safealert/app.json)
2. [eas.json](safealert/eas.json)
3. [package.json](safealert/package.json)
4. [DEPLOY.md](safealert/DEPLOY.md)

## Punto de partida actual

La app hoy está configurada así:

1. Nombre visible: SafeAlert
2. Slug Expo: safealert
3. Scheme: safealert
4. Android package: com.safealert.app
5. iOS bundle identifier: com.safealert.app

Si quieres publicar Ayudame como una app nueva en las tiendas, no basta con cambiar solo el nombre visible. Debes usar identificadores nuevos para evitar conflictos con la publicación anterior.

## Recomendación de identidad nueva

Usa una identidad separada para Ayudame:

1. Nombre comercial: Ayudame
2. Slug Expo: ayudame
3. Scheme: ayudame
4. Android package: com.ayudame.app
5. iOS bundle identifier: com.ayudame.app

Si quieres mantener SafeAlert y Ayudame como apps distintas, esta separación es obligatoria.

## Paso 1: Renombrar la app en la configuración

Edita [app.json](safealert/app.json) y cambia estos valores:

```json
{
  "expo": {
    "name": "Ayudame",
    "slug": "ayudame",
    "scheme": "ayudame",
    "ios": {
      "bundleIdentifier": "com.ayudame.app"
    },
    "android": {
      "package": "com.ayudame.app"
    }
  }
}
```

### Qué significa cada cambio

1. name: es el nombre visible para el usuario.
2. slug: identifica el proyecto en Expo y conviene alinearlo con la marca.
3. scheme: define deep links; si cambia la marca, conviene cambiarlo también.
4. android.package: debe ser único en Google Play.
5. ios.bundleIdentifier: debe ser único en App Store Connect.

## Paso 2: Preparar Firebase para la nueva app

Como el package Android y el bundle identifier iOS cambiarán, Firebase actual ya no coincide automáticamente con la app nueva.

Debes crear una nueva app Android y una nueva app iOS dentro del mismo proyecto Firebase o en uno nuevo.

### Android

1. Entra a Firebase Console.
2. Agrega una app Android con package name com.ayudame.app.
3. Descarga el nuevo google-services.json.
4. Reemplaza el archivo actual en:
   [google-services.json](safealert/google-services.json)

### iOS

1. Entra a Firebase Console.
2. Agrega una app iOS con bundle identifier com.ayudame.app.
3. Descarga GoogleService-Info.plist.
4. Guárdalo para el build iOS.

Nota importante:

Si mantienes com.safealert.app y solo cambias el nombre visible a Ayudame, puedes reutilizar la configuración actual. Pero eso no crea una app nueva en las tiendas; solo renombra la existente.

## Paso 3: Subir versión y metadatos

Antes de compilar para distribución, incrementa la versión.

En [app.json](safealert/app.json):

1. Aumenta expo.version, por ejemplo de 1.1.0 a 1.2.0.
2. Aumenta android.versionCode a un entero mayor que el anterior.

Ejemplo:

```json
{
  "expo": {
    "version": "1.2.0",
    "android": {
      "versionCode": 3
    }
  }
}
```

Para iOS con EAS, la build también necesitará un build number nuevo cuando hagas submit.

## Paso 4: Validaciones previas

Ejecuta desde la carpeta [safealert](safealert):

```powershell
Set-Location C:/Claude_Code_trabajos/safealert
npm run typecheck
```

Si vas a publicar backend junto con la app, sigue además la guía de [DEPLOY.md](safealert/DEPLOY.md).

## Paso 5: Publicación en Google Play Store

El proyecto ya tiene perfil de build Android configurado en [eas.json](safealert/eas.json):

1. preview: genera APK interna.
2. production: genera AAB para tienda.

### 5.1 Generar build de prueba Android

```powershell
Set-Location C:/Claude_Code_trabajos/safealert
npm run build:android:preview
```

Esto genera una APK útil para compartir por QR o para testers cerrados.

### 5.2 Generar build de tienda Android

```powershell
Set-Location C:/Claude_Code_trabajos/safealert
npm run build:android:production
```

Esto genera un Android App Bundle .aab, que es el formato correcto para Google Play.

### 5.3 Crear la ficha en Google Play Console

1. Entra a Google Play Console.
2. Crea una nueva aplicación llamada Ayudame.
3. Selecciona idioma principal.
4. Completa App access, Data safety, Content rating y Privacy policy.
5. Sube el .aab al track Internal testing.

### 5.4 Publicar en producción

Cuando validaste el track interno:

1. Promueve el release a Closed testing o Production.
2. Espera revisión de Google.

### Checklist Google Play

1. Package name final único: com.ayudame.app.
2. Ícono y nombre Ayudame consistentes.
3. Política de privacidad pública.
4. Capturas de pantalla.
5. Correo de soporte.

## Paso 6: Publicación en App Store

Para App Store necesitas cuenta Apple Developer activa.

### 6.1 Requisitos previos

1. Bundle ID único: com.ayudame.app.
2. Certificados y provisioning gestionados por EAS o Apple.
3. App registrada en App Store Connect.

### 6.2 Crear la app en App Store Connect

1. Entra a App Store Connect.
2. Crea una nueva app llamada Ayudame.
3. Usa el bundle identifier com.ayudame.app.
4. Define SKU y datos comerciales.

### 6.3 Construir la app iOS

Si vas a usar EAS Build, el flujo recomendado es:

```powershell
Set-Location C:/Claude_Code_trabajos/safealert
npx eas build -p ios --profile production
```

Si es la primera vez, EAS te pedirá credenciales Apple y configuración de signing.

### 6.4 Subir a App Store Connect

Puedes usar submit manual o EAS Submit:

```powershell
Set-Location C:/Claude_Code_trabajos/safealert
npx eas submit -p ios --profile production
```

### 6.5 Distribución inicial recomendada en iOS

Antes de ir a App Store pública, usa TestFlight:

1. Sube la build a App Store Connect.
2. Activa Internal Testing o External Testing en TestFlight.
3. Comparte el enlace con testers.

### Checklist App Store

1. Bundle ID final único.
2. Nombre comercial Ayudame aprobado.
3. Privacy policy pública.
4. Screenshots iPhone y, si aplica, iPad.
5. Descripción, keywords y categoría.

## Paso 7: Distribución por código QR en web

Aquí hay dos escenarios distintos.

### Escenario A: QR para instalar Android directamente

Esto funciona bien con APK.

Flujo recomendado:

1. Genera la APK interna:

```powershell
Set-Location C:/Claude_Code_trabajos/safealert
npm run build:android:preview
```

2. Descarga la APK generada por EAS.
3. Súbela a un hosting web seguro con HTTPS.
4. Crea una página web simple con botón y QR.
5. El QR debe apuntar a la URL directa de descarga o a una landing intermedia.

Ejemplo de URL:

```text
https://tudominio.com/ayudame/android/ayudame-v1.2.0.apk
```

### Escenario B: QR hacia tiendas oficiales

Este es el más limpio para producción.

En vez de enlazar un APK o IPA, crea una landing web con dos botones:

1. Google Play
2. App Store

Y un solo QR que apunte a esa landing.

Ejemplo:

```text
https://tudominio.com/ayudame
```

En esa página puedes detectar el dispositivo y redirigir:

1. Android: a Google Play.
2. iPhone/iPad: a App Store.
3. Desktop: mostrar ambas opciones.

### Importante sobre iOS por QR

No es normal distribuir una IPA directamente por QR para usuarios comunes.

En iOS lo correcto es:

1. QR hacia TestFlight, si aún está en pruebas.
2. QR hacia App Store, si ya está publicada.

## Paso 8: Landing web recomendada para el QR

La landing debería incluir:

1. Logo de Ayudame.
2. Botón Descargar en Google Play.
3. Botón Descargar en App Store.
4. Texto corto con versión y requisitos.
5. Un QR visible para compartir desde escritorio.

Estructura mínima:

1. Título: Descarga Ayudame
2. Subtítulo: Alertas rápidas para tu red de confianza
3. Botón Android
4. Botón iPhone
5. Sección de ayuda si la instalación falla

## Paso 9: Flujo recomendado de publicación

### Opción recomendada para lanzar Ayudame como marca nueva

1. Cambiar name, slug, scheme, package y bundle identifier.
2. Crear nuevas apps en Firebase para Android e iOS.
3. Generar APK interna y validarla por QR.
4. Generar AAB y publicarlo en Google Play Internal testing.
5. Generar build iOS y distribuir por TestFlight.
6. Publicar la landing web con QR.
7. Luego pasar a producción en Google Play y App Store.

## Paso 10: Comandos útiles resumidos

### Validación

```powershell
Set-Location C:/Claude_Code_trabajos/safealert
npm run typecheck
```

### Android APK interna

```powershell
Set-Location C:/Claude_Code_trabajos/safealert
npm run build:android:preview
```

### Android tienda

```powershell
Set-Location C:/Claude_Code_trabajos/safealert
npm run build:android:production
```

### iOS tienda/TestFlight

```powershell
Set-Location C:/Claude_Code_trabajos/safealert
npx eas build -p ios --profile production
```

### Submit iOS

```powershell
Set-Location C:/Claude_Code_trabajos/safealert
npx eas submit -p ios --profile production
```

## Errores comunes al renombrar

1. Cambiar solo name y olvidar android.package o ios.bundleIdentifier.
2. Reutilizar google-services.json de SafeAlert con com.ayudame.app.
3. No incrementar versionCode en Android.
4. Publicar QR de APK para iPhone, lo cual no sirve para usuarios finales.
5. Mantener scheme viejo y romper deep links o flujos compartidos.

## Recomendación final

Si Ayudame va a convivir con SafeAlert como producto independiente, publica Ayudame como una app nueva, con package y bundle identifier nuevos.

Si solo quieres cambiar la marca de la app actual, puedes mantener los identificadores actuales y renombrar únicamente el nombre visible, pero eso sustituye la identidad comercial existente en las tiendas.