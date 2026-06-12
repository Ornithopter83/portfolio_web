param(
    [string]$WebAppPath = "apps/web",
    [string]$NasOutput = "artifacts/publish-nas-static",
    [string]$DeployPath,
    [switch]$NoInstall
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$webRoot = Join-Path $repoRoot $WebAppPath
$distPath = Join-Path $webRoot "dist"
$nasPath = Join-Path $repoRoot $NasOutput

function Invoke-Npm {
    param([string[]]$Arguments)

    & npm.cmd @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "npm $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
    }
}

function Invoke-WebBuild {
    $vitePath = Join-Path $repoRoot "node_modules/vite/bin/vite.js"

    if (-not (Test-Path -LiteralPath $vitePath)) {
        throw "Vite was not found. Run npm.cmd install first."
    }

    Push-Location $webRoot
    try {
        & node $vitePath "build"
        if ($LASTEXITCODE -ne 0) {
            throw "vite build failed with exit code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
}

function Resolve-SafeDeployPath {
    param([string]$Path)

    $resolvedPath = if (Test-Path -LiteralPath $Path) {
        (Resolve-Path -LiteralPath $Path).Path
    }
    else {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
        (Resolve-Path -LiteralPath $Path).Path
    }

    $rootPath = [System.IO.Path]::GetPathRoot($resolvedPath).TrimEnd("\")
    $trimmedPath = $resolvedPath.TrimEnd("\")

    if ($trimmedPath -eq $rootPath) {
        throw "DeployPath must not be a drive root: $resolvedPath"
    }

    return $resolvedPath
}

if (-not (Test-Path -LiteralPath $webRoot)) {
    throw "React web app was not found: $webRoot"
}

if (-not $NoInstall) {
    Invoke-Npm @("install")
}

Invoke-WebBuild

if (-not (Test-Path -LiteralPath $distPath)) {
    throw "React build output was not found: $distPath"
}

if (Test-Path -LiteralPath $nasPath) {
    Remove-Item -LiteralPath $nasPath -Recurse -Force
}

New-Item -ItemType Directory -Path $nasPath | Out-Null
Get-ChildItem -LiteralPath $distPath -Force | Copy-Item -Destination $nasPath -Recurse -Force

Get-ChildItem -LiteralPath $nasPath -Recurse -Force -File |
    Where-Object { $_.Extension -eq ".br" -or $_.Extension -eq ".gz" } |
    ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }

Write-Host "NAS static output prepared: $nasPath"

if ($DeployPath) {
    $resolvedDeployPath = Resolve-SafeDeployPath $DeployPath

    $appEntriesToReplace = @(
        "assets",
        "models",
        "index.html",
        "manifest.webmanifest",
        "sw.js",
        "icon-192.png",
        "favicon.png"
    )

    foreach ($entry in $appEntriesToReplace) {
        $targetPath = Join-Path $resolvedDeployPath $entry
        if (Test-Path -LiteralPath $targetPath) {
            Remove-Item -LiteralPath $targetPath -Recurse -Force
        }
    }

    Get-ChildItem -LiteralPath $nasPath -Force |
        Copy-Item -Destination $resolvedDeployPath -Recurse -Force

    Get-ChildItem -LiteralPath $resolvedDeployPath -Recurse -Force -File |
        Where-Object {
            $_.FullName -notlike "*Network Trashes Folder*" -and
            ($_.Extension -eq ".br" -or $_.Extension -eq ".gz")
        } |
        ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }

    foreach ($requiredPath in @(
        (Join-Path $resolvedDeployPath "index.html"),
        (Join-Path $resolvedDeployPath "sw.js"),
        (Join-Path $resolvedDeployPath "manifest.webmanifest")
    )) {
        if (-not (Test-Path -LiteralPath $requiredPath)) {
            throw "Deploy output is missing required file: $requiredPath"
        }
    }

    Write-Host "NAS static output copied to: $resolvedDeployPath"
}
else {
    Write-Host "Upload all contents of this directory to /HDD1/DocRoot."
    Write-Host "Or run with -DeployPath S:\HDD1\DocRoot to copy through ipDISK Drive."
}
