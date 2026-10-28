-- Chạy một lần trong SQL Editor của dự án Supabase hiện tại, SAU SUPABASE_MEDIA.sql.
-- Dữ liệu album và ảnh là công khai. Chỉ Admin có quyền thêm/xóa.
create table if not exists public.photo_albums (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(title) between 1 and 250),
 description text not null default '',
 school_year text not null default '',
 month int check (month between 1 and 12),
 created_at timestamptz not null default now()
);
create table if not exists public.album_photos (
 id uuid primary key default gen_random_uuid(),
 album_id uuid not null references public.photo_albums(id) on delete cascade,
 file_path text not null,
 position int not null default 0,
 created_at timestamptz not null default now()
);
create index if not exists album_photos_album_idx on public.album_photos(album_id,position);
alter table public.photo_albums enable row level security;
alter table public.album_photos enable row level security;
drop policy if exists "public read albums" on public.photo_albums;
create policy "public read albums" on public.photo_albums for select to anon,authenticated using(true);
drop policy if exists "admin insert albums" on public.photo_albums;
create policy "admin insert albums" on public.photo_albums for insert to authenticated with check(public.is_site_admin());
drop policy if exists "admin delete albums" on public.photo_albums;
create policy "admin delete albums" on public.photo_albums for delete to authenticated using(public.is_site_admin());
drop policy if exists "public read album photos" on public.album_photos;
create policy "public read album photos" on public.album_photos for select to anon,authenticated using(true);
drop policy if exists "admin insert album photos" on public.album_photos;
create policy "admin insert album photos" on public.album_photos for insert to authenticated with check(public.is_site_admin());
drop policy if exists "admin delete album photos" on public.album_photos;
create policy "admin delete album photos" on public.album_photos for delete to authenticated using(public.is_site_admin());
grant select on public.photo_albums,public.album_photos to anon,authenticated;
grant insert,delete on public.photo_albums,public.album_photos to authenticated;
