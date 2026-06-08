# NAS Static Deployment

## Automated NAS Output

NAS1DUAL Apache에서 Blazor 기본 경로인 `/_framework` 접근이 `403 Forbidden`으로 막힐 수 있습니다. NAS 배포본은 `_framework` 폴더를 `framework`로 바꾸고 Blazor 부트스트랩 스크립트 내부 경로도 함께 치환합니다.

```powershell
.\scripts\publish-nas.ps1
```

ipTIME ipDISK Drive로 NAS가 `S:`에 마운트되어 있다면 생성과 복사를 한 번에 실행할 수 있습니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-nas.ps1 -DeployPath S:\HDD1\DocRoot
```

스크립트는 다음 작업을 수행합니다.

1. `dotnet restore PortfolioLauncher.sln --configfile NuGet.Config`
2. `dotnet publish src/PortfolioLauncher.Web/PortfolioLauncher.Web.csproj -c Release -o artifacts/publish/web --no-restore`
3. `artifacts/publish/web/wwwroot` 내용을 `artifacts/publish-nas-no-underscore`로 복사
4. `_framework` 폴더를 `framework`로 변경
5. `index.html`과 `framework/blazor.webassembly.js`의 `_framework` 참조를 `framework`로 변경
6. NAS Apache에서 직접 압축 전송을 기대하지 않도록 `.br`, `.gz` 파일 제거
7. `-DeployPath`가 지정된 경우 배포 산출물과 같은 이름의 대상 항목을 교체한 뒤 해당 경로로 복사

`-DeployPath` 복사는 산출물에 포함된 최상위 항목만 교체합니다. 예를 들어 `apps`처럼 배포 산출물에 없는 NAS 폴더는 유지됩니다.

`artifacts/publish-nas-no-underscore` 안의 내용물 전체를 `/HDD1/DocRoot`로 복사합니다.

## Manual Release Output

```powershell
dotnet restore PortfolioLauncher.sln --configfile NuGet.Config
dotnet publish src/PortfolioLauncher.Web/PortfolioLauncher.Web.csproj -c Release -o artifacts/publish/web --no-restore
```

수동으로 배포할 때도 자동화 스크립트와 동일하게 `_framework`를 `framework`로 바꾸고, `index.html` 및 `framework/blazor.webassembly.js` 내부 경로를 수정한 뒤 `.br`, `.gz` 파일을 제거합니다.

## Check URLs

```text
http://suhonas.ipdisk.co.kr:8080/
http://suhonas.ipdisk.co.kr:8080/portfolio
http://suhonas.ipdisk.co.kr:8080/framework/blazor.webassembly.js
http://suhonas.ipdisk.co.kr:8080/framework/blazor.boot.json
```

`framework/blazor.webassembly.js`에서 긴 JavaScript 코드가 보이면 framework 경로 우회가 적용된 상태입니다. 실제 화면은 `/`에서 확인합니다.

## MIME Types

- `.wasm`: `application/wasm`
- `.dll`: `application/octet-stream`
- `.json`: `application/json`
- `.js`: `text/javascript`
