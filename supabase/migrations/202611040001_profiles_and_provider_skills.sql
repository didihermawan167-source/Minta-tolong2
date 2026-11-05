-- Minta Tolong: single-account profiles and provider skill categories.
-- Apply only after the Supabase project is active and reviewed.
-- This migration does not enable payments or expose private contact data.

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  bio text not null default '',
  city text not null default '',
  is_provider boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skill_categories (
  id text primary key,
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.provider_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  category_id text not null references public.skill_categories(id) on delete restrict,
  experience_description text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, category_id)
);

create index if not exists provider_skills_category_id_idx
  on public.provider_skills(category_id);
create index if not exists provider_skills_user_id_idx
  on public.provider_skills(user_id);

insert into public.skill_categories (id, name) values
  ('home-repair', 'Perbaikan Rumah'),
  ('electronics', 'Elektronik & HP'),
  ('vehicle', 'Kendaraan'),
  ('delivery', 'Antar & Jemput'),
  ('cleaning', 'Kebersihan'),
  ('moving', 'Angkut Barang'),
  ('computer', 'Komputer & Internet'),
  ('other', 'Keterampilan Lainnya')
on conflict (id) do nothing;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();

alter table public.user_profiles enable row level security;
alter table public.skill_categories enable row level security;
alter table public.provider_skills enable row level security;

drop policy if exists "Authenticated users can read profiles" on public.user_profiles;
create policy "Authenticated users can read profiles"
  on public.user_profiles for select
  to authenticated
  using (auth.uid() = id or is_provider = true);

drop policy if exists "Users can insert their own profile" on public.user_profiles;
create policy "Users can insert their own profile"
  on public.user_profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.user_profiles;
create policy "Users can update their own profile"
  on public.user_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Authenticated users can read skill categories" on public.skill_categories;
create policy "Authenticated users can read skill categories"
  on public.skill_categories for select
  to authenticated
  using (is_active = true);

drop policy if exists "Authenticated users can read provider skills" on public.provider_skills;
create policy "Authenticated users can read provider skills"
  on public.provider_skills for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.user_profiles p
      where p.id = provider_skills.user_id
        and p.is_provider = true
    )
  );

drop policy if exists "Users can manage their own provider skills" on public.provider_skills;
create policy "Users can manage their own provider skills"
  on public.provider_skills for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own provider skills" on public.provider_skills;
create policy "Users can update their own provider skills"
  on public.provider_skills for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own provider skills" on public.provider_skills;
create policy "Users can delete their own provider skills"
  on public.provider_skills for delete
  to authenticated
  using (auth.uid() = user_id);

-- One atomic operation: a failed category/profile write rolls back the entire save.
create or replace function public.save_provider_profile(
  p_display_name text,
  p_bio text,
  p_city text,
  p_category_ids text[]
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_category_ids text[] := coalesce(p_category_ids, array[]::text[]);
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if exists (
    select 1
    from unnest(v_category_ids) as requested(category_id)
    where not exists (
      select 1
      from public.skill_categories c
      where c.id = requested.category_id
        and c.is_active = true
    )
  ) then
    raise exception 'One or more skill categories are invalid or inactive';
  end if;

  insert into public.user_profiles (id, display_name, bio, city, is_provider, updated_at)
  values (
    v_user_id,
    coalesce(nullif(trim(p_display_name), ''), 'Pengguna'),
    coalesce(trim(p_bio), ''),
    coalesce(trim(p_city), ''),
    cardinality(v_category_ids) > 0,
    now()
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    bio = excluded.bio,
    city = excluded.city,
    is_provider = excluded.is_provider,
    updated_at = now();

  delete from public.provider_skills
  where user_id = v_user_id;

  insert into public.provider_skills (user_id, category_id, experience_description)
  select v_user_id, requested.category_id, coalesce(trim(p_bio), '')
  from (
    select distinct category_id
    from unnest(v_category_ids) as requested(category_id)
  ) requested;
end;
$$;

revoke all on function public.save_provider_profile(text, text, text, text[]) from public, anon;
grant execute on function public.save_provider_profile(text, text, text, text[]) to authenticated;
