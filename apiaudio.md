# =============================================================================

# Nombre: app.py

# Fecha: 2026-03-30

# Utilidad: API Flask V2 para recibir audio, transcribirlo, normalizar texto,

# separar palabras y detectar términos de alerta mediante coincidencia

# exacta y difusa, devolviendo una salida lista para comparación desde

# cualquier aplicación cliente.

# API / Función: Flask + faster-whisper + RapidFuzz

# Descripción de uso:

# - Expone:

# GET  /api/audio/health

# POST /api/audio/detectar-alerta

# POST /api/audio/transcribir   (alias operativo)

# - Recibe un archivo por multipart/form-data en el campo "archivo".

# - Transcribe el audio.

# - Normaliza el texto (minúsculas, sin tildes, sin puntuación).

# - Separa y expande palabras comparables.

# - Detecta coincidencias exactas y difusas contra keywords de alerta.

# Ejemplo de llamada:

# POST https://oaf.pythonanywhere.com/api/audio/detectar-alerta

# Headers:

# X-API-Key: tu_clave_privada

# Form-Data:

# archivo   = audio.mp3

# language  = es

# threshold = 82

# Ejemplo de devolución:

# {

# "ok": true,

# "texto_crudo": "Ayúdame por favor",

# "texto_normalizado": "ayudame por favor",

# "palabras_separadas": ["ayudame", "por", "favor"],

# "palabras_comparables": ["ayudame", "ayuda", "por", "favor"],

# "coincidencias_exactas": ["ayudame", "ayuda"],

# "coincidencias_difusas": [],

# "alerta_detectada": true

# }

# Conexión a API externa:

# - No. El procesamiento es local en el servidor.

# Concurrencia:

# - Si Python > 3.13, utiliza ThreadPoolExecutor preparado para concurrencia.

# - Si Python <= 3.13, ejecuta en flujo normal.

# =============================================================================

from __future__ import annotations

import os
import re
import sys
import tempfile
import threading
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

from flask import Flask, current_app, jsonify, request
from flask_cors import CORS
from rapidfuzz import fuzz
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.utils import secure_filename

try:
    from faster_whisper import WhisperModel
except ImportError as exc:
    raise RuntimeError(
        "No se encontró 'faster-whisper'. Instalar con: pip install faster-whisper"
    ) from exc

# -----------------------------------------------------------------------------

# Configuración general

# -----------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
TMP_DIR_BASE = BASE_DIR / "_tmp_audio"
TMP_DIR_BASE.mkdir(parents=True, exist_ok=True)

API_PUBLIC_BASE = "https://oaf.pythonanywhere.com"

WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "small")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
MAX_AUDIO_FILE_SIZE_MB = int(os.getenv("MAX_AUDIO_FILE_SIZE_MB", "20"))
API_ACCESS_KEY = os.getenv("API_ACCESS_KEY", "").strip()
CORS_ALLOW_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "*")
FUZZY_THRESHOLD_DEFAULT = int(os.getenv("FUZZY_THRESHOLD_DEFAULT", "82"))

ALLOWED_EXTENSIONS = {
    ".mp3", ".wav", ".m4a", ".ogg", ".opus", ".flac",
    ".aac", ".mp4", ".mpeg", ".mpga", ".webm"
}

KEYWORDS_ALERTA_DEFAULT = [
    "ayuda",
    "ayudame",
    "auxilio",
    "socorro",
    "emergencia",
    "salvame",
    "rescate",
    "urgente",
    "peligro",
]

PYTHON_VERSION = (sys.version_info.major, sys.version_info.minor)
MODO_CONCURRENTE_HABILITADO = PYTHON_VERSION > (3, 13)
MAX_WORKERS_TRANSCRIPCION = 2 if (MODO_CONCURRENTE_HABILITADO and WHISPER_DEVICE == "cpu") else 1

_executor = ThreadPoolExecutor(max_workers=MAX_WORKERS_TRANSCRIPCION) if MODO_CONCURRENTE_HABILITADO else None
_thread_local = threading.local()
_model_init_lock = threading.Lock()

# -----------------------------------------------------------------------------

# App Flask

# -----------------------------------------------------------------------------

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": CORS_ALLOW_ORIGINS
        }
    }
)

# -----------------------------------------------------------------------------

# Utilidades generales

