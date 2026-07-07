create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_role() = 'administrateur'
$$;

create or replace function public.is_formateur()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_role() = 'formateur'
$$;

create or replace function public.can_access_workshop(target_workshop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workshops w
    where w.id = target_workshop_id
      and w.organization_id = public.current_organization_id()
      and (
        public.is_admin()
        or w.facilitator_id = auth.uid()
        or exists (
          select 1
          from public.workshop_participants wp
          join public.beneficiaries b on b.id = wp.beneficiary_id
          where wp.workshop_id = w.id
            and b.formateur_id = auth.uid()
        )
      )
  )
$$;

revoke all on function public.current_organization_id() from public;
revoke all on function public.current_profile_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_formateur() from public;
revoke all on function public.can_access_workshop(uuid) from public;

grant execute on function public.current_organization_id() to authenticated;
grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_formateur() to authenticated;
grant execute on function public.can_access_workshop(uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.beneficiaries enable row level security;
alter table public.consents enable row level security;
alter table public.diagnostics enable row level security;
alter table public.diagnostic_scores enable row level security;
alter table public.modules enable row level security;
alter table public.skills enable row level security;
alter table public.beneficiary_modules enable row level security;
alter table public.beneficiary_skills enable row level security;
alter table public.workshops enable row level security;
alter table public.workshop_participants enable row level security;
alter table public.attendances enable row level security;
alter table public.follow_up_notes enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
for select
using (id = public.current_organization_id());

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select
using (
  organization_id = public.current_organization_id()
  and (public.is_admin() or id = auth.uid())
);

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
for insert
with check (
  organization_id = public.current_organization_id()
  and public.is_admin()
);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
for update
using (
  organization_id = public.current_organization_id()
  and (public.is_admin() or id = auth.uid())
)
with check (
  organization_id = public.current_organization_id()
  and (public.is_admin() or id = auth.uid())
);

drop policy if exists beneficiaries_select on public.beneficiaries;
create policy beneficiaries_select on public.beneficiaries
for select
using (
  organization_id = public.current_organization_id()
  and (
    public.is_admin()
    or (public.is_formateur() and formateur_id = auth.uid())
  )
);

drop policy if exists beneficiaries_insert on public.beneficiaries;
create policy beneficiaries_insert on public.beneficiaries
for insert
with check (
  organization_id = public.current_organization_id()
  and (
    public.is_admin()
    or (public.is_formateur() and formateur_id = auth.uid())
  )
);

drop policy if exists beneficiaries_update on public.beneficiaries;
create policy beneficiaries_update on public.beneficiaries
for update
using (
  organization_id = public.current_organization_id()
  and (
    public.is_admin()
    or (public.is_formateur() and formateur_id = auth.uid())
  )
)
with check (
  organization_id = public.current_organization_id()
  and (
    public.is_admin()
    or (public.is_formateur() and formateur_id = auth.uid())
  )
);

drop policy if exists beneficiaries_delete on public.beneficiaries;
create policy beneficiaries_delete on public.beneficiaries
for delete
using (
  organization_id = public.current_organization_id()
  and public.is_admin()
);

drop policy if exists consents_access on public.consents;
create policy consents_access on public.consents
for all
using (
  organization_id = public.current_organization_id()
  and exists (
    select 1
    from public.beneficiaries b
    where b.id = consents.beneficiary_id
      and (
        public.is_admin()
        or (public.is_formateur() and b.formateur_id = auth.uid())
      )
  )
)
with check (
  organization_id = public.current_organization_id()
  and exists (
    select 1
    from public.beneficiaries b
    where b.id = consents.beneficiary_id
      and (
        public.is_admin()
        or (public.is_formateur() and b.formateur_id = auth.uid())
      )
  )
);

drop policy if exists diagnostics_access on public.diagnostics;
create policy diagnostics_access on public.diagnostics
for all
using (
  organization_id = public.current_organization_id()
  and exists (
    select 1
    from public.beneficiaries b
    where b.id = diagnostics.beneficiary_id
      and (
        public.is_admin()
        or (public.is_formateur() and b.formateur_id = auth.uid())
      )
  )
)
with check (
  organization_id = public.current_organization_id()
  and exists (
    select 1
    from public.beneficiaries b
    where b.id = diagnostics.beneficiary_id
      and (
        public.is_admin()
        or (public.is_formateur() and b.formateur_id = auth.uid())
      )
  )
);

drop policy if exists diagnostic_scores_access on public.diagnostic_scores;
create policy diagnostic_scores_access on public.diagnostic_scores
for all
using (
  organization_id = public.current_organization_id()
  and exists (
    select 1
    from public.beneficiaries b
    where b.id = diagnostic_scores.beneficiary_id
      and (
        public.is_admin()
        or (public.is_formateur() and b.formateur_id = auth.uid())
      )
  )
)
with check (
  organization_id = public.current_organization_id()
  and exists (
    select 1
    from public.beneficiaries b
    where b.id = diagnostic_scores.beneficiary_id
      and (
        public.is_admin()
        or (public.is_formateur() and b.formateur_id = auth.uid())
      )
  )
);

drop policy if exists modules_select on public.modules;
create policy modules_select on public.modules
for select
using (organization_id = public.current_organization_id());

drop policy if exists modules_manage on public.modules;
create policy modules_manage on public.modules
for all
using (
  organization_id = public.current_organization_id()
  and public.is_admin()
)
with check (
  organization_id = public.current_organization_id()
  and public.is_admin()
);

drop policy if exists skills_select on public.skills;
create policy skills_select on public.skills
for select
using (organization_id = public.current_organization_id());

drop policy if exists skills_manage on public.skills;
create policy skills_manage on public.skills
for all
using (
  organization_id = public.current_organization_id()
  and public.is_admin()
)
with check (
  organization_id = public.current_organization_id()
  and public.is_admin()
);

drop policy if exists beneficiary_modules_access on public.beneficiary_modules;
create policy beneficiary_modules_access on public.beneficiary_modules
for all
using (
  organization_id = public.current_organization_id()
  and exists (
    select 1
    from public.beneficiaries b
    where b.id = beneficiary_modules.beneficiary_id
      and (
        public.is_admin()
        or (public.is_formateur() and b.formateur_id = auth.uid())
      )
  )
)
with check (
  organization_id = public.current_organization_id()
  and exists (
    select 1
    from public.beneficiaries b
    where b.id = beneficiary_modules.beneficiary_id
      and (
        public.is_admin()
        or (public.is_formateur() and b.formateur_id = auth.uid())
      )
  )
);

drop policy if exists beneficiary_skills_access on public.beneficiary_skills;
create policy beneficiary_skills_access on public.beneficiary_skills
for all
using (
  organization_id = public.current_organization_id()
  and exists (
    select 1
    from public.beneficiaries b
    where b.id = beneficiary_skills.beneficiary_id
      and (
        public.is_admin()
        or (public.is_formateur() and b.formateur_id = auth.uid())
      )
  )
)
with check (
  organization_id = public.current_organization_id()
  and exists (
    select 1
    from public.beneficiaries b
    where b.id = beneficiary_skills.beneficiary_id
      and (
        public.is_admin()
        or (public.is_formateur() and b.formateur_id = auth.uid())
      )
  )
);

drop policy if exists workshops_select on public.workshops;
create policy workshops_select on public.workshops
for select
using (public.can_access_workshop(id));

drop policy if exists workshops_insert on public.workshops;
create policy workshops_insert on public.workshops
for insert
with check (
  organization_id = public.current_organization_id()
  and (
    public.is_admin()
    or facilitator_id = auth.uid()
  )
);

drop policy if exists workshops_update on public.workshops;
create policy workshops_update on public.workshops
for update
using (
  organization_id = public.current_organization_id()
  and (
    public.is_admin()
    or facilitator_id = auth.uid()
  )
)
with check (
  organization_id = public.current_organization_id()
  and (
    public.is_admin()
    or facilitator_id = auth.uid()
  )
);

drop policy if exists workshops_delete on public.workshops;
create policy workshops_delete on public.workshops
for delete
using (
  organization_id = public.current_organization_id()
  and (
    public.is_admin()
    or facilitator_id = auth.uid()
  )
);

drop policy if exists workshop_participants_access on public.workshop_participants;
create policy workshop_participants_access on public.workshop_participants
for all
using (
  organization_id = public.current_organization_id()
  and public.can_access_workshop(workshop_id)
)
with check (
  organization_id = public.current_organization_id()
  and public.can_access_workshop(workshop_id)
);

drop policy if exists attendances_access on public.attendances;
create policy attendances_access on public.attendances
for all
using (
  organization_id = public.current_organization_id()
  and exists (
    select 1
    from public.beneficiaries b
    where b.id = attendances.beneficiary_id
      and (
        public.is_admin()
        or (public.is_formateur() and b.formateur_id = auth.uid())
      )
  )
)
with check (
  organization_id = public.current_organization_id()
  and exists (
    select 1
    from public.beneficiaries b
    where b.id = attendances.beneficiary_id
      and (
        public.is_admin()
        or (public.is_formateur() and b.formateur_id = auth.uid())
      )
  )
);

drop policy if exists notes_select on public.follow_up_notes;
create policy notes_select on public.follow_up_notes
for select
using (
  organization_id = public.current_organization_id()
  and exists (
    select 1
    from public.beneficiaries b
    where b.id = follow_up_notes.beneficiary_id
      and (
        public.is_admin()
        or (
          public.is_formateur()
          and b.formateur_id = auth.uid()
          and follow_up_notes.is_sensitive = false
        )
      )
  )
);

drop policy if exists notes_insert on public.follow_up_notes;
create policy notes_insert on public.follow_up_notes
for insert
with check (
  organization_id = public.current_organization_id()
  and exists (
    select 1
    from public.beneficiaries b
    where b.id = follow_up_notes.beneficiary_id
      and (
        public.is_admin()
        or (
          public.is_formateur()
          and b.formateur_id = auth.uid()
          and follow_up_notes.is_sensitive = false
        )
      )
  )
);

drop policy if exists notes_delete on public.follow_up_notes;
create policy notes_delete on public.follow_up_notes
for delete
using (
  organization_id = public.current_organization_id()
  and (
    public.is_admin()
    or (
      public.is_formateur()
      and author_id = auth.uid()
      and is_sensitive = false
    )
  )
);

drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
for select
using (
  organization_id = public.current_organization_id()
  and public.is_admin()
);

drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
for insert
with check (
  organization_id = public.current_organization_id()
  and actor_id = auth.uid()
);
