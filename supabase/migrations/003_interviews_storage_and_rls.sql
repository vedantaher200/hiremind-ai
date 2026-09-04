-- Apply after 002_application_persistence.sql.
-- Adds persisted recruiter-to-candidate interviews and resume storage policies.

alter table public.profiles add column if not exists email text;
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and (p.email is null or p.email = '');

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

create index if not exists interviews_candidate_idx on public.interviews(candidate_id, interview_date, interview_time);
create index if not exists interviews_recruiter_idx on public.interviews(recruiter_id, interview_date, interview_time);

alter table public.interviews enable row level security;

drop policy if exists "candidates read own interviews" on public.interviews;
create policy "candidates read own interviews" on public.interviews
  for select using (candidate_id = auth.uid());

drop policy if exists "recruiters manage interviews for own jobs" on public.interviews;
create policy "recruiters manage interviews for own jobs" on public.interviews
  for all using (recruiter_id = auth.uid())
  with check (recruiter_id = auth.uid());

drop policy if exists "recruiters read candidates" on public.profiles;
create policy "recruiters read candidates" on public.profiles
  for select using (
    role = 'candidate'
    and coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('recruiter', 'admin')
  );

drop policy if exists "recruiters update own job applications" on public.applications;
create policy "recruiters update own job applications" on public.applications
  for update using (
    exists (select 1 from public.jobs where jobs.id = applications.job_id and jobs.recruiter_id = auth.uid())
  ) with check (
    exists (select 1 from public.jobs where jobs.id = applications.job_id and jobs.recruiter_id = auth.uid())
  );

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

drop policy if exists "candidates manage own resumes" on storage.objects;
create policy "candidates manage own resumes" on storage.objects
  for all using (
    bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
  );
