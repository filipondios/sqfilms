$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$venvPython = Join-Path $scriptDir "venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    throw "No se encontró el entorno virtual en $venvPython"
}

& $venvPython .\main.py -p .\data\reviews.db
