-- HireMind AI - Complete Supabase Master Schema
-- Run this in the Supabase SQL editor before configuring the frontend.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('admin', 'recruiter', 'candidate');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.job_status as enum ('draft', 'published', 'closed');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.application_stage as enum ('applied', 'screening', 'ats_review', 'shortlisted', 'assessment', 'interview', 'offer', 'hired', 'rejected');
exception
  when duplicate_object then null;
end $$;

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role public.user_role not null default 'candidate',
  full_name text not null,
  phone text,
  location text,
  title text,
  bio text,
  avatar_url text,
  avatar_path text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  organization_website text,
  skills text[] not null default '{}',
  experience jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure all columns exist for existing tables
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists github_url text;
alter table public.profiles add column if not exists portfolio_url text;
alter table public.profiles add column if not exists skills text[] not null default '{}';
alter table public.profiles add column if not exists experience jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists education jsonb not null default '[]'::jsonb;

-- 2. Jobs Table
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references public.profiles(id),
  title text not null,
  department text,
  description text not null,
  requirements text[] not null default '{}',
  required_skills text[] not null default '{}',
  experience_level text,
  location text,
  employment_type text,
  salary_range text,
  status public.job_status not null default 'draft',
  application_deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Resumes Table
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);

-- 4. Applications Table
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id),
  job_id uuid not null references public.jobs(id),
  resume_id uuid references public.resumes(id),
  stage public.application_stage not null default 'applied',
  ats_score numeric not null default 0,
  interview_score numeric not null default 0,
  coding_score numeric not null default 0,
  aptitude_score numeric not null default 0,
  communication_score numeric not null default 0,
  behavioral_score numeric not null default 0,
  overall_score numeric not null default 0,
  applied_at timestamptz not null default now(),
  unique(candidate_id, job_id)
);

-- 5. Stage History Table
create table if not exists public.application_stage_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  previous_stage public.application_stage,
  new_stage public.application_stage not null,
  reason text,
  changed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 6. ATS Analyses Table
create table if not exists public.ats_analyses (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  job_id uuid not null references public.jobs(id),
  provider text not null,
  score numeric,
  result jsonb not null,
  created_at timestamptz not null default now()
);

-- 7. Notifications Table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- 8. Assessment Attempts & Interview Sessions Persistence
create table if not exists public.resume_analyses (
  id text primary key,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_attempts (
  id text primary key,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  test_id text not null,
  result jsonb not null,
  completed_at timestamptz not null default now()
);

create table if not exists public.interview_sessions (
  id text primary key,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  session jsonb not null,
  updated_at timestamptz not null default now()
);

-- 9. Interviews (Scheduled) Table
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  recruiter_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  interview_date date not null,
  interview_time time not null,
  interview_type text not null check (interview_type in ('HR Interview', 'Technical Interview', 'AI Assessment', 'Final Interview')),
  mode text not null check (mode in ('Online', 'Offline')),
  meeting_link text,
  notes text,
  status text not null default 'Scheduled' check (status in ('Scheduled', 'Completed', 'Cancelled', 'Rescheduled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS across all tables
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.resumes enable row level security;
alter table public.applications enable row level security;
alter table public.application_stage_history enable row level security;
alter table public.ats_analyses enable row level security;
alter table public.notifications enable row level security;
alter table public.resume_analyses enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.interviews enable row level security;

-- Profile Policies
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select using (
  id = auth.uid() 
  or (role = 'candidate' and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('recruiter', 'admin')
  ))
);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles for insert with check (id = auth.uid());

-- Job Policies
drop policy if exists "read published jobs" on public.jobs;
create policy "read published jobs" on public.jobs for select using (status = 'published' or recruiter_id = auth.uid());

drop policy if exists "manage own jobs" on public.jobs;
create policy "manage own jobs" on public.jobs for all using (recruiter_id = auth.uid()) with check (recruiter_id = auth.uid());

-- Resume Policies
drop policy if exists "manage own resumes" on public.resumes;
create policy "manage own resumes" on public.resumes for all using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());

-- Application Policies
drop policy if exists "manage own applications" on public.applications;
create policy "manage own applications" on public.applications for all using (
  candidate_id = auth.uid() 
  or exists (select 1 from public.jobs where jobs.id = applications.job_id and jobs.recruiter_id = auth.uid())
) with check (
  candidate_id = auth.uid() 
  or exists (select 1 from public.jobs where jobs.id = applications.job_id and jobs.recruiter_id = auth.uid())
);

-- Notification Policies
drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications for select using (user_id = auth.uid());

drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Candidate Assessments and Interviews Policies
drop policy if exists "candidate manages own resume analyses" on public.resume_analyses;
create policy "candidate manages own resume analyses" on public.resume_analyses for all using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());

drop policy if exists "candidate manages own assessment attempts" on public.assessment_attempts;
create policy "candidate manages own assessment attempts" on public.assessment_attempts for all using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());

drop policy if exists "candidate manages own interview sessions" on public.interview_sessions;
create policy "candidate manages own interview sessions" on public.interview_sessions for all using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());

drop policy if exists "candidates read own interviews" on public.interviews;
create policy "candidates read own interviews" on public.interviews for select using (candidate_id = auth.uid());

drop policy if exists "recruiters manage interviews for own jobs" on public.interviews;
create policy "recruiters manage interviews for own jobs" on public.interviews for all using (recruiter_id = auth.uid()) with check (recruiter_id = auth.uid());

-- Automatic Profile Creation Trigger on Auth User Creation
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, organization_website)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'candidate'::public.user_role),
    new.raw_user_meta_data ->> 'organization_website'
  ) on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    email = coalesce(excluded.email, public.profiles.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Storage buckets provisioning
insert into storage.buckets (id, name, public) values ('profile-avatars', 'profile-avatars', true) on conflict (id) do update set public = true;
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false) on conflict (id) do nothing;

drop policy if exists "users upload own avatars" on storage.objects;
create policy "users upload own avatars" on storage.objects for insert with check (
  bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users update own avatars" on storage.objects;
create policy "users update own avatars" on storage.objects for update using (
  bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users delete own avatars" on storage.objects;
create policy "users delete own avatars" on storage.objects for delete using (
  bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars are publicly readable" on storage.objects;
create policy "avatars are publicly readable" on storage.objects for select using (bucket_id = 'profile-avatars');

drop policy if exists "candidates manage own resumes" on storage.objects;
create policy "candidates manage own resumes" on storage.objects for all using (
  bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
);
