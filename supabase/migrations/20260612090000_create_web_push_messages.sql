create extension if not exists pgcrypto;

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    body text not null,
    status text not null default 'pending',
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    processing_started_at timestamptz,
    processed_at timestamptz,
    error_message text,
    constraint messages_status_check check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled'))
);

create table if not exists public.message_attachments (
    id uuid primary key default gen_random_uuid(),
    message_id uuid not null references public.messages(id) on delete cascade,
    file_path text not null,
    file_name text not null,
    content_type text not null,
    size_bytes bigint not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    endpoint text not null unique,
    subscription jsonb not null,
    user_agent text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.push_deliveries (
    id uuid primary key default gen_random_uuid(),
    message_id uuid not null references public.messages(id) on delete cascade,
    push_subscription_id uuid references public.push_subscriptions(id) on delete set null,
    status text not null,
    status_code integer,
    error_message text,
    sent_at timestamptz,
    created_at timestamptz not null default now(),
    constraint push_deliveries_status_check check (status in ('sent', 'failed'))
);

create table if not exists public.server_heartbeats (
    server_id text primary key,
    status text not null default 'offline',
    note text,
    last_seen_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint server_heartbeats_status_check check (status in ('online', 'offline'))
);

drop trigger if exists set_push_subscriptions_updated_at on public.push_subscriptions;
create trigger set_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row
execute function public.set_updated_at();

drop trigger if exists set_server_heartbeats_updated_at on public.server_heartbeats;
create trigger set_server_heartbeats_updated_at
before update on public.server_heartbeats
for each row
execute function public.set_updated_at();

alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.push_deliveries enable row level security;
alter table public.server_heartbeats enable row level security;

grant select, insert on public.messages to anon, authenticated;
grant select, insert on public.message_attachments to anon, authenticated;
grant select, insert, update on public.push_subscriptions to anon, authenticated;
grant select on public.server_heartbeats to anon, authenticated;

drop policy if exists "Anyone can create messages" on public.messages;
create policy "Anyone can create messages"
on public.messages
for insert
to anon, authenticated
with check (status = 'pending');

drop policy if exists "Anyone can read public message status" on public.messages;
create policy "Anyone can read public message status"
on public.messages
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can create message attachments" on public.message_attachments;
create policy "Anyone can create message attachments"
on public.message_attachments
for insert
to anon, authenticated
with check (
    exists (
        select 1
        from public.messages
        where messages.id = message_attachments.message_id
    )
);

drop policy if exists "Anyone can read message attachments" on public.message_attachments;
create policy "Anyone can read message attachments"
on public.message_attachments
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can upsert push subscriptions" on public.push_subscriptions;
create policy "Anyone can upsert push subscriptions"
on public.push_subscriptions
for insert
to anon, authenticated
with check (is_active = true);

drop policy if exists "Anyone can update own push subscription endpoint" on public.push_subscriptions;
create policy "Anyone can update own push subscription endpoint"
on public.push_subscriptions
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Anyone can read server heartbeats" on public.server_heartbeats;
create policy "Anyone can read server heartbeats"
on public.server_heartbeats
for select
to anon, authenticated
using (true);

create index if not exists messages_status_created_at_idx
on public.messages (status, created_at);

create index if not exists push_subscriptions_is_active_idx
on public.push_subscriptions (is_active);

create index if not exists push_deliveries_message_id_idx
on public.push_deliveries (message_id);

insert into storage.buckets (id, name, public)
values ('message-attachments', 'message-attachments', false)
on conflict (id) do nothing;

drop policy if exists "Anyone can upload message attachments" on storage.objects;
create policy "Anyone can upload message attachments"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'message-attachments');

drop policy if exists "Anyone can read message attachments bucket" on storage.objects;
create policy "Anyone can read message attachments bucket"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'message-attachments');
