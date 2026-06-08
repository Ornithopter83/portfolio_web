param(
    [string]$Remote = "origin",
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

function Invoke-Git {
    param([string[]]$Arguments)

    & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
    }
}

$isRepository = (& git rev-parse --is-inside-work-tree) -eq "true"
if (-not $isRepository) {
    throw "This directory is not a Git repository: $repoRoot"
}

$currentBranch = (& git branch --show-current).Trim()
if ($currentBranch -ne $Branch) {
    throw "Current branch is '$currentBranch'. Switch to '$Branch' before pushing."
}

$dirtyStatus = (& git status --porcelain)
if ($dirtyStatus) {
    Write-Host "Commit or stash these changes before pushing:"
    $dirtyStatus | ForEach-Object { Write-Host $_ }
    throw "Working tree is not clean."
}

Invoke-Git @("push", "-u", $Remote, $Branch)

Write-Host "Pushed $Branch to $Remote."
