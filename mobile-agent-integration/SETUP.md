# 📱 Mobile Dev Agent — Integración con VS Code + GitHub Copilot

Guía de instalación paso a paso para conectar el agente a tu proyecto.

---

## ¿Qué incluye este paquete?

```
.github/
└── copilot-instructions.md     ← Instrucciones que Copilot lee automáticamente

.vscode/
├── settings.json               ← Configuración del editor
├── tasks.json                  ← Tareas para iniciar el agente
├── extensions.json             ← Extensiones recomendadas
└── mcp.json                    ← Conexión del servidor MCP con Copilot

mcp-server/
├── package.json
└── src/
    └── index.js                ← Servidor MCP con 7 herramientas nativas
```

---

## Instalación (5 minutos)

### Paso 1 — Copiar archivos a tu proyecto

Copiá toda esta carpeta dentro de la raíz de tu proyecto en VS Code:

```
tu-proyecto/          ← raíz de tu proyecto existente
├── lib/              ← tu código Flutter/RN/etc.
├── .github/          ← ← PEGÁ ACÁ
├── .vscode/          ← ← PEGÁ ACÁ
└── mcp-server/       ← ← PEGÁ ACÁ
```

> Si ya tenés `.vscode/settings.json`, fusioná el contenido a mano.

---

### Paso 2 — Instalar Node.js (si no lo tenés)

```bash
# Verificar si ya lo tenés
node --version   # necesitás v18 o superior

# Si no lo tenés, instalalo desde:
# https://nodejs.org  (bajate la versión LTS)
```

---

### Paso 3 — Instalar dependencias del servidor MCP

Abrí la terminal en VS Code (`Ctrl + `` ` ``) y ejecutá:

```bash
cd mcp-server
npm install
```

---

### Paso 4 — Activar la integración MCP en GitHub Copilot

1. Abrí VS Code
2. Andá a **Settings** (`Ctrl+,`)
3. Buscá: `chat.mcp.enabled`
4. **Activá** la opción ✅

O hacelo desde `settings.json`:
```json
{
  "chat.mcp.enabled": true,
  "github.copilot.chat.codeGeneration.useInstructionFiles": true
}
```

---

### Paso 5 — Iniciar el servidor MCP

**Opción A — Tarea automática de VS Code:**
```
Ctrl+Shift+P → "Tasks: Run Task" → "🚀 Iniciar Mobile Dev Agent (MCP)"
```

**Opción B — Terminal manual:**
```bash
cd mcp-server && node src/index.js
```

Vas a ver en la terminal:
```
📱 Mobile Dev Agent MCP Server iniciado
📁 Proyecto: /ruta/a/tu-proyecto
🔧 Herramientas disponibles: create_code_file, create_project_structure...
```

---

### Paso 6 — Verificar que Copilot ve el agente

1. Abrí el chat de Copilot (`Ctrl+Shift+I` o `Ctrl+Alt+I`)
2. Hacé click en el ícono de herramientas 🔧
3. Deberías ver **"mobile-dev-agent"** en la lista
4. Activalo ✅

---

## Uso en el chat de Copilot

Con el agente conectado, podés pedirle cosas como:

```
"Creá la estructura completa de mi proyecto Flutter con cámara y GPS"

"Implementá notificaciones push en mi app React Native"

"Generá el archivo CameraService.dart en lib/core/services/"

"Agregá los permisos de biometría al AndroidManifest.xml"

"Listá todos los archivos .dart del proyecto"
```

Copilot va a usar las herramientas del agente para **escribir los archivos directamente** en tu proyecto.

---

## Herramientas disponibles

| Herramienta | Qué hace |
|-------------|----------|
| `create_code_file` | Crea cualquier archivo de código en el proyecto |
| `create_project_structure` | Genera estructura completa (Flutter/RN/iOS/Android) |
| `implement_native_feature` | Implementa funciones nativas con código real |
| `add_permissions` | Configura Info.plist y AndroidManifest.xml |
| `read_project_file` | Lee el contenido de un archivo existente |
| `list_project_files` | Lista archivos por extensión o directorio |
| `update_file_section` | Modifica una sección de un archivo existente |

---

## Funciones nativas soportadas

`camera` · `notifications` · `gps` · `volume` · `sensors` · `biometrics` · `bluetooth` · `nfc` · `flashlight` · `battery` · `vibration` · `contacts` · `storage` · `push-notifications`

---

## Solución de problemas

**El servidor MCP no aparece en Copilot:**
- Verificá que `chat.mcp.enabled: true` en settings
- Reiniciá VS Code después de instalar las dependencias
- Chequeá que `node --version` sea ≥ 18

**Error "cannot find module":**
```bash
cd mcp-server && npm install
```

**El agente escribe en el lugar equivocado:**
- El servidor detecta la raíz del proyecto automáticamente (un nivel arriba de `mcp-server/`)
- Podés especificar `output_dir` en las herramientas para controlar el destino

---

*Mobile Dev Agent · Generado para VS Code + GitHub Copilot*
