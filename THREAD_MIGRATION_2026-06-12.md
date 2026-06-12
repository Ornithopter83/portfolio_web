# Thread Migration Note - 2026-06-12

이 문서는 Codex 스레드 이주용 요약입니다. 새 스레드는 이 파일을 먼저 읽고, 이어서 `README.md`, `WORK_PREP.md`, `docs/architecture.md`, `docs/deployment-github-pages.md`를 확인하면 됩니다.

## Current Repository

- Local path: `C:\Projects\VS\Portfolio_web`
- GitHub repository: `https://github.com/Ornithopter83/portfolio_web`
- Branch: `main`
- Latest pushed commit: `c3bb405 Restore VS2022 solution`
- Previous migration commit: `eb0fc27 Migrate portfolio launcher to React web push`
- GitHub Pages URL: `https://ornithopter83.github.io/portfolio_web/`

## Current Architecture

- Frontend: React + Vite + TypeScript in `apps/web`
- 3D demo module: `apps/web/src/demoLauncher3d.js`
- 3D model asset: `apps/web/public/models/witch.glb`
- Service worker: `apps/web/public/sw.js`
- Push worker: Node.js in `apps/push-worker`
- Database and storage: Supabase
- HTTPS deployment: GitHub Pages through GitHub Actions
- NAS1DUAL deployment: static backup deployment only, no Node runtime on NAS
- Mini PC role: runs the Node Web Push worker when online

## VS2022 Status

The VS2022 solution was recreated after the old solution was removed with the Blazor/Razor backup files.

- Solution: `PortfolioLauncher.sln`
- Web project: `apps/web/PortfolioLauncher.Web.njsproj`
- Push worker project: `apps/push-worker/PortfolioLauncher.PushWorker.njsproj`
- Required VS workload: Visual Studio 2022 Node.js development tools

The solution intentionally manages Node.js projects, not a .NET/Blazor project.

## Removed Legacy Items

The old Razor/Blazor backup structure is no longer part of this repository.

Removed or intentionally absent:

- `src/PortfolioLauncher.Web`
- old Blazor/Razor `PortfolioLauncher.sln`
- `NuGet.Config`
- old thread handoff backup documents related to the Blazor structure

Current docs no longer instruct using `dotnet restore` or `dotnet build` for this project.

## GitHub CLI and Secrets

`gh` was found at:

```text
C:\Program Files\GitHub CLI\gh.exe
```

The real user environment is logged in to GitHub as `Ornithopter83`.

Confirmed repository Actions secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_WEB_PUSH_PUBLIC_KEY`

If a sandboxed shell cannot find `gh`, use the full path above or open a new terminal after installation.

## Deployment Status

GitHub Actions workflow:

- File: `.github/workflows/deploy-pages.yml`
- Last checked run after `c3bb405`: success
- Pages response check: `https://ornithopter83.github.io/portfolio_web/` returned HTTP `200`
- Page content check: served React/Vite asset paths under `/portfolio_web/assets/`

Known warning:

- GitHub Actions reported Node.js 20 action deprecation warnings.
- Deployment still succeeds.
- A future maintenance task should update the workflow for Node 24 compatibility before GitHub fully removes Node 20 action runtime support.

## Validation Commands Used

From repository root:

```powershell
dotnet sln PortfolioLauncher.sln list
```

VS2022 build:

```powershell
& 'C:\Program Files\Microsoft Visual Studio\2022\Professional\MSBuild\Current\Bin\MSBuild.exe' PortfolioLauncher.sln /t:Build /p:Configuration=Debug /p:Platform='Any CPU' /m
```

React build:

```powershell
cd apps\web
node ..\..\node_modules\vite\bin\vite.js build
```

Node worker syntax check:

```powershell
node --check apps\push-worker\src\index.mjs
```

NAS static package check:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-nas.ps1 -NoInstall
```

## Important Operational Notes

- Do not put Supabase service role keys in the frontend or Git repository.
- Do not put the Web Push VAPID private key in the frontend or Git repository.
- Frontend uses only public Vite variables.
- Mini PC worker `.env` should hold private server-side values.
- NAS1DUAL is a static Apache backup target only.
- GitHub Pages is the preferred HTTPS endpoint for Web Push testing and normal public access.

Mini PC worker public site URL should be:

```text
PUBLIC_SITE_URL=https://ornithopter83.github.io/portfolio_web
```

## Suggested Next Tasks

1. Open `PortfolioLauncher.sln` in VS2022 and confirm both Node.js projects load normally.
2. Test the React app locally from VS2022 or with Vite.
3. Confirm Supabase migrations are applied to the intended project.
4. Run Mini PC push worker with real `.env` values and test one Web Push notification.
5. Update GitHub Actions to avoid Node.js 20 action deprecation warnings.

## Current Worktree Note

At the time this migration note was created, the repository was clean before adding this file. If this file is committed later, use a message such as:

```text
Add thread migration note
```
