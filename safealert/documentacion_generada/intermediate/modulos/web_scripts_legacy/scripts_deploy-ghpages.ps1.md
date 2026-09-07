# Archivo: scripts/deploy-ghpages.ps1

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | scripts/deploy-ghpages.ps1 |
| Líneas totales | 113 |
| Lenguaje | PowerShell 7+ |
| Tamaño (bytes) | 3930 |
| Categoría | Script de despliegue (build web + GitHub Pages) |
| Estado detectado | CÓDIGO LEGADO / APARENTEMENTE NO UTILIZADO en el pipeline vigente |
| Nivel de certeza | Altamente probable |

## Objetivo

Automatiza: (1) `npm run web:build`, (2) preparación de un repositorio temporal con el contenido de `dist/` bajo un subdirectorio `safealert/`, (3) un `index.html` raíz de redirección, (4) publicación forzada en la rama `gh-pages` del remoto `origin`, con fallback manual. Está pensado para el esquema GitHub Pages "usuario/organización" del repositorio `Claude_Code_trabajos` de la cuenta `oaf2023`, sirviendo la PWA en `https://oaf2023.github.io/Claude_Code_trabajos/safealert/`.

## Clasificación y estado

Etiqueta: `CÓDIGO LEGADO` (esquema de subdirectorio) / `APARENTEMENTE NO UTILIZADO` con `[POTENCIALMENTE NO UTILIZADO]` como herramienta invocable.

No hay referencias en `package.json`, CI ni docs del repo (grep global solo lo halla en sí mismo y en inventarios generados). No obstante, es coherente con las rutas legadas de `public/manifest.json`, `public/sw.js` y `scripts/patch-import-meta.js` (todas con prefijo `/Claude_Code_trabajos/safealert`), lo que indica que fue el mecanismo de publicación usado en la etapa PWA "Fase A" (ver `informe_tecnico.html`, commit 0022). `[NIVEL DE CERTEZA: Altamente probable]`.

## Dependencias e importaciones

| Dependencia | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `npm` (web:build) | externa (herramienta) | Línea 25 | Sí (si se ejecuta) |
| `git` | externa (herramienta) | Líneas 51–52, 78–83, 96–98 | Sí |
| `npx gh-pages` | externa (npm) | Línea 90 | Sí (ruta principal) |
| Cmdlets de PowerShell | estándar | Todo el script | Sí |

## Componentes que dependen de este archivo

Ninguno activo en el repo. Relación histórica con: `public/manifest.json`, `public/sw.js`, `scripts/patch-import-meta.js` (comparten el prefijo `/Claude_Code_trabajos/safealert` y la URL `https://oaf2023.github.io/Claude_Code_trabajos/safealert/`).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| ErrorActionPreference | `"Stop"` | string | Fallo rápido ante errores | 12 |
| ROOT | padre de `PSScriptRoot` | string | Raíz del proyecto | 13, 24–25, 31, 47 |
| DIST | `ROOT/dist` | string | Build web | 14, 34, 43, 60 |
| REMOTE | `"origin"` | string | Remoto git | 15, 89 |
| BRANCH | `"gh-pages"` | string | Rama de publicación | 16, 52, 82, 89, 97 |
| TEMP_DIR | `$env:TEMP/safealert-ghpages-<timestamp>` | string | Repo temporal de deploy | 42–43, 50–51, 56–60, 75–79, 109 |
| DEPLOY_SUB | `TEMP_DIR/safealert` | string | Subdirectorio con el build | 56–60 |
| ROOT_INDEX | HTML de redirección (here-doc) | string | `index.html` raíz del branch | 63–75 |

URLs y cuentas hardcodeadas: `https://oaf2023.github.io/Claude_Code_trabajos/safealert/` (líneas 93, 101), `https://github.com/oaf2023/Claude_Code_trabajos/settings/pages` (línea 112).

## Estructura (funciones / clases / tipos)

