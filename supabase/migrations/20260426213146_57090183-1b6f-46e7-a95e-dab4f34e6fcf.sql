create type public.app_role as enum ('admin', 'management', 'team', 'colleague', 'employee', 'partner', 'applicant');
create type public.onboarding_status as enum ('draft', 'active', 'archived');
create type public.assignment_status as enum ('open', 'in_progress', 'signed', 'overdue');
create type public.form_kind as enum ('applicant', 'partner', 'employee', 'team', 'management');

create table public.profiles (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null default '',
  organization text,
  team_name text,
  position_title text,
  onboarding_status assignment_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table public.onboarding_modules (
  id uuid not null default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  summary text not null,
  key_points text[] not null default '{}',
  audience_roles public.app_role[] not null default '{}',
  version text not null default '1.0',
  status public.onboarding_status not null default 'draft',
  is_public_teaser boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.onboarding_assignments (
  id uuid not null default gen_random_uuid() primary key,
  module_id uuid not null references public.onboarding_modules(id) on delete cascade,
  assigned_to uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  status public.assignment_status not null default 'open',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, assigned_to)
);

create table public.onboarding_forms (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.form_kind not null,
  form_data jsonb not null default '{}'::jsonb,
  status public.assignment_status not null default 'open',
  submitted_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.legal_signatures (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid references public.onboarding_modules(id) on delete restrict,
  form_id uuid references public.onboarding_forms(id) on delete restrict,
  signer_name text not null,
  signer_role public.app_role not null,
  signed_content_title text not null,
  signed_content_version text not null,
  confirmation_text text not null,
  signature_data jsonb not null,
  signature_hash text not null,
  audit_data jsonb not null default '{}'::jsonb,
  signed_at timestamptz not null default now(),
  check (module_id is not null or form_id is not null)
);

create index idx_profiles_user_id on public.profiles(user_id);
create index idx_user_roles_user_id on public.user_roles(user_id);
create index idx_modules_status on public.onboarding_modules(status);
create index idx_assignments_assigned_to on public.onboarding_assignments(assigned_to);
create index idx_forms_user_id on public.onboarding_forms(user_id);
create index idx_signatures_user_id on public.legal_signatures(user_id);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.onboarding_modules enable row level security;
alter table public.onboarding_assignments enable row level security;
alter table public.onboarding_forms enable row level security;
alter table public.legal_signatures enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create or replace function public.is_management_or_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(_user_id, 'admin') or public.has_role(_user_id, 'management')
$$;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

create trigger update_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at_column();
create trigger update_modules_updated_at before update on public.onboarding_modules for each row execute function public.update_updated_at_column();
create trigger update_assignments_updated_at before update on public.onboarding_assignments for each row execute function public.update_updated_at_column();
create trigger update_forms_updated_at before update on public.onboarding_forms for each row execute function public.update_updated_at_column();

create policy "Users can view their own profile"
on public.profiles for select to authenticated
using (auth.uid() = user_id or public.is_management_or_admin(auth.uid()));

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "Users can create their own profile"
on public.profiles for insert to authenticated
with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "Admins manage roles"
on public.user_roles for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Users can view their own roles"
on public.user_roles for select to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "Published module teasers are visible"
on public.onboarding_modules for select to anon, authenticated
using (status = 'active' and is_public_teaser = true);

create policy "Role members can view assigned modules"
on public.onboarding_modules for select to authenticated
using (
  status = 'active'
  and (
    public.is_management_or_admin(auth.uid())
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = any(public.onboarding_modules.audience_roles)
    )
  )
);

create policy "Admins manage modules"
on public.onboarding_modules for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Users view own assignments and managers view all"
on public.onboarding_assignments for select to authenticated
using (assigned_to = auth.uid() or public.is_management_or_admin(auth.uid()));

create policy "Admins and management manage assignments"
on public.onboarding_assignments for all to authenticated
using (public.is_management_or_admin(auth.uid()))
with check (public.is_management_or_admin(auth.uid()));

create policy "Users update their assignment status"
on public.onboarding_assignments for update to authenticated
using (assigned_to = auth.uid() or public.is_management_or_admin(auth.uid()))
with check (assigned_to = auth.uid() or public.is_management_or_admin(auth.uid()));

create policy "Users manage their own forms"
on public.onboarding_forms for all to authenticated
using (user_id = auth.uid() or public.is_management_or_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_management_or_admin(auth.uid()));

create policy "Users insert their own signatures"
on public.legal_signatures for insert to authenticated
with check (user_id = auth.uid());

create policy "Users and managers view signatures"
on public.legal_signatures for select to authenticated
using (user_id = auth.uid() or public.is_management_or_admin(auth.uid()));