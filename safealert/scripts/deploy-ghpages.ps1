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
