# AGENTS.md

## Codex Working Rules

- 현재 운영 기준은 React + Vite 정적 웹 앱, Node.js Web Push 워커, Supabase, GitHub Pages HTTPS 배포, NAS1DUAL Apache 백업 배포입니다.
- VS2022 관리를 위해 `PortfolioLauncher.sln`과 Node.js Tools 기반 `.njsproj` 프로젝트를 유지합니다.
- Three.js 관련 코드는 `apps/web/src/demoLauncher3d.js`에 둡니다.
- NAS1DUAL에서는 서버 런타임을 실행하지 않고 `apps/web/dist` 정적 산출물만 배포합니다.
- Node 워커는 Mini PC에서만 실행하며, Supabase service role key와 Web Push private key를 프론트엔드나 Git 저장소에 넣지 않습니다.
- 변경 후 가능한 경우 다음 명령으로 검증합니다.

```powershell
npm.cmd install
cd apps\web
node ..\..\node_modules\vite\bin\vite.js build
```

- 문서는 기능 변경과 함께 최신 상태로 유지합니다.
