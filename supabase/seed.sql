-- Hosted Supabase order:
-- 1. Run schema.sql
-- 2. Run rls.sql
-- 3. Create and confirm these Auth users in the Dashboard:
--    admin@logixfamille.demo / LogixDemo123!
--    formateur@logixfamille.demo / LogixDemo123!
-- 4. Run this seed.sql file

insert into public.organizations (id, name, slug)
values (
  '11111111-1111-4111-8111-111111111111',
  'Association Horizon Familles',
  'horizon-familles'
)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug;

do $$
begin
  if not exists (
    select 1 from auth.users where email = 'admin@logixfamille.demo'
  ) then
    raise exception 'Create the Auth user admin@logixfamille.demo before running seed.sql';
  end if;

  if not exists (
    select 1 from auth.users where email = 'formateur@logixfamille.demo'
  ) then
    raise exception 'Create the Auth user formateur@logixfamille.demo before running seed.sql';
  end if;
end $$;

insert into public.profiles (id, organization_id, first_name, last_name, email, role)
select
  id,
  '11111111-1111-4111-8111-111111111111',
  'Amina',
  'Diallo',
  'admin@logixfamille.demo',
  'administrateur'
from auth.users
where email = 'admin@logixfamille.demo'
on conflict (id) do update set
  organization_id = excluded.organization_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  email = excluded.email,
  role = excluded.role;

insert into public.profiles (id, organization_id, first_name, last_name, email, role)
select
  id,
  '11111111-1111-4111-8111-111111111111',
  'Nora',
  'Bensaid',
  'formateur@logixfamille.demo',
  'formateur'
from auth.users
where email = 'formateur@logixfamille.demo'
on conflict (id) do update set
  organization_id = excluded.organization_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  email = excluded.email,
  role = excluded.role;

