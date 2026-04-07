# Checklist de Publicacion

## Tecnico

- Confirmar que `com.safealert.app` sigue siendo el package oficial.
- Confirmar que `versionCode` aumenta respecto de la build anterior.
- Confirmar que `versionName` representa la release actual.
- Confirmar que el keystore release real esta disponible por variables `MYAPP_RELEASE_*`.
- Ejecutar `npm run typecheck` sin errores.
- Generar el build de produccion Android.
- Copiar el `.aab` final a `Publicar/artefactos/`.

## Cuenta y consola

- Tener acceso a Google Play Console.
- Tener creada la app en Play Console.
- Tener una URL publica de politica de privacidad.
- Tener definidos los testers internos o el grupo de Google.

## Formularios de Google Play

- App access.
- Ads.
- Data safety.
- Content rating.
- Target audience.
- Politica de privacidad.
- Informacion general de la ficha de la app.

## Verificacion antes de enviar

- Revisar notas de release.
- Revisar capturas si Play las exige en la ficha.
- Verificar que los permisos declarados coinciden con el uso real de la app.
- Confirmar que la build se puede instalar en al menos un dispositivo Android fisico.
