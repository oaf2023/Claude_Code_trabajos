# Comandos para ejecutar en tu terminal

Abrí una terminal en la carpeta del proyecto:
```
cd C:\Claude_Code_trabajos\safealert
```

## Paso 1 — Login Firebase
```
firebase login
```

## Paso 2 — Habilitar servicios en Firebase Console

Antes de hacer deploy, activá estos servicios en https://console.firebase.google.com → proyecto "safealert":

1. **Authentication** → Comenzar → habilitar "Anónimo"
2. **Firestore Database** → Crear base de datos → Modo producción → ubicación: us-central1
3. **Storage** → Comenzar → Modo producción
4. **Functions** → (requiere plan Blaze - pago por uso, con capa gratuita generosa)

## Paso 3 — Deploy de reglas y functions
```
firebase deploy --only firestore:rules,storage
firebase deploy --only functions
```

## Paso 4 — Verificar
```
firebase functions:list
```

---

## Para agregar SMS después (Twilio)

Cuando tengas el Auth Token de Twilio, crear el archivo `functions/.env`:
```
TWILIO_ACCOUNT_SID=tu_account_sid_aqui
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

Y en `functions/src/sendAlertSMS.ts` descomentar el bloque "OPCIÓN 1: Twilio SMS".

Luego: `firebase deploy --only functions`
