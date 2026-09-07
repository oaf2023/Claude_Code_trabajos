# ============================================================================
# Archivo         : inventario_proyecto.py
# Descripcion     : Inventario recursivo y clasificacion de archivos del
#                   proyecto SafeAlert para auditoria tecnica.
# Autor           : Equipo SafeAlert
# Fecha           : 2026-03-25
# Version         : 1.0.0
# Lenguaje        : Python 3.13
# Uso             : python inventario_proyecto.py <ruta_proyecto> <ruta_salida>
#                   Genera inventario.json, inventario_clasificado.json,
#                   arbol.txt y estadisticas.json.
# ============================================================================

import json
import os
import sys
from collections import Counter

# Directorios de dependencias/terceros/generados que se excluyen del arbol
# relevante (se inventarían aparte y se justifica en el documento).
# - node_modules: dependencias npm.
# - android / .cxx / .gradle / build: proyecto nativo generado por `expo
#   prebuild` y artefactos de compilacion CMake/Gradle (regenerable).
# - dist / dist-android-check / coverage / lib: salidas de compilacion.
# - .git / .git_bak / .expo / caches: metadatos y cache.
# - temp_voice_resources: ejemplos de terceros (libreria react-native-wakeword).
# - bugreport-Pixel_*: volcado de diagnostico del dispositivo.
# - artefactos: binarios de publicacion (.aab/.apk) dentro de Publicar/.
DIRS_EXCLUIDOS_ANALISIS = {
    "node_modules", ".git", ".git_bak", ".expo", "dist", "dist-android-check",
    "coverage", "__pycache__", ".pytest_cache", ".cache", ".gradle", ".cxx",
    "build", "android", "ios", "Pods", ".idea", ".vscode", "DerivedData",
    ".venv", "venv", "lib", ".fleet", "temp_voice_resources", "artefactos",
    ".oxlint", ".turbo", ".husky", "documentacion_generada",
    "bugreport-Pixel_8-2026-03-24-17-03-40-5574720f-3c13-4f65-aa67-6b993b136909",
}

# Carpetas que se inventarian de forma resumida (contador) sin bajar a ellas.
DIRS_SOLO_CONTEO = {
    "node_modules", ".git", ".git_bak", ".expo", "android", "dist",
    "dist-android-check", "coverage", "temp_voice_resources", "artefactos",
    "bugreport-Pixel_8-2026-03-24-17-03-40-5574720f-3c13-4f65-aa67-6b993b136909",
}

# Extensiones consideradas "codigo fuente relevante" (analisis profundo).
EXT_CODIGO = {
    ".py", ".ts", ".tsx", ".js", ".jsx", ".sql", ".css", ".html", ".ps1",
    ".sh", ".yaml", ".yml", ".toml", ".xml", ".json", ".mjs", ".cjs", ".kt",
    ".java", ".swift", ".mm", ".m", ".rb", ".gradle", ".plist", ".properties",
}

# Extensiones de recursos/medios (no analisis linea a linea).
EXT_RECURSOS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg", ".mp3", ".wav",
    ".m4a", ".onnx", ".ttf", ".otf", ".woff", ".woff2", ".jar", ".aar",
    ".aab", ".apk", ".keystore", ".jks", ".p12", ".mobileprovision",
    ".pbxproj", ".xcworkspacedata", ".storyboard", ".lock", ".pyc",
}

EXT_DOCUMENTACION = {".md", ".txt", ".docx", ".pdf", ".html", ".htm"}


