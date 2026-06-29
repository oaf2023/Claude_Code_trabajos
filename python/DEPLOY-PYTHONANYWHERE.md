# Guía de Actualización — PythonAnywhere

## Conexión rápida

**URL**: https://www.pythonanywhere.com/user/oaf/
**Consola**: Dashboard → Consoles → Bash (o abrir una nueva)

```bash
ssh -o ProxyCommand="ssh oaf@ssh.pythonanywhere.com nc oaf@ssh.pythonanywhere.com 22" oaf@oaf.pythonanywhere.com
```

## Paso 1 — Obtener los últimos cambios

```bash
cd ~/agrupacion_api
git pull origin main
```

Si los archivos están fuera del repo, copiarlos manualmente:
```bash
# Subir flask_app.py y requirements.txt desde local
# Opción A: desde la consola de PA, pegar el contenido
nano flask_app.py   # pegar el contenido actualizado

# Opción B: subir por SCP desde local
scp C:\Claude_Code_trabajos\python\flask_app.py oaf@oaf.pythonanywhere.com:~/agrupacion_api/
scp C:\Claude_Code_trabajos\python\requirements.txt oaf@oaf.pythonanywhere.com:~/agrupacion_api/
```

## Paso 2 — Actualizar dependencias

```bash
cd ~/agrupacion_api
pip install -r requirements.txt --user
```

**Nuevas dependencias** (Fase 0):
- `firebase-admin==6.6.0` — para verificar Firebase ID Tokens en `/api/users/register` y `/api/users/status`

Verificar instalación:
```bash
python -c "import firebase_admin; print(firebase_admin.__version__)"
```

## Paso 3 — Configurar secretos de entorno

Ir a **Dashboard → Web → oaf.pythonanywhere.com → Environment variables**.

Agregar o verificar las siguientes variables:

| Variable | Valor | Propósito |
|----------|-------|-----------|
| `AUDIO_ALERT_API_KEY` | `ad2f4eef8e6d5a73f2d635d0a980569fae3c405d682972c1` | API key para endpoints de audio/tel (rotada) |
| `SAFEALERT_INTERNAL_KEY` | *(generar una)* | Clave interna `/api/payments/confirm` |
| `MP_WEBHOOK_SECRET` | *(de Mercado Pago)* | Firma HMAC webhook MP |
| `FLASK_DEBUG` | `0` | Modo producción (nunca `1`) |
| `FIREBASE_CREDENTIALS_PATH` | *(opcional)* | Ruta a JSON de service account para Firebase Admin |

Luego hacer clic en **Reload oaf.pythonanywhere.com**.

## Paso 4 — Configurar Firebase Admin (nuevo)

Esta versión usa `firebase-admin` para verificar ID Tokens en los endpoints protegidos.

### Opción A: Application Default Credentials (recomendada)

PythonAnywhere expone metadata de Google Cloud si el proyecto está vinculado. La inicialización sin argumentos usará ADC:

```python
firebase_admin.initialize_app()
```

No requiere configuración adicional. Si falla, verificar que el proyecto esté en Google Cloud con facturación.

### Opción B: Service Account JSON (alternativa)

1. Descargar service account JSON desde Firebase Console → Configuración → Cuentas de servicio → "Generar nueva clave privada"
2. Subir el archivo a PythonAnywhere:
   ```bash
   scp firebase-credentials.json oaf@oaf.pythonanywhere.com:~/agrupacion_api/
   ```
3. Agregar variable de entorno:
   - `FIREBASE_CREDENTIALS_PATH` → `/home/oaf/agrupacion_api/firebase-credentials.json`
4. **NUNCA** comitees este JSON al repositorio.

## Paso 5 — Verificar el deploy

```bash
# 1. Health check
curl https://oaf.pythonanywhere.com/api/health

# 2. Probar auth (debería rechazar sin token)
curl -X POST https://oaf.pythonanywhere.com/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"device_id":"test","name":"Test","phone":"+5411111111"}'
# Esperado: {"error": "Token requerido"} — 401

# 3. Ver logs
tail -f /var/log/oaf.pythonanywhere.com.error.log
```

## Paso 6 — Endpoints protegidos con Firebase Auth

| Endpoint | Antes | Ahora |
|----------|-------|-------|
| `POST /api/users/register` | Sin autenticación | Requiere `Authorization: Bearer <Firebase ID Token>` |
| `GET /api/users/status/<id>` | Sin autenticación | Requiere `Authorization: Bearer <Firebase ID Token>` |
| `POST /api/payments/confirm` | `X-Internal-Key` | Sin cambios |
| `POST /api/payments/webhook` | Firma HMAC | Sin cambios |
| `POST /api/security/upload-recording` | `X-API-Key` | Sin cambios |
| `POST /api/tel/*` | `X-API-Key` | Sin cambios |

## Rollback

Si algo sale mal:

1. Ir a **Dashboard → Files → oaf.pythonanywhere.com → Web**
2. Usar la función "Revert to previous version" en la sección "Code"
3. O restaurar el backup de la DB:
   ```bash
   cp /home/oaf/backups/safealert.db.$(date -d yesterday +%Y-%m-%d) /home/oaf/agrupacion_api/usuarios/safealert.db
   ```
4. Hacer **Reload**

## Resumen de cambios en esta versión

- Rotación de `AUDIO_ALERT_API_KEY` (nueva: `ad2f4eef8...`)
- Firebase Auth en endpoints de registro/status de usuarios
- `firebase-admin` agregado a dependencias
- Actualización de `requirements.txt`
