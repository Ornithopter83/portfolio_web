# Portfolio Launcher

Blazor WebAssembly Standalone App 기반의 개인 포트폴리오 및 데모 런처 1차 프로토타입입니다.

## Prerequisites

- Visual Studio 2022
- .NET 9 SDK

## Run

```powershell
dotnet restore PortfolioLauncher.sln --configfile NuGet.Config
dotnet run --project src/PortfolioLauncher.Web/PortfolioLauncher.Web.csproj --no-restore
```

## Build

```powershell
dotnet restore PortfolioLauncher.sln --configfile NuGet.Config
dotnet build PortfolioLauncher.sln --no-restore
```

## Publish

```powershell
dotnet restore PortfolioLauncher.sln --configfile NuGet.Config
dotnet publish src/PortfolioLauncher.Web/PortfolioLauncher.Web.csproj -c Release -o artifacts/publish/web --no-restore
```

정적 배포 산출물은 `artifacts/publish/web/wwwroot`에 생성됩니다.

## NAS Publish

NAS1DUAL Apache에서는 `/_framework` 경로 접근이 `403 Forbidden`으로 막힐 수 있으므로, NAS 배포본은 `framework` 폴더명으로 변환합니다.

```powershell
.\scripts\publish-nas.ps1
```

업로드 대상 산출물은 `artifacts/publish-nas-no-underscore`에 생성됩니다. 이 폴더 안의 내용물 전체를 NAS Document Root인 `/HDD1/DocRoot`로 복사합니다.

ipTIME ipDISK Drive로 NAS가 `S:`에 마운트되어 있다면 생성과 복사를 한 번에 실행할 수 있습니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-nas.ps1 -DeployPath S:\HDD1\DocRoot
```

## Supabase

Supabase DB 변경사항은 `supabase/migrations`에서 관리합니다. 새 Supabase 프로젝트를 만든 뒤 CLI로 연결하고 마이그레이션을 적용합니다.

```powershell
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

현재 초기 마이그레이션은 `관리자`, `방문객` 2가지 앱 권한 상태를 생성합니다.

## Demo Launcher 3D

시연 모달은 `wwwroot/models/witch.glb`를 Three.js로 로드합니다. 현재 GLB에는 내장 animation clip이 없어 시연 버튼 클릭 시 JavaScript에서 팔/다리 본을 움직이는 절차적 걷기 동작을 재생합니다.
