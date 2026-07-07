create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('administrateur', 'formateur', 'coordinateur');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.beneficiary_status as enum ('actif', 'pause', 'sorti', 'archive');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.module_priority as enum ('prioritaire', 'recommande');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.module_status as enum ('a_faire', 'en_cours', 'termine', 'archive');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.attendance_status as enum ('inscrit', 'present', 'absent', 'retard', 'excuse');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.note_type as enum ('general', 'progression', 'difficulte', 'orientation', 'administratif');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.note_visibility as enum ('interne');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  role public.user_role not null default 'formateur',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  formateur_id uuid references public.profiles(id) on delete set null,
  first_name text not null,
  last_name text not null,
  birth_year integer check (birth_year is null or birth_year between 1900 and extract(year from now())::integer),
  phone text not null,
  email text,
  family_situation text,
  children_count integer not null default 0 check (children_count >= 0),
  french_level_estimate integer check (french_level_estimate between 1 and 5),
  priority_needs text[] not null default '{}',
  status public.beneficiary_status not null default 'actif',
  rgpd_consent boolean not null default false,
  entry_date date not null default current_date,
  exit_date date,
  exit_outcome text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  beneficiary_id uuid not null references public.beneficiaries(id) on delete cascade,
  accepted boolean not null default true,
  accepted_at timestamptz not null default timezone('utc', now()),
  policy_version text not null,
  collected_by uuid references public.profiles(id) on delete set null,
  source text not null default 'staff-form',
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  beneficiary_id uuid not null references public.beneficiaries(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  summary text,
  french_average numeric(4,2) not null default 0,
  digital_average numeric(4,2) not null default 0,
  overall_average numeric(4,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.diagnostic_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  diagnostic_id uuid not null references public.diagnostics(id) on delete cascade,
  beneficiary_id uuid not null references public.beneficiaries(id) on delete cascade,
  axis_code text not null,
  axis_label text not null,
  score integer not null check (score between 1 and 5),
  comment text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (diagnostic_id, axis_code)
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  color_token text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, code)
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  display_order integer not null default 0,
  stat_key text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (module_id, code)
);

create table if not exists public.beneficiary_modules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  beneficiary_id uuid not null references public.beneficiaries(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  module_code text not null,
  priority public.module_priority not null,
  status public.module_status not null default 'a_faire',
  assigned_from_diagnostic_id uuid references public.diagnostics(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (beneficiary_id, module_id)
);

create table if not exists public.beneficiary_skills (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  beneficiary_id uuid not null references public.beneficiaries(id) on delete cascade,
  beneficiary_module_id uuid not null references public.beneficiary_modules(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  validated_by uuid references public.profiles(id) on delete set null,
  validated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (beneficiary_id, skill_id)
);

create table if not exists public.workshops (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  module_id uuid references public.modules(id) on delete set null,
  module_code text,
  facilitator_id uuid references public.profiles(id) on delete set null,
  workshop_date date not null,
  workshop_time time,
  location text,
  capacity integer,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workshop_participants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  beneficiary_id uuid not null references public.beneficiaries(id) on delete cascade,
  registered_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (workshop_id, beneficiary_id)
);

create table if not exists public.attendances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  participant_id uuid not null references public.workshop_participants(id) on delete cascade,
  beneficiary_id uuid not null references public.beneficiaries(id) on delete cascade,
  status public.attendance_status not null default 'inscrit',
  note text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workshop_id, beneficiary_id)
);

create table if not exists public.follow_up_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  beneficiary_id uuid not null references public.beneficiaries(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  note_type public.note_type not null default 'general',
  content text not null,
  visibility public.note_visibility not null default 'interne',
  is_sensitive boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_organization on public.profiles (organization_id);
create index if not exists idx_beneficiaries_organization on public.beneficiaries (organization_id);
create index if not exists idx_beneficiaries_formateur on public.beneficiaries (formateur_id);
create index if not exists idx_diagnostics_beneficiary on public.diagnostics (beneficiary_id, created_at desc);
create index if not exists idx_diagnostic_scores_beneficiary on public.diagnostic_scores (beneficiary_id);
create index if not exists idx_modules_organization on public.modules (organization_id, display_order);
create index if not exists idx_skills_module on public.skills (module_id, display_order);
create index if not exists idx_beneficiary_modules_beneficiary on public.beneficiary_modules (beneficiary_id);
create index if not exists idx_beneficiary_skills_beneficiary on public.beneficiary_skills (beneficiary_id);
create index if not exists idx_workshops_date on public.workshops (workshop_date desc);
create index if not exists idx_workshop_participants_workshop on public.workshop_participants (workshop_id);
create index if not exists idx_attendances_workshop on public.attendances (workshop_id);
create index if not exists idx_notes_beneficiary on public.follow_up_notes (beneficiary_id, created_at desc);
create index if not exists idx_audit_logs_organization on public.audit_logs (organization_id, created_at desc);

drop trigger if exists set_updated_at_organizations on public.organizations;
create trigger set_updated_at_organizations
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_beneficiaries on public.beneficiaries;
create trigger set_updated_at_beneficiaries
before update on public.beneficiaries
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_modules on public.modules;
create trigger set_updated_at_modules
before update on public.modules
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_skills on public.skills;
create trigger set_updated_at_skills
before update on public.skills
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_beneficiary_modules on public.beneficiary_modules;
create trigger set_updated_at_beneficiary_modules
before update on public.beneficiary_modules
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_workshops on public.workshops;
create trigger set_updated_at_workshops
before update on public.workshops
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_attendances on public.attendances;
create trigger set_updated_at_attendances
before update on public.attendances
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_follow_up_notes on public.follow_up_notes;
create trigger set_updated_at_follow_up_notes
before update on public.follow_up_notes
for each row execute function public.set_updated_at();

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

alter default privileges in schema public
grant select, insert, update, delete on tables to authenticated, service_role;

alter default privileges in schema public
grant usage, select on sequences to authenticated, service_role;
