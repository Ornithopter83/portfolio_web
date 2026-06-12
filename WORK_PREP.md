# Portfolio Launcher Work Prep

Last checked: 2026-06-12

## Current Direction

The project operating shape is:

- React + Vite static frontend
- Supabase Auth, DB, Storage, and RLS
- Web Push Service Worker in the frontend
- Mini PC Node.js worker for push delivery
- GitHub Pages HTTPS hosting for public/Web Push use
- NAS1DUAL Apache static hosting for backup/internal use

GitHub repository for restore/maintenance:

- `https://github.com/Ornithopter83/portfolio_web`

## Active Project Shape

- Web app: `apps/web`
- Push worker: `apps/push-worker`
- Three.js module: `apps/web/src/demoLauncher3d.js`
- 3D model asset: `apps/web/public/models/witch.glb`
- Service Worker: `apps/web/public/sw.js`
- NAS publish script: `scripts/publish-nas.ps1`
- GitHub Pages workflow: `.github/workflows/deploy-pages.yml`
- Supabase migrations:
  - `supabase/migrations/20260608041000_create_access_roles.sql`
  - `supabase/migrations/20260612090000_create_web_push_messages.sql`

## Verification

```powershell
npm.cmd install
cd apps\web
node ..\..\node_modules\vite\bin\vite.js build
```

## Web Push Notes

- Web Push requires HTTPS for real device use.
- Use GitHub Pages as the default HTTPS URL: `https://ornithopter83.github.io/portfolio_web/`.
- React stores PushSubscription data in Supabase.
- The Mini PC worker reads pending messages and sends notifications with VAPID keys.
- The worker updates `server_heartbeats` so the site can show server ON/OFF and last update time.
- Secrets stay out of the browser and Git:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `WEB_PUSH_PRIVATE_KEY`

## NAS Publish Behavior

- NAS URL: `http://suhonas.ipdisk.co.kr:8080/`
- NAS Document Root: `/HDD1/DocRoot`
- Build output: `apps/web/dist`
- NAS-ready output: `artifacts/publish-nas-static`
- Deploy script copies static React files and verifies:
  - `index.html`
  - `sw.js`
  - `manifest.webmanifest`

## GitHub Pages Publish Behavior

- Pages URL: `https://ornithopter83.github.io/portfolio_web/`
- Workflow: `.github/workflows/deploy-pages.yml`
- Workflow base path: `VITE_BASE_PATH=/portfolio_web/`
- Required Actions secrets:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_WEB_PUSH_PUBLIC_KEY`
- Mini PC worker `PUBLIC_SITE_URL`:
  - `https://ornithopter83.github.io/portfolio_web`

## Recommended Next Steps

1. Install npm dependencies and generate `package-lock.json`.
2. Run the React build and fix any TypeScript/Vite errors.
3. Add Supabase project values to `.env` files.
4. Generate Web Push VAPID keys.
5. Apply Supabase migrations.
6. Enable GitHub Pages with GitHub Actions and add Actions secrets.
7. Start the Mini PC worker and verify heartbeat.
8. Open the GitHub Pages URL, subscribe to notifications, create a message, and confirm push delivery.