Sin funciones: script lineal de 4 fases con `Write-Host` de progreso. Sin clases ni tipos.

## Análisis línea por línea

```powershell
/* ============================================================================

* Archivo         : scripts/deploy-ghpages.ps1
* Descripción     : Build web + deploy a GitHub Pages (gh-pages branch).
* Autor           : oafon
* Fecha           : 2026-08-26
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7+
* Uso             : .\scripts\deploy-ghpages.ps1
* ============================================================================ */

$ErrorActionPreference = "Stop"
$ROOT = Split-Path $PSScriptRoot -Parent
$DIST = Join-Path $ROOT "dist"
$REMOTE = "origin"
$BRANCH = "gh-pages"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SafeAlert — Deploy a GitHub Pages" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Build
Write-Host "`n[1/4] Ejecutando web:build..." -ForegroundColor Yellow
Push-Location $ROOT
npm run web:build
if ($LASTEXITCODE -ne 0) {
    Write-Error "web:build fallo"
    Pop-Location
    exit 1
}
Pop-Location

# 2. Verificar que dist/ existe
if (-not (Test-Path $DIST)) {
    Write-Error "Directorio dist/ no encontrado"
    exit 1
}
```

**Explicación de las líneas 1–37:**

- **Líneas 1–10**: cabecera estándar del proyecto. Obsérvese que usa comentario de bloque `/* */` (estilo C), válido en PowerShell solo como comentario de bloque `#`... en realidad `/* */` NO es comentario válido en PowerShell: `/*` se interpreta como división por falta de operando y lanzaría error. `[OBSERVACIÓN TÉCNICA]` (líneas 1–10): esta cabecera rompería la ejecución del script en PowerShell 7 (el parser trataría `/*` como operador de división). `[NIVEL DE CERTEZA: Confirmado por código]` — a diferencia de los scripts `New-*.ps1` que sí usan `<# #>`, aquí se copió la cabecera de un archivo JS. Verificar si el script llegó a ejecutarse alguna vez tal cual.
- **Línea 12**: `$ErrorActionPreference = "Stop"`.
- **Líneas 13–16**: constantes ROOT/DIST/REMOTE/BRANCH.
- **Líneas 18–20**: banner.
- **Líneas 23–31** (fase 1/4): corre `npm run web:build`; si el exit code no es 0, `Write-Error` (con `ErrorActionPreference=Stop` se lanza) y sale con 1. `Pop-Location` antes de salir.
- **Líneas 33–37** (fase 2/4, verificación): exige `dist/`.

```powershell
Write-Host "`n[2/4] Preparando gh-pages..." -ForegroundColor Yellow

# 3. Crear branch gh-pages temporal
$TEMP_DIR = Join-Path $env:TEMP "safealert-ghpages-$(Get-Date -Format 'yyyyMMddHHmmss')"
Copy-Item -Path $DIST -Destination $TEMP_DIR -Recurse -Force

# Copiar archivos PWA al root del deploy (fuera de safealert/)
#因为在 GitHub Pages el repo es raí, necesitamos copiar el contenido de dist/ a safealert/ dentro del branch
Push-Location $ROOT

# Inicializar repo temporal en TEMP_DIR
Push-Location $TEMP_DIR
git init -q
git checkout -q -b $BRANCH
Pop-Location

# Copiar dist/ contenido a TEMP_DIR/safealert/
$DEPLOY_SUB = Join-Path $TEMP_DIR "safealert"
if (-not (Test-Path $DEPLOY_SUB)) {
    New-Item -ItemType Directory -Path $DEPLOY_SUB -Force | Out-Null
}
Copy-Item -Path (Join-Path $DIST "*") -Destination $DEPLOY_SUB -Recurse -Force

