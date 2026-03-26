/* ============================================================================
* Archivo         : index.js
* Descripción     : Servidor MCP local para generación y edición asistida de proyectos mobile.
* Autor           : oafon
* Fecha           : 2026-03-20
* Versión         : 1.1.0
* Lenguaje        : JavaScript ESM sobre Node.js 18+
* Uso             : node mcp-server/src/index.js
* ============================================================================ */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";

const SERVER_FILE_PATH = fileURLToPath(import.meta.url);
const SERVER_SRC_DIR = path.dirname(SERVER_FILE_PATH);
const SERVER_ROOT = path.resolve(SERVER_SRC_DIR, "..");
const DEFAULT_PROJECT_ROOT = path.resolve(SERVER_ROOT, "..");
const PROJECT_ROOT = path.resolve(
  process.env.MOBILE_DEV_AGENT_PROJECT_ROOT?.trim() || DEFAULT_PROJECT_ROOT
);
const LOG_FILE_PATH = path.resolve(
  process.env.MOBILE_DEV_AGENT_LOG_FILE?.trim() ||
    path.join(SERVER_ROOT, "logs", "mobile-dev-agent.log")
);

const server = new McpServer({
  name: "mobile-dev-agent",
  version: "1.0.0",
});

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

/* ============================================================================
* Función         : logLine
* Descripción     : Escribe mensajes de diagnóstico en stderr y en un archivo local sin romper el transporte stdio.
* Fecha           : 2026-03-20
* Versión         : 1.1.0
* Lenguaje        : JavaScript ESM sobre Node.js 18+
* Conexiones      : startServer, manejadores de proceso
* Ingesta         : message: string
* Devolución      : void
* Uso             : logLine('mensaje de diagnóstico')
* ============================================================================ */
function logLine(message) {
  const line = `[${new Date().toISOString()}] ${message}`;

  try {
    fs.ensureDirSync(path.dirname(LOG_FILE_PATH));
    fs.appendFileSync(LOG_FILE_PATH, `${line}\n`, "utf8");
  } catch {
    // Evitamos que un fallo de logging afecte el canal stdio.
  }

  process.stderr.write(`${line}\n`);
}

function resolvePath(relativePath) {
  const resolved = path.resolve(PROJECT_ROOT, relativePath);

  const relativeToRoot = path.relative(PROJECT_ROOT, resolved);

  // Seguridad: solo dentro del proyecto
  if (
    relativeToRoot.startsWith("..") ||
    path.isAbsolute(relativeToRoot)
  ) {
    throw new Error(`Ruta fuera del proyecto: ${relativePath}`);
  }

  return resolved;
}

async function writeFile(relativePath, content) {
  const fullPath = resolvePath(relativePath);
  await fs.ensureDir(path.dirname(fullPath));
  await fs.writeFile(fullPath, content, "utf8");
  return fullPath;
}

async function readFile(relativePath) {
  const fullPath = resolvePath(relativePath);
  return await fs.readFile(fullPath, "utf8");
}

function detectPlatform(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const name = path.basename(filePath).toLowerCase();
  if (ext === ".swift") return "ios";
  if (ext === ".kt" || ext === ".kts") return "android";
  if (ext === ".dart") return "flutter";
  if ([".tsx", ".ts", ".jsx", ".js"].includes(ext)) return "react-native";
  if (name === "pubspec.yaml") return "flutter";
  if (name === "build.gradle" || name === "androidmanifest.xml") return "android";
  if (name === "package.swift") return "ios";
  if (name === "package.json" || name === "app.json") return "react-native";
  return "unknown";
}

// ═══════════════════════════════════════════════════════════════
// HERRAMIENTA 1: Crear archivo de código
// ═══════════════════════════════════════════════════════════════
server.tool(
  "create_code_file",
  "Crea un archivo de código en el proyecto. Detecta la plataforma automáticamente según la extensión (.swift → iOS, .kt → Android, .dart → Flutter, .tsx → React Native)",
  {
    path: z.string().describe("Ruta relativa desde la raíz del proyecto, ej: lib/features/auth/login_screen.dart"),
    content: z.string().describe("Contenido completo del archivo con imports y código"),
    overwrite: z.boolean().optional().default(false).describe("Si true, sobreescribe el archivo si ya existe"),
  },
  async ({ path: filePath, content, overwrite }) => {
    const fullPath = resolvePath(filePath);
    const exists = await fs.pathExists(fullPath);

    if (exists && !overwrite) {
      return {
        content: [{
          type: "text",
          text: `⚠️ El archivo ya existe: ${filePath}\nUsá overwrite: true para sobreescribir.`,
        }],
      };
    }

    await writeFile(filePath, content);
    const platform = detectPlatform(filePath);
    const lines = content.split("\n").length;

    return {
      content: [{
        type: "text",
        text: `✅ Archivo creado: ${filePath}\n📱 Plataforma: ${platform}\n📄 Líneas: ${lines}\n📍 Ruta completa: ${fullPath}`,
      }],
    };
  }
);

