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

function Assert-GitRepository {
    $isRepository = (& git rev-parse --is-inside-work-tree 2>$null) -eq "true"
    if (-not $isRepository) {
        throw "This directory is not a Git repository: $repoRoot"
    }

    $topLevel = (& git rev-parse --show-toplevel).Trim()
    if ((Resolve-Path $topLevel).Path -ne $repoRoot.Path) {
        throw "Git repository root is '$topLevel', expected '$repoRoot'."
    }
}

Assert-GitRepository

if (-not $SkipDeploy) {
    $publishArgs = @{
        DeployPath = $DeployPath
        NoRestore = $NoRestore
    }

    Write-Host "Publishing Release build and copying NAS output..."
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
