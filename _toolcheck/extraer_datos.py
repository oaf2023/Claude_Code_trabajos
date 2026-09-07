# ============================================================================
# Archivo         : extraer_datos.py
# Descripcion     : Extraccion estatica de funciones, clases, endpoints,
#                   dependencias, esquemas SQL, colecciones Firestore y
#                   variables de entorno del proyecto SafeAlert, para
#                   generar los JSON de matrices del documento maestro.
# Autor           : Equipo SafeAlert
# Fecha           : 2026-09-06
# Version         : 1.0.0
# Lenguaje        : Python 3.13
# Uso             : python extraer_datos.py <ruta_proyecto> <ruta_salida>
# Resultado       : funciones.json, clases.json, endpoints.json,
#                   dependencias.json, database.json, entorno.json
# Nota            : La extraccion es estatica (regex por linea); los anexos
#                   contienen el analisis autoritativo de cada archivo.
# ============================================================================

import json
import os
import re
import sys

EXT_SRC = {".ts", ".tsx", ".py", ".js", ".mjs"}
DIRS_SKIP = {"node_modules", ".git", ".git_bak", ".expo", "android", "dist",
             "dist-android-check", "coverage", "__pycache__", ".pytest_cache",
             "build", "lib", "temp_voice_resources", "documentacion_generada"}


def archivos_de(raiz):
    for dirpath, dirnames, filenames in os.walk(raiz):
        dirnames[:] = [d for d in dirnames if d not in DIRS_SKIP]
        for fn in filenames:
            yield os.path.join(dirpath, fn)


def extraer_funciones_clases(raiz):
    """Detecta funciones, clases, interfaces y tipos por linea."""
    funciones = []
    clases = []
    tipos = []
    # patrones TS/JS/TSX
    pat_fn_ts = re.compile(
        r"^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+"
        r"([A-Za-z_$][\w$]*)\s*\(")
    pat_arrow_ts = re.compile(
        r"^\s*(?:export\s+)?(?:async\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*"
        r"(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>")
    pat_cls_ts = re.compile(
        r"^\s*(?:export\s+)?(?:default\s+)?class\s+([A-Za-z_$][\w$]*)")
    pat_int_ts = re.compile(
        r"^\s*(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)")
    pat_typ_ts = re.compile(
        r"^\s*(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\s*=")
    pat_fn_py = re.compile(r"^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(")
    pat_cls_py = re.compile(r"^\s*class\s+([A-Za-z_]\w*)")

    for ruta in archivos_de(raiz):
        ext = os.path.splitext(ruta)[1].lower()
        if ext not in EXT_SRC:
            continue
        rel = os.path.relpath(ruta, raiz).replace("\\", "/")
        try:
            with open(ruta, "r", encoding="utf-8", errors="replace") as f:
                lineas = f.readlines()
        except OSError:
            continue
        es_py = ext == ".py"
        for num, linea in enumerate(lineas, start=1):
            s = linea.rstrip("\n")
            if es_py:
                m = pat_fn_py.match(s)
                if m:
                    funciones.append({"archivo": rel, "linea": num,
                                      "nombre": m.group(1),
                                      "lenguaje": "Python"})
                    continue
                m = pat_cls_py.match(s)
                if m:
                    clases.append({"archivo": rel, "linea": num,
                                   "nombre": m.group(1),
                                   "lenguaje": "Python"})
                    continue
            else:
                m = pat_fn_ts.match(s) or pat_arrow_ts.match(s)
                if m:
                    funciones.append({"archivo": rel, "linea": num,
                                      "nombre": m.group(1),
                                      "lenguaje": "TypeScript/JS"})
                    continue
                m = pat_cls_ts.match(s)
                if m:
                    clases.append({"archivo": rel, "linea": num,
                                   "nombre": m.group(1),
                                   "lenguaje": "TypeScript/JS"})
                    continue
                m = pat_int_ts.match(s)
                if m:
                    tipos.append({"archivo": rel, "linea": num,
                                  "nombre": m.group(1), "tipo": "interface"})
                    continue
                m = pat_typ_ts.match(s)
                if m:
                    tipos.append({"archivo": rel, "linea": num,
                                  "nombre": m.group(1), "tipo": "type"})
                    continue
    return funciones, clases, tipos