// ═══════════════════════════════════════════════════════════════
// HERRAMIENTA 2: Crear estructura de proyecto completa
// ═══════════════════════════════════════════════════════════════
server.tool(
  "create_project_structure",
  "Crea la estructura completa de carpetas y archivos para un proyecto mobile (Flutter, React Native, iOS o Android)",
  {
    platform: z.enum(["flutter", "react-native", "ios", "android"]).describe("Framework/plataforma del proyecto"),
    project_name: z.string().describe("Nombre del proyecto en snake_case o camelCase"),
    features: z.array(z.string()).optional().default([]).describe("Features nativas a incluir: camera, notifications, gps, biometrics, bluetooth, volume, sensors"),
    architecture: z.enum(["mvvm", "bloc", "clean", "mvc"]).optional().default("mvvm"),
  },
  async ({ platform, project_name, features, architecture }) => {
    const createdFiles = [];

    const structures = {
      flutter: {
        dirs: [
          "lib/core/services",
          "lib/core/permissions",
          "lib/core/constants",
          "lib/core/utils",
          "lib/features",
          "lib/shared/widgets",
          "lib/shared/theme",
          "assets/images",
          "assets/fonts",
          "test",
        ],
        files: {
          "lib/main.dart": generateFlutterMain(project_name, features),
          "lib/core/permissions/permission_service.dart": generateFlutterPermissions(features),
          "lib/shared/theme/app_theme.dart": generateFlutterTheme(project_name),
          "pubspec.yaml": generateFlutterPubspec(project_name, features),
        },
      },
      "react-native": {
        dirs: [
          "src/screens",
          "src/components",
          "src/services",
          "src/hooks",
          "src/store",
          "src/types",
          "src/navigation",
          "src/constants",
          "assets",
        ],
        files: {
          "src/App.tsx": generateRNApp(project_name),
          "src/navigation/AppNavigator.tsx": generateRNNavigator(),
          "src/services/PermissionsService.ts": generateRNPermissions(features),
          "src/types/index.ts": generateRNTypes(),
          "app.json": generateExpoAppJson(project_name, features),
        },
      },
      ios: {
        dirs: [
          `${project_name}/Views`,
          `${project_name}/ViewModels`,
          `${project_name}/Models`,
          `${project_name}/Services`,
          `${project_name}/Extensions`,
          `${project_name}/Resources`,
        ],
        files: {
          [`${project_name}/ContentView.swift`]: generateSwiftContentView(project_name),
          [`${project_name}/Services/PermissionsManager.swift`]: generateSwiftPermissions(features),
          [`${project_name}App.swift`]: generateSwiftApp(project_name),
        },
      },
      android: {
        dirs: [
          `app/src/main/java/com/${project_name}/ui/screens`,
          `app/src/main/java/com/${project_name}/ui/components`,
          `app/src/main/java/com/${project_name}/viewmodel`,
          `app/src/main/java/com/${project_name}/data`,
          `app/src/main/java/com/${project_name}/services`,
          `app/src/main/res/layout`,
          `app/src/main/res/values`,
        ],
        files: {
          [`app/src/main/java/com/${project_name}/MainActivity.kt`]: generateKotlinMain(project_name),
          [`app/src/main/java/com/${project_name}/services/PermissionsHelper.kt`]: generateKotlinPermissions(project_name, features),
          "app/src/main/AndroidManifest.xml": generateAndroidManifest(project_name, features),
        },
      },
    };

    const struct = structures[platform];
    if (!struct) throw new Error(`Plataforma no soportada: ${platform}`);

    // Crear directorios
    for (const dir of struct.dirs) {
      const fullDir = resolvePath(dir);
      await fs.ensureDir(fullDir);
      // Placeholder para que git los trackee
      const gitkeep = path.join(fullDir, ".gitkeep");
      if (!(await fs.pathExists(gitkeep))) {
        await fs.writeFile(gitkeep, "", "utf8");
      }
    }

    // Crear archivos
    for (const [filePath, content] of Object.entries(struct.files)) {
      await writeFile(filePath, content);
      createdFiles.push(filePath);
    }

    return {
      content: [{
        type: "text",
        text: [
          `✅ Estructura creada para proyecto ${platform.toUpperCase()}: "${project_name}"`,
          `📁 Directorios: ${struct.dirs.length}`,
          `📄 Archivos generados: ${createdFiles.length}`,
          `🏗️ Arquitectura: ${architecture.toUpperCase()}`,
          `📱 Features incluidas: ${features.length > 0 ? features.join(", ") : "básicas"}`,
          "",
          "Archivos creados:",
          ...createdFiles.map(f => `  • ${f}`),
        ].join("\n"),
      }],
    };
  }
);

