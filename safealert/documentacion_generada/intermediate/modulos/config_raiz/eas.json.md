# Archivo: eas.json

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| eas.json | 34 | JSON (EAS Build/Submit) | 629 | Configuración de builds EAS y submit | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Configura los perfiles de compilación de EAS Build (`preview`, `development`, `production`) y de envío a tiendas (EAS Submit) para SafeAlert. Determina el tipo de cliente de desarrollo, la distribución, el tipo de artefacto Android (APK vs AAB), el aprovisionamiento iOS y la fuente de versionado de la app.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Los scripts de `package.json` (`build:android:preview`, `build:android:production`) invocan `eas build` con perfiles definidos aquí. [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

No importa módulos. Relacionado con: `package.json` (scripts EAS), `app.json` (config de la app), cuenta EAS (`owner` y `extra.eas.projectId` en `app.json`).

## Componentes que dependen de este archivo

- `package.json` líneas 8-9 (perfiles `preview` y `production`).
- EAS CLI al ejecutar `eas build`/`eas submit`.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `cli.version` | `>= 16.18.0` | string | Versión mínima de EAS CLI | Línea 3 |
| `cli.appVersionSource` | `remote` | string | La versión de app la gestiona EAS en remoto | Línea 4 |
| `build.preview.developmentClient` | `false` | boolean | Preview NO usa client de desarrollo | Línea 8 |
| `build.preview.distribution` | `internal` | string | Distribución interna (testers) | Línea 9 |
| `build.preview.android.buildType` | `apk` | string | Artefacto APK instalable directo | Líneas 10-12 |
| `build.preview.ios.enterpriseProvisioning` | `adhoc` | string | Provisioning ad-hoc iOS | Líneas 13-15 |
| `build.development.developmentClient` | `true` | boolean | Client de desarrollo | Línea 18 |
| `build.production.distribution` | `store` | string | Distribución a tienda | Línea 25 |
| `build.production.android.buildType` | `app-bundle` | string | AAB para Play Store | Líneas 26-28 |

## Estructura (funciones / clases / tipos)

No aplica. Estructura JSON: `cli`, `build` (perfiles `preview`, `development`, `production`), `submit`.

## Análisis línea por línea

```json
{
  "cli": {
    "version": ">= 16.18.0",
    "appVersionSource": "remote"
  },
  "build": {
    "preview": {
      "developmentClient": false,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "enterpriseProvisioning": "adhoc"
      }
    },
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "enterpriseProvisioning": "adhoc"
      }
    },
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Explicación de las líneas 1–34:**

- **Línea 3**: `cli.version >= 16.18.0` — exige una versión mínima de la CLI de EAS.
- **Línea 4**: `appVersionSource: remote` — EAS gestiona `version`/`buildNumber`/`versionCode` en remoto (los incrementa automáticamente). Interactúa con `app.json` (`version: 1.2.0`, `versionCode: 4`).
- **Líneas 7-16**: perfil `preview`:
  - **Línea 8**: `developmentClient: false` — build autónomo, no requiere Expo Go/dev client.
  - **Línea 9**: `distribution: internal` — para testers internos (instalación directa).
  - **Líneas 10-12**: Android con `buildType: apk` (APK instalable manualmente; NO sirve para Play Store).
  - **Líneas 13-15**: iOS con `enterpriseProvisioning: adhoc` (instalación por UDID, sin pasar por TestFlight necesariamente).
- **Líneas 17-23**: perfil `development`:
  - **Línea 18**: `developmentClient: true` — genera el client de desarrollo (Expo dev client) para desarrollo nativo local.
  - **Línea 19**: `distribution: internal`.
  - **Líneas 20-22**: iOS adhoc para el dev client.
- **Líneas 24-29**: perfil `production`:
  - **Línea 25**: `distribution: store` — build elegible para tiendas.
  - **Líneas 26-28**: Android con `buildType: app-bundle` (AAB requerido por Google Play).
- **Líneas 31-33**: `submit.production` vacío: config de EAS Submit sin opciones adicionales (usaría valores por defecto/credenciales de las consolas).

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Con `appVersionSource: remote`, EAS puede sobrescribir la versión local de `app.json` en el servidor; hay que mantener sincronía con lo publicado en Play Console/App Store (ver `app.json.md`).
- [OBSERVACIÓN TÉCNICA] El perfil `preview` en iOS usa adhoc: requiere registrar los UDID de los dispositivos de test en EAS.
- [NOTA] No se define `env`, `node` ni `credentialsSource` explícitos: se usan los valores por defecto de EAS (credenciales gestionadas por EAS).

## Seguridad

- [INFORMATIVO] No hay secretos en el archivo. Las credenciales de firma las gestiona EAS en remoto (no en el repo).
- [INFORMATIVO] Distribución `internal` + adhoc: el APK/AAB resultante debe distribuirse solo a testers autorizados; un APK de preview contiene la misma lógica y claves públicas de Firebase que el de producción (no añade secretos nuevos).

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Documentar el flujo de versionado remoto para evitar discrepancias entre `app.json`, Play Console y App Store.
- [RECOMENDACIÓN] Considerar fijar `node` (versión de Node en el build) y `env` por perfil si los builds requieren consistencia de entorno (p. ej. `EXPO_PUBLIC_ENVIRONMENT`).
- [RECOMENDACIÓN] Revisar periódicamente la versión mínima de EAS CLI frente a la instalada en CI.
