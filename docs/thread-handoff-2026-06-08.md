# Portfolio Launcher Thread Handoff - 2026-06-08

To: ornithopter@nate.com
Subject: Portfolio Launcher 작업 요약 및 다음 스레드 인수인계

## 오늘 작업 요약

Portfolio Launcher는 Blazor WebAssembly Standalone App 기반으로 계속 개발 중입니다. 현재 작업 위치는 `C:\Projects\VS\Portfolio_web`입니다.

### NAS 배포 자동화

- `scripts/publish-nas.ps1`를 추가/개선했습니다.
- Release publish 후 `artifacts/publish/web/wwwroot`를 `artifacts/publish-nas-no-underscore`로 변환합니다.
- NAS1DUAL Apache에서 막히는 `/_framework` 경로를 피하기 위해 `_framework` 폴더를 `framework`로 변경합니다.
- `index.html`, `framework/blazor.webassembly.js` 내부의 `_framework` 참조를 `framework`로 치환합니다.
- `.br`, `.gz` 압축 파일을 제거합니다.
- `-DeployPath S:\HDD1\DocRoot` 옵션으로 ipTIME ipDISK Drive에 직접 복사할 수 있습니다.
- 기존에는 대상 항목을 먼저 삭제하고 복사해서 중간 실패 시 `index.html`이 사라질 수 있었는데, 이제는 덮어쓰기 복사 후 `_framework`, `.br`, `.gz` 잔여물만 정리하도록 바꿨습니다.

### NAS 배포 + Git push 자동화

- `scripts/push-main.ps1`, `scripts/push-main.cmd` 추가
- `scripts/publish-nas-and-push.ps1`, `scripts/publish-nas-and-push.cmd` 추가
- `publish-nas-and-push.cmd`는 NAS 배포 복사 후 GitHub push까지 한 번에 수행합니다.
- push 스크립트는 커밋되지 않은 변경사항이 있으면 중단합니다.

### GitHub 형상관리

- 원격 저장소: `https://github.com/Ornithopter83/portfolio_web.git`
- 브랜치: `main`
- Git LFS 설정 완료
- `마녀_R.glb`와 `src/PortfolioLauncher.Web/wwwroot/models/witch.glb`는 LFS로 추적됩니다.
- 현재 로컬은 `origin/main`보다 4커밋 앞서 있습니다.

커밋 목록:

```text
c7ed9c7 Make NAS deploy copy safer
0609c87 Add one-command deploy and push scripts
fa04e3c Add witch model demo animation
78ea892 Add Supabase access role migrations
414f7b5 Track GLB assets with Git LFS
23e6f1b Initial Portfolio Launcher with NAS publish automation
```

### Supabase 준비

- `supabase/config.toml` 추가
- `supabase/migrations/20260608041000_create_access_roles.sql` 추가
- `access_roles` 테이블:
  - `admin` / `관리자`
  - `visitor` / `방문객`
- `user_access_roles` 테이블 추가
- 신규 Supabase Auth 사용자는 `visitor`가 자동 부여됩니다.
- RLS 정책 추가:
  - 누구나 `access_roles` 조회 가능
  - 로그인 사용자는 자신의 권한 조회 가능
  - `admin`은 전체 사용자 권한 조회/생성/수정/삭제 가능
- Supabase 연결 확인:
  - project ref: `vjobfwlqmaltwlleiboq`
  - project name: `portfolio_web`
  - migration `20260608041000`은 원격 DB에도 적용된 상태로 확인했습니다.

### Demo Launcher 3D

- 기존 Three.js 큐브 대신 `src/PortfolioLauncher.Web/wwwroot/models/witch.glb`를 로드하도록 변경했습니다.
- `마녀_R.glb`를 확인한 결과 glTF animation clip은 0개였습니다.
- 그래서 현재는 내장 walk clip 재생이 아니라, 팔/다리 bone을 직접 움직이는 절차적 걷기 동작을 구현했습니다.
- 시연 버튼 클릭 시 `DemoLauncherModal.razor`에서 `playDemoAction(demo.Key)`를 호출합니다.
- 추후 `walk`, `cast` animation clip이 포함된 GLB로 교체하면 `AnimationMixer` 기반 재생으로 확장할 수 있습니다.

### 검증 결과

다음 명령은 성공했습니다.

```powershell
dotnet restore PortfolioLauncher.sln --configfile NuGet.Config
dotnet build PortfolioLauncher.sln --no-restore
dotnet publish src\PortfolioLauncher.Web\PortfolioLauncher.Web.csproj -c Release -o artifacts\publish\web --no-restore
```

NAS 파일 기준 확인:

- `S:\HDD1\DocRoot\index.html` 있음
- `S:\HDD1\DocRoot\framework\blazor.webassembly.js` 있음
- `S:\HDD1\DocRoot\framework\blazor.boot.json` 있음
- `S:\HDD1\DocRoot\_framework` 없음
- 라이브 배포 파일에 `.br`, `.gz` 잔여물 없음

다만 `http://suhonas.ipdisk.co.kr:8080/`는 현재 TCP 8080 연결이 실패했습니다. 배포 파일 문제보다는 NAS Apache 서비스, 공유기 포트포워딩, 방화벽, ipDISK 웹서비스 상태를 확인해야 합니다.

## 다음 스레드에서 이어받을 순서

1. `AGENTS.md`, `HANDOFF.md`, `README.md`, `docs/thread-handoff-2026-06-08.md`를 먼저 읽습니다.
2. 현재 Git 상태를 확인합니다.

```powershell
git status -sb
git log --oneline --decorate -8
```

3. 원격보다 앞선 로컬 커밋을 push합니다.

```powershell
git push origin main
```

4. NAS 웹 접속 문제를 확인합니다.

```powershell
Test-NetConnection suhonas.ipdisk.co.kr -Port 8080
```

5. NAS 관리 화면에서 Apache/Web Server 활성화, 웹 포트, 포트포워딩, 방화벽을 확인합니다.
6. 배포 파일 자체는 필요 시 다음 명령으로 다시 복구합니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-nas.ps1 -DeployPath S:\HDD1\DocRoot
```

7. 이후 정상 동작이 확인되면 통합 자동화를 사용합니다.

```powershell
.\scripts\publish-nas-and-push.cmd
```

8. Demo Launcher 3D를 이어서 개선합니다.
   - 현재는 절차적 걷기입니다.
   - 다음 단계는 WASD 이동과 Return 캐스팅입니다.
   - animation clip이 포함된 GLB가 생기면 `demoLauncher3d.js`의 `AnimationMixer` 경로를 우선 사용합니다.

9. Supabase 앱 연동을 시작합니다.
   - 클라이언트에는 anon public key만 사용합니다.
   - service_role key는 Blazor WebAssembly에 절대 넣지 않습니다.
   - 사용자 권한은 `public.current_access_role()` 또는 RLS 기반 조회로 확인합니다.

## 메일 본문 권장 문안

안녕하세요.

Portfolio Launcher 2026-06-08 작업 요약과 다음 스레드 인수인계 문서를 첨부합니다.

핵심 내용은 NAS 배포 자동화, GitHub 형상관리, Supabase 권한 등급 migration, Demo Launcher 마녀 모델/걷기 동작, 그리고 다음 스레드에서 이어받을 순서입니다.

현재 로컬 저장소는 `origin/main`보다 4커밋 앞서 있으므로, 다음 작업의 첫 단계는 `git push origin main`입니다.

감사합니다.