# Crear index.html en raíz que redirija a /safealert/
$ROOT_INDEX = @"
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="refresh" content="0;url=/Claude_Code_trabajos/safealert/">
<title>SafeAlert</title>
</head>
<body>
<p>Redirigiendo a <a href="/Claude_Code_trabajos/safealert/">SafeAlert</a>...</p>
</body>
</html>
"@
Set-Content -Path (Join-Path $TEMP_DIR "index.html") -Value $ROOT_INDEX -Encoding UTF8
```

**Explicación de las líneas 39–75:**

- **Línea 42**: crea un directorio temporal único con timestamp.
- **Línea 43**: copia `dist/` completo al temporal.
- **Línea 46**: `[NOTA]` comentario en chino (sin traducción): "porque en GitHub Pages el repo es la raíz, necesitamos copiar el contenido de dist/ a safealert/ dentro del branch". Indica ediciones apresuradas multilingües. `[OBSERVACIÓN TÉCNICA]` (calidad de mantenimiento).
- **Líneas 49–53**: `git init` + branch `gh-pages` dentro del temporal.
- **Líneas 56–60**: crea `TEMP_DIR/safealert/` y copia allí el contenido de `dist/`. Resultado: el branch sirve la PWA en `/Claude_Code_trabajos/safealert/`.
- **Líneas 63–75**: genera el `index.html` raíz del branch con `meta refresh` hacia `/Claude_Code_trabajos/safealert/` y un enlace alternativo. Ruta del subdirectorio hardcodeada (coherente con `manifest.json`/`sw.js`).

```powershell
# Commit
Push-Location $TEMP_DIR
git add -A
git commit -q -m "deploy: SafeAlert PWA a GitHub Pages"
Write-Host "[3/4] Push a $REMOTE/$BRANCH..." -ForegroundColor Yellow
git push -q --force "$((git remote get-url origin 2>$null) -replace '\.git$','').git" $BRANCH 2>$null
Pop-Location

# 4. Deploy con gh-pages npm package como fallback
Write-Host "`n[4/4] Deploy..." -ForegroundColor Yellow

# Usar npx gh-pages
$npxCmd = "npx gh-pages -d `"$TEMP_DIR`" -r `"$REMOTE`" -b `"$BRANCH`" --dotfiles"
Invoke-Expression $npxCmd
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDeploy completado!" -ForegroundColor Green
    Write-Host "URL: https://oaf2023.github.io/Claude_Code_trabajos/safealert/" -ForegroundColor Cyan
} else {
    Write-Warning "npx gh-pages fallo. Intentando push manual..."
    Push-Location $TEMP_DIR
    git push --force "origin" "$BRANCH"
    Pop-Location
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nDeploy completado (manual)!" -ForegroundColor Green
        Write-Host "URL: https://oaf2023.github.io/Claude_Code_trabajos/safealert/" -ForegroundColor Cyan
    } else {
        Write-Error "Deploy fallo"
        exit 1
    }
}

