# Uso (na raiz do projeto):  .\scripts\run-all.ps1  [-WithLighthouse] [-SkipBuild]
param(
  [switch]$WithLighthouse,
  [switch]$SkipBuild
)

Set-Location (Split-Path $PSScriptRoot -Parent)
if (-not (Test-Path package.json)) { Write-Host "package.json nao encontrado." -ForegroundColor Red; exit 1 }

$results = @()
function Step([string]$name, [scriptblock]$cmd) {
  Write-Host ""
  Write-Host "=== $name ===" -ForegroundColor Cyan
  & $cmd
  $ok = ($LASTEXITCODE -eq 0)
  $script:results += [pscustomobject]@{ Etapa = $name; Resultado = $(if ($ok) { 'OK' } else { 'FALHOU' }) }
  if (-not $ok) {
    Write-Host "FALHOU: $name" -ForegroundColor Red
    $script:results | Format-Table -AutoSize
    exit 1
  }
}

Step 'Tipos (tsc -b)'              { npx tsc -b }
Step 'Lint'                        { npm run lint }
if (-not $SkipBuild) {
  Step 'Build de producao'         { npm run build }
}
Step 'Playwright (desktop+mobile)' { npx playwright test --timeout=30000 }
if ($WithLighthouse) {
  Step 'Lighthouse'                { npm run lighthouse }
}

Write-Host ""
Write-Host "=== Resumo ===" -ForegroundColor Green
$results | Format-Table -AutoSize
Write-Host "Tudo certo. Relatorio: npx playwright show-report"