# Archivo: Pruebas/check_ios.py

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | Pruebas/check_ios.py |
| Líneas totales | 79 |
| Lenguaje | Python 3 (stdlib) |
| Tamaño (bytes) | 2648 |
| Categoría | Script de diagnóstico de entorno (desarrollo iOS local) |
| Estado detectado | APARENTEMENTE NO UTILIZADO (herramienta manual de verificación) |
| Nivel de certeza | Altamente probable |

## Objetivo

Verifica si el equipo local es apto para desarrollo nativo de iOS: detecta el sistema operativo (macOS = "Darwin"), presencia de Xcode Command Line Tools (`xcode-select`), y herramientas base (`git`, `python3`, `brew`). Emite un reporte JSON con plataforma, aptitud, presencia de Xcode y recomendación (desarrollo local vs. MacInCloud/VM macOS). Su propósito es decidir si hace falta una máquina virtual/cloud para compilar iOS.

## Clasificación y estado

Etiqueta: `APARENTEMENTE NO UTILIZADO` con `[POTENCIALMENTE NO UTILIZADO]` como utilidad integrada.

El grep global no encontró referencias fuera de la carpeta `Pruebas/` y los inventarios generados. Es una herramienta manual independiente (sin importadores). El docstring interno la nombra `check_ios_dev_env.py`, mientras el archivo se llama `check_ios.py` (inconsistencia de nombre). `[NIVEL DE CERTEZA: Altamente probable]` — no se puede descartar ejecución manual ad hoc.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `sys` | estándar | `main` (version_info) | Sí |
| `platform` | estándar | `main` (system) y `verificar_xcode` (no: solo en main) | Sí (`platform.system()`) |
| `subprocess` | estándar | `verificar_xcode`, `check_component` | Sí |
| `json` | estándar | `main` (reporte) | Sí |
| `threading` | estándar | `ejecucion_concurrente` | Condicional (Python 3.13+) |

Todas estándar; sin dependencias de terceros.

## Componentes que dependen de este archivo

Ninguno. No se importa desde otro módulo; es ejecutable directo (`if __name__ == "__main__"`). Solo inventarios de la auditoría lo listan.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| tareas_sistema | dict git/python3/brew → comandos | dict | Herramientas base a comprobar | 50–54, 62, 65 |
| es_macos | `platform.system() == "Darwin"` | bool | Indicador macOS | 56, 70 |
| version_py | `sys.version_info` | sys.version_info | Versión de Python | 57, 60 |
| status_herramientas | dict de resultados | dict | Estado de cada herramienta | 62, 65, 71 |
| reporte | dict JSON | dict | Reporte final | 67–73, 76 |

## Estructura (funciones / clases / tipos)

- `verificar_xcode()` (líneas 16–22): comprueba `xcode-select -p`.
- `check_component(nombre, comando)` (líneas 24–30): comprueba un comando.
- `ejecucion_concurrente(tareas)` (líneas 32–47): lanza comprobaciones en hilos; incluye `worker` interno (36–39).
- `main()` (líneas 49–76): orquesta el reporte.
- Sin clases ni tipos definidos.

## Análisis línea por línea

```python
"""
Nombre: check_ios_dev_env.py
Fecha: 09 de Abril, 2026
Utilidad: Verificación de requisitos para desarrollo iOS en el sistema local.
Función/API: System OS check & Xcode CLI tools.
Descripción: Evalúa si el entorno actual es apto para desarrollo nativo de iOS o si se requiere VM/Cloud.
Ejemplo de resultado: {'os': 'Darwin', 'can_dev': True, 'missing': []}
"""

import sys
import platform
import subprocess
import json
import threading

def verificar_xcode():
    """Verifica si Xcode select está instalado (solo en macOS)."""
    try:
        resultado = subprocess.run(['xcode-select', '-p'], capture_output=True, text=True)
        return resultado.returncode == 0
    except FileNotFoundError:
        return False

def check_component(nombre, comando):
    """Verifica la existencia de un comando en el sistema."""
    try:
        subprocess.run(comando, capture_output=True, text=True, check=True)
        return {nombre: "Instalado"}
    except (subprocess.CalledProcessError, FileNotFoundError):
        return {nombre: "No encontrado"}
```