# -----------------------------------------------------------------------------

def _respuesta_error(detail: str, status_code: int = 400):
    return jsonify({"ok": False, "detail": detail}), status_code

def _to_int(value: str | None, default: int) -> int:
    if value is None or not str(value).strip():
        return default
    return int(str(value).strip())

def _clamp_int(value: int, minimum: int, maximum: int) -> int:
    return max(minimum, min(value, maximum))

def _validar_api_key() -> tuple[bool, tuple[Any, int] | None]:
    if not API_ACCESS_KEY:
        return True, None

    api_key_recibida = request.headers.get("X-API-Key", "").strip()
    if api_key_recibida != API_ACCESS_KEY:
        return False, _respuesta_error("No autorizado. API Key inválida o ausente.", 401)

    return True, None

def _validar_extension(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Extensión no soportada: {suffix}. Permitidas: {sorted(ALLOWED_EXTENSIONS)}"
        )
    return suffix

def _parse_keywords(raw_keywords: str | None) -> list[str]:
    if not raw_keywords or not raw_keywords.strip():
        return KEYWORDS_ALERTA_DEFAULT.copy()

    parts = [p.strip() for p in raw_keywords.split(",")]
    parts = [p for p in parts if p]
    return parts if parts else KEYWORDS_ALERTA_DEFAULT.copy()

# -----------------------------------------------------------------------------

# Normalización de texto

# -----------------------------------------------------------------------------

def _quitar_tildes(texto: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", texto)
        if unicodedata.category(c) != "Mn"
    )

def _normalizar_texto(texto: str) -> str:
    texto = texto.lower().strip()
    texto = _quitar_tildes(texto)
    texto = re.sub(r"[^a-z0-9\s]", " ", texto)
    texto = re.sub(r"\s+", " ", texto).strip()
    return texto

def _separar_palabras(texto_normalizado: str) -> list[str]:
    if not texto_normalizado:
        return []
    return [p for p in texto_normalizado.split(" ") if p]

def _unicos_en_orden(items: list[str]) -> list[str]:
    vistos: set[str] = set()
    salida: list[str] = []

    for item in items:
        if item not in vistos:
            vistos.add(item)
            salida.append(item)

    return salida

def _expandir_variantes(tokens: list[str]) -> list[str]:
    """
    Genera palabras comparables para aumentar la tasa de detección.
    Ejemplos:
      ayudame -> ayuda
      auxiliame -> auxilio
      socorreme -> socorro
      urgenteee -> urgente (por fuzzy también entra)
    """
    salida: list[str] = []

    for token in tokens:
        salida.append(token)

        if token.startswith("ayud"):
            salida.append("ayuda")
            if token != "ayudame":
                salida.append("ayudame")

        if token.startswith("auxili"):
            salida.append("auxilio")

        if token.startswith("socorr"):
            salida.append("socorro")

        if token.startswith("emergen"):
            salida.append("emergencia")

        if token.startswith("salva"):
            salida.append("salvame")

        if token.startswith("resc"):
            salida.append("rescate")

        if token.startswith("urgen"):
            salida.append("urgente")

        if token.startswith("pelig"):
            salida.append("peligro")

    return _unicos_en_orden(salida)

# -----------------------------------------------------------------------------

# Detección exacta y difusa

# -----------------------------------------------------------------------------

def _coincidencias_exactas(tokens: list[str], keywords: list[str]) -> list[str]:
    keywords_norm = {_normalizar_texto(k) for k in keywords}
    exactas = [t for t in tokens if t in keywords_norm]
    return _unicos_en_orden(exactas)

def _mejor_match_difuso(token: str, keywords: list[str]) -> dict[str, Any] | None:
    mejor_keyword = None
    mejor_score = -1

    for kw in keywords:
        kw_norm = _normalizar_texto(kw)

        ratio_1 = fuzz.ratio(token, kw_norm)
        ratio_2 = fuzz.partial_ratio(token, kw_norm)
        ratio_3 = fuzz.WRatio(token, kw_norm)

        score = max(ratio_1, ratio_2, ratio_3)

        if score > mejor_score:
            mejor_score = score
            mejor_keyword = kw_norm

    if mejor_keyword is None:
        return None

    return {
        "token": token,
        "keyword": mejor_keyword,
        "score": int(mejor_score),
    }