// ═══════════════════════════════════════════════════════════════
// HERRAMIENTA 3: Implementar función nativa
// ═══════════════════════════════════════════════════════════════
server.tool(
  "implement_native_feature",
  "Genera e instala en el proyecto el código completo de una función nativa: camera, notifications, gps, volume, sensors, biometrics, bluetooth, nfc, flashlight, battery, vibration, contacts",
  {
    feature: z.enum([
      "camera", "notifications", "gps", "volume", "sensors",
      "biometrics", "bluetooth", "nfc", "flashlight", "battery",
      "vibration", "contacts", "storage", "push-notifications"
    ]).describe("La función nativa a implementar"),
    platform: z.enum(["flutter", "react-native", "ios", "android"]).describe("Plataforma"),
    output_dir: z.string().optional().describe("Directorio destino, ej: lib/core/services. Si no se indica, usa el default de la plataforma"),
  },
  async ({ feature, platform, output_dir }) => {
    const implementations = getNativeImplementation(feature, platform);
    const defaultDirs = {
      flutter: "lib/core/services",
      "react-native": "src/services",
      ios: "Services",
      android: "app/src/main/java/com/app/services",
    };

    const targetDir = output_dir || defaultDirs[platform];
    const writtenFiles = [];

    for (const { filename, content } of implementations.files) {
      const filePath = path.join(targetDir, filename);
      await writeFile(filePath, content);
      writtenFiles.push(filePath);
    }

    return {
      content: [{
        type: "text",
        text: [
          `✅ ${feature} implementado para ${platform}`,
          "",
          "Archivos creados:",
          ...writtenFiles.map(f => `  • ${f}`),
          "",
          "Permisos requeridos:",
          ...implementations.permissions.map(p => `  • ${p}`),
          "",
          "Packages/dependencias a agregar:",
          ...implementations.packages.map(p => `  • ${p}`),
          "",
          "⚠️  Recordá:",
          implementations.notes,
        ].join("\n"),
      }],
    };
  }
);

// ═══════════════════════════════════════════════════════════════
// HERRAMIENTA 4: Agregar permisos
// ═══════════════════════════════════════════════════════════════
server.tool(
  "add_permissions",
  "Agrega los permisos necesarios a Info.plist (iOS) o AndroidManifest.xml (Android) según las features nativas usadas",
  {
    platform: z.enum(["ios", "android", "flutter", "react-native"]).describe("Plataforma"),
    features: z.array(z.string()).describe("Features que necesitan permisos: camera, gps, microphone, contacts, notifications, bluetooth, nfc, biometrics, storage, calendar"),
    plist_path: z.string().optional().describe("Ruta a Info.plist (solo iOS, ej: MyApp/Info.plist)"),
    manifest_path: z.string().optional().describe("Ruta a AndroidManifest.xml (ej: app/src/main/AndroidManifest.xml)"),
  },
  async ({ platform, features, plist_path, manifest_path }) => {
    const results = [];

    // iOS — Info.plist entries
    if (platform === "ios" || platform === "flutter" || platform === "react-native") {
      const entries = generateInfoPlistEntries(features);
      const plistFilePath = plist_path || "ios/Runner/Info.plist";

      // Crear Info.plist si no existe
      const fullPlistPath = resolvePath(plistFilePath);
      const exists = await fs.pathExists(fullPlistPath);

      if (!exists) {
        const plistContent = generateFullInfoPlist(entries);
        await writeFile(plistFilePath, plistContent);
        results.push(`✅ iOS Info.plist creado: ${plistFilePath}`);
      } else {
        // Agregar note — no modificamos XML existente automáticamente (riesgo)
        const note = generateInfoPlistNote(entries);
        const notePath = "mcp-server/permissions-to-add-ios.md";
        await writeFile(notePath, note);
        results.push(`📋 iOS: Revisá las entradas a agregar en ${notePath}`);
      }
    }

    // Android — AndroidManifest.xml
    if (platform === "android" || platform === "flutter" || platform === "react-native") {
      const permissions = generateAndroidPermissions(features);
      const manifestFilePath = manifest_path || "android/app/src/main/AndroidManifest.xml";
      const fullManifestPath = resolvePath(manifestFilePath);
      const exists = await fs.pathExists(fullManifestPath);

      if (!exists) {
        const manifestContent = generateFullManifest("app", permissions);
        await writeFile(manifestFilePath, manifestContent);
        results.push(`✅ Android Manifest creado: ${manifestFilePath}`);
      } else {
        const note = generateAndroidPermissionsNote(permissions);
        const notePath = "mcp-server/permissions-to-add-android.md";
        await writeFile(notePath, note);
        results.push(`📋 Android: Revisá los permisos a agregar en ${notePath}`);
      }
    }

    return {
      content: [{
        type: "text",
        text: [
          "🔐 Configuración de permisos:",
          ...results,
        ].join("\n"),
      }],
    };
  }
);

