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

Blazor 컴포넌트가 모달 상태와 선택된 시연을 관리하고, JavaScript 모듈이 Three.js 장면을 담당합니다. 현재는 회전하는 큐브를 표시하며, 이후 `character.glb` 로딩 함수로 교체할 수 있도록 `loadCharacterModel` 함수를 분리했습니다.
