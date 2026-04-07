# Publicar SafeAlert

Esta carpeta contiene todo lo necesario para preparar y publicar SafeAlert en Google Play Internal Testing sin mezclar material operativo con el resto del proyecto.

## Contenido

- `scripts/Build-PlayInternalTesting.ps1`: valida el proyecto y genera localmente el AAB Android de produccion con Gradle.
- `scripts/Export-PublicacionBundle.ps1`: recopila datos tecnicos y copia artefactos generados a `artefactos/`.
- `play-console/01_Checklist.md`: checklist de preparacion antes de subir a Play.
- `play-console/02_Tutorial_Paso_A_Paso.md`: tutorial completo de Google Play Internal Testing.
- `play-console/03_Datos_De_La_App.md`: datos tecnicos actuales de SafeAlert.
- `play-console/04_Data_Safety_Base.md`: base para completar el formulario de Data safety.
- `play-console/05_Notas_De_Release.md`: texto base para notas de release.
- `play-console/06_Politica_De_Privacidad_Base.md`: plantilla base de politica de privacidad.
- `play-console/07_Textos_Play_Store.md`: textos iniciales para ficha de Play.
- `artefactos/`: carpeta destino para AAB, metadatos y archivos finales de publicacion.

## Flujo recomendado

1. Ejecutar `pwsh -File .\Publicar\scripts\Initialize-PlayReleaseConfig.ps1`.
2. Completar `Publicar/config/release.env.ps1` con el keystore y passwords reales.
3. Ejecutar `pwsh -File .\Publicar\scripts\Build-PlayInternalTesting.ps1`.
4. Ejecutar `pwsh -File .\Publicar\scripts\Export-PublicacionBundle.ps1`.
5. Tomar el `.aab` y los textos dentro de esta carpeta.
6. Subir el bundle a Google Play Console en `Internal testing`.

## Configuracion local release

- `Publicar/config/release.env.example.ps1`: plantilla versionada.
- `Publicar/config/release.env.ps1`: archivo local ignorado por Git con tus secretos reales.

Tambien podés usar variables de entorno manuales, pero la carpeta `Publicar` ya soporta cargar `release.env.ps1` automaticamente.

## Limitacion real

La carga final a Google Play Console, la aceptacion de formularios legales y la eleccion de testers requieren tu cuenta de Google y no se pueden automatizar desde este workspace sin tus credenciales.
