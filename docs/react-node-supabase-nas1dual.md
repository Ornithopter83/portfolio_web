# React, Node.js, Supabase, NAS1DUAL 운영 구조

## 결론

카카오톡 연동은 현재 구조에서 제외합니다. 알림은 Web Push로 처리합니다.

React + Supabase + GitHub Pages 조합을 Web Push 실사용 기본 구조로 운영합니다. NAS1DUAL은 정적 백업/내부 배포처로 유지합니다. Node.js는 NAS1DUAL에서 실행하지 않고, Mini PC에서 Web Push 워커로 실행합니다.

## 운영 형태

```text
Developer PC
  - npm install
  - node ..\..\node_modules\vite\bin\vite.js build

GitHub Pages
  - HTTPS static hosting
  - https://ornithopter83.github.io/portfolio_web/
  - Web Push 실사용 URL

NAS1DUAL
  - Apache static hosting
  - /HDD1/DocRoot 에 apps/web/dist 산출물 백업 배포

Supabase
  - Auth
  - Database
  - Storage
  - RLS
  - 메시지 pending queue

Mini PC
  - Node.js push worker
  - service role key 보관
  - Web Push VAPID private key 보관
  - pending 메시지 처리
```

## Node.js 역할

Node.js는 두 역할로 나뉩니다.

- 개발 PC: React/Vite 빌드 도구
- Mini PC: Web Push 워커 런타임

NAS1DUAL은 Node.js 런타임을 맡지 않습니다. NAS에는 정적 파일만 배포합니다. HTTPS가 필요한 Web Push 실사용은 GitHub Pages를 기준으로 합니다.

## Web Push Flow

1. 사용자가 React 웹사이트에서 알림 구독을 허용합니다.
2. 브라우저가 PushSubscription을 생성합니다.
3. React 앱이 Supabase `push_subscriptions`에 구독 정보를 저장합니다.
4. 사용자가 메시지와 첨부 파일을 작성합니다.
5. React 앱이 Supabase `messages`, `message_attachments`, Storage에 저장합니다.
6. Mini PC Node 워커가 켜져 있을 때 pending 메시지를 가져옵니다.
7. 워커가 `web-push`로 알림을 발송합니다.
8. Service Worker가 알림을 표시합니다.
9. 사용자가 알림을 클릭하면 웹사이트로 이동합니다.

## 서버 ON/OFF 표시

Mini PC 워커는 `server_heartbeats`에 다음 값을 갱신합니다.

- `server_id`: `mini-pc-push-worker`
- `status`: `online` 또는 `offline`
- `last_seen_at`: 마지막 heartbeat
- `note`: 오류 또는 상태 메모

React 앱은 이 값을 읽어 서버 ON/OFF와 마지막 갱신 시각을 표시합니다.

## 보안 기준

브라우저에는 공개 가능한 값만 둡니다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_WEB_PUSH_PUBLIC_KEY`

Mini PC Node 워커에만 두는 값:

- `SUPABASE_SERVICE_ROLE_KEY`
- `WEB_PUSH_PRIVATE_KEY`

Git 저장소에 `.env` 실제 값을 커밋하지 않습니다.

## HTTPS 제약

Web Push는 실제 브라우저/스마트폰 사용에서 HTTPS가 필요합니다. 현재 기본 HTTPS 배포처는 GitHub Pages입니다.

- GitHub Pages: `https://ornithopter83.github.io/portfolio_web/`
- 로컬 개발 중에는 `localhost`
- 필요 시 HTTPS reverse proxy, DDNS + TLS 인증서, Cloudflare Tunnel 검토

iOS/iPadOS는 홈 화면에 추가한 웹앱에서 알림 권한을 허용하는 흐름을 기준으로 테스트합니다.

## 피해야 할 구조

- NAS에서 `npm run dev`로 운영
- NAS에서 Node worker 상시 실행을 전제로 설계
- NAS 정적 파일에 service role key 저장
- 브라우저 번들에 Web Push private key 포함
- 카카오톡 메시지/알림톡을 이 알림 경로에 섞기

## 구현 위치

- React 앱: `apps/web`
- Node 워커: `apps/push-worker`
- Supabase schema: `docs/supabase-schema.md`
- GitHub Pages 배포: `docs/deployment-github-pages.md`
- NAS 배포: `docs/deployment-nas.md`
