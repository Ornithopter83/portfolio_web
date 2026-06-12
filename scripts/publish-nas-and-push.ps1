param(
    [string]$DeployPath = "S:\HDD1\DocRoot",
    [string]$Remote = "origin",
    [string]$Branch = "main",
    [switch]$NoInstall,
    [switch]$SkipDeploy,
    [switch]$SkipPush
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$publishScript = Join-Path $PSScriptRoot "publish-nas.ps1"
$pushScript = Join-Path $PSScriptRoot "push-main.ps1"

Set-Location $repoRoot

function Assert-GitRepository {
    $isRepository = (& git rev-parse --is-inside-work-tree 2>$null) -eq "true"
    if (-not $isRepository) {
        throw "This directory is not a Git repository: $repoRoot"
    }

    $topLevel = (& git rev-parse --show-toplevel).Trim()
    if (-not $topLevel) {
        throw "Git repository root could not be resolved."
    }
}

Assert-GitRepository

if (-not $SkipDeploy) {
    $publishArgs = @{
        DeployPath = $DeployPath
        NoInstall = $NoInstall
    }

    Write-Host "Building React static app and copying NAS output..."
    & $publishScript @publishArgs
    if ($LASTEXITCODE -ne 0) {
        throw "NAS publish/deploy failed with exit code $LASTEXITCODE."
    }
}

if (-not $SkipPush) {
    Write-Host "Pushing clean Git repository..."
    & $pushScript -Remote $Remote -Branch $Branch
    if ($LASTEXITCODE -ne 0) {
        throw "Git push failed with exit code $LASTEXITCODE."
    }
}

Write-Host "NAS deploy and Git push flow completed."