// ═══════════════════════════════════════════════════════════════
// HERRAMIENTA 5: Leer archivo del proyecto
// ═══════════════════════════════════════════════════════════════
server.tool(
  "read_project_file",
  "Lee el contenido de un archivo del proyecto",
  {
    path: z.string().describe("Ruta relativa del archivo, ej: lib/main.dart"),
  },
  async ({ path: filePath }) => {
    const fullPath = resolvePath(filePath);
    const exists = await fs.pathExists(fullPath);
    if (!exists) {
      return { content: [{ type: "text", text: `❌ Archivo no encontrado: ${filePath}` }] };
    }
    const content = await readFile(filePath);
    const platform = detectPlatform(filePath);
    return {
      content: [{
        type: "text",
        text: `📄 ${filePath} [${platform}]\n\n${content}`,
      }],
    };
  }
);

// ═══════════════════════════════════════════════════════════════
// HERRAMIENTA 6: Listar archivos del proyecto
// ═══════════════════════════════════════════════════════════════
server.tool(
  "list_project_files",
  "Lista archivos del proyecto por extensión o directorio",
  {
    directory: z.string().optional().default("").describe("Subdirectorio a listar, vacío = raíz del proyecto"),
    extensions: z.array(z.string()).optional().describe("Filtrar por extensiones, ej: ['.dart', '.yaml']"),
  },
  async ({ directory, extensions }) => {
    const targetDir = directory ? resolvePath(directory) : PROJECT_ROOT;
    const exists = await fs.pathExists(targetDir);
    if (!exists) {
      return { content: [{ type: "text", text: `❌ Directorio no encontrado: ${directory}` }] };
    }

    const pattern = extensions
      ? `**/*{${extensions.join(",")}}`
      : "**/*";

    const files = await glob(pattern, {
      cwd: targetDir,
      ignore: ["**/node_modules/**", "**/.git/**", "**/build/**", "**/.dart_tool/**", "**/Pods/**"],
      nodir: true,
    });

    const grouped = {};
    for (const f of files) {
      const ext = path.extname(f) || "otros";
      grouped[ext] = grouped[ext] || [];
      grouped[ext].push(f);
    }

    const lines = [`📁 Archivos en "${directory || "."}" (${files.length} total):`, ""];
    for (const [ext, list] of Object.entries(grouped).sort()) {
      lines.push(`${ext} (${list.length}):`);
      list.slice(0, 20).forEach(f => lines.push(`  ${f}`));
      if (list.length > 20) lines.push(`  ... y ${list.length - 20} más`);
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// ═══════════════════════════════════════════════════════════════
// HERRAMIENTA 7: Modificar/actualizar archivo existente
// ═══════════════════════════════════════════════════════════════
server.tool(
  "update_file_section",
  "Reemplaza una sección específica de un archivo existente (útil para agregar código sin reescribir todo el archivo)",
  {
    path: z.string().describe("Ruta relativa del archivo a modificar"),
    search: z.string().describe("Texto exacto a buscar y reemplazar"),
    replace: z.string().describe("Nuevo texto que reemplazará al anterior"),
    create_backup: z.boolean().optional().default(true).describe("Si true, crea .bak del archivo original"),
  },
  async ({ path: filePath, search, replace, create_backup }) => {
    const fullPath = resolvePath(filePath);
    const exists = await fs.pathExists(fullPath);
    if (!exists) {
      return { content: [{ type: "text", text: `❌ Archivo no encontrado: ${filePath}` }] };
    }

    const original = await fs.readFile(fullPath, "utf8");
    if (!original.includes(search)) {
      return {
        content: [{
          type: "text",
          text: `❌ Texto no encontrado en ${filePath}.\n\nBuscado:\n${search.slice(0, 200)}`,
        }],
      };
    }

    if (create_backup) {
      await fs.writeFile(fullPath + ".bak", original, "utf8");
    }

    const updated = original.replace(search, replace);
    await fs.writeFile(fullPath, updated, "utf8");

    return {
      content: [{
        type: "text",
        text: `✅ Archivo actualizado: ${filePath}${create_backup ? "\n💾 Backup guardado: " + filePath + ".bak" : ""}`,
      }],
    };
  }
);

// ═══════════════════════════════════════════════════════════════
// GENERADORES DE CÓDIGO — Templates
// ═══════════════════════════════════════════════════════════════

function generateFlutterMain(projectName, features) {
  const imports = features.map(f => {
    const pkgs = {
      notifications: "import 'package:flutter_local_notifications/flutter_local_notifications.dart';",
      gps: "import 'package:geolocator/geolocator.dart';",
      camera: "import 'package:camera/camera.dart';",
    };
    return pkgs[f] || "";
  }).filter(Boolean).join("\n");

  return `import 'package:flutter/material.dart';
${imports}
import 'core/permissions/permission_service.dart';
import 'shared/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await PermissionService.initialize();
  runApp(const ${toCamelCase(projectName)}App());
}

class ${toCamelCase(projectName)}App extends StatelessWidget {
  const ${toCamelCase(projectName)}App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${projectName}',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      home: const Scaffold(
        body: Center(child: Text('${projectName}')),
      ),
    );
  }
}
`;
}

function generateFlutterPermissions(features) {
  return `import 'package:permission_handler/permission_handler.dart';

class PermissionService {
  static Future<void> initialize() async {
    await requestAllPermissions();
  }

  static Future<void> requestAllPermissions() async {
    final permissions = <Permission>[
      ${features.includes("camera") ? "Permission.camera," : ""}
      ${features.includes("gps") ? "Permission.location," : ""}
      ${features.includes("notifications") ? "Permission.notification," : ""}
      ${features.includes("microphone") ? "Permission.microphone," : ""}
      ${features.includes("contacts") ? "Permission.contacts," : ""}
      ${features.includes("storage") ? "Permission.storage," : ""}
      ${features.includes("bluetooth") ? "Permission.bluetooth," : ""}
    ].where((p) => true).toList();

    final statuses = await permissions.request();
    statuses.forEach((permission, status) {
      if (!status.isGranted) {
        print('Permiso denegado: \$permission');
      }
    });
  }

  static Future<bool> checkPermission(Permission permission) async {
    final status = await permission.status;
    if (status.isDenied) {
      final result = await permission.request();
      return result.isGranted;
    }
    if (status.isPermanentlyDenied) {
      await openAppSettings();
      return false;
    }
    return status.isGranted;
  }
}
`;
}

function generateFlutterTheme(projectName) {
  return `import 'package:flutter/material.dart';

class AppTheme {
  static const _primary = Color(0xFF5B8EF5);
  static const _secondary = Color(0xFF3DBA7E);

  static ThemeData get light => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: _primary,
      secondary: _secondary,
    ),
    appBarTheme: const AppBarTheme(centerTitle: true),
  );

  static ThemeData get dark => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: _primary,
      secondary: _secondary,
      brightness: Brightness.dark,
    ),
  );
}
`;
}

function generateFlutterPubspec(projectName, features) {
  const featureDeps = {
    notifications: "  flutter_local_notifications: ^17.0.0",
    gps: "  geolocator: ^12.0.0",
    camera: "  camera: ^0.11.0",
    sensors: "  sensors_plus: ^4.0.2",
    biometrics: "  local_auth: ^2.3.0",
    bluetooth: "  flutter_blue_plus: ^1.32.12",
    volume: "  volume_controller: ^2.0.7",
    vibration: "  vibration: ^2.0.0",
    battery: "  battery_plus: ^6.0.1",
    contacts: "  flutter_contacts: ^1.1.9+1",
    nfc: "  flutter_nfc_kit: ^3.4.1",
    storage: "  path_provider: ^2.1.3",
  };

  const selectedDeps = features.map(f => featureDeps[f]).filter(Boolean).join("\n");

  return `name: ${toSnakeCase(projectName)}
description: Mobile app generada por Mobile Dev Agent
version: 1.0.0+1

environment:
  sdk: ">=3.0.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.6
  permission_handler: ^11.3.1
  go_router: ^13.2.0
  flutter_riverpod: ^2.5.1
  freezed_annotation: ^2.4.3
  json_annotation: ^4.9.0
${selectedDeps}

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.2
  build_runner: ^2.4.9
  freezed: ^2.5.2
  json_serializable: ^6.8.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/fonts/
`;
}

function generateRNApp(projectName) {
  return `import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}
`;
}

function generateRNNavigator() {
  return `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
`;
}

function generateRNPermissions(features) {
  return `import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';

export class PermissionsService {
  static async requestAll(): Promise<void> {
    ${features.includes("notifications") ? "await Notifications.requestPermissionsAsync();" : ""}
    ${features.includes("gps") ? "await Location.requestForegroundPermissionsAsync();" : ""}
    ${features.includes("camera") ? "await Camera.requestCameraPermissionsAsync();" : ""}
  }
}
`;
}

function generateRNTypes() {
  return `export type RootStackParamList = {
  Home: undefined;
  // Agregá tus pantallas aquí
};

export interface User {
  id: string;
  name: string;
  email: string;
}
`;
}

function generateExpoAppJson(projectName, features) {
  const iosPlugins = features.map(f => {
    const m = {
      notifications: '["expo-notifications", {"mode": "production"}]',
      gps: '"expo-location"',
      camera: '"expo-camera"',
    };
    return m[f];
  }).filter(Boolean);

  return JSON.stringify({
    expo: {
      name: projectName,
      slug: toSnakeCase(projectName),
      version: "1.0.0",
      orientation: "portrait",
      scheme: toSnakeCase(projectName),
      userInterfaceStyle: "automatic",
      ios: {
        supportsTablet: true,
        bundleIdentifier: `com.${toSnakeCase(projectName)}`,
        infoPlist: {
          ...(features.includes("camera") && { NSCameraUsageDescription: "Necesitamos acceso a tu cámara." }),
          ...(features.includes("gps") && { NSLocationWhenInUseUsageDescription: "Necesitamos tu ubicación." }),
          ...(features.includes("microphone") && { NSMicrophoneUsageDescription: "Necesitamos acceso al micrófono." }),
          ...(features.includes("contacts") && { NSContactsUsageDescription: "Necesitamos acceso a tus contactos." }),
        },
      },
      android: {
        adaptiveIcon: { backgroundColor: "#5B8EF5" },
        package: `com.${toSnakeCase(projectName)}`,
        permissions: [
          ...(features.includes("camera") ? ["CAMERA"] : []),
          ...(features.includes("gps") ? ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"] : []),
          ...(features.includes("notifications") ? ["RECEIVE_BOOT_COMPLETED", "VIBRATE"] : []),
        ],
      },
      plugins: iosPlugins.length > 0 ? iosPlugins : undefined,
    },
  }, null, 2);
}

function generateSwiftContentView(projectName) {
  return `import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationStack {
            Text("${projectName}")
                .navigationTitle("${projectName}")
        }
    }
}

#Preview {
    ContentView()
}
`;
}

function generateSwiftApp(projectName) {
  return `import SwiftUI

@main
struct ${toCamelCase(projectName)}App: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
`;
}

function generateSwiftPermissions(features) {
  return `import Foundation
import AVFoundation
${features.includes("gps") ? "import CoreLocation" : ""}
${features.includes("notifications") ? "import UserNotifications" : ""}

class PermissionsManager: ObservableObject {
    ${features.includes("gps") ? "private let locationManager = CLLocationManager()" : ""}

    func requestAll() async {
        ${features.includes("camera") ? `await requestCamera()` : ""}
        ${features.includes("gps") ? `requestLocation()` : ""}
        ${features.includes("notifications") ? `await requestNotifications()` : ""}
    }

    ${features.includes("camera") ? `
    private func requestCamera() async {
        await AVCaptureDevice.requestAccess(for: .video)
    }` : ""}

    ${features.includes("notifications") ? `
    private func requestNotifications() async {
        let center = UNUserNotificationCenter.current()
        try? await center.requestAuthorization(options: [.alert, .sound, .badge])
    }` : ""}

    ${features.includes("gps") ? `
    private func requestLocation() {
        locationManager.requestWhenInUseAuthorization()
    }` : ""}
}
`;
}

function generateKotlinMain(projectName) {
  return `package com.${projectName}

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Text("${projectName}")
                }
            }
        }
    }
}
`;
}

function generateKotlinPermissions(projectName, features) {
  const perms = features.map(f => {
    const m = {
      camera: "android.permission.CAMERA",
      gps: "android.permission.ACCESS_FINE_LOCATION",
      microphone: "android.permission.RECORD_AUDIO",
      contacts: "android.permission.READ_CONTACTS",
      storage: "android.permission.READ_EXTERNAL_STORAGE",
    };
    return m[f];
  }).filter(Boolean);

  return `package com.${projectName}.services

import android.app.Activity
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

object PermissionsHelper {
    private val REQUIRED_PERMISSIONS = arrayOf(
        ${perms.map(p => `"${p}"`).join(",\n        ")}
    )

    fun allGranted(activity: Activity): Boolean =
        REQUIRED_PERMISSIONS.all {
            ContextCompat.checkSelfPermission(activity, it) == PackageManager.PERMISSION_GRANTED
        }

    fun requestAll(activity: Activity, requestCode: Int) {
        ActivityCompat.requestPermissions(activity, REQUIRED_PERMISSIONS, requestCode)
    }
}
`;
}

function generateAndroidManifest(projectName, features) {
  const perms = generateAndroidPermissionsXml(features);
  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.${projectName}">
${perms}
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${projectName}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`;
}

function generateAndroidPermissionsXml(features) {
  const map = {
    camera: '    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />',
    gps: '    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />\n    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
    notifications: '    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n    <uses-permission android:name="android.permission.VIBRATE" />',
    microphone: '    <uses-permission android:name="android.permission.RECORD_AUDIO" />',
    bluetooth: '    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />\n    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />',
    nfc: '    <uses-permission android:name="android.permission.NFC" />\n    <uses-feature android:name="android.hardware.nfc" android:required="false" />',
    contacts: '    <uses-permission android:name="android.permission.READ_CONTACTS" />\n    <uses-permission android:name="android.permission.WRITE_CONTACTS" />',
    storage: '    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />\n    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />',
  };
  return features.map(f => map[f] || "").filter(Boolean).join("\n");
}

function getNativeImplementation(feature, platform) {
  const impls = {
    notifications: {
      flutter: {
        files: [{
          filename: "notification_service.dart",
          content: `import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iOS = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    await _plugin.initialize(
      const InitializationSettings(android: android, iOS: iOS),
    );
  }

  static Future<void> show({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'main_channel', 'Notificaciones',
      importance: Importance.max,
      priority: Priority.high,
    );
    const iOSDetails = DarwinNotificationDetails();
    await _plugin.show(
      id, title, body,
      const NotificationDetails(android: androidDetails, iOS: iOSDetails),
      payload: payload,
    );
  }

  static Future<void> schedule({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledDate,
  }) async {
    // Implementar con zonedSchedule
  }

  static Future<void> cancelAll() => _plugin.cancelAll();
}
`,
        }],
        permissions: ["Permission.notification", "Android: POST_NOTIFICATIONS", "iOS: NSUserNotificationsUsageDescription"],
        packages: ["flutter_local_notifications: ^17.0.0", "timezone: ^0.9.4"],
        notes: "Llamá NotificationService.initialize() en main() antes de runApp()",
      },
    },
    camera: {
      flutter: {
        files: [{
          filename: "camera_service.dart",
          content: `import 'package:camera/camera.dart';
import 'package:permission_handler/permission_handler.dart';

class CameraService {
  static CameraController? controller;
  static List<CameraDescription> cameras = [];

  static Future<void> initialize() async {
    final status = await Permission.camera.request();
    if (!status.isGranted) throw Exception('Permiso de cámara denegado');
    cameras = await availableCameras();
    if (cameras.isEmpty) throw Exception('No se encontraron cámaras');
    await openCamera();
  }

  static Future<void> openCamera({CameraLensDirection direction = CameraLensDirection.back}) async {
    final camera = cameras.firstWhere(
      (c) => c.lensDirection == direction,
      orElse: () => cameras.first,
    );
    controller = CameraController(camera, ResolutionPreset.high, enableAudio: false);
    await controller!.initialize();
  }

  static Future<XFile?> takePicture() async {
    if (controller == null || !controller!.value.isInitialized) return null;
    try {
      return await controller!.takePicture();
    } catch (e) {
      print('Error al tomar foto: \$e');
      return null;
    }
  }

  static Future<void> switchCamera() async {
    final current = controller?.description.lensDirection;
    final newDir = current == CameraLensDirection.back
        ? CameraLensDirection.front
        : CameraLensDirection.back;
    await openCamera(direction: newDir);
  }

  static void dispose() {
    controller?.dispose();
    controller = null;
  }
}
`,
        }],
        permissions: ["Permission.camera", "Android: CAMERA", "iOS: NSCameraUsageDescription"],
        packages: ["camera: ^0.11.0", "permission_handler: ^11.3.1"],
        notes: "Usá CameraPreview(CameraService.controller!) en tu widget para mostrar la cámara",
      },
    },
    gps: {
      flutter: {
        files: [{
          filename: "location_service.dart",
          content: `import 'package:geolocator/geolocator.dart';

class LocationService {
  static Future<Position?> getCurrentPosition() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      print('Servicios de ubicación deshabilitados');
      return null;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        print('Permiso de ubicación denegado');
        return null;
      }
    }
    if (permission == LocationPermission.deniedForever) {
      await Geolocator.openAppSettings();
      return null;
    }

    return await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
  }

  static Stream<Position> getPositionStream() =>
      Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10, // metros
        ),
      );

  static double distanceBetween(double lat1, double lon1, double lat2, double lon2) =>
      Geolocator.distanceBetween(lat1, lon1, lat2, lon2);
}
`,
        }],
        permissions: ["Permission.location", "Android: ACCESS_FINE_LOCATION", "iOS: NSLocationWhenInUseUsageDescription"],
        packages: ["geolocator: ^12.0.0"],
        notes: "Para background location también necesitás Permission.locationAlways y configuración adicional en native",
      },
    },
  };

  return (
    impls[feature]?.[platform] || {
      files: [{ filename: `${feature}_service.${getExtension(platform)}`, content: `// TODO: Implementar ${feature} para ${platform}\n` }],
      permissions: [],
      packages: [],
      notes: `Implementación de ${feature} pendiente para ${platform}`,
    }
  );
}