**Explicación de las líneas 1–30:**

- **Líneas 1–8**: docstring del módulo. El nombre indicado (`check_ios_dev_env.py`) no coincide con el del archivo real (`check_ios.py`). `[OBSERVACIÓN TÉCNICA]`. El ejemplo de resultado promete claves `os`/`can_dev`/`missing` que el código real NO produce (genera `plataforma`/`es_apto_nativo`/`xcode_presente`/`herramientas_base`/`recomendacion`); documentación desactualizada.
- **Líneas 10–14**: imports estándar.
- **Líneas 16–22** (`verificar_xcode`): ejecuta `xcode-select -p`; devuelve `True` si el returncode es 0 (herramientas de línea de comandos de Xcode presentes). Captura `FileNotFoundError` → False. Nota: solo verifica las CLI tools, no la app Xcode completa ni `xcodebuild` de la versión correcta.
- **Líneas 24–30** (`check_component`): ejecuta `comando` con `check=True`; si retorna 0 devuelve `{nombre: "Instalado"}`, si lanza `CalledProcessError`/`FileNotFoundError` devuelve `{nombre: "No encontrado"}`. El `capture_output=True` evita basura en consola.

```python
def ejecucion_concurrente(tareas):
    resultados = {}
    threads = []

    def worker(nombre, comando):
        res = check_component(nombre, comando)
        resultados.update(res)

    for nombre, comando in tareas.items():
        t = threading.Thread(target=worker, args=(nombre, comando))
        threads.append(t)
        t.start()

    for t in threads:
        t.join()
    return resultados

def main():
    tareas_sistema = {
        "git": ["git", "--version"],
        "python": ["python3", "--version"],
        "brew": ["brew", "--version"]
    }

    es_macos = platform.system() == "Darwin"
    version_py = sys.version_info
    
    # Lógica de concurrencia según versión de Python solicitado (3.13+)
    if version_py.major == 3 and version_py.minor >= 13:
        # En 3.13+ usamos la lógica multihilo preparada
        status_herramientas = ejecucion_concurrente(tareas_sistema)
    else:
        # Ejecución normal secuencial
        status_herramientas = {n: check_component(n, c)[n] for n, c in tareas_sistema.items()}

    reporte = {
        "plataforma": platform.system(),
        "es_apto_nativo": es_macos,
        "xcode_presente": verificar_xcode() if es_macos else False,
        "herramientas_base": status_herramientas,
        "recomendacion": "Listo para desarrollar" if es_macos else "Se recomienda MacInCloud o VM con macOS"
    }

    print(f"--- Reporte de Entorno para Manejadatos ---")
    print(json.dumps(reporte, indent=4))

if __name__ == "__main__":
    main()
```

**Explicación de las líneas 32–79:**

- **Líneas 32–47** (`ejecucion_concurrente`):
  - **Línea 33**: diccionario compartido `resultados`.
  - **Líneas 36–39** (`worker`): ejecuta `check_component` y actualiza `resultados`.
  - **Líneas 40–43**: crea y arranca un hilo por tarea.
  - **Líneas 45–46**: espera a todos (`join`).
  - **Línea 47**: devuelve el dict.
  - `[OBSERVACIÓN TÉCNICA]` (líneas 33–39): varios hilos escriben en el mismo dict sin bloqueo; en CPython el GIL hace que cada `update` sea prácticamente atómico, pero no es una garantía del lenguaje (si se ejecutara con un intérprete sin GIL o se agregara lógica no atómica, habría condiciones de carrera). Riesgo teórico bajo.
- **Líneas 49–76** (`main`):
  - **Líneas 50–54**: define `tareas_sistema` (git, python3, brew).
  - **Línea 56**: detecta macOS (`Darwin`).
  - **Línea 57**: versión de Python.
  - **Líneas 60–65**: si Python >= 3.13 usa hilos; si no, secuencia con comprensión de diccionario. `[OBSERVACIÓN TÉCNICA]`: la condición por versión de Python es arbitraria (el multihilo funciona en cualquier versión); parece un requisito introducido para validar Python 3.13 (¿por el runtime objetivo?), no una necesidad técnica.
  - **Líneas 67–73**: construye `reporte` (ver discrepancia con el docstring en las líneas 1–8).
  - **Línea 75**: encabezado impreso con texto fijo "Reporte de Entorno para Manejadatos" — `[OBSERVACIÓN TÉCNICA]`: menciona "Manejadatos" (otro proyecto/contexto del autor), no SafeAlert; texto copiado.
  - **Línea 76**: imprime el JSON indentado.
  - **Líneas 78–79**: guard `__main__`.