def _coincidencias_difusas(
    tokens: list[str],
    keywords: list[str],
    threshold: int,
    exactas: list[str],
) -> list[dict[str, Any]]:
    salida: list[dict[str, Any]] = []
    ya_vistas: set[tuple[str, str]] = set()

    exactas_set = set(exactas)

    for token in tokens:
        if token in exactas_set:
            continue

        mejor = _mejor_match_difuso(token, keywords)
        if not mejor:
            continue

        if mejor["score"] >= threshold:
            clave = (mejor["token"], mejor["keyword"])
            if clave not in ya_vistas:
                ya_vistas.add(clave)
                salida.append(mejor)

    salida.sort(key=lambda x: x["score"], reverse=True)
    return salida

# -----------------------------------------------------------------------------

# Whisper

# -----------------------------------------------------------------------------

def _obtener_modelo_whisper() -> WhisperModel:
    model = getattr(_thread_local, "whisper_model", None)

    if model is None:
        with _model_init_lock:
            model = getattr(_thread_local, "whisper_model", None)
            if model is None:
                model = WhisperModel(
                    WHISPER_MODEL_SIZE,
                    device=WHISPER_DEVICE,
                    compute_type=WHISPER_COMPUTE_TYPE,
                )
                _thread_local.whisper_model = model

    return model

def _transcribir_sync(
    audio_path: Path,
    *,
    language: str | None,
    beam_size: int,
) -> dict[str, Any]:
    model = _obtener_modelo_whisper()

    segments_generator, info = model.transcribe(
        str(audio_path),
        language=language,
        task="transcribe",
        beam_size=beam_size,
        vad_filter=True,
        word_timestamps=False,
    )

    segmentos: list[dict[str, Any]] = []
    texto_partes: list[str] = []

    for segment in segments_generator:
        texto_segmento = (segment.text or "").strip()

        if texto_segmento:
            texto_partes.append(texto_segmento)

        segmentos.append({
            "inicio": round(float(segment.start), 3),
            "fin": round(float(segment.end), 3),
            "texto": texto_segmento,
        })

    return {
        "idioma_detectado": getattr(info, "language", None),
        "probabilidad_idioma": round(float(getattr(info, "language_probability", 0.0)), 5)
        if getattr(info, "language_probability", None) is not None else None,
        "duracion_segundos": round(float(getattr(info, "duration", 0.0)), 3)
        if getattr(info, "duration", None) is not None else None,
        "texto_crudo": " ".join(texto_partes).strip(),
        "segmentos": segmentos,
    }

def _transcribir(audio_path: Path, *, language: str | None, beam_size: int) -> dict[str, Any]:
    if MODO_CONCURRENTE_HABILITADO and _executor is not None:
        future = _executor.submit(
            _transcribir_sync,
            audio_path,
            language=language,
            beam_size=beam_size,
        )
        return future.result()

    return _transcribir_sync(
        audio_path,
        language=language,
        beam_size=beam_size,
    )

# -----------------------------------------------------------------------------

# Endpoints

# -----------------------------------------------------------------------------

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "ok": True,
        "mensaje": "API operativa",
        "health": f"{API_PUBLIC_BASE}/api/audio/health",
        "detectar_alerta": f"{API_PUBLIC_BASE}/api/audio/detectar-alerta",
        "transcribir_alias": f"{API_PUBLIC_BASE}/api/audio/transcribir",
    })

@app.route("/api/audio/health", methods=["GET"])
def healthcheck():
    autorizado, error_response = _validar_api_key()
    if not autorizado:
        return error_response

    return jsonify({
        "ok": True,
        "servicio": "transcripcion_alerta_v2",
        "public_base": API_PUBLIC_BASE,
        "endpoint_principal": f"{API_PUBLIC_BASE}/api/audio/detectar-alerta",
        "endpoint_alias": f"{API_PUBLIC_BASE}/api/audio/transcribir",
        "modelo": WHISPER_MODEL_SIZE,
        "device": WHISPER_DEVICE,
        "compute_type": WHISPER_COMPUTE_TYPE,
        "modo_concurrente": MODO_CONCURRENTE_HABILITADO,
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        "max_audio_file_size_mb": MAX_AUDIO_FILE_SIZE_MB,
        "threshold_default": FUZZY_THRESHOLD_DEFAULT,
        "keywords_default": KEYWORDS_ALERTA_DEFAULT,
    })

