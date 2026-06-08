param(
    [string]$DeployPath = "S:\HDD1\DocRoot",
    [string]$Remote = "origin",
    [string]$Branch = "main",
    [switch]$NoRestore,
    [switch]$SkipDeploy,
    [switch]$SkipPush
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$publishScript = Join-Path $PSScriptRoot "publish-nas.ps1"
$pushScript = Join-Path $PSScriptRoot "push-main.ps1"

Set-Location $repoRoot

if (-not $SkipDeploy) {
    $publishArgs = @("-File", $publishScript, "-DeployPath", $DeployPath)

    if ($NoRestore) {
        $publishArgs += "-NoRestore"
    }

    & powershell -ExecutionPolicy Bypass @publishArgs
    if ($LASTEXITCODE -ne 0) {
        throw "NAS publish/deploy failed with exit code $LASTEXITCODE."
    }
}

if (-not $SkipPush) {
    & powershell -ExecutionPolicy Bypass -File $pushScript -Remote $Remote -Branch $Branch
    if ($LASTEXITCODE -ne 0) {
        throw "Git push failed with exit code $LASTEXITCODE."
    }
}

Write-Host "NAS deploy and Git push flow completed."
