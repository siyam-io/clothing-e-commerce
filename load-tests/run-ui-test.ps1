param (
    [ValidateSet("ui-only", "hybrid")]
    [string]$Mode = "hybrid",
    [string]$FrontendUrl = "http://localhost:3000",
    [string]$BackendUrl = "http://localhost:5000"
)

$k6Path = Join-Path $PSScriptRoot "bin\k6.exe"
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

if (-not (Test-Path $chromePath)) {
    $chromePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
}

$env:K6_BROWSER_EXECUTABLE_PATH = $chromePath
$env:K6_BROWSER_HEADLESS = "true"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Frontend UI & Core Web Vitals Stress Testing (k6/Chrome)" -ForegroundColor Cyan
Write-Host "   Mode         : $Mode" -ForegroundColor Cyan
Write-Host "   Frontend URL : $FrontendUrl" -ForegroundColor Cyan
Write-Host "   Backend URL  : $BackendUrl" -ForegroundColor Cyan
Write-Host "   Browser Exec : $chromePath" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if ($Mode -eq "ui-only") {
    $script = Join-Path $PSScriptRoot "ui-browser-test.js"
} else {
    $script = Join-Path $PSScriptRoot "hybrid-ui-stress-test.js"
}

& $k6Path run -e WEB_BASE="$FrontendUrl" -e API_BASE="$BackendUrl" "$script"

