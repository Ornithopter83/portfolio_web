# Architecture

Portfolio Launcher는 Visual Studio 2022에서 열 수 있는 Blazor WebAssembly Standalone App입니다.

## Structure

- `PortfolioLauncher.sln`: Visual Studio 솔루션
- `src/PortfolioLauncher.Web`: 클라이언트 앱
- `src/PortfolioLauncher.Web/Pages`: 라우팅되는 화면
- `src/PortfolioLauncher.Web/Components`: 재사용 UI 컴포넌트
- `src/PortfolioLauncher.Web/wwwroot/js/demoLauncher3d.js`: Demo Launcher 3D 캔버스 모듈
- `docs`: 운영 및 확장 문서
- `tests`: 향후 테스트 프로젝트 영역

## Demo Launcher

Blazor 컴포넌트가 모달 상태와 선택된 시연을 관리하고, JavaScript 모듈이 Three.js 장면을 담당합니다. `wwwroot/models/witch.glb` 모델을 로드하고 시연 버튼을 누르면 `playDemoAction`을 통해 걷기 동작을 재생합니다.

현재 `마녀_R.glb`에는 glTF animation clip이 포함되어 있지 않으므로, `demoLauncher3d.js`에서 팔/다리 본을 직접 움직이는 절차적 걷기 동작을 사용합니다. 추후 `walk`, `cast` 등의 animation clip이 포함된 GLB로 교체하면 `AnimationMixer` 기반 클립 재생으로 확장할 수 있습니다.