// ── Permission helpers ──────────────────────────────────────
function generateInfoPlistEntries(features) {
  const map = {
    camera: { key: "NSCameraUsageDescription", value: "Esta app necesita acceso a tu cámara." },
    gps: { key: "NSLocationWhenInUseUsageDescription", value: "Esta app necesita acceso a tu ubicación." },
    microphone: { key: "NSMicrophoneUsageDescription", value: "Esta app necesita acceso al micrófono." },
    contacts: { key: "NSContactsUsageDescription", value: "Esta app necesita acceso a tus contactos." },
    calendar: { key: "NSCalendarsUsageDescription", value: "Esta app necesita acceso a tu calendario." },
    bluetooth: { key: "NSBluetoothAlwaysUsageDescription", value: "Esta app necesita Bluetooth para conectarse a dispositivos." },
    nfc: { key: "NFCReaderUsageDescription", value: "Esta app usa NFC para leer etiquetas." },
    biometrics: { key: "NSFaceIDUsageDescription", value: "Esta app usa Face ID para autenticación segura." },
    health: { key: "NSHealthShareUsageDescription", value: "Esta app lee datos de salud." },
    notifications: { key: "UIBackgroundModes", value: "remote-notification" },
  };
  return features.map(f => map[f]).filter(Boolean);
}

