# Portfolio Launcher

React 정적 웹 앱, Supabase, Mini PC Node Web Push 워커, NAS1DUAL Apache 정적 배포를 기준으로 운영하는 포트폴리오 런처입니다.

## Repository

- GitHub: `https://github.com/Ornithopter83/portfolio_web`
- 유지관리 및 복구 시 이 저장소를 기준으로 clone/pull 합니다.

## Structure

- `PortfolioLauncher.sln`: VS2022 관리용 솔루션
- `apps/web`: React + Vite + TypeScript 정적 웹 앱
- `apps/web/src/demoLauncher3d.js`: Three.js 3D 시연 모듈
- `apps/web/public/models/witch.glb`: 시연용 GLB 모델
- `apps/web/public/sw.js`: Web Push Service Worker
- `apps/push-worker`: Mini PC에서 실행하는 Node.js Web Push 워커
- `supabase/migrations`: Supabase DB, Storage, RLS 마이그레이션
- `.github/workflows/deploy-pages.yml`: GitHub Pages HTTPS 배포 워크플로
- `scripts/publish-nas.ps1`: React 정적 산출물 NAS 배포 스크립트
- `docs`: 운영 및 확장 문서
## Prerequisites

- Visual Studio 2022 with Node.js development tools
- Node.js 20 이상
- npm
- Supabase CLI
- NAS1DUAL Apache 정적 웹 서비스

## Web App

VS2022에서는 `PortfolioLauncher.sln`을 열어 `PortfolioLauncher.Web`과 `PortfolioLauncher.PushWorker` 프로젝트를 관리합니다.

```powershell
npm.cmd install
cd apps\web
node ..\..\node_modules\vite\bin\vite.js --host 0.0.0.0
```

빌드:

```powershell
cd apps\web
node ..\..\node_modules\vite\bin\vite.js build
```

웹 앱은 다음 환경 변수를 사용합니다.

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_WEB_PUSH_PUBLIC_KEY=
```

## Push Worker

Mini PC에서 Node 서버가 켜져 있을 때만 pending 메시지를 처리합니다. 서버가 꺼져 있으면 Supabase에 메시지가 쌓이고, 웹사이트에는 heartbeat 기준으로 서버 OFF가 표시됩니다.

```powershell
copy apps\push-worker\.env.example apps\push-worker\.env
node apps\push-worker\src\index.mjs
```

필요한 환경 변수:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
WEB_PUSH_PUBLIC_KEY=
WEB_PUSH_PRIVATE_KEY=
WEB_PUSH_SUBJECT=mailto:admin@example.com
PUBLIC_SITE_URL=https://ornithopter83.github.io/portfolio_web
WORKER_ID=mini-pc-push-worker
POLL_INTERVAL_MS=15000
```

`SUPABASE_SERVICE_ROLE_KEY`와 `WEB_PUSH_PRIVATE_KEY`는 브라우저, NAS 정적 파일, Git 저장소에 넣지 않습니다.

## GitHub Pages Publish

Web Push 테스트와 외부 접속은 GitHub Pages HTTPS URL을 기본으로 사용합니다.

```text
https://ornithopter83.github.io/portfolio_web/
```

`main` branch에 push하면 `.github/workflows/deploy-pages.yml`가 `apps/web/dist`를 Pages로 배포합니다. 자세한 설정은 `docs/deployment-github-pages.md`를 참고합니다.

Mini PC Node worker의 `PUBLIC_SITE_URL`도 다음 값으로 설정합니다.

```text
PUBLIC_SITE_URL=https://ornithopter83.github.io/portfolio_web
```

## NAS Publish

NAS1DUAL은 Node/React를 실행하지 않고, React 빌드 산출물만 Apache로 서빙합니다. NAS 배포는 내부/백업 배포처로 사용할 수 있습니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-nas.ps1
```

ipTIME ipDISK Drive로 NAS가 `S:`에 마운트되어 있다면 생성과 복사를 한 번에 실행할 수 있습니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-nas.ps1 -DeployPath S:\HDD1\DocRoot
```

NAS 배포와 GitHub push를 한 번에 실행하려면:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-nas-and-push.ps1
```

## Supabase

Supabase DB 변경사항은 `supabase/migrations`에서 관리합니다.

```powershell
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

현재 마이그레이션은 앱 권한, 메시지, 첨부, Push 구독, 발송 결과, 서버 heartbeat를 생성합니다.

## Web Push

사용자는 웹사이트에서 알림 구독을 허용합니다. 구독 정보는 Supabase에 저장되고, Mini PC Node 워커가 pending 메시지를 읽어 Web Push를 발송합니다. 알림 클릭 시 웹사이트로 이동합니다.

자세한 내용은 `docs/react-node-supabase-nas1dual.md`를 참고합니다.
