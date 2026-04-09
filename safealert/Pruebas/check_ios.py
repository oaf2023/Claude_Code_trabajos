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