function generateInfoPlistNote(entries) {
  return `# Entradas a agregar en Info.plist (iOS)\n\n` +
    entries.map(e => `## ${e.key}\n\`\`\`xml\n<key>${e.key}</key>\n<string>${e.value}</string>\n\`\`\``).join("\n\n");
}

function generateAndroidPermissions(features) {
  const map = {
    camera: "android.permission.CAMERA",
    gps: "android.permission.ACCESS_FINE_LOCATION",
    microphone: "android.permission.RECORD_AUDIO",
    contacts: "android.permission.READ_CONTACTS",
    storage: "android.permission.READ_EXTERNAL_STORAGE",
    bluetooth: "android.permission.BLUETOOTH_CONNECT",
    nfc: "android.permission.NFC",
    notifications: "android.permission.POST_NOTIFICATIONS",
    vibration: "android.permission.VIBRATE",
  };
  return features.map(f => map[f]).filter(Boolean);
}

function generateAndroidPermissionsNote(permissions) {
  return `# Permisos a agregar en AndroidManifest.xml\n\n` +
    `Agregá estas líneas dentro de \`<manifest>\` antes de \`<application>\`:\n\n\`\`\`xml\n` +
    permissions.map(p => `<uses-permission android:name="${p}" />`).join("\n") +
    `\n\`\`\``;
}