def extraer_endpoints_flask(raiz):
    """Extrae rutas @app.route / @flask_app.route de backend/flask_app.py."""
    ruta = os.path.join(raiz, "backend", "flask_app.py")
    if not os.path.exists(ruta):
        return []
    patron = re.compile(
        r"@[A-Za-z_]\w*\.route\(\s*(['\"])(?P<ruta>.+?)\1"
        r"(?:\s*,\s*methods\s*=\s*\[(?P<metodos>[^\]]*)\])?")
    endpoints = []
    with open(ruta, "r", encoding="utf-8", errors="replace") as f:
        lineas = f.readlines()
    i = 0
    while i < len(lineas):
        m = patron.search(lineas[i])
        if m:
            ruta_ep = m.group("ruta")
            metodos_raw = m.group("metodos") or "GET"
            metodos = re.findall(r"['\"]([A-Z]+)['\"]", metodos_raw) or ["GET"]
            # funcion siguiente def
            j = i + 1
            funcion = "?"
            while j < len(lineas) and j < i + 12:
                dm = re.match(r"\s*def\s+([A-Za-z_]\w*)\s*\(", lineas[j])
                if dm:
                    funcion = dm.group(1)
                    break
                j += 1
            for met in metodos:
                endpoints.append({"metodo": met, "ruta": ruta_ep,
                                  "funcion": funcion,
                                  "archivo": "backend/flask_app.py",
                                  "linea": i + 1})
            i = j
        else:
            i += 1
    return endpoints


def extraer_endpoints_functions(raiz):
    """Extrae exportaciones de Cloud Functions (v2: onCall/onRequest/...)."""
    base = os.path.join(raiz, "functions", "src")
    endpoints = []
    if not os.path.isdir(base):
        return endpoints
    patron = re.compile(
        r"^\s*export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*"
        r"(?:[A-Za-z_$][\w$]*\.)*"
        r"(onCall|onRequest|onSchedule|onDocumentCreated|"
        r"onDocumentWritten|onDocumentUpdated|onDocumentDeleted|"
        r"onValueCreated|onValueWritten|onCustomEventPublished)\s*\(")
    for ruta in archivos_de(base):
        rel = os.path.relpath(ruta, raiz).replace("\\", "/")
        with open(ruta, "r", encoding="utf-8", errors="replace") as f:
            lineas = f.readlines()
        for num, linea in enumerate(lineas, 1):
            m = patron.search(linea)
            if m:
                endpoints.append({"metodo": m.group(2), "ruta": m.group(1),
                                  "funcion": m.group(1),
                                  "archivo": rel, "linea": num})
    return endpoints