@app.route("/api/audio/detectar-alerta", methods=["POST"])
@app.route("/api/audio/transcribir", methods=["POST"])
def detectar_alerta():
    autorizado, error_response = _validar_api_key()
    if not autorizado:
        return error_response

    archivo = request.files.get("archivo")
    if archivo is None:
        return _respuesta_error("Debe enviarse un archivo en el campo 'archivo'.", 400)

    if not archivo.filename:
        return _respuesta_error("El archivo no tiene nombre.", 400)

    filename_seguro = secure_filename(archivo.filename)
    if not filename_seguro:
        return _respuesta_error("El nombre del archivo no es válido.", 400)

    try:
        _validar_extension(filename_seguro)
    except ValueError as exc:
        return _respuesta_error(str(exc), 400)

    language = (request.form.get("language") or "es").strip().lower() or "es"
    threshold = _clamp_int(
        _to_int(request.form.get("threshold"), FUZZY_THRESHOLD_DEFAULT),
        0,
        100,
    )
    beam_size = _clamp_int(
        _to_int(request.form.get("beam_size"), 5),
        1,
        10,
    )
    keywords = _parse_keywords(request.form.get("keywords"))

    try:
        with tempfile.TemporaryDirectory(prefix="alerta_audio_", dir=str(TMP_DIR_BASE)) as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / filename_seguro

            archivo.save(str(input_path))

            resultado_tx = _transcribir(
                input_path,
                language=language,
                beam_size=beam_size,
            )

            texto_crudo = resultado_tx["texto_crudo"]
            texto_normalizado = _normalizar_texto(texto_crudo)

            palabras_separadas = _separar_palabras(texto_normalizado)
            palabras_comparables = _expandir_variantes(palabras_separadas)

            coincidencias_exactas = _coincidencias_exactas(palabras_comparables, keywords)
            coincidencias_difusas = _coincidencias_difusas(
                palabras_comparables,
                keywords,
                threshold,
                coincidencias_exactas,
            )

            alerta_detectada = bool(coincidencias_exactas or coincidencias_difusas)

            mejor_match = None
            if coincidencias_difusas:
                mejor_match = coincidencias_difusas[0]
            elif coincidencias_exactas:
                mejor_match = {
                    "token": coincidencias_exactas[0],
                    "keyword": coincidencias_exactas[0],
                    "score": 100,
                }

            return jsonify({
                "ok": True,
                "archivo_original": archivo.filename,
                "idioma_detectado": resultado_tx["idioma_detectado"],
                "probabilidad_idioma": resultado_tx["probabilidad_idioma"],
                "duracion_segundos": resultado_tx["duracion_segundos"],
                "texto_crudo": texto_crudo,
                "texto_normalizado": texto_normalizado,
                "palabras_separadas": palabras_separadas,
                "palabras_comparables": palabras_comparables,
                "palabras_unicas": _unicos_en_orden(palabras_comparables),
                "keywords_evaluadas": [_normalizar_texto(k) for k in keywords],
                "coincidencias_exactas": coincidencias_exactas,
                "coincidencias_difusas": coincidencias_difusas,
                "mejor_match": mejor_match,
                "alerta_detectada": alerta_detectada,
                "threshold_usado": threshold,
                "segmentos": resultado_tx["segmentos"],
                "modelo": WHISPER_MODEL_SIZE,
                "device": WHISPER_DEVICE,
                "compute_type": WHISPER_COMPUTE_TYPE,
                "modo_concurrente": MODO_CONCURRENTE_HABILITADO,
                "endpoint": f"{API_PUBLIC_BASE}/api/audio/detectar-alerta",
            })

    except RequestEntityTooLarge:
        return _respuesta_error(
            f"Archivo demasiado grande. Máximo permitido: {MAX_AUDIO_FILE_SIZE_MB} MB",
            413
        )
    except Exception as exc:
        current_app.logger.exception("Error interno en /api/audio/detectar-alerta")
        return _respuesta_error(str(exc), 500)

@app.errorhandler(RequestEntityTooLarge)
def handle_413(_error_exc):
    return jsonify({
        "ok": False,
        "detail": f"Archivo demasiado grande. Máximo permitido: {MAX_AUDIO_FILE_SIZE_MB} MB"
    }), 413

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