function generateFullInfoPlist(entries) {
  const entriesXml = entries.map(e => `\t<key>${e.key}</key>\n\t<string>${e.value}</string>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
${entriesXml}
</dict>
</plist>
`;
}

function generateFullManifest(pkg, permissions) {
  const permsXml = permissions.map(p => `    <uses-permission android:name="${p}" />`).join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
${permsXml}
    <application android:label="App" android:theme="@style/Theme.AppCompat">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`;
}

// ── String utils ─────────────────────────────────────────────
function toCamelCase(str) {
  return str.replace(/([-_\s][a-z])/g, g => g.toUpperCase().replace(/[-_\s]/, '')).replace(/^./, c => c.toUpperCase());
}
function toSnakeCase(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/[- ]/g, '_');
}
function getExtension(platform) {
  return { flutter: "dart", ios: "swift", android: "kt", "react-native": "tsx" }[platform] || "txt";
}

// ═══════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════

/* ============================================================================
* Función         : startServer
* Descripción     : Inicia el transporte stdio del MCP y registra eventos clave del ciclo de vida del proceso.
* Fecha           : 2026-03-20
* Versión         : 1.1.0
* Lenguaje        : JavaScript ESM sobre Node.js 18+
* Conexiones      : McpServer, StdioServerTransport, logLine
* Ingesta         : Sin argumentos
* Devolución      : Promise<void>
* Uso             : await startServer()
* ============================================================================ */
async function startServer() {
  process.on("unhandledRejection", (reason) => {
    const detail = reason instanceof Error ? reason.stack || reason.message : String(reason);
    logLine(`ERROR unhandledRejection: ${detail}`);
  });

  process.on("uncaughtException", (error) => {
    logLine(`ERROR uncaughtException: ${error.stack || error.message}`);
    process.exit(1);
  });

  process.on("SIGINT", () => {
    logLine("Señal SIGINT recibida. Cerrando MCP local.");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    logLine("Señal SIGTERM recibida. Cerrando MCP local.");
    process.exit(0);
  });

  process.on("exit", (code) => {
    logLine(`Proceso MCP finalizado con código ${code}.`);
  });

  process.stdin.on("end", () => {
    logLine("STDIN finalizado por el host MCP.");
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logLine("📱 Mobile Dev Agent MCP Server iniciado");
  logLine(`📁 Proyecto: ${PROJECT_ROOT}`);
  logLine(`🗂️ Archivo de log: ${LOG_FILE_PATH}`);
  logLine(
    "🔧 Herramientas disponibles: create_code_file, create_project_structure, implement_native_feature, add_permissions, read_project_file, list_project_files, update_file_section"
  );
}

await startServer();
