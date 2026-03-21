# SafeAlert - Deploy del MVP

## Checklist previo

1. Validar que estén presentes android/app/google-services.json y ios/GoogleService-Info.plist.
2. Ejecutar npm run typecheck en la app.
3. Ejecutar npm run build dentro de functions.
4. Confirmar que las reglas de Firestore y Storage estén listas para producción.
5. Verificar que functions/.env no tenga secretos de ejemplo.

## Comandos base

```bash
cd C:\Claude_Code_trabajos\safealert
firebase login
firebase deploy --only firestore:rules,storage
firebase deploy --only functions
```

## Validaciones después del deploy

```bash
firebase functions:list
firebase functions:log --only sendAlertSMS
```

## Notas operativas

- La app no debe publicitar wake word ni background tracking en esta etapa.
- El botón de llamada es asistido: abre el dialer tras una acción explícita del usuario.
- Si Twilio no está configurado, la Function usa un fallback interno y deja provider, providerMessageId, attempts y lastError en la trazabilidad del documento.

## Secretos requeridos en Functions

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15551234567
```

No documentes tokens reales en este archivo ni en commits.
