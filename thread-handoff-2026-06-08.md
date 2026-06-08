# Thread Handoff - 2026-06-08

## Current Repository State

- Repository: `https://github.com/Ornithopter83/portfolio_web.git`
- Local workspace used today: `C:\Project\WEB`
- Branch: `main`
- Current commit: `887d4c9 Ignore source GLB export`
- `HEAD` and `origin/main` both point to `887d4c989161a5c268b18d219f04dfc084b197d6`
- Working tree was clean at handoff time.

Recent commits:

```text
887d4c9 Ignore source GLB export
1d6bf4e Use animated witch GLB clips
81f2a25 Add demo keyboard controls
46995f3 Fix NAS publish flow and Three.js imports
4418f42 Add thread handoff summary
```

## What Changed Today

- `C:\Project\WEB` was converted into a normal Git working tree for `Ornithopter83/portfolio_web`.
- NAS publish scripts were cleaned up.
- Three.js import resolution was fixed with an import map.
- Demo launcher keyboard controls were added.
- The animated Unity-exported GLB was applied to the app model path.
- Root-level source GLB export was ignored so Git push is not blocked by duplicate untracked model files.

## Demo Launcher 3D

Active model file:

```text
src/PortfolioLauncher.Web/wwwroot/models/witch.glb
```

Current model size:

```text
14,751,868 bytes
```

The Unity-exported animation clips inside the GLB were verified:

```text
Idle
Walk
Cast_01
```

Runtime behavior:

- `Idle` plays as the idle action.
- `Walk` plays while moving.
- `Cast_01` plays when pressing `Enter`.
- `W/A/S/D` move the character inside the preview bounds.
- `Enter` triggers casting.
- Demo buttons also trigger the casting action.
- If expected clips are missing in a future GLB, the code falls back to procedural movement/cast.

Important files:

```text
src/PortfolioLauncher.Web/wwwroot/index.html
src/PortfolioLauncher.Web/wwwroot/js/demoLauncher3d.js
src/PortfolioLauncher.Web/wwwroot/models/witch.glb
```

Important note:

- Do not test the Blazor app by opening `wwwroot/index.html` directly with `file://`.
- Use `dotnet run`, published output through a local server, or the NAS URL.
- Direct `file://` can produce misleading Blazor/module loading behavior.

## NAS Publish Flow

Primary deploy command:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-nas-and-push.ps1 -DeployPath S:\HDD1\DocRoot
```

Test deploy without Git push:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-nas-and-push.ps1 -NoRestore -SkipPush -DeployPath .\artifacts\deploy-script-check
```

Script responsibilities:

- `scripts/publish-nas.ps1`
  - Optional restore.
  - Release publish.
  - Copy `wwwroot` into `artifacts/publish-nas-no-underscore`.
  - Rename `_framework` to `framework`.
  - Rewrite framework references.
  - Remove `.br` and `.gz`.
  - Copy to `-DeployPath` after removing old app-managed entries.
- `scripts/publish-nas-and-push.ps1`
  - Checks that the current directory is inside a Git working tree.
  - Runs `publish-nas.ps1`.
  - Runs `push-main.ps1` unless `-SkipPush` is supplied.
- `scripts/push-main.ps1`
  - Requires a clean working tree.
  - Pushes `main` to `origin`.

NAS deployment was checked at:

```text
S:\HDD1\DocRoot
```

Verified files:

```text
S:\HDD1\DocRoot\index.html
S:\HDD1\DocRoot\framework\blazor.webassembly.js
S:\HDD1\DocRoot\framework\blazor.boot.json
S:\HDD1\DocRoot\models\witch.glb
```

The NAS may contain old files under:

```text
S:\HDD1\DocRoot\Network Trashes Folder
```

Those are NAS trash-folder leftovers and are not part of the active app deploy path.

## Validation Commands

Run these after pulling on the next PC:

```powershell
dotnet restore PortfolioLauncher.sln --configfile NuGet.Config
dotnet build PortfolioLauncher.sln --no-restore
```

Run locally:

```powershell
dotnet run --project src/PortfolioLauncher.Web/PortfolioLauncher.Web.csproj --no-restore --launch-profile http
```

Default dev URL:

```text
http://localhost:5082
```

## Next PC Setup

Recommended start on the other PC:

```powershell
git clone https://github.com/Ornithopter83/portfolio_web.git WEB
cd WEB
dotnet restore PortfolioLauncher.sln --configfile NuGet.Config
dotnet build PortfolioLauncher.sln --no-restore
dotnet run --project src/PortfolioLauncher.Web/PortfolioLauncher.Web.csproj --no-restore --launch-profile http
```

If the repo already exists on that PC:

```powershell
cd <existing-repo>
git pull
dotnet restore PortfolioLauncher.sln --configfile NuGet.Config
dotnet build PortfolioLauncher.sln --no-restore
```

If GitHub HTTPS push asks for a password:

- Use a GitHub Personal Access Token instead of the account password.
- Fine-grained PAT scoped to `Ornithopter83/portfolio_web` with `Contents: Read and write` is enough.
- Run this once in normal PowerShell to let Git Credential Manager store it:

```powershell
git push -u origin main
```

## Known Notes

- `Witch_Animated_IdleWalkCast.glb` at the repo root is treated as a source/export artifact and is ignored by `.gitignore`.
- The app uses `src/PortfolioLauncher.Web/wwwroot/models/witch.glb`.
- Publish currently emits a warning recommending `wasm-tools`. It is optional, but can be installed for optimized Blazor WebAssembly publishing:

```powershell
dotnet workload install wasm-tools
```

