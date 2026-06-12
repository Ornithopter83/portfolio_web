# Portfolio Launcher Handoff

이 프로젝트는 React 정적 웹 앱, Supabase, Mini PC Node Web Push 워커, GitHub Pages HTTPS 배포, NAS1DUAL Apache 백업 배포 구조입니다.

## 기본 정보

- Web app: `apps/web`
- Push worker: `apps/push-worker`
- VS solution: `PortfolioLauncher.sln`
- GitHub repository: `https://github.com/Ornithopter83/portfolio_web`
- GitHub Pages URL: `https://ornithopter83.github.io/portfolio_web/`
- NAS URL: `http://suhonas.ipdisk.co.kr:8080/`
- NAS Document Root: `/HDD1/DocRoot`

## 현재 구현

- 상단 메뉴: 프로필 / 포트폴리오 / 메시지 / 시연
- React 주요 화면: `apps/web/src/App.tsx`
- Three.js 마녀 모델/절차적 걷기: `apps/web/src/demoLauncher3d.js`
- 마녀 GLB 정적 자산: `apps/web/public/models/witch.glb`
- Web Push Service Worker: `apps/web/public/sw.js`
- Node Push Worker: `apps/push-worker/src/index.mjs`
- NAS 배포 자동화: `scripts/publish-nas.ps1`
- GitHub Pages 배포 자동화: `.github/workflows/deploy-pages.yml`
- NAS 배포 + Git push 자동화: `scripts/publish-nas-and-push.ps1`
- Supabase 권한 등급 마이그레이션: `supabase/migrations/20260608041000_create_access_roles.sql`
- Supabase 메시지/푸시 마이그레이션: `supabase/migrations/20260612090000_create_web_push_messages.sql`
- React/Node/Supabase/NAS1DUAL 운영 검토: `docs/react-node-supabase-nas1dual.md`

## 검증 명령

```powershell
npm.cmd install
cd apps\web
node ..\..\node_modules\vite\bin\vite.js build
```

## GitHub Pages 배포 절차

Web Push 실사용과 스마트폰 알림 테스트는 GitHub Pages HTTPS 배포를 기준으로 합니다.

```text
https://ornithopter83.github.io/portfolio_web/
```

GitHub repository 설정:

- Pages source: GitHub Actions
- Actions secrets:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_WEB_PUSH_PUBLIC_KEY`

`main` branch에 push하면 `.github/workflows/deploy-pages.yml`가 `apps/web/dist`를 배포합니다.

Mini PC worker `.env`:

```text
PUBLIC_SITE_URL=https://ornithopter83.github.io/portfolio_web
```

## NAS 배포 절차

NAS1DUAL은 React/Node를 직접 실행하지 않고 Apache 정적 파일 서버로만 사용합니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-nas.ps1
```

스크립트 실행 후 `artifacts/publish-nas-static` 안의 내용물 전체를 `/HDD1/DocRoot`로 복사합니다.

ipTIME ipDISK Drive로 NAS가 `S:`에 마운트되어 있다면 다음 명령으로 생성과 복사를 한 번에 실행합니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-nas.ps1 -DeployPath S:\HDD1\DocRoot
```

NAS 배포와 GitHub push를 한 번에 실행하려면 다음 명령을 사용합니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-nas-and-push.ps1
```

확인 URL:

```text
http://suhonas.ipdisk.co.kr:8080/
http://suhonas.ipdisk.co.kr:8080/sw.js
http://suhonas.ipdisk.co.kr:8080/manifest.webmanifest
http://suhonas.ipdisk.co.kr:8080/models/witch.glb
```

NAS HTTP 접속은 Web Push 실사용용이 아니라 내부 확인/백업 배포용으로 봅니다.

## Supabase 준비

프로젝트 생성 후 다음 명령으로 로컬 migration을 적용합니다.

```powershell
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

초기 migration은 `관리자(admin)`, `방문객(visitor)` 앱 권한 상태를 생성합니다. Web Push migration은 메시지, 첨부, push 구독, 발송 결과, 서버 heartbeat, Storage bucket을 생성합니다.

운영 전 확인:

- `SUPABASE_SERVICE_ROLE_KEY`는 Mini PC Node 워커 `.env`에만 저장합니다.
- React 앱에는 `VITE_SUPABASE_ANON_KEY`만 사용합니다.
- Web Push VAPID private key는 Mini PC Node 워커에만 저장합니다.

## Demo Launcher 3D

`마녀_R.glb`는 리깅은 있지만 glTF animation clip이 0개입니다. 현재는 `witch.glb`를 로드한 뒤 시연 버튼 또는 Return 키 입력 시 `J_Bip_*` 팔/다리 본을 직접 흔드는 절차적 동작을 재생합니다.
