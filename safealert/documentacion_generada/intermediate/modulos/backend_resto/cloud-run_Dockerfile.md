# Archivo: cloud-run/Dockerfile

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | `cloud-run/Dockerfile` |
| Líneas totales | 15 |
| Lenguaje | Dockerfile |
| Tamaño (bytes) | ~630 |
| Categoría | Infraestructura / Contenedor |
| Estado detectado | FUNCIONALIDAD EXISTENTE — imagen de despliegue del backend Flask en Cloud Run |
| Nivel de certeza | Confirmado por código |

## Objetivo

Define la imagen Docker que ejecuta la API Flask (`backend/flask_app.py`) en
Google Cloud Run. Es el mecanismo real de despliegue del backend detectado en el
proyecto (el documento `ARQUITECTURA.md` menciona PythonAnywhere, pero el
contenido actual del repositorio apunta a Cloud Run).

## Clasificación y estado

- FUNCIONALIDAD EXISTENTE: es parte del pipeline de despliegue con
  `cloud-run/cloudbuild.yaml`.
- `[OBSERVACIÓN TÉCNICA]`: el `Dockerfile` copia `requirements.txt` y `.` desde
  su propio directorio de contexto; el build debe ejecutarse con contexto
  `backend/` (o copiando el backend), porque `flask_app.py` no está en la raíz
  sino en `backend/`. El `cloudbuild.yaml` usa `.` como contexto, por lo que el
  despliegue real depende de cómo se invoque (p. ej. desde un subdirectorio o
  con `--file`). `[NIVEL DE CERTEZA: Altamente probable]` según el layout del
  repositorio.

## Dependencias e importaciones

| Dependencia | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `python:3.12-slim` | Imagen base externa | Ejecución de Python | Sí — base del runtime |
| `requirements.txt` (backend) | Archivo interno | Instalación de dependencias pip | Sí |
| `gunicorn` | Paquete externo | Servidor WSGI | Sí — debe estar en requirements.txt |
| `flask_app:flask_app` | Módulo interno | Aplicación WSGI | Sí |

## Componentes que dependen de este archivo

- `cloud-run/cloudbuild.yaml`: construye esta imagen y la despliega en Cloud Run.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad |
| --- | --- | --- | --- |
| `FLASK_DEBUG` | `0` | str | Desactiva el modo debug de Flask en producción |
| `PYTHONUNBUFFERED` | `1` | str | Logs de Python sin buffering |

## Análisis línea por línea

```dockerfile
FROM python:3.12-slim
```

**Explicación de la línea 1:** Toma como base la imagen oficial `python:3.12-slim`
(debian ligera con Python 3.12). Slim reduce el tamaño del contenedor.
`[NIVEL DE CERTEZA: Confirmado por código]`

```dockerfile
WORKDIR /app
```

**Explicación de la línea 3:** Establece `/app` como directorio de trabajo dentro
del contenedor; todos los comandos y rutas relativas parten de ahí.

```dockerfile
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
```

**Explicación de las líneas 5–6:** Copia el manifiesto de dependencias Python al
contenedor y ejecuta `pip install` sin caché (imagen más pequeña). Las
dependencias quedan fijadas por las versiones del `requirements.txt` de
`backend/`.

```dockerfile
COPY . .
```

**Explicación de la línea 8:** Copia el contenido del contexto de build (debe
incluir `flask_app.py`, `wsgi.py`, etc.) dentro de `/app`.

```dockerfile
ENV FLASK_DEBUG=0
ENV PYTHONUNBUFFERED=1
```

**Explicación de las líneas 10–11:** Define variables de entorno:
- `FLASK_DEBUG=0`: modo producción (sin recarga ni debugger).
- `PYTHONUNBUFFERED=1`: la salida estándar de Python no se bufferiza, los logs
  llegan en tiempo real a Cloud Logging.

```dockerfile
EXPOSE 8080
```

**Explicación de la línea 13:** Declara el puerto 8080, el que Cloud Run espera
por convención para recibir peticiones HTTP.

```dockerfile
CMD ["gunicorn", "--bind", ":8080", "--workers", "2", "--timeout", "120", "flask_app:flask_app"]
```

**Explicación de la línea 15:** Comando de arranque: ejecuta `gunicorn` (servidor
WSGI) escuchando en `:8080` con 2 workers y timeout de 120 s, cargando el objeto
WSGI `flask_app` del módulo `flask_app`. Los secretos y la ruta de la BD se
inyectan en runtime por Cloud Run (ver `cloudbuild.yaml`).

## Fichas de funciones y métodos

No aplica (no contiene funciones).

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]`: `gunicorn` debe estar incluido en
  `backend/requirements.txt` para que la imagen arranque correctamente.
- `[OBSERVACIÓN TÉCNICA]`: solo 2 workers con `--timeout 120`; operaciones SQL
  pesadas o llamadas lentas podrían agotar workers (`[NIVEL DE CERTEZA:
  Inferido]`).

## Seguridad

- `[INFORMATIVO]`: `FLASK_DEBUG=0` correcto para producción.
- `[INFORMATIVO]`: la imagen no define usuario no-root explícito; se recomienda
  ejecutar con usuario sin privilegios (`[NIVEL DE CERTEZA: Inferido]`,
  recomendación estándar de contenedores).

## Riesgos y recomendaciones (sin modificar código)

1. Verificar que el contexto de build del Dockerfile sea `backend/` para que el
   `COPY . .` funcione (o ajustar rutas).
2. Documentar la cadena completa build → push → deploy (Cloud Build + Artifact
   Registry + Cloud Run).
