# Guía de Actualización — PythonAnywhere

**URL**: https://www.pythonanywhere.com/user/oaf/
**Consola**: Dashboard → Consoles → Bash (o abrir una nueva)

> **IMPORTANTE (2026-08-01):** PythonAnywhere NO posee sección
> "Environment variables" en la pestaña Web. Las claves se cargan desde un
> archivo `.env` colocado en `/home/oaf/agrupacion_api/.env` (leído por
> `python-dotenv` dentro de `flask_app.py`).

## Paso 1 — Subir los archivos nuevos (backend v3.1 con panel admin)

Subir por la pestaña **Files → /home/oaf/agrupacion_api/** (o SCP):

```bash
scp C:\Claude_Code_trabajos\safealert\backend\flask_app.py      oaf@oaf.pythonanywhere.com:~/agrupacion_api/
scp C:\Claude_Code_trabajos\safealert\backend\requirements.txt  oaf@oaf.pythonanywhere.com:~/agrupacion_api/
scp C:\Claude_Code_trabajos\safealert\backend\.env              oaf@oaf.pythonanywhere.com:~/agrupacion_api/.env
```

> El archivo `.env` es local (ignorado por Git). Si no hay SCP disponible,
> copiar su contenido con **Files → New file → .env → Paste**.

## Paso 2 — Instalar dependencias (Bash console)

```bash
cd ~/agrupacion_api
pip install --user python-dotenv
python -c "import dotenv; print('dotenv OK')"
```

## Paso 3 — Reemplazar el WSGI (CRÍTICO)

El WSGI actual define secretos con placeholders (`TU_SAFEALERT_INTERNAL_KEY`,
`TU_AUDIO_ALERT_API_KEY`, ...) que **pisan** al `.env` (por eso la app móvil
recibe "API Key inválida" y el panel no tiene su clave).

1. Ir a **Dashboard → Web → oaf.pythonanywhere.com → "WSGI configuration file"**
   (enlace que abre el archivo `oaf_pythonanywhere_com_wsgi.py`).
2. Reemplazar **todo el contenido** por el de
   `safealert/backend/wsgi.py` (no define secretos; los carga desde `.env`).
3. Guardar (Save).

## Paso 4 — Verificar el WSGI

El WSGI debe exponer `flask_app` (backend unificado v3.1):

```python
from flask_app import flask_app as application
```

## Paso 5 — Reload y verificar

1. Dashboard → **Web → oaf.pythonanywhere.com → Reload**
2. Health check:

```bash
curl https://oaf.pythonanywhere.com/api/health
```

3. Probar el panel admin (con la clave de `safealert/backend/.env`):

```bash
curl -H "X-Admin-Key: tP4HbmLpkGgsKFhlWQd3cJxjzeO1vX0NfrTIDi6nZBwRa7Vy" \
     https://oaf.pythonanywhere.com/api/v1/admin/stats
# Esperado: 200 con JSON de KPIs (kpis, usuarios_por_plan, ...)
```

4. Ver logs:

```bash
tail -f /var/log/oaf.pythonanywhere.com.error.log
```

## Paso 6 — Entrar al panel admin

- URL del panel: `https://oaf.pythonanywhere.com` (panel desplegado aparte) o local
  `npm run dev` en `safealert/admin`.
- Clave de login: **la de `SAFEALERT_ADMIN_API_KEY` en `safealert/backend/.env`**
  (actual: `tP4HbmLpkGgsKFhlWQd3cJxjzeO1vX0NfrTIDi6nZBwRa7Vy`).
- Páginas: `/` (KPIs), `/usuarios` (búsqueda por MAC), `/pagos-simulados`
  (pago simulado por MAC), `/admin`.

## Variables del `.env`

| Variable | Propósito |
|----------|-----------|
| `SAFEALERT_ADMIN_API_KEY` | Clave del panel admin (header `X-Admin-Key`) |
| `SAFEALERT_INTERNAL_KEY` | Clave interna `/api/payments/confirm` |
| `AUDIO_ALERT_API_KEY` | API key de endpoints de audio/tel (la app móvil usa `ad2f4eef8e6d5a73f2d635d0a980569fae3c405d682972c1`) |
| `MP_WEBHOOK_SECRET` | Firma HMAC webhook MercadoPago |
| `FLASK_DEBUG` | `0` en producción (nunca `1`) |

## Rollback

1. **Files → /home/oaf/agrupacion_api** → restaurar versión anterior de `flask_app.py`.
2. Restaurar DB si hiciera falta:
   ```bash
   cp /home/oaf/backups/safealert.db.$(date -d yesterday +%Y-%m-%d) /home/oaf/agrupacion_api/usuarios/safealert.db
   ```
3. Hacer **Reload**.
