-- Run this in the Supabase SQL editor before configuring the frontend.
create extension if not exists pgcrypto;
create type public.user_role as enum ('admin', 'recruiter', 'candidate');
create type public.job_status as enum ('draft', 'published', 'closed');
create type public.application_stage as enum ('applied', 'screening', 'ats_review', 'shortlisted', 'assessment', 'interview', 'offer', 'hired', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'candidate', full_name text not null,
  phone text, location text, title text, bio text, avatar_path text, organization_website text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.jobs (
  id uuid primary key default gen_random_uuid(), recruiter_id uuid not null references public.profiles(id),
  title text not null, department text, description text not null, required_skills text[] not null default '{}',
  location text, employment_type text, salary_range text, status public.job_status not null default 'draft',
  application_deadline date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.resumes (
  id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null, file_name text not null, mime_type text not null, size_bytes bigint not null, created_at timestamptz not null default now()
);
create table public.applications (
  id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.profiles(id), job_id uuid not null references public.jobs(id),
  resume_id uuid references public.resumes(id), stage public.application_stage not null default 'applied', applied_at timestamptz not null default now(), unique(candidate_id, job_id)
);
create table public.application_stage_history (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.applications(id) on delete cascade,
  previous_stage public.application_stage, new_stage public.application_stage not null, reason text, changed_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table public.ats_analyses (
  id uuid primary key default gen_random_uuid(), resume_id uuid not null references public.resumes(id) on delete cascade, job_id uuid not null references public.jobs(id),
  provider text not null, score numeric, result jsonb not null, created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, message text not null, read_at timestamptz, created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.resumes enable row level security;
alter table public.applications enable row level security;
alter table public.application_stage_history enable row level security;
alter table public.ats_analyses enable row level security;
alter table public.notifications enable row level security;
create policy "read own profile" on public.profiles for select using (id = auth.uid());
create policy "update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "read published jobs" on public.jobs for select using (status = 'published' or recruiter_id = auth.uid());
create policy "manage own jobs" on public.jobs for all using (recruiter_id = auth.uid()) with check (recruiter_id = auth.uid());
create policy "manage own resumes" on public.resumes for all using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());
create policy "manage own applications" on public.applications for all using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());
create policy "read own notifications" on public.notifications for select using (user_id = auth.uid());

-- Required auth bootstrap: creates the profile with SECURITY DEFINER, so email
-- confirmation settings do not prevent client-side RLS from creating it.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, organization_website)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'candidate'),
    new.raw_user_meta_data ->> 'organization_website'
  ) on conflict (id) do update set full_name = excluded.full_name;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create policy "insert own profile" on public.profiles for insert with check (id = auth.uid());
create policy "users update own notifications" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
