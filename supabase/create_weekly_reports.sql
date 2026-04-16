-- ──────────────────────────────────────────────────────────────
-- Weekly Reports & Admin Users
-- Run this in Supabase SQL Editor
-- ──────────────────────────────────────────────────────────────

-- Admin users table
create table if not exists public.admin_users (
  id   uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Each user can only see their own admin record (used for isAdmin check)
create policy "Users can read own admin record"
  on public.admin_users for select
  to authenticated
  using (id = auth.uid());

-- ──────────────────────────────────────────────────────────────

-- Weekly reports table
create table if not exists public.weekly_reports (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null,
  content      text        not null,
  image_url    text,
  is_published boolean     not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.weekly_reports enable row level security;

-- Anyone (anon + authenticated) can read published reports
create policy "Public can read published reports"
  on public.weekly_reports for select
  using (is_published = true);

-- Admins can read ALL reports (including drafts)
create policy "Admin can read all reports"
  on public.weekly_reports for select
  to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()));

-- Admins can insert
create policy "Admin can insert reports"
  on public.weekly_reports for insert
  to authenticated
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

-- Admins can update
create policy "Admin can update reports"
  on public.weekly_reports for update
  to authenticated
  using   (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

-- Admins can delete
create policy "Admin can delete reports"
  on public.weekly_reports for delete
  to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()));

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger weekly_reports_updated_at
  before update on public.weekly_reports
  for each row execute function public.set_updated_at();

-- ──────────────────────────────────────────────────────────────
-- MANUAL STEP (Supabase Dashboard):
-- Storage > New bucket > Name: "report-images" > Public: ON
-- Then add storage policy:
--   SELECT: true (public read)
--   INSERT/UPDATE/DELETE: auth.uid() in (select id from admin_users)
-- ──────────────────────────────────────────────────────────────

-- To add an admin user (run after the user signs up):
-- insert into public.admin_users (id, email)
-- select id, email from auth.users where email = 'your@email.com';
