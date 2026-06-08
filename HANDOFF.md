# Portfolio Launcher Handoff

이 프로젝트는 Blazor WebAssembly Standalone App 기반 Portfolio Launcher입니다.

## 기본 정보

- Solution: `PortfolioLauncher.sln`
- Web project: `src/PortfolioLauncher.Web`
- NAS URL: `http://suhonas.ipdisk.co.kr:8080/`
- NAS Document Root: `/HDD1/DocRoot`

## 현재 구현

- 상단 메뉴: 프로필 / 포트폴리오 / 시연
- 프로필 페이지: `src/PortfolioLauncher.Web/Pages/Home.razor`
- 포트폴리오 페이지: `src/PortfolioLauncher.Web/Pages/Portfolio.razor`
- Demo Launcher 모달: `src/PortfolioLauncher.Web/Components/DemoLauncherModal.razor`
- Three.js 큐브: `src/PortfolioLauncher.Web/wwwroot/js/demoLauncher3d.js`
- NAS용 Apache 설정: `src/PortfolioLauncher.Web/wwwroot/.htaccess`
- NAS 배포 자동화: `scripts/publish-nas.ps1`
- Supabase 권한 등급 마이그레이션: `supabase/migrations/20260608041000_create_access_roles.sql`

## 검증 명령

```powershell
dotnet restore PortfolioLauncher.sln --configfile NuGet.Config
dotnet build PortfolioLauncher.sln --no-restore
```

## NAS 배포 절차

NAS1DUAL Apache에서 기본 Blazor 경로인 `/_framework` 접근이 `403 Forbidden`으로 막혔습니다. NAS 배포본은 `_framework`를 쓰지 않고 `framework` 폴더로 우회합니다.

```powershell
.\scripts\publish-nas.ps1
```

스크립트 실행 후 `artifacts/publish-nas-no-underscore` 안의 내용물 전체를 `/HDD1/DocRoot`로 복사합니다.

ipTIME ipDISK Drive로 NAS가 `S:`에 마운트되어 있다면 다음 명령으로 생성과 복사를 한 번에 실행합니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-nas.ps1 -DeployPath S:\HDD1\DocRoot
```

확인 URL:

```text
http://suhonas.ipdisk.co.kr:8080/
http://suhonas.ipdisk.co.kr:8080/portfolio
http://suhonas.ipdisk.co.kr:8080/framework/blazor.webassembly.js
http://suhonas.ipdisk.co.kr:8080/framework/blazor.boot.json
```

`framework/blazor.webassembly.js`에서 긴 JavaScript 코드가 보이면 정상입니다. 실제 화면은 `/`에서 확인합니다.

## Supabase 준비

아직 Supabase DB 프로젝트 생성 전입니다. 프로젝트 생성 후 다음 명령으로 로컬 migration을 적용합니다.

```powershell
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

초기 migration은 `관리자(admin)`, `방문객(visitor)` 2가지 앱 권한 상태를 생성합니다. 신규 Auth 사용자는 `visitor`가 자동 부여됩니다. 첫 관리자는 Supabase SQL Editor에서 직접 `user_access_roles.role_code`를 `admin`으로 수정합니다.
