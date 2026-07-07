# Supabase Setup - Logix Famille

Ce guide part du projet actuel et du principe que vous utilisez un projet Supabase heberge.

## 1. Creer le projet Supabase

1. Ouvrez le dashboard Supabase et creez un nouveau projet.
2. Choisissez l'organisation, le nom du projet, la region et un mot de passe base de donnees.
3. Attendez que le projet soit en etat `Healthy`.
4. Ouvrez `Connect` ou `Settings > API` pour recuperer :
   - l'URL du projet ;
   - la cle publishable / anon pour le front.

## 2. Configurer le fichier `.env`

Depuis la racine du projet :

```bash
cp .env.example .env
```

Renseignez au minimum :

```env
VITE_SUPABASE_URL=https://<votre-projet>.supabase.co
VITE_SUPABASE_ANON_KEY=<votre-cle-anon-ou-publishable-front>
VITE_APP_NAME=Logix Famille
VITE_SUPPORT_EMAIL=contact@logixfamille.fr
VITE_DEMO_BANNER_TEXT=Donnees de demonstration - ne pas presenter comme resultats reels.
VITE_RGPD_POLICY_VERSION=2026-07
```

Variables indispensables pour la connexion :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 3. Ordre exact d'execution SQL

Dans le `SQL Editor` du dashboard Supabase, executez dans cet ordre :

1. Le contenu de [supabase/schema.sql](/Users/moimageur/Documents/New%20project/supabase/schema.sql)
2. Le contenu de [supabase/rls.sql](/Users/moimageur/Documents/New%20project/supabase/rls.sql)
3. Creez les comptes Auth dans le dashboard
4. Le contenu de [supabase/seed.sql](/Users/moimageur/Documents/New%20project/supabase/seed.sql)

Ne lancez pas `seed.sql` avant d'avoir cree les comptes Auth, sinon le script levera volontairement une erreur de controle.

## 4. Creer les comptes Auth

Dans `Authentication > Users` :

1. Creez `admin@logixfamille.demo`
2. Creez `formateur@logixfamille.demo`
3. Utilisez le mot de passe `LogixDemo123!`
4. Assurez-vous que l'email est confirme

Selon l'interface actuelle du dashboard, cela peut passer par une option du type `Auto Confirm User` ou par une confirmation manuelle de l'email.

## 5. Relier les comptes Auth a `profiles`

Le projet utilise une vraie FK `public.profiles.id -> auth.users.id`.

Le fichier `seed.sql` s'occupe maintenant de creer ou mettre a jour `public.profiles` a partir des emails presents dans `auth.users`.

Autrement dit :

1. Vous creez les utilisateurs dans `Authentication > Users`
2. Vous executez `seed.sql`
3. `seed.sql` insere les lignes `profiles` avec les vrais UUID Supabase des utilisateurs Auth

### Verification immediate

Executez cette requete :

```sql
select id, email
from auth.users
where email in ('admin@logixfamille.demo', 'formateur@logixfamille.demo')
order by email;
```

Puis :

```sql
select id, organization_id, email, role, is_active
from public.profiles
order by email;
```

Vous devez voir :

- un profil `administrateur` pour `admin@logixfamille.demo`
- un profil `formateur` pour `formateur@logixfamille.demo`

### Si un utilisateur Auth existe mais pas son profil

Relancez simplement `seed.sql`.

Si vous voulez forcer l'insertion manuellement :

```sql
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
```

```sql
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
```

## 6. Ce que `seed.sql` insere

Apres execution correcte du seed, vous obtenez :

- 1 organisation `Association Horizon Familles`
- 2 profils staff relies a Supabase Auth
- 6 modules
- 30 competences
- 3 beneficiaires de demonstration
- diagnostics, parcours modules, competences validees
- ateliers, participants, presences
- notes de suivi, dont une note sensible admin

## 7. Verifier que l'admin voit tout

Dans l'application locale :