def extraer_dependencias(raiz):
    """Lee manifests npm y requirements pip."""
    resultado = []
    manifests = [
        ("package.json", "App principal (raiz)"),
        ("admin/package.json", "Panel admin"),
        ("functions/package.json", "Cloud Functions"),
        ("iphone/package.json", "App iphone"),
    ]
    for rel, etiqueta in manifests:
        ruta = os.path.join(raiz, rel)
        if os.path.exists(ruta):
            try:
                with open(ruta, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except (OSError, ValueError):
                continue
            for seccion, tipo in (("dependencies", "produccion"),
                                  ("devDependencies", "desarrollo")):
                for nombre, version in (data.get(seccion) or {}).items():
                    resultado.append({"origen": etiqueta, "manifiesto": rel,
                                      "nombre": nombre, "version": version,
                                      "tipo": tipo})
    ruta_req = os.path.join(raiz, "backend", "requirements.txt")
    if os.path.exists(ruta_req):
        with open(ruta_req, "r", encoding="utf-8", errors="replace") as f:
            for linea in f:
                linea = linea.strip()
                if not linea or linea.startswith("#") or linea.startswith("-"):
                    continue
                nombre = re.split(r"[<>=!~;]", linea, maxsplit=1)[0].strip()
                resultado.append({"origen": "Backend Flask",
                                  "manifiesto": "backend/requirements.txt",
                                  "nombre": nombre,
                                  "version": linea[len(nombre):].strip() or "sin fijar",
                                  "tipo": "produccion"})
    return resultado


def extraer_sql(raiz):
    """Parsea CREATE TABLE de los .sql de backend/sql."""
    tablas = []
    for rel in ("backend/sql/001_ubicaciones_consentimientos_accesos.sql",
                "backend/sql/002_retencion_purga.sql"):
        ruta = os.path.join(raiz, rel)
        if not os.path.exists(ruta):
            continue
        with open(ruta, "r", encoding="utf-8", errors="replace") as f:
            texto = f.read()
        for m in re.finditer(
                r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?\s*"
                r"\((.*?)\)\s*(?:ENGINE|DEFAULT|;|$)",
                texto, re.IGNORECASE | re.DOTALL):
            nombre_tabla = m.group(1)
            cuerpo = m.group(2)
            columnas = []
            for cm in re.finditer(
                    r"^\s*`?(\w+)`?\s+([A-Z]+(?:\([^)]*\))?(?:\s+UNSIGNED)?)"
                    r"(\s+NOT\s+NULL)?(\s+AUTO_INCREMENT)?"
                    r"(\s+UNIQUE)?(\s+DEFAULT\s+([^,\n]+))?"
                    r"(\s+COMMENT\s+'([^']*)')?",
                    cuerpo, re.IGNORECASE | re.MULTILINE):
                columnas.append({
                    "campo": cm.group(1),
                    "tipo": cm.group(2).strip(),
                    "null": "NO" if cm.group(3) else "SI",
                    "pk": "PK" if "PRIMARY" in cuerpo and cm.group(1) else "",
                    "auto": bool(cm.group(4)),
                    "unique": bool(cm.group(5)),
                    "default": (cm.group(7) or "").strip() if cm.group(6) else "",
                    "descripcion": cm.group(9) or "",
                })
            # PK explicita
            pm = re.search(r"PRIMARY\s+KEY\s*\(([^)]+)\)", cuerpo, re.IGNORECASE)
            pks = [p.strip().strip("`") for p in pm.group(1).split(",")] if pm else []
            for col in columnas:
                if col["campo"] in pks:
                    col["pk"] = "PK"
            tablas.append({"tabla": nombre_tabla, "archivo": rel,
                           "columnas": columnas})
    return tablas


def extraer_entorno(raiz):
    """Nombres de variables de entorno (sin valores) de .env.example."""
    vars_env = []
    for dirpath, dirnames, filenames in os.walk(raiz):
        dirnames[:] = [d for d in dirnames if d not in DIRS_SKIP]
        for fn in filenames:
            if fn in (".env.example", "release.env.example.ps1", ".env"):
                ruta = os.path.join(dirpath, fn)
                rel = os.path.relpath(ruta, raiz).replace("\\", "/")
                # .env real: SOLO nombres, valores nunca se leen
                es_ejemplo = fn.endswith(".example") or fn.endswith(
                    ".example.ps1")
                try:
                    with open(ruta, "r", encoding="utf-8",
                              errors="replace") as f:
                        lineas = f.readlines()
                except OSError:
                    continue
                for linea in lineas:
                    s = linea.strip()
                    if not s or s.startswith("#"):
                        continue
                    if "=" in s:
                        nombre = s.split("=", 1)[0].strip()
                        if re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", nombre):
                            vars_env.append({
                                "variable": nombre,
                                "archivo": rel,
                                "valor_real_presente": not es_ejemplo,
                            })
    # dedupe conservando archivo
    return vars_env


def main():
    if len(sys.argv) < 3:
        print("Uso: python extraer_datos.py <proyecto> <salida>")
        return 1
    raiz = os.path.abspath(sys.argv[1])
    salida = os.path.abspath(sys.argv[2])
    os.makedirs(salida, exist_ok=True)

    funciones, clases, tipos = extraer_funciones_clases(raiz)
    ep_flask = extraer_endpoints_flask(raiz)
    ep_funcs = extraer_endpoints_functions(raiz)
    deps = extraer_dependencias(raiz)
    tablas = extraer_sql(raiz)
    envs = extraer_entorno(raiz)

    with open(os.path.join(salida, "funciones.json"), "w", encoding="utf-8") as f:
        json.dump(funciones, f, ensure_ascii=False, indent=1)
    with open(os.path.join(salida, "clases.json"), "w", encoding="utf-8") as f:
        json.dump(clases, f, ensure_ascii=False, indent=1)
    with open(os.path.join(salida, "tipos.json"), "w", encoding="utf-8") as f:
        json.dump(tipos, f, ensure_ascii=False, indent=1)
    with open(os.path.join(salida, "endpoints.json"), "w", encoding="utf-8") as f:
        json.dump(ep_flask + ep_funcs, f, ensure_ascii=False, indent=1)
    with open(os.path.join(salida, "dependencias.json"), "w", encoding="utf-8") as f:
        json.dump(deps, f, ensure_ascii=False, indent=1)
    with open(os.path.join(salida, "database.json"), "w", encoding="utf-8") as f:
        json.dump(tablas, f, ensure_ascii=False, indent=1)
    with open(os.path.join(salida, "entorno.json"), "w", encoding="utf-8") as f:
        json.dump(envs, f, ensure_ascii=False, indent=1)

    resumen = {
        "funciones_detectadas": len(funciones),
        "clases_detectadas": len(clases),
        "tipos_interfaces_detectadas": len(tipos),
        "endpoints_flask": len(ep_flask),
        "endpoints_cloud_functions": len(ep_funcs),
        "dependencias_manifest": len(deps),
        "tablas_sql": len(tablas),
        "variables_entorno": len(envs),
    }
    print(json.dumps(resumen, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
