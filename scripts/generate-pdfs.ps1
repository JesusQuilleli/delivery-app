# scripts/generate-pdfs.ps1
# Script para compilar documentos HTML a PDF usando Microsoft Edge headless

param(
  [string]$SourceHtml = "",
  [string]$OutputFile = ""
)

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
  $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

if (-not (Test-Path $edgePath)) {
  Write-Error "No se encontro Microsoft Edge en las rutas estandar."
  exit 1
}

$root = Resolve-Path "$PSScriptRoot\.."

if ($SourceHtml -and $OutputFile) {
  $resolvedHtml = Resolve-Path $SourceHtml
  $htmlUrl = "file:///$($resolvedHtml.Path.Replace('\', '/'))"
  Write-Host "Generando PDF desde: $resolvedHtml -> $OutputFile"
  Start-Process -FilePath $edgePath -ArgumentList "--headless", "--disable-gpu", "--no-pdf-header-footer", "--run-all-compositor-stages-before-draw", "--print-to-pdf=`"$OutputFile`"", "`"$htmlUrl`"" -Wait
  if (Test-Path $OutputFile) {
    Write-Host "PDF generado con exito: $OutputFile ($( (Get-Item $OutputFile).Length ) bytes)"
  } else {
    Write-Error "Fallo la generacion de $OutputFile"
  }
  exit 0
}

# Generacion por defecto de documentos conocidos
$documents = @(
  @{
    Html = "$root\docs\demo\accesos-demo.html"
    Pdf  = "$root\Accesos_Demo_TiendaFast.pdf"
    Name = "Accesos Demo y Guion Comercial"
  }
)

foreach ($doc in $documents) {
  if (Test-Path $doc.Html) {
    $resolved = Resolve-Path $doc.Html
    $htmlUrl = "file:///$($resolved.Path.Replace('\', '/'))"
    Write-Host "Compilando $($doc.Name)..."
    Start-Process -FilePath $edgePath -ArgumentList "--headless", "--disable-gpu", "--no-pdf-header-footer", "--run-all-compositor-stages-before-draw", "--print-to-pdf=`"$($doc.Pdf)`"", "`"$htmlUrl`"" -Wait
    if (Test-Path $doc.Pdf) {
      Write-Host "  -> Generado: $($doc.Pdf) ($( (Get-Item $doc.Pdf).Length ) bytes)"
    } else {
      Write-Warning "  -> No se pudo generar $($doc.Pdf)"
    }
  } else {
    Write-Warning "No existe el archivo origen: $($doc.Html)"
  }
}
