create table if not exists public.access_roles (
    code text primary key,
    display_name text not null,
    sort_order integer not null,
    created_at timestamptz not null default now(),
    constraint access_roles_code_check check (code in ('admin', 'visitor'))
);

insert into public.access_roles (code, display_name, sort_order)
values
    ('admin', '관리자', 1),
    ('visitor', '방문객', 2)
on conflict (code) do update
set
    display_name = excluded.display_name,
    sort_order = excluded.sort_order;

create table if not exists public.user_access_roles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    role_code text not null default 'visitor' references public.access_roles(code),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint user_access_roles_role_code_check check (role_code in ('admin', 'visitor'))
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_user_access_roles_updated_at on public.user_access_roles;
create trigger set_user_access_roles_updated_at
before update on public.user_access_roles
for each row
execute function public.set_updated_at();

alter table public.access_roles enable row level security;
alter table public.user_access_roles enable row level security;

create or replace function public.current_access_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        (
            select role_code
            from public.user_access_roles
            where user_id = auth.uid()
        ),
        'visitor'
    );
$$;

grant execute on function public.current_access_role() to anon, authenticated;
grant select on public.access_roles to anon, authenticated;
grant select on public.user_access_roles to authenticated;
grant insert, update, delete on public.user_access_roles to authenticated;

drop policy if exists "Access roles are readable by everyone" on public.access_roles;
create policy "Access roles are readable by everyone"
on public.access_roles
for select
to anon, authenticated
using (true);

drop policy if exists "Users can read own access role" on public.user_access_roles;
create policy "Users can read own access role"
on public.user_access_roles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Admins can read all user access roles" on public.user_access_roles;
create policy "Admins can read all user access roles"
on public.user_access_roles
for select
to authenticated
using (public.current_access_role() = 'admin');

drop policy if exists "Admins can insert user access roles" on public.user_access_roles;
create policy "Admins can insert user access roles"
on public.user_access_roles
for insert
to authenticated
with check (
    public.current_access_role() = 'admin'
    and role_code in ('admin', 'visitor')
);

drop policy if exists "Admins can update user access roles" on public.user_access_roles;
create policy "Admins can update user access roles"
on public.user_access_roles
for update
to authenticated
using (public.current_access_role() = 'admin')
with check (
    public.current_access_role() = 'admin'
    and role_code in ('admin', 'visitor')
);

drop policy if exists "Admins can delete user access roles" on public.user_access_roles;
create policy "Admins can delete user access roles"
on public.user_access_roles
for delete
to authenticated
using (public.current_access_role() = 'admin');

create or replace function public.handle_new_user_access_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.user_access_roles (user_id, role_code)
    values (new.id, 'visitor')
    on conflict (user_id) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created_access_role on auth.users;
create trigger on_auth_user_created_access_role
after insert on auth.users
for each row
execute function public.handle_new_user_access_role();