# Limpiar
Remove-Item -Path $TEMP_DIR -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "`nSiguiente paso: habilitar GitHub Pages en:" -ForegroundColor Yellow
Write-Host "https://github.com/oaf2023/Claude_Code_trabajos/settings/pages" -ForegroundColor White
Write-Host "Source: Branch 'gh-pages' / Folder '/ (root)'" -ForegroundColor White
```

**Explicación de las líneas 77–113:**

- **Líneas 78–83**: `git add -A` + commit + push forzado a la URL del remoto `origin` obtenida con `git remote get-url origin` (solo funciona si el repo raíz tiene remoto; el push se hace DESDE el repo temporal que no tiene remoto configurado, pero se pasa la URL explícita). `--force` sobrescribe el historial de `gh-pages` (práctica común en Pages pero destructiva). Los errores se silencian con `2>$null`; el resultado se decide por exit code del push.
- **Línea 89**: construye comando `npx gh-pages -d "<TEMP_DIR>" -r origin -b gh-pages --dotfiles`.
- **Línea 90**: `Invoke-Expression $npxCmd` ejecuta la cadena. `[OBSERVACIÓN TÉCNICA]`: usar `Invoke-Expression` con cadenas es frágil (espacios/quoting en rutas temporales); aquí no hay entrada de usuario, riesgo bajo, pero la práctica es desaconsejable.
- **Líneas 91–106**: si `npx gh-pages` falla (exit != 0), intenta push manual desde el temporal: `git push --force "origin" "$BRANCH"` — nota: usa el remoto `origin` del repo TEMPORAL, que no tiene remoto configurado (el `git init` de la línea 51 no añadió remotos); este fallback solo funcionaría si existiera config global/remoto heredado o si el primer push ya hubiera dejado la URL. `[OBSERVACIÓN TÉCNICA]` (línea 97): fallback probablemente inoperante tal como está.
- **Líneas 108–109**: limpieza del temporal (con `-ErrorAction SilentlyContinue`).
- **Líneas 111–113**: instrucciones finales para habilitar GitHub Pages en la UI, con URL de la cuenta `oaf2023` hardcodeada.

## Fichas de funciones y métodos

No aplica (script lineal sin funciones).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` (líneas 1–10): la cabecera usa `/* ... */` (comentario de bloque de C/JS), que en PowerShell no es sintaxis de comentario: `/*` se evaluaría como división y el script fallaría al arrancar. Contraste: los scripts `New-*.ps1` usan `<# #>` correctamente. Si este script se ejecutó alguna vez, debió ser con la cabecera modificada o copiada sin ese bloque. `[NIVEL DE CERTEZA: Confirmado por código]` (el parser de PowerShell rechaza `/*` fuera de contexto aritmético).
- `[OBSERVACIÓN TÉCNICA]` (línea 46): comentario mezclado en chino, señal de edición apresurada.
- `[OBSERVACIÓN TÉCNICA]` (línea 97): el fallback de push manual usa `"origin"` en el repo temporal sin remoto configurado; probablemente inoperante.
- `[NOTA]`: fuerza push sobre `gh-pages` (destructivo sobre el historial del branch).
- `[NOTA]`: hardcodea cuenta de GitHub (`oaf2023`) y nombre de repositorio (`Claude_Code_trabajos`) en múltiples líneas; el esquema solo aplica a ese repositorio.
- `[POTENCIALMENTE NO UTILIZADO]`: sin invocación en package.json/CI/docs.

## Seguridad

- `[INFORMATIVO]` (líneas 93, 101, 112): expone cuenta y repositorio GitHub del desarrollador; datos de entorno, no credenciales.
- `[INFORMATIVO]` (línea 90): `Invoke-Expression` con cadena estática (sin entrada de usuario): riesgo bajo de inyección.
- `[INFORMATIVO]` (línea 82): push con `--force`; riesgo operacional de pérdida de historial del branch de publicación.
- No se manejan secretos ni tokens (el push depende de las credenciales git locales del usuario).

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Operacional alto: esquema de publicación ligado a un subdirectorio `/Claude_Code_trabajos/safealert/` que hoy contradice la base `/` configurada en `app.json`; publicar con este script produciría una PWA cuyo manifest/SW apuntan a rutas inexistentes si el repositorio destino cambia.
- `[RIESGO]` Medio: cabecera inválida en PowerShell (`/*`) impediría la ejecución tal cual; verificar antes de cualquier uso.
- `[RIESGO]` Medio: `--force` sobre `gh-pages` sin respaldo.
- `[RECOMENDACIÓN]`: si se retoma el despliegue web, migrar a GitHub Actions (workflow Pages) que use `baseUrl` parametrizada, o fijar repositorio Page de proyecto con la base correcta; eliminar/archivar este script y los prefijos legados.
- `[RECOMENDACIÓN]`: reemplazar `Invoke-Expression` por invocación directa (`& npx gh-pages ...`) y añadir verificación de que `filePath` destino coincida con la base declarada en `app.json`.
