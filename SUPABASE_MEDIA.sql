-- Chạy trên đúng dự án Supabase, sau SUPABASE_SETUP.sql.
-- Chỉ nội dung được phép công khai; không đăng dữ liệu cá nhân nhạy cảm.
create table if not exists public.media_library (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(title) between 1 and 250),
 description text not null default '',
 category text not null check (category in ('document','image','audio','video','post')),
 school_year text not null default '',
 month int check (month between 1 and 12),
 featured boolean not null default false,
 allow_download boolean not null default true,
 file_path text,
 external_url text,
 mime_type text,
 created_at timestamptz not null default now(),
 constraint media_source check (file_path is not null or external_url is not null)
);
alter table public.media_library enable row level security;
drop policy if exists "public reads media" on public.media_library;
create policy "public reads media" on public.media_library for select to anon,authenticated using (true);
drop policy if exists "admin inserts media" on public.media_library;
create policy "admin inserts media" on public.media_library for insert to authenticated with check (public.is_site_admin());
drop policy if exists "admin updates media" on public.media_library;
create policy "admin updates media" on public.media_library for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "admin deletes media" on public.media_library;
create policy "admin deletes media" on public.media_library for delete to authenticated using (public.is_site_admin());
grant select on public.media_library to anon,authenticated;
grant insert,update,delete on public.media_library to authenticated;
-- Public bucket: không dùng cho tài liệu riêng tư. File đã tải lên có URL công khai,
-- checkbox "cho phép tải về" chỉ điều khiển nút giao diện, KHÔNG chặn tải kỹ thuật.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('tanchau-public','tanchau-public',true,52428800,
 array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/wav','audio/ogg','video/mp4','video/webm'])
on conflict (id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "admin upload public files" on storage.objects;
create policy "admin upload public files" on storage.objects for insert to authenticated with check (bucket_id='tanchau-public' and public.is_site_admin());
drop policy if exists "admin delete public files" on storage.objects;
create policy "admin delete public files" on storage.objects for delete to authenticated using (bucket_id='tanchau-public' and public.is_site_admin());
