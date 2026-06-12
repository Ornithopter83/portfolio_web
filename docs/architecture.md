# Architecture

Portfolio Launcher는 React 정적 웹 앱, Supabase, Mini PC Node Web Push 워커, GitHub Pages HTTPS 호스팅, NAS1DUAL Apache 백업 호스팅으로 구성됩니다.

## Runtime Shape

```text
GitHub Pages
  - apps/web/dist 정적 파일 HTTPS 서빙
  - Web Push 실사용 기본 URL

NAS1DUAL Apache
  - apps/web/dist 정적 파일 내부/백업 서빙

React Web App
  - 프로필, 포트폴리오, 시연, 메시지 화면
  - Supabase anon key로 메시지/첨부/Push 구독 저장
  - Service Worker로 Web Push 구독 및 알림 클릭 처리

Supabase
  - Auth and access roles
  - messages
  - message_attachments
  - push_subscriptions
  - push_deliveries
  - server_heartbeats
  - message-attachments Storage bucket

Mini PC Node Worker
  - service role key 보관
  - pending 메시지 polling
  - Web Push 발송
  - heartbeat와 발송 결과 기록
```

## Structure

- `apps/web`: React + Vite + TypeScript 앱
- `apps/web/src/App.tsx`: 주요 화면과 메시지 작성 흐름
- `apps/web/src/demoLauncher3d.js`: Three.js 시연 모듈
- `apps/web/public/sw.js`: Push event와 notification click 처리
- `apps/web/public/models/witch.glb`: 3D 모델
- `apps/push-worker`: Mini PC Node Web Push 워커
- `supabase/migrations`: DB, Storage, RLS 마이그레이션
- `.github/workflows/deploy-pages.yml`: GitHub Pages HTTPS 배포
- `scripts/publish-nas.ps1`: React 정적 산출물 NAS 배포

## Message Flow

1. 사용자가 React 웹 앱의 메시지 화면에서 알림 구독을 허용합니다.
2. 브라우저가 PushSubscription을 생성하고 Supabase `push_subscriptions`에 저장합니다.
3. 사용자가 메시지와 첨부를 작성합니다.
4. React 앱이 `messages`, `message_attachments`, Storage bucket에 데이터를 저장합니다.
5. Mini PC Node 워커가 켜져 있으면 `messages.status = pending` 작업을 polling합니다.
6. 워커가 `web-push`로 구독자에게 알림을 발송합니다.
7. 발송 결과를 `push_deliveries`에 기록하고 메시지 상태를 `sent` 또는 `failed`로 변경합니다.
8. 사용자가 알림을 클릭하면 Service Worker가 GitHub Pages 웹사이트 URL을 엽니다.

## Server Status

Node 워커는 `server_heartbeats`의 `mini-pc-push-worker` 행을 주기적으로 갱신합니다. React 앱은 이 값을 읽어 서버 ON/OFF와 마지막 갱신 시각을 표시합니다.

## Demo Launcher

React 모달이 시연 상태를 관리하고, `demoLauncher3d.js`가 Three.js 장면을 담당합니다. `apps/web/public/models/witch.glb` 모델을 로드하고 시연 버튼 또는 Return 키 입력 시 `playDemoAction`을 통해 캐스팅 동작을 재생합니다.

현재 `마녀_R.glb`에는 glTF animation clip이 포함되어 있지 않으므로, JS에서 팔/다리 본을 직접 움직이는 절차적 동작을 사용합니다. 추후 `walk`, `cast` 등의 animation clip이 포함된 GLB로 교체하면 `AnimationMixer` 기반 클립 재생으로 확장할 수 있습니다.
