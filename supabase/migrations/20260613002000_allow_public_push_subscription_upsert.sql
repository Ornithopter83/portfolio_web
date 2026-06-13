grant select, insert, update on table public.push_subscriptions to anon, authenticated;

drop policy if exists "public can create push subscriptions" on public.push_subscriptions;
drop policy if exists "public can update own endpoint subscriptions" on public.push_subscriptions;
drop policy if exists "Anyone can upsert push subscriptions" on public.push_subscriptions;
drop policy if exists "Anyone can update own push subscription endpoint" on public.push_subscriptions;
drop policy if exists "public insert push subscriptions" on public.push_subscriptions;
drop policy if exists "public update push subscriptions" on public.push_subscriptions;
drop policy if exists "public select push subscriptions" on public.push_subscriptions;

create policy "public insert push subscriptions"
on public.push_subscriptions
for insert
to public
with check (true);

create policy "public update push subscriptions"
on public.push_subscriptions
for update
to public
using (true)
with check (true);

create policy "public select push subscriptions"
on public.push_subscriptions
for select
to public
using (true);
