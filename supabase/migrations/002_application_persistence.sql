-- Apply after schema.sql / 001_auth_and_rls.sql. These additions match the
-- persisted fields used by the current React application.
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists github_url text;
alter table public.profiles add column if not exists portfolio_url text;
alter table public.profiles add column if not exists skills text[] not null default '{}';
alter table public.profiles add column if not exists experience jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists education jsonb not null default '[]'::jsonb;
alter table public.jobs add column if not exists requirements text[] not null default '{}';
alter table public.jobs add column if not exists experience_level text;
alter table public.applications add column if not exists ats_score numeric not null default 0;
alter table public.applications add column if not exists interview_score numeric not null default 0;
alter table public.applications add column if not exists coding_score numeric not null default 0;
alter table public.applications add column if not exists aptitude_score numeric not null default 0;
alter table public.applications add column if not exists communication_score numeric not null default 0;
alter table public.applications add column if not exists behavioral_score numeric not null default 0;
alter table public.applications add column if not exists overall_score numeric not null default 0;

create table if not exists public.resume_analyses (
  id text primary key, candidate_id uuid not null references public.profiles(id) on delete cascade,
  result jsonb not null, created_at timestamptz not null default now()
);
create table if not exists public.assessment_attempts (
  id text primary key, candidate_id uuid not null references public.profiles(id) on delete cascade,
  test_id text not null, result jsonb not null, completed_at timestamptz not null default now()
);
create table if not exists public.interview_sessions (
  id text primary key, candidate_id uuid not null references public.profiles(id) on delete cascade,
  session jsonb not null, updated_at timestamptz not null default now()
);
alter table public.resume_analyses enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.interview_sessions enable row level security;
create policy "candidate manages own resume analyses" on public.resume_analyses for all using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());
create policy "candidate manages own assessment attempts" on public.assessment_attempts for all using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());
create policy "candidate manages own interview sessions" on public.interview_sessions for all using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());

-- Recruiters only see candidate profiles and application data for jobs they own.
create policy "recruiters read candidates" on public.profiles for select using (
  role = 'candidate' and exists (select 1 from public.profiles recruiter where recruiter.id = auth.uid() and recruiter.role in ('recruiter', 'admin'))
);
create policy "recruiters read own job applications" on public.applications for select using (
  candidate_id = auth.uid() or exists (select 1 from public.jobs where jobs.id = applications.job_id and jobs.recruiter_id = auth.uid())
);
create policy "recruiters update own job applications" on public.applications for update using (
  exists (select 1 from public.jobs where jobs.id = applications.job_id and jobs.recruiter_id = auth.uid())
);
create policy "recruiters read relevant assessment attempts" on public.assessment_attempts for select using (
  exists (select 1 from public.applications join public.jobs on jobs.id = applications.job_id where applications.candidate_id = assessment_attempts.candidate_id and jobs.recruiter_id = auth.uid())
);
create policy "recruiters read relevant resume analyses" on public.resume_analyses for select using (
  exists (select 1 from public.applications join public.jobs on jobs.id = applications.job_id where applications.candidate_id = resume_analyses.candidate_id and jobs.recruiter_id = auth.uid())
);
create policy "recruiters read relevant interviews" on public.interview_sessions for select using (
  exists (select 1 from public.applications join public.jobs on jobs.id = applications.job_id where applications.candidate_id = interview_sessions.candidate_id and jobs.recruiter_id = auth.uid())
);

-- Create this public bucket in Storage if it does not already exist.
insert into storage.buckets (id, name, public) values ('profile-avatars', 'profile-avatars', true) on conflict (id) do nothing;
create policy "users upload own avatars" on storage.objects for insert with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars are publicly readable" on storage.objects for select using (bucket_id = 'profile-avatars');
