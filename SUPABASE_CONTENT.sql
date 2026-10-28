-- Chạy một lần trong Supabase SQL Editor của đúng dự án.
-- Bảng lưu nội dung công khai (không lưu thông tin cá nhân học sinh).
create table if not exists public.site_content (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
drop policy if exists "everyone reads published content" on public.site_content;
create policy "everyone reads published content" on public.site_content
for select to anon, authenticated using (true);
drop policy if exists "only admins publish content" on public.site_content;
create policy "only admins publish content" on public.site_content
for insert to authenticated with check (public.is_site_admin());
drop policy if exists "only admins update content" on public.site_content;
create policy "only admins update content" on public.site_content
for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
-- Không cấp quyền DELETE: tránh xóa toàn bộ dữ liệu ngoài ý muốn.
grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;
