# Supabase Setup

This directory keeps database migrations for the Portfolio Launcher Supabase project.

## Create Project

1. Create a new Supabase project in the Supabase Dashboard.
2. Copy the project ref from the project URL or Project Settings.
3. Install the Supabase CLI on the build machine.
4. If your Supabase project uses a different Postgres major version, update `db.major_version` in `supabase/config.toml`.

## Link And Apply

```powershell
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

The first migration creates two application access states:

- `admin`: 관리자
- `visitor`: 방문객

The Web Push migration creates message queue tables, attachment metadata, push subscriptions, delivery logs, server heartbeat rows, and the `message-attachments` Storage bucket.

New Supabase Auth users receive `visitor` by default. Promote the first administrator in the SQL Editor after signing in once:

```sql
select id, email from auth.users;

update public.user_access_roles
set role_code = 'admin', updated_at = now()
where user_id = '<admin-user-id>';
```

## GitHub Integration

When enabling Supabase GitHub Integration, set the working directory to `.` because the `supabase/` directory is at the repository root.

Do not store the Supabase `service_role` key in the React web app or NAS static files. Browser-side code must only use the public anon key, and database access should be controlled with Row Level Security policies. The service role key belongs only in the Mini PC Node push worker environment.
