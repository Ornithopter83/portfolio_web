# GitHub Pages HTTPS Deployment

GitHub Pages를 Web Push 테스트와 외부 접속용 HTTPS 배포처로 사용합니다.

기본 URL:

```text
https://ornithopter83.github.io/portfolio_web/
```

NAS1DUAL은 정적 백업/내부 배포처로 유지할 수 있지만, 스마트폰 Web Push 권한과 알림 클릭 테스트는 GitHub Pages HTTPS URL을 기준으로 진행합니다.

## Repository Settings

GitHub repository에서 다음을 설정합니다.

1. `Settings` > `Pages`
2. `Build and deployment`의 source를 `GitHub Actions`로 선택
3. `Settings` > `Secrets and variables` > `Actions`
4. Repository secrets 추가:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_WEB_PUSH_PUBLIC_KEY
```

이 값들은 브라우저에 포함되는 공개 가능한 값입니다. 그래도 저장소 파일에는 직접 커밋하지 않고 GitHub Actions secrets로 주입합니다.

## Workflow

배포 워크플로:

```text
.github/workflows/deploy-pages.yml
```

동작:

1. `main` branch push 또는 수동 실행
2. Node.js 22 설정
3. `npm ci`
4. `apps/web`에서 Vite build
5. `apps/web/dist`를 GitHub Pages artifact로 업로드
6. Pages에 배포

GitHub Pages 프로젝트 사이트는 `/portfolio_web/` 하위 경로에서 서비스되므로 workflow는 다음 값을 사용합니다.

```text
VITE_BASE_PATH=/portfolio_web/
```

## Web Push URL

Mini PC Node worker의 `.env`에는 Pages 주소를 넣습니다.

```text
PUBLIC_SITE_URL=https://ornithopter83.github.io/portfolio_web
```

알림 payload의 클릭 URL은 이 값을 기준으로 만들어집니다.

## Local Build Check

GitHub Pages와 같은 base path로 로컬 빌드를 확인하려면:

```powershell
cd apps\web
$env:VITE_BASE_PATH='/portfolio_web/'
node C:\Projects\VS\Portfolio_web\node_modules\vite\bin\vite.js build
```

NAS용 루트 배포를 만들 때는 `VITE_BASE_PATH=/`를 사용합니다. `scripts/publish-nas.ps1`는 기본값 `/`를 사용합니다.

## HTTPS Notes

- Web Push는 HTTPS 또는 localhost에서만 안정적으로 동작합니다.
- GitHub Pages는 HTTPS를 제공하므로 스마트폰 알림 구독 테스트에 적합합니다.
- iOS/iPadOS는 홈 화면에 추가한 웹앱에서 알림 권한을 허용하는 흐름을 기준으로 테스트합니다.
- Supabase Auth redirect URL을 사용할 경우 Pages URL을 허용 목록에 추가합니다.
