# Archivo: cloud-run/cloudbuild.yaml

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | `cloud-run/cloudbuild.yaml` |
| Líneas totales | 43 |
| Lenguaje | YAML (Google Cloud Build) |
| Tamaño (bytes) | ~1.100 |
| Categoría | Infraestructura / CI-CD despliegue |
| Estado detectado | FUNCIONALIDAD EXISTENTE — pipeline de despliegue del backend a Cloud Run |
| Nivel de certeza | Confirmado por código |

## Objetivo

Pipeline de Google Cloud Build que construye la imagen Docker del backend Flask,
la sube a Artifact Registry y la despliega como servicio **Cloud Run**
(`safealert-backend`) inyectando secretos desde Secret Manager.

## Clasificación y estado

- FUNCIONALIDAD EXISTENTE: archivo de despliegue real del backend.
- `[OBSERVACIÓN TÉCNICA]`: `--allow-unauthenticated` expone el servicio sin
  autenticación de IAM; la protección queda delegada a las API keys internas
  (`X-API-Key`/secretos). `[NIVEL DE CERTEZA: Confirmado por código]`

## Dependencias e importaciones

| Dependencia | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `gcr.io/cloud-builders/docker` | Imagen de Cloud Build | build y push | Sí |
| `gcr.io/google.com/cloudsdktool/cloud-sdk` | Imagen de Cloud Build | comando `gcloud run deploy` | Sí |
| Secret Manager (`safealert-*-key`, etc.) | Servicio GCP | secretos de runtime | Sí |

## Componentes que dependen de este archivo

- `cloud-run/Dockerfile` (imagen que se construye).
- Backend `backend/flask_app.py` y `backend/requirements.txt` (contenido de la
  imagen).
- Variables de sustitución `${_REGION}` y `${PROJECT_ID}`.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad |
| --- | --- | --- | --- |
| `_REGION` | `us-central1` | str (sustitución) | Región de despliegue |
| `PROJECT_ID` | (inyectado por Cloud Build) | str | Proyecto GCP |
| `SHORT_SHA` | (inyectado por Cloud Build) | str | Commit corto; etiqueta de imagen |
| `SAFEALERT_INTERNAL_KEY` | `[SECRETO OCULTO]` | str | Clave interna (Secret Manager) |
| `AUDIO_ALERT_API_KEY` | `[SECRETO OCULTO]` | str | Clave API de alertas de audio |
| `MP_WEBHOOK_SECRET` | `[SECRETO OCULTO]` | str | Secreto de firma webhook Mercado Pago |
| `SAFEALERT_DB_PATH` | `[SECRETO OCULTO]` | str | Ruta/DSN de la base de datos |

## Análisis línea por línea

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - '${_REGION}-docker.pkg.dev/${PROJECT_ID}/safealert/backend:${SHORT_SHA}'
      - '.'
```

**Explicación de las líneas 1–7:** Primer paso: construye la imagen Docker con
etiqueta `{region}-docker.pkg.dev/{proyecto}/safealert/backend:{commit}` usando
el contexto `.` (directorio actual de ejecución del build). La ruta del
repositorio de artefactos es `safealert/backend`.

```yaml
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - '${_REGION}-docker.pkg.dev/${PROJECT_ID}/safealert/backend:${SHORT_SHA}'
```

**Explicación de las líneas 9–12:** Segundo paso: sube la imagen al Artifact
Registry del proyecto.

```yaml
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'safealert-backend'
      - '--image=${_REGION}-docker.pkg.dev/${PROJECT_ID}/safealert/backend:${SHORT_SHA}'
      - '--region=${_REGION}'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--min-instances=0'
      - '--max-instances=10'
      - '--concurrency=8'
      - '--cpu=1'
      - '--memory=512Mi'
```

**Explicación de las líneas 14–28:** Tercer paso: despliega el servicio
`safealert-backend` en Cloud Run (plataforma gestionada) en `us-central1`:
- `--allow-unauthenticated`: permite invocaciones sin credenciales de IAM
  (relevante porque los clientes móviles/admin llaman directamente con API key).
- Autoescalado `min 0 / max 10` instancias; `concurrency 8` peticiones por
  instancia; `cpu 1` y `memory 512Mi`.

```yaml
      - '--set-secrets=SAFEALERT_INTERNAL_KEY=safealert-internal-key:latest'
      - '--set-secrets=AUDIO_ALERT_API_KEY=safealert-audio-key:latest'
      - '--set-secrets=MP_WEBHOOK_SECRET=safealert-mp-secret:latest'
      - '--set-secrets=SAFEALERT_DB_PATH=safealert-db-path:latest'
      - '--set-env-vars=FLASK_DEBUG=0'
      - '--timeout=300'
```

**Explicación de las líneas 29–34:** Inyecta 4 secretos desde Secret Manager
(versión `latest`) como variables de entorno del contenedor y define
`FLASK_DEBUG=0`. Los valores de los secretos no se muestran por seguridad.
`--timeout=300` fija el tiempo máximo de una petición en 300 s.

```yaml
substitutions:
  _REGION: us-central1

options:
  machineType: 'E2_HIGHCPU_8'
  logging: CLOUD_LOGGING_ONLY

timeout: 600s
```

**Explicación de las líneas 36–43:** Configuración del build:
- `substitutions._REGION = us-central1` (por defecto, sobrescribible).
- `options.machineType = E2_HIGHCPU_8`: máquina de build potente.
- `logging: CLOUD_LOGGING_ONLY`: los logs van a Cloud Logging.
- `timeout: 600s`: límite total del pipeline (10 min).

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]`: los nombres de secretos (p. ej. `safealert-db-path`)
  sugieren que la cadena de conexión de la BD vive en Secret Manager y no en el
  repositorio (`[NIVEL DE CERTEZA: Altamente probable]`).
- `[OBSERVACIÓN TÉCNICA]`: la imagen se referencia por `SHORT_SHA` (inmutable y
  trazable por commit).

## Seguridad

- `[INFORMATIVO]`: uso correcto de Secret Manager (no hay secretos en el yaml).
- `[MEDIO]`: `--allow-unauthenticated` + protección solo por cabecera `X-API-Key`
  / claves internas: si una clave se filtra o falta validación de origen, el
  endpoint queda accesible públicamente. `[NIVEL DE CERTEZA: Confirmado por
  código]`
- `[INFORMATIVO]`: sin WAF/Cloudflare delante del backend en esta configuración.

## Riesgos y recomendaciones (sin modificar código)

1. Considerar autenticación adicional (IAM o API gateway) si los endpoints
   internos no requieren acceso público.
2. Fijar `max-instances` razonable y monitorizar coste/uso.
3. Documentar el disparo del pipeline (Cloud Build trigger por rama/tag).
