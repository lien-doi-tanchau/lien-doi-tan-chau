-- Chạy trong Supabase SQL Editor, sau khi tạo dự án.
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 email text,
 role text not null default 'guest' check (role in ('guest','admin'))
);
alter table public.profiles enable row level security;
create or replace function public.is_site_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;
revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;
drop policy if exists "read own profile or admin" on public.profiles;
create policy "read own profile or admin" on public.profiles for select to authenticated
using (id=auth.uid() or public.is_site_admin());
drop policy if exists "admin updates profiles" on public.profiles;
create policy "admin updates profiles" on public.profiles for update to authenticated
using (public.is_site_admin()) with check (public.is_site_admin());
create or replace function public.create_profile_for_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
 insert into public.profiles(id,email,role) values(new.id,new.email,'guest')
 on conflict (id) do nothing;
 return new;
end $$;
drop trigger if exists on_auth_user_created_tc on auth.users;
create trigger on_auth_user_created_tc after insert on auth.users
for each row execute procedure public.create_profile_for_user();
insert into public.profiles(id,email,role)
select id,email,'guest' from auth.users on conflict(id) do nothing;
-- Sau khi tạo tài khoản quản trị qua Supabase Authentication -> Users,
-- thay admin@example.com bằng email thật rồi chạy lệnh dưới đây một lần:
-- update public.profiles set role='admin' where email='admin@example.com';