1. Connectez-vous avec `admin@logixfamille.demo`
2. Ouvrez `/app/beneficiaries`
3. Verifiez que les 3 beneficiaires de demo sont visibles
4. Ouvrez `/app/settings`
5. Verifiez que la page Parametres est accessible
6. Ouvrez les notes de `Samira Kone`
7. Verifiez que la note sensible est visible
8. Ouvrez `/app/exports`
9. Verifiez que l'export des notes inclut les notes autorisees pour l'admin

## 8. Verifier que le formateur ne voit que ses beneficiaires

Par defaut, le formateur de demonstration est assigne aux beneficiaires seedes. Cela valide deja :

- l'acces authentifie ;
- le role `formateur` ;
- l'interdiction de `/app/settings` ;
- le filtrage des notes sensibles.

Pour verifier la segregation entre deux formateurs, faites ce test manuel complementaire.

### Creer un deuxieme formateur de test

Dans `Authentication > Users`, creez :

- `formateur2@logixfamille.demo`
- mot de passe `LogixDemo123!`

Puis executez :

```sql
insert into public.profiles (id, organization_id, first_name, last_name, email, role)
select
  id,
  '11111111-1111-4111-8111-111111111111',
  'Leila',
  'Mokhtar',
  'formateur2@logixfamille.demo',
  'formateur'
from auth.users
where email = 'formateur2@logixfamille.demo'
on conflict (id) do update set
  organization_id = excluded.organization_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  email = excluded.email,
  role = excluded.role;
```

Reaffectez un beneficiaire :

```sql
update public.beneficiaries
set formateur_id = (
  select id
  from public.profiles
  where email = 'formateur2@logixfamille.demo'
)
where id = '66666666-6666-4666-8666-666666666666';
```

### Resultat attendu

1. `admin@logixfamille.demo` voit toujours les 3 beneficiaires
2. `formateur@logixfamille.demo` ne voit plus `Fatou Mendy`
3. `formateur2@logixfamille.demo` voit `Fatou Mendy`
4. Aucun des deux formateurs n'accede a `/app/settings`
5. Aucun des deux formateurs n'obtient la note sensible admin

## 9. Verifier les RLS de maniere plus technique

Le plus fiable reste le test dans l'application, car le `SQL Editor` execute vos requetes avec des privileges eleves.

Si vous voulez tout de meme simuler un utilisateur authentifie dans une transaction SQL, remplacez les UUID par les vrais IDs des utilisateurs :

```sql
begin;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '<UUID_ADMIN_OU_FORMATEUR>', true);

select id, first_name, last_name, formateur_id
from public.beneficiaries
order by last_name, first_name;

select id, title, facilitator_id, workshop_date
from public.workshops
order by workshop_date, title;

select id, beneficiary_id, is_sensitive
from public.follow_up_notes
order by created_at;

rollback;
```

Attendus :

- avec l'UUID admin, toutes les lignes de l'organisation remontent
- avec l'UUID formateur, seules les lignes liees a ses beneficiaires remontent
- les notes sensibles n'apparaissent pas pour le formateur

## 10. Checklist de test manuel

- [ ] Connexion admin
- [ ] Connexion formateur
- [ ] Creation beneficiaire
- [ ] Diagnostic 10 axes
- [ ] Generation du parcours
- [ ] Validation d'une competence
- [ ] Creation d'un atelier
- [ ] Enregistrement d'une presence
- [ ] Ajout d'une note
- [ ] Export CSV
- [ ] Verification acces interdit formateur sur Parametres
- [ ] Verification acces interdit formateur aux notes sensibles
- [ ] Verification RLS sur beneficiaires, ateliers et notes

## 11. Comptes de test

- `admin@logixfamille.demo` / `LogixDemo123!`
- `formateur@logixfamille.demo` / `LogixDemo123!`
- `formateur2@logixfamille.demo` / `LogixDemo123!` si vous faites le test de segregation avance

## 12. Lancer l'application en local

```bash
pnpm install
pnpm run dev
```

L'application sera disponible sur l'URL affichee par Vite, en general `http://localhost:5173`.
