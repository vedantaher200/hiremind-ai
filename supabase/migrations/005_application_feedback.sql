-- Recruiter-approved feedback visible to the candidate on their own application.
alter table public.applications add column if not exists shareable_feedback text;
alter table public.applications add column if not exists feedback_categories text[] not null default '{}';
alter table public.applications add column if not exists status_changed_at timestamptz;
