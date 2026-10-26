-- Store the external Google Calendar event identifier for managed interviews.
alter table public.interviews add column if not exists google_event_id text unique;
