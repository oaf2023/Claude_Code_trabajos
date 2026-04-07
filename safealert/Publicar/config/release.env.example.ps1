<# ============================================================================

* Archivo         : release.env.example.ps1
* Descripción     : Plantilla local para definir variables de firma release usadas por la carpeta Publicar.
* Autor           : oafon
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Uso             : Copiar a release.env.ps1 y completar los valores reales.
* ============================================================================ #>

$env:MYAPP_RELEASE_STORE_FILE = 'C:\secure\safealert-release.keystore'
$env:MYAPP_RELEASE_STORE_PASSWORD = 'COMPLETAR_PASSWORD'
$env:MYAPP_RELEASE_KEY_ALIAS = 'safealert-release'
$env:MYAPP_RELEASE_KEY_PASSWORD = 'COMPLETAR_PASSWORD'