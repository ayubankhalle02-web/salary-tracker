-- Run once in Supabase → SQL Editor.
create table public.transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense','saving')),
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  date date not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index on public.transactions (user_id, date desc);

alter table public.transactions enable row level security;

-- Each user can only see and change their own rows.
create policy "select own" on public.transactions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "insert own" on public.transactions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "update own" on public.transactions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "delete own" on public.transactions for delete to authenticated
  using (user_id = (select auth.uid()));
