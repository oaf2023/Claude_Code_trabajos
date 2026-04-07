# Tutorial Paso a Paso - Google Play Internal Testing

## 1. Preparar la build local

1. Abrir una terminal en `safealert`.
2. Inicializar la configuracion local de release:

```powershell
pwsh -File .\Publicar\scripts\Initialize-PlayReleaseConfig.ps1
```

1. Editar `Publicar/config/release.env.ps1` y completar:
   - `MYAPP_RELEASE_STORE_FILE`
   - `MYAPP_RELEASE_STORE_PASSWORD`
   - `MYAPP_RELEASE_KEY_ALIAS`
   - `MYAPP_RELEASE_KEY_PASSWORD`
2. Ejecutar:

```powershell
pwsh -File .\Publicar\scripts\Build-PlayInternalTesting.ps1
```

1. Exportar el paquete de publicacion:

```powershell
pwsh -File .\Publicar\scripts\Export-PublicacionBundle.ps1
```

## 2. Crear o abrir la app en Google Play Console

1. Entrar en Google Play Console.
2. Seleccionar o crear la app `SafeAlert`.
3. Confirmar que el identificador del paquete es `com.safealert.app`.

## 3. Completar los formularios obligatorios

Usar los documentos de esta carpeta como base:

- `03_Datos_De_La_App.md`
- `04_Data_Safety_Base.md`
- `06_Politica_De_Privacidad_Base.md`
- `07_Textos_Play_Store.md`

## 4. Subir la release a Internal Testing

1. Ir a `Testing > Internal testing`.
2. Crear una nueva release.
3. Subir el archivo `.aab` generado en `Publicar/artefactos/app-release.aab`.
4. Pegar las notas de release base de `05_Notas_De_Release.md`.
5. Guardar y revisar advertencias de Play.
6. Publicar la release interna.

## 5. Agregar testers

1. Crear una lista de emails o usar un grupo de Google.
2. Compartir el enlace de opt-in que entregue Play Console.
3. Pedir a cada tester que instale desde Google Play Store.

## 6. Validar la instalacion

1. Confirmar que la app abre correctamente.
2. Confirmar que Firebase inicia.
3. Confirmar permisos de ubicacion, notificaciones, microfono y contactos.
4. Confirmar el flujo SOS principal.

## 7. Subir una nueva version

1. Incrementar `versionCode`.
2. Ajustar `versionName` si corresponde.
3. Regenerar la build.
4. Subir un nuevo `.aab` a la misma pista `Internal testing`.