def clasificar(rel: str, ext: str, tam: int) -> str:
    """Clasifica un archivo por categoria (funcion de clasificacion)."""
    low = rel.lower()
    if ext in EXT_RECURSOS or tam > 1_500_000:
        return "Recursos/Medios/Artefacto"
    if ext in EXT_DOCUMENTACION:
        return "Documentacion"
    if ext == ".env" or low.endswith(".env.example") or low.endswith(".env.example.ps1"):
        return "Configuracion (sensible)"
    if ext in {".json", ".yaml", ".yml", ".toml", ".xml", ".properties", ".plist"}:
        return "Configuracion"
    if ext in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}:
        return "Codigo fuente (JS/TS)"
    if ext == ".py":
        return "Codigo fuente (Python)"
    if ext == ".sql":
        return "Base de datos / Migracion"
    if ext in {".ps1", ".sh", ".bat"}:
        return "Script automatizacion"
    if ext == ".kt":
        return "Codigo fuente (Kotlin)"
    if ext == ".java":
        return "Codigo fuente (Java)"
    if ext == ".css":
        return "Estilos (CSS)"
    if ext == ".html":
        return "HTML"
    return "Otro"


def main():
    if len(sys.argv) < 3:
        print("Uso: python inventario_proyecto.py <proyecto> <salida>")
        return 1
    raiz = os.path.abspath(sys.argv[1])
    salida = os.path.abspath(sys.argv[2])
    os.makedirs(salida, exist_ok=True)

    inventario = []
    detalle_dirs = Counter()
    total_bytes = 0

    for dirpath, dirnames, filenames in os.walk(raiz):
        # Poda: no descender a directorios excluidos
        dirnames[:] = [
            d for d in dirnames
            if d not in DIRS_EXCLUIDOS_ANALISIS
        ]
        for fname in filenames:
            ruta = os.path.join(dirpath, fname)
            rel = os.path.relpath(ruta, raiz).replace("\\", "/")
            try:
                tam = os.path.getsize(ruta)
            except OSError:
                tam = -1
            ext = os.path.splitext(fname)[1].lower()
            cat = clasificar(rel, ext, tam)
            total_bytes += max(tam, 0)
            inventario.append({
                "ruta": rel,
                "directorio": os.path.dirname(rel).replace("\\", "/"),
                "archivo": fname,
                "extension": ext,
                "tamano_bytes": tam,
                "categoria": cat,
            })

    # Estadisticas
    por_ext = Counter(i["extension"] for i in inventario)
    por_cat = Counter(i["categoria"] for i in inventario)
    codigo = [i for i in inventario if i["categoria"].startswith("Codigo")]
    estadisticas = {
        "ruta_proyecto": raiz,
        "total_archivos_inventariados": len(inventario),
        "total_bytes": total_bytes,
        "archivos_codigo": len(codigo),
        "por_extension": dict(por_ext.most_common()),
        "por_categoria": dict(por_cat.most_common()),
    }

    # Conteo resumido de directorios excluidos (no se analizan internamente)
    conteo_excluidos = {}
    for nombre in sorted(DIRS_SOLO_CONTEO):
        ruta_dir = os.path.join(raiz, nombre)
        if os.path.isdir(ruta_dir):
            n = 0
            for _, dnames, fnames in os.walk(ruta_dir):
                n += len(fnames)
            conteo_excluidos[nombre] = n
    estadisticas["directorios_excluidos_conteo"] = conteo_excluidos

    with open(os.path.join(salida, "inventario.json"), "w", encoding="utf-8") as f:
        json.dump(inventario, f, ensure_ascii=False, indent=1)
    with open(os.path.join(salida, "inventario_clasificado.json"), "w", encoding="utf-8") as f:
        json.dump({"estadisticas": estadisticas, "archivos": inventario},
                  f, ensure_ascii=False, indent=1)
    with open(os.path.join(salida, "estadisticas.json"), "w", encoding="utf-8") as f:
        json.dump(estadisticas, f, ensure_ascii=False, indent=2)

    # Arbol en texto
    with open(os.path.join(salida, "arbol.txt"), "w", encoding="utf-8") as f:
        f.write("ARBOL COMPLETO DEL PROYECTO (relevante, sin dependencias/generados)\n")
        f.write("=" * 80 + "\n")
        for item in sorted(inventario, key=lambda x: x["ruta"]):
            f.write(item["ruta"] + "\n")

    print(json.dumps(estadisticas, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
