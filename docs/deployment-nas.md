# NAS Static Deployment

## Current Target

NAS1DUAL은 React와 Node.js를 실행하지 않습니다. 개발 PC 또는 CI에서 React 앱을 빌드한 뒤, `apps/web/dist` 정적 산출물을 NAS Apache Document Root인 `/HDD1/DocRoot`에 배포합니다.

Web Push 실사용과 스마트폰 알림 테스트는 GitHub Pages HTTPS 배포를 기본으로 사용합니다. NAS 배포는 내부 확인 또는 백업 배포처입니다.

## Automated NAS Output

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-nas.ps1
```

ipTIME ipDISK Drive로 NAS가 `S:`에 마운트되어 있다면 생성과 복사를 한 번에 실행할 수 있습니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-nas.ps1 -DeployPath S:\HDD1\DocRoot
```

NAS 배포와 GitHub push를 한 번에 실행할 수도 있습니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-nas-and-push.ps1
```

더블클릭 실행용 래퍼:

```text
scripts\publish-nas-and-push.cmd
scripts\push-main.cmd
```

## Script Flow

`scripts/publish-nas.ps1`는 다음 작업을 수행합니다.

1. `npm.cmd install`
2. `node ..\..\node_modules\vite\bin\vite.js build` in `apps/web`
3. `apps/web/dist` 내용을 `artifacts/publish-nas-static`으로 복사
4. `.br`, `.gz` 잔여물 제거
5. `-DeployPath`가 지정된 경우 해당 경로의 앱 관리 항목을 교체
6. 대상 경로에 `index.html`, `sw.js`, `manifest.webmanifest`가 있는지 확인

이미 의존성이 설치되어 있으면 `-NoInstall`을 사용할 수 있습니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-nas.ps1 -NoInstall
```

## Manual Release Output

```powershell
npm.cmd install
cd apps\web
node ..\..\node_modules\vite\bin\vite.js build
```

수동 배포 시 `apps/web/dist` 안의 내용물 전체를 `/HDD1/DocRoot`로 복사합니다.

## Check URLs

```text
http://suhonas.ipdisk.co.kr:8080/
http://suhonas.ipdisk.co.kr:8080/sw.js
http://suhonas.ipdisk.co.kr:8080/manifest.webmanifest
http://suhonas.ipdisk.co.kr:8080/models/witch.glb
```

Web Push는 HTTPS 환경이 필요합니다. 실제 스마트폰 알림은 `https://ornithopter83.github.io/portfolio_web/` GitHub Pages 배포에서 확인합니다.
