param(
    [string]$Configuration = "Release",
    [string]$PublishOutput = "artifacts/publish/web",
    [string]$NasOutput = "artifacts/publish-nas-no-underscore",
    [string]$DeployPath,
    [switch]$NoRestore
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$solutionPath = Join-Path $repoRoot "PortfolioLauncher.sln"
$projectPath = Join-Path $repoRoot "src/PortfolioLauncher.Web/PortfolioLauncher.Web.csproj"
$nugetConfigPath = Join-Path $repoRoot "NuGet.Config"
$publishPath = Join-Path $repoRoot $PublishOutput
$nasPath = Join-Path $repoRoot $NasOutput
$sourceRoot = Join-Path $publishPath "wwwroot"

function Invoke-DotNet {
    param([string[]]$Arguments)

    & dotnet @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "dotnet $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
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

if (-not $NoRestore) {
    Invoke-DotNet @("restore", $solutionPath, "--configfile", $nugetConfigPath)
}

Invoke-DotNet @(
    "publish",
    $projectPath,
    "-c",
    $Configuration,
    "-o",
    $publishPath,
    "--no-restore"
)

if (-not (Test-Path -LiteralPath $sourceRoot)) {
    throw "Publish output was not found: $sourceRoot"
}

if (Test-Path -LiteralPath $nasPath) {
    Remove-Item -LiteralPath $nasPath -Recurse -Force
}

New-Item -ItemType Directory -Path $nasPath | Out-Null
Get-ChildItem -LiteralPath $sourceRoot -Force | Copy-Item -Destination $nasPath -Recurse -Force

$frameworkPath = Join-Path $nasPath "_framework"
$nasFrameworkPath = Join-Path $nasPath "framework"

if (-not (Test-Path -LiteralPath $frameworkPath)) {
    throw "Blazor framework directory was not found: $frameworkPath"
}

Rename-Item -LiteralPath $frameworkPath -NewName "framework"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$indexPath = Join-Path $nasPath "index.html"
$blazorScriptPath = Join-Path $nasFrameworkPath "blazor.webassembly.js"

foreach ($filePath in @($indexPath, $blazorScriptPath)) {
    if (-not (Test-Path -LiteralPath $filePath)) {
        throw "Required file was not found: $filePath"
    }

    $content = [System.IO.File]::ReadAllText($filePath)
    $content = $content.Replace("_framework/", "framework/")
    $content = $content.Replace("_framework\`"", "framework\`"")
    [System.IO.File]::WriteAllText($filePath, $content, $utf8NoBom)
}

Get-ChildItem -LiteralPath $nasPath -Recurse -Force -File |
    Where-Object { $_.Extension -eq ".br" -or $_.Extension -eq ".gz" } |
    ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }

$textExtensions = @(".html", ".js", ".json", ".css", ".map", ".htaccess")
$remainingUnderscoreRefs = Get-ChildItem -LiteralPath $nasPath -Recurse -Force -File |
    Where-Object { $textExtensions -contains $_.Extension -or $_.Name -eq ".htaccess" } |
    Select-String -Pattern "_framework" -SimpleMatch -ErrorAction SilentlyContinue
if ($remainingUnderscoreRefs) {
    throw "NAS output text files still contain _framework references."
}

Write-Host "NAS publish output prepared: $nasPath"

if ($DeployPath) {
    $resolvedDeployPath = Resolve-SafeDeployPath $DeployPath

    $appEntriesToReplace = @(
        "_framework",
        "framework",
        "css",
        "js",
        "lib",
        "models",
        "sample-data",
        "index.html",
        "favicon.png",
        "icon-192.png",
        "PortfolioLauncher.Web.styles.css",
        ".htaccess"
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
        (Join-Path $resolvedDeployPath "framework/blazor.webassembly.js"),
        (Join-Path $resolvedDeployPath "framework/blazor.boot.json")
    )) {
        if (-not (Test-Path -LiteralPath $requiredPath)) {
            throw "Deploy output is missing required file: $requiredPath"
        }
    }

    Write-Host "NAS publish output copied to: $resolvedDeployPath"
}
else {
    Write-Host "Upload all contents of this directory to /HDD1/DocRoot."
    Write-Host "Or run with -DeployPath S:\HDD1\DocRoot to copy through ipDISK Drive."
}
