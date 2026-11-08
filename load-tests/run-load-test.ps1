param (
    [ValidateSet("quick", "smoke", "huge", "random", "1k", "5k", "10k", "50k", "custom")]
    [string]$Scenario = "huge",
    [string]$TargetUrl = "http://localhost:5000",
    [int]$VUs = 100,
    [string]$Duration = "30s"
)

$k6Path = Join-Path $PSScriptRoot "bin\k6.exe"

if (-not (Test-Path $k6Path)) {
    Write-Error "k6 binary not found at $k6Path"
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   E-Commerce Production Load Testing (Engine: k6)         " -ForegroundColor Cyan
Write-Host "   Target URL : $TargetUrl" -ForegroundColor Cyan
Write-Host "   Scenario   : $Scenario" -ForegroundColor Cyan
if ($Scenario -eq "custom" -or $Scenario -eq "random") {
    Write-Host "   VUs        : $VUs" -ForegroundColor Cyan
    Write-Host "   Duration   : $Duration" -ForegroundColor Cyan
}
Write-Host "==========================================================" -ForegroundColor Cyan

$scriptFile = Join-Path $PSScriptRoot "user-journey-10k.js"
$hugeScript = Join-Path $PSScriptRoot "huge-random-activity-test.js"

switch ($Scenario) {
    "quick" {
        & $k6Path run --vus 100 --duration 30s -e BASE_URL="$TargetUrl" "$scriptFile"
    }
    "smoke" {
        $smokeScript = Join-Path $PSScriptRoot "smoke-test.js"
        & $k6Path run -e BASE_URL="$TargetUrl" "$smokeScript"
    }
    "huge" {
        # Full Staged Huge Activity Journey (Warmup -> 200 -> 500 Peak)
        & $k6Path run -e BASE_URL="$TargetUrl" "$hugeScript"
    }
    "random" {
        # User defined random activity with custom VUs and duration
        & $k6Path run --vus $VUs --duration $Duration -e BASE_URL="$TargetUrl" "$hugeScript"
    }
    "1k" {
        & $k6Path run --vus 1000 --duration 1m -e BASE_URL="$TargetUrl" "$scriptFile"
    }
    "5k" {
        & $k6Path run --vus 5000 --duration 2m -e BASE_URL="$TargetUrl" "$scriptFile"
    }
    "10k" {
        # Full 10,000 Virtual Users staged journey (Warmup -> 1k -> 3k -> 5k -> 10k Peak)
        & $k6Path run -e BASE_URL="$TargetUrl" "$scriptFile"
    }
    "50k" {
        & $k6Path run --vus 50000 --duration 2m -e BASE_URL="$TargetUrl" "$scriptFile"
    }
    "custom" {
        & $k6Path run --vus $VUs --duration $Duration -e BASE_URL="$TargetUrl" "$scriptFile"
    }
}