- `[NOTA]`: aunque la app SafeAlert es Expo/React Native (iOS se compila con EAS/Cloud o local con Xcode), este script evalúa solo la factibilidad local del SO; no valida versiones de Xcode (>= 16.1 para RN 0.83), CocoaPods, Node ni `eas`. Cobertura de diagnóstico limitada.

## Fichas de funciones y métodos

### verificar_xcode() (líneas 16–22)
- Firma: `def verificar_xcode():` → `bool`.
- Propósito: saber si las CLI tools de Xcode están instaladas.
- Parámetros: ninguno. Retorno: `True/False`.
- Excepciones capturadas: `FileNotFoundError`.
- Flujo: `xcode-select -p` → returncode. Llamada desde `main` solo si macOS.

### check_component(nombre, comando) (líneas 24–30)
- Firma: `def check_component(nombre, comando):` → `dict {nombre: "Instalado"|"No encontrado"}`.
- Propósito: comprobar disponibilidad de un comando.
- Parámetros: `nombre` (clave del reporte), `comando` (lista argv).
- Retorno: dict de un elemento.
- Llamada desde `worker` y desde `main` (rama secuencial).

### ejecucion_concurrente(tareas) (líneas 32–47)
- Firma: `def ejecucion_concurrente(tareas):` → `dict`.
- Propósito: ejecutar `check_component` en paralelo por tarea.
- Parámetros: `tareas` (dict nombre → comando).
- Retorno: dict con resultados. Riesgo: escritura compartida sin lock (teórico).
- Uso: solo en Python >= 3.13 (rama de `main`).

### main() (líneas 49–76)
- Firma: `def main():` → `None`.
- Propósito: orquestar detección de SO, Xcode y herramientas, e imprimir el reporte JSON.
- Flujo: definir tareas → decidir concurrencia → verificar Xcode (solo macOS) → construir/imprimir reporte.
- Efectos secundarios: salida por consola; ejecuta subprocesos del sistema (`git`, `python3`, `brew`, `xcode-select`) con sus efectos menores (p. ej. `brew --version` es inofensivo).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` (líneas 1–8): docstring desactualizado (nombre de archivo y claves de ejemplo del reporte no coinciden con el código real).
- `[OBSERVACIÓN TÉCNICA]` (líneas 60–65): el uso de hilos condicionado a Python 3.13+ no responde a una necesidad técnica demostrable.
- `[OBSERVACIÓN TÉCNICA]` (línea 75): cadena fija "Reporte de Entorno para Manejadatos" (contexto ajeno a SafeAlert).
- `[NOTA]`: la validación es superficial (SO + xcode-select + 3 binarios); no valida el toolchain iOS real de Expo/RN.
- `[POTENCIALMENTE NO UTILIZADO]`: sin referencias; herramienta manual desechable/archivable.

## Seguridad

- `[INFORMATIVO]`: ejecuta binarios del sistema con argumentos fijos (sin entrada del usuario); captura la salida (no la imprime).
- `[INFORMATIVO]`: no recoge ni imprime datos personales, rutas sensibles ni credenciales.
- Sin hallazgos clasificables (CRÍTICO/ALTO/MEDIO/BAJO): ninguno.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo: falsos positivos de aptitud (macOS + xcode-select no bastan para compilar RN 0.83; se requiere Xcode completo con SDK iOS 18+, CocoaPods/Ruby y Node).
- `[RECOMENDACIÓN]`: si se conserva, alinear docstring/nombre con el comportamiento real (claves `plataforma/es_apto_nativo/...`), corregir la cadena "Manejadatos" y ampliar la verificación a `xcodebuild -version`; de lo contrario, archivarlo en la carpeta `Pruebas/` como registro histórico.