insert into public.modules (id, organization_id, code, title, description, color_token, display_order)
values
('90000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'francais-quotidien', 'Francais du quotidien', 'Communication, lecture et ecriture utiles au quotidien.', 'pine', 1),
('90000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'parents-ecole', 'Parents et ecole', 'Relation avec l''ecole et suivi de la scolarite.', 'sand', 2),
('90000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'sante', 'Sante', 'Autonomie de parcours de sante.', 'coral', 3),
('90000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'travail-insertion', 'Travail et insertion professionnelle', 'Demarches d''insertion et outils de candidature.', 'pine', 4),
('90000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'numerique-demarches', 'Numerique et demarches en ligne', 'Smartphone, email et services numeriques utiles.', 'sand', 5),
('90000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'autonomie-administrative', 'Autonomie administrative', 'Organisation des papiers et services publics en ligne.', 'coral', 6)
on conflict (organization_id, code) do update set
  title = excluded.title,
  description = excluded.description,
  color_token = excluded.color_token,
  display_order = excluded.display_order;

insert into public.skills (id, organization_id, module_id, code, title, display_order, stat_key)
values
('91000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000001', 'french-understand-appointments', 'Comprendre un rendez-vous ou une consigne simple', 1, null),
('91000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000001', 'french-fill-basic-form', 'Remplir un formulaire simple', 2, null),
('91000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000001', 'french-read-school-message', 'Lire un message d''ecole ou d''administration', 3, null),
('91000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000001', 'french-write-short-message', 'Ecrire un message court comprehensible', 4, null),
('91000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000001', 'french-ask-for-help', 'Demander de l''aide et reformuler un besoin', 5, null),
('91000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000002', 'school-read-notebook', 'Lire le carnet ou l''ENT de l''enfant', 1, null),
('91000000-0000-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000002', 'school-book-appointment', 'Prendre un rendez-vous avec l''ecole', 2, null),
('91000000-0000-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000002', 'school-prepare-meeting', 'Preparer une reunion parents-professeurs', 3, null),
('91000000-0000-4000-8000-000000000009', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000002', 'school-understand-homework', 'Comprendre les devoirs et consignes', 4, null),
('91000000-0000-4000-8000-000000000010', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000002', 'school-identify-supports', 'Identifier les aides et ressources scolaires', 5, null),
('91000000-0000-4000-8000-000000000011', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000003', 'health-book-appointment', 'Prendre un rendez-vous de sante', 1, null),
('91000000-0000-4000-8000-000000000012', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000003', 'health-identify-right-contact', 'Identifier le bon interlocuteur de sante', 2, null),
('91000000-0000-4000-8000-000000000013', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000003', 'health-prepare-documents', 'Preparer ses documents utiles', 3, null),
('91000000-0000-4000-8000-000000000014', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000003', 'health-understand-prescription', 'Comprendre une ordonnance ou un compte-rendu simple', 4, null),
('91000000-0000-4000-8000-000000000015', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000003', 'health-follow-up', 'Organiser son suivi et ses rappels', 5, null),
('91000000-0000-4000-8000-000000000016', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000004', 'work-cv', 'CV valide', 1, 'cv_validated'),
('91000000-0000-4000-8000-000000000017', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000004', 'work-cover-letter', 'Presenter son parcours a l''oral ou a l''ecrit', 2, null),
('91000000-0000-4000-8000-000000000018', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000004', 'work-job-search', 'Rechercher une offre et y repondre', 3, null),
('91000000-0000-4000-8000-000000000019', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000004', 'work-interview', 'Se preparer a un entretien', 4, null),
('91000000-0000-4000-8000-000000000020', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000004', 'work-rights', 'Comprendre les bases des droits et contrats', 5, null),
('91000000-0000-4000-8000-000000000021', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000005', 'digital-email', 'Creer, lire et envoyer un email', 1, null),
('91000000-0000-4000-8000-000000000022', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000005', 'digital-smartphone-files', 'Scanner et envoyer un document depuis le smartphone', 2, null),
('91000000-0000-4000-8000-000000000023', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000005', 'digital-passwords', 'Utiliser des mots de passe fiables', 3, null),
('91000000-0000-4000-8000-000000000024', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000005', 'digital-online-form', 'Completer une demarche simple en ligne', 4, null),
('91000000-0000-4000-8000-000000000025', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000005', 'digital-video-call', 'Participer a un appel ou rendez-vous video', 5, null),
('91000000-0000-4000-8000-000000000026', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000006', 'admin-sort-documents', 'Classer ses documents administratifs', 1, 'administrative_skill'),
('91000000-0000-4000-8000-000000000027', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000006', 'admin-online-account', 'Acceder a un compte de service public', 2, null),
('91000000-0000-4000-8000-000000000028', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000006', 'admin-complete-request', 'Completer une demande administrative simple', 3, null),
('91000000-0000-4000-8000-000000000029', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000006', 'admin-appointments', 'Prendre ou confirmer un rendez-vous administratif', 4, null),
('91000000-0000-4000-8000-000000000030', '11111111-1111-4111-8111-111111111111', '90000000-0000-4000-8000-000000000006', 'admin-follow-deadline', 'Suivre une echeance ou une relance', 5, null)
on conflict (id) do nothing;

insert into public.beneficiaries (
  id,
  organization_id,
  formateur_id,
  first_name,
  last_name,
  birth_year,
  phone,
  email,
  family_situation,
  children_count,
  french_level_estimate,
  priority_needs,
  status,
  rgpd_consent,
  entry_date,
  exit_date,
  exit_outcome
)
values
(
  '44444444-4444-4444-8444-444444444444',
  '11111111-1111-4111-8111-111111111111',
  (select id from public.profiles where email = 'formateur@logixfamille.demo'),
  'Samira',
  'Kone',
  1988,
  '0600000001',
  'samira.kone@example.org',
  'Mere isolee',
  2,
  2,
  array['FLE', 'ecole', 'CAF'],
  'actif',
  true,
  current_date - interval '120 day',
  null,
  null
),
(
  '55555555-5555-4555-8555-555555555555',
  '11111111-1111-4111-8111-111111111111',
  (select id from public.profiles where email = 'formateur@logixfamille.demo'),
  'Mamadou',
  'Traore',
  1991,
  '0600000002',
  null,
  'Couple',
  3,
  3,
  array['emploi', 'numerique'],
  'actif',
  true,
  current_date - interval '90 day',
  null,
  null
),
(
  '66666666-6666-4666-8666-666666666666',
  '11111111-1111-4111-8111-111111111111',
  (select id from public.profiles where email = 'formateur@logixfamille.demo'),
  'Fatou',
  'Mendy',
  1985,
  '0600000003',
  'fatou.mendy@example.org',
  'Couple',
  1,
  4,
  array['administratif'],
  'sorti',
  true,
  current_date - interval '240 day',
  current_date - interval '12 day',
  'formation'
)
on conflict (id) do update set
  status = excluded.status,
  french_level_estimate = excluded.french_level_estimate,
  priority_needs = excluded.priority_needs,
  exit_date = excluded.exit_date,
  exit_outcome = excluded.exit_outcome;

insert into public.consents (organization_id, beneficiary_id, accepted, policy_version, collected_by)
values
('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', true, '2026-07', (select id from public.profiles where email = 'formateur@logixfamille.demo')),
('11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555', true, '2026-07', (select id from public.profiles where email = 'formateur@logixfamille.demo')),
('11111111-1111-4111-8111-111111111111', '66666666-6666-4666-8666-666666666666', true, '2026-07', (select id from public.profiles where email = 'formateur@logixfamille.demo'))
on conflict do nothing;

insert into public.diagnostics (
  id,
  organization_id,
  beneficiary_id,
  created_by,
  summary,
  french_average,
  digital_average,
  overall_average,
  created_at
)
values
('77777777-7777-4777-8777-000000000001', '11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', (select id from public.profiles where email = 'formateur@logixfamille.demo'), 'Diagnostic d''entree avec priorites FLE, ecole et numerique.', 1.67, 1.67, 2.10, timezone('utc', now()) - interval '100 day'),
('77777777-7777-4777-8777-000000000002', '11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', (select id from public.profiles where email = 'formateur@logixfamille.demo'), 'Deuxieme diagnostic montrant une progression reguliere.', 2.67, 2.67, 2.90, timezone('utc', now()) - interval '20 day'),
('77777777-7777-4777-8777-000000000003', '11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555', (select id from public.profiles where email = 'formateur@logixfamille.demo'), 'Priorite emploi et demarches numeriques.', 3.00, 2.67, 3.00, timezone('utc', now()) - interval '30 day'),
('77777777-7777-4777-8777-000000000004', '11111111-1111-4111-8111-111111111111', '66666666-6666-4666-8666-666666666666', (select id from public.profiles where email = 'formateur@logixfamille.demo'), 'Beneficiaire sorti vers formation.', 4.00, 4.33, 4.10, timezone('utc', now()) - interval '40 day')
on conflict (id) do nothing;

insert into public.diagnostic_scores (organization_id, diagnostic_id, beneficiary_id, axis_code, axis_label, score, comment)
values
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000001', '44444444-4444-4444-8444-444444444444', 'french_oral', 'Francais oral', 2, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000001', '44444444-4444-4444-8444-444444444444', 'reading', 'Lecture', 1, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000001', '44444444-4444-4444-8444-444444444444', 'writing', 'Ecriture', 2, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000001', '44444444-4444-4444-8444-444444444444', 'digital_autonomy', 'Autonomie numerique', 2, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000001', '44444444-4444-4444-8444-444444444444', 'children_school', 'Ecole des enfants', 2, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000001', '44444444-4444-4444-8444-444444444444', 'health', 'Sante', 3, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000001', '44444444-4444-4444-8444-444444444444', 'work', 'Travail', 3, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000001', '44444444-4444-4444-8444-444444444444', 'administration', 'Administration', 2, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000001', '44444444-4444-4444-8444-444444444444', 'smartphone_email', 'Smartphone / email', 1, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000001', '44444444-4444-4444-8444-444444444444', 'public_services', 'Services publics en ligne', 2, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000002', '44444444-4444-4444-8444-444444444444', 'french_oral', 'Francais oral', 3, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000002', '44444444-4444-4444-8444-444444444444', 'reading', 'Lecture', 2, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000002', '44444444-4444-4444-8444-444444444444', 'writing', 'Ecriture', 3, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000002', '44444444-4444-4444-8444-444444444444', 'digital_autonomy', 'Autonomie numerique', 3, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000002', '44444444-4444-4444-8444-444444444444', 'children_school', 'Ecole des enfants', 3, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000002', '44444444-4444-4444-8444-444444444444', 'health', 'Sante', 3, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000002', '44444444-4444-4444-8444-444444444444', 'work', 'Travail', 3, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000002', '44444444-4444-4444-8444-444444444444', 'administration', 'Administration', 3, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000002', '44444444-4444-4444-8444-444444444444', 'smartphone_email', 'Smartphone / email', 2, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000002', '44444444-4444-4444-8444-444444444444', 'public_services', 'Services publics en ligne', 3, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000003', '55555555-5555-4555-8555-555555555555', 'french_oral', 'Francais oral', 3, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000003', '55555555-5555-4555-8555-555555555555', 'reading', 'Lecture', 3, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000003', '55555555-5555-4555-8555-555555555555', 'writing', 'Ecriture', 3, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000003', '55555555-5555-4555-8555-555555555555', 'digital_autonomy', 'Autonomie numerique', 2, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000003', '55555555-5555-4555-8555-555555555555', 'children_school', 'Ecole des enfants', 4, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000003', '55555555-5555-4555-8555-555555555555', 'health', 'Sante', 3, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000003', '55555555-5555-4555-8555-555555555555', 'work', 'Travail', 2, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000003', '55555555-5555-4555-8555-555555555555', 'administration', 'Administration', 3, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000003', '55555555-5555-4555-8555-555555555555', 'smartphone_email', 'Smartphone / email', 3, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000003', '55555555-5555-4555-8555-555555555555', 'public_services', 'Services publics en ligne', 3, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000004', '66666666-6666-4666-8666-666666666666', 'french_oral', 'Francais oral', 4, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000004', '66666666-6666-4666-8666-666666666666', 'reading', 'Lecture', 4, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000004', '66666666-6666-4666-8666-666666666666', 'writing', 'Ecriture', 4, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000004', '66666666-6666-4666-8666-666666666666', 'digital_autonomy', 'Autonomie numerique', 4, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000004', '66666666-6666-4666-8666-666666666666', 'children_school', 'Ecole des enfants', 5, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000004', '66666666-6666-4666-8666-666666666666', 'health', 'Sante', 4, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000004', '66666666-6666-4666-8666-666666666666', 'work', 'Travail', 4, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000004', '66666666-6666-4666-8666-666666666666', 'administration', 'Administration', 4, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000004', '66666666-6666-4666-8666-666666666666', 'smartphone_email', 'Smartphone / email', 5, ''),
('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-000000000004', '66666666-6666-4666-8666-666666666666', 'public_services', 'Services publics en ligne', 4, '')
on conflict do nothing;

insert into public.beneficiary_modules (id, organization_id, beneficiary_id, module_id, module_code, priority, status, assigned_from_diagnostic_id)
values
('88888888-8888-4888-8888-000000000001', '11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', '90000000-0000-4000-8000-000000000001', 'francais-quotidien', 'prioritaire', 'en_cours', '77777777-7777-4777-8777-000000000002'),
('88888888-8888-4888-8888-000000000002', '11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', '90000000-0000-4000-8000-000000000002', 'parents-ecole', 'recommande', 'en_cours', '77777777-7777-4777-8777-000000000002'),
('88888888-8888-4888-8888-000000000003', '11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', '90000000-0000-4000-8000-000000000005', 'numerique-demarches', 'recommande', 'en_cours', '77777777-7777-4777-8777-000000000002'),
('88888888-8888-4888-8888-000000000004', '11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555', '90000000-0000-4000-8000-000000000004', 'travail-insertion', 'prioritaire', 'en_cours', '77777777-7777-4777-8777-000000000003'),
('88888888-8888-4888-8888-000000000005', '11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555', '90000000-0000-4000-8000-000000000005', 'numerique-demarches', 'prioritaire', 'termine', '77777777-7777-4777-8777-000000000003'),
('88888888-8888-4888-8888-000000000006', '11111111-1111-4111-8111-111111111111', '66666666-6666-4666-8666-666666666666', '90000000-0000-4000-8000-000000000006', 'autonomie-administrative', 'recommande', 'termine', '77777777-7777-4777-8777-000000000004')
on conflict (beneficiary_id, module_id) do nothing;

insert into public.beneficiary_skills (organization_id, beneficiary_id, beneficiary_module_id, module_id, skill_id, validated_by)
values
('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', '88888888-8888-4888-8888-000000000001', '90000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', (select id from public.profiles where email = 'formateur@logixfamille.demo')),
('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', '88888888-8888-4888-8888-000000000001', '90000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000002', (select id from public.profiles where email = 'formateur@logixfamille.demo')),
('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', '88888888-8888-4888-8888-000000000003', '90000000-0000-4000-8000-000000000005', '91000000-0000-4000-8000-000000000021', (select id from public.profiles where email = 'formateur@logixfamille.demo')),
('11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555', '88888888-8888-4888-8888-000000000004', '90000000-0000-4000-8000-000000000004', '91000000-0000-4000-8000-000000000016', (select id from public.profiles where email = 'formateur@logixfamille.demo')),
('11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555', '88888888-8888-4888-8888-000000000005', '90000000-0000-4000-8000-000000000005', '91000000-0000-4000-8000-000000000021', (select id from public.profiles where email = 'formateur@logixfamille.demo')),
('11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555', '88888888-8888-4888-8888-000000000005', '90000000-0000-4000-8000-000000000005', '91000000-0000-4000-8000-000000000022', (select id from public.profiles where email = 'formateur@logixfamille.demo')),
('11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555', '88888888-8888-4888-8888-000000000005', '90000000-0000-4000-8000-000000000005', '91000000-0000-4000-8000-000000000023', (select id from public.profiles where email = 'formateur@logixfamille.demo')),
('11111111-1111-4111-8111-111111111111', '66666666-6666-4666-8666-666666666666', '88888888-8888-4888-8888-000000000006', '90000000-0000-4000-8000-000000000006', '91000000-0000-4000-8000-000000000026', (select id from public.profiles where email = 'formateur@logixfamille.demo'))
on conflict (beneficiary_id, skill_id) do nothing;

insert into public.workshops (id, organization_id, title, module_id, module_code, facilitator_id, workshop_date, workshop_time, location, capacity, notes)
values
('99999999-9999-4999-8999-000000000001', '11111111-1111-4111-8111-111111111111', 'Atelier smartphone et email', '90000000-0000-4000-8000-000000000005', 'numerique-demarches', (select id from public.profiles where email = 'formateur@logixfamille.demo'), current_date - interval '7 day', '09:30', 'Salle multimedia', 8, 'Atelier numerique de groupe'),
('99999999-9999-4999-8999-000000000002', '11111111-1111-4111-8111-111111111111', 'Atelier parents et ecole', '90000000-0000-4000-8000-000000000002', 'parents-ecole', (select id from public.profiles where email = 'formateur@logixfamille.demo'), current_date + interval '5 day', '14:00', 'Maison de quartier', 10, 'Preparation reunion parents-professeurs')
on conflict (id) do nothing;

insert into public.workshop_participants (id, organization_id, workshop_id, beneficiary_id)
values
('aaaaaaaa-aaaa-4aaa-8aaa-000000000001', '11111111-1111-4111-8111-111111111111', '99999999-9999-4999-8999-000000000001', '44444444-4444-4444-8444-444444444444'),
('aaaaaaaa-aaaa-4aaa-8aaa-000000000002', '11111111-1111-4111-8111-111111111111', '99999999-9999-4999-8999-000000000001', '55555555-5555-4555-8555-555555555555'),
('aaaaaaaa-aaaa-4aaa-8aaa-000000000003', '11111111-1111-4111-8111-111111111111', '99999999-9999-4999-8999-000000000002', '44444444-4444-4444-8444-444444444444')
on conflict (workshop_id, beneficiary_id) do nothing;

insert into public.attendances (organization_id, workshop_id, participant_id, beneficiary_id, status, note, recorded_by)
values
('11111111-1111-4111-8111-111111111111', '99999999-9999-4999-8999-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001', '44444444-4444-4444-8444-444444444444', 'present', 'A utilise le smartphone pour envoyer un document.', (select id from public.profiles where email = 'formateur@logixfamille.demo')),
('11111111-1111-4111-8111-111111111111', '99999999-9999-4999-8999-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000002', '55555555-5555-4555-8555-555555555555', 'retard', 'Arrive avec 15 minutes de retard mais present ensuite.', (select id from public.profiles where email = 'formateur@logixfamille.demo')),
('11111111-1111-4111-8111-111111111111', '99999999-9999-4999-8999-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000003', '44444444-4444-4444-8444-444444444444', 'inscrit', null, (select id from public.profiles where email = 'formateur@logixfamille.demo'))
on conflict (workshop_id, beneficiary_id) do nothing;

insert into public.follow_up_notes (organization_id, beneficiary_id, author_id, note_type, content, is_sensitive)
values
('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', (select id from public.profiles where email = 'formateur@logixfamille.demo'), 'progression', 'La beneficiaire lit mieux les messages de l''ecole et commence a envoyer des emails simples.', false),
('11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555', (select id from public.profiles where email = 'formateur@logixfamille.demo'), 'orientation', 'Mise en relation avec un atelier CV et recherche d''emploi.', false),
('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', (select id from public.profiles where email = 'admin@logixfamille.demo'), 'administratif', 'Note sensible reservee a l''administration pour un suivi interne specifique.', true)
on conflict do nothing;
