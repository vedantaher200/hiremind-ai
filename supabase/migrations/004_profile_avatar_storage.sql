-- Apply after 003_interviews_storage_and_rls.sql.
-- Idempotently provisions the bucket used by both candidate and recruiter avatars.

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "users upload own avatars" on storage.objects;
create policy "users upload own avatars" on storage.objects
  for insert with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users update own avatars" on storage.objects;
create policy "users update own avatars" on storage.objects
  for update using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete own avatars" on storage.objects;
create policy "users delete own avatars" on storage.objects
  for delete using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars are publicly readable" on storage.objects;
create policy "avatars are publicly readable" on storage.objects
  for select using (bucket_id = 'profile-avatars');