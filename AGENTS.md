# AGENTS.md

## Codex Working Rules

- 기존 Blazor WebAssembly 구조와 C# 스타일을 우선합니다.
- Three.js 관련 코드는 `wwwroot/js/demoLauncher3d.js`에 둡니다.
- 정적 배포를 고려해 서버 전용 API 의존성을 추가하지 않습니다.
- 변경 후 `dotnet restore PortfolioLauncher.sln --configfile NuGet.Config`와 `dotnet build PortfolioLauncher.sln --no-restore`로 검증합니다.
- 문서는 기능 변경과 함께 최신 상태로 유지합니다.
