-- Run this once in the Supabase SQL Editor (Dashboard → SQL → New query).

create table if not exists public.user_tasks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_tasks enable row level security;

create policy "Users can read their own tasks"
  on public.user_tasks
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on public.user_tasks
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.user_tasks
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.user_tasks
  for delete
  using (auth.uid() = user_id);
