# Test Plan - Logix Famille

Ce document sert de procedure de validation reelle avant toute utilisation avec de vraies donnees.

Regle de lecture :

- `Statut attendu` = ce qui doit se produire pour valider le test
- `Resultat obtenu` = a renseigner pendant la recette
- `Correction a faire si echec` = action immediate a investiguer

Liens utiles :

- [SUPABASE_SETUP.md](/Users/moimageur/Documents/New%20project/SUPABASE_SETUP.md)
- [supabase/schema.sql](/Users/moimageur/Documents/New%20project/supabase/schema.sql)
- [supabase/rls.sql](/Users/moimageur/Documents/New%20project/supabase/rls.sql)
- [supabase/seed.sql](/Users/moimageur/Documents/New%20project/supabase/seed.sql)
- [.env.example](/Users/moimageur/Documents/New%20project/.env.example)

## 1. Preparation Supabase

### 1.1 Creer le projet Supabase

1. Ouvrir le dashboard Supabase
2. Creer un nouveau projet
3. Choisir la region la plus proche
4. Attendre l'etat `Healthy`

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Projet Supabase cree | Le projet existe et le dashboard est accessible | A renseigner | Reprendre la creation du projet, verifier organisation, region et etat du projet |

### 1.2 Creer les deux comptes Auth

Dans `Authentication > Users` :

1. Creer `admin@logixfamille.demo`
2. Creer `formateur@logixfamille.demo`
3. Utiliser `LogixDemo123!`
4. Verifier que les comptes sont confirmes

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Compte admin Auth cree | L'utilisateur `admin@logixfamille.demo` existe dans `auth.users` | A renseigner | Refaire la creation du compte, verifier l'email et la confirmation |
| Compte formateur Auth cree | L'utilisateur `formateur@logixfamille.demo` existe dans `auth.users` | A renseigner | Refaire la creation du compte, verifier l'email et la confirmation |

### 1.3 Executer `schema.sql`

1. Ouvrir `SQL Editor`
2. Coller [supabase/schema.sql](/Users/moimageur/Documents/New%20project/supabase/schema.sql)
3. Executer le script

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Schema cree | Les tables, types, triggers et grants sont crees sans erreur | A renseigner | Corriger le message SQL, verifier que le script a ete execute une seule fois ou qu'il reste idempotent |

### 1.4 Executer `rls.sql`

1. Coller [supabase/rls.sql](/Users/moimageur/Documents/New%20project/supabase/rls.sql)
2. Executer le script

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| RLS appliquees | Les fonctions et policies sont creees sans erreur | A renseigner | Verifier que `schema.sql` a bien ete execute avant, puis relancer `rls.sql` |

### 1.5 Executer `seed.sql`

1. Verifier que les deux comptes Auth existent deja
2. Coller [supabase/seed.sql](/Users/moimageur/Documents/New%20project/supabase/seed.sql)
3. Executer le script

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Seed charge | Les donnees de demonstration sont inserees sans erreur | A renseigner | Creer les comptes Auth d'abord, verifier les `profiles`, puis relancer `seed.sql` |

### 1.6 Verifier les tables

Executer :

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Verifier au minimum la presence de :

- `organizations`
- `profiles`
- `beneficiaries`
- `consents`
- `diagnostics`
- `diagnostic_scores`
- `modules`
- `skills`
- `beneficiary_modules`
- `beneficiary_skills`
- `workshops`
- `workshop_participants`
- `attendances`
- `follow_up_notes`
- `audit_logs`

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Tables presentes | Toutes les tables attendues existent | A renseigner | Reexecuter `schema.sql`, verifier le message d'erreur exact dans SQL Editor |

### 1.7 Verifier les `profiles`

Executer :

```sql
select id, organization_id, email, role, is_active
from public.profiles
order by email;
```

Verification attendue :

- `admin@logixfamille.demo` avec role `administrateur`
- `formateur@logixfamille.demo` avec role `formateur`
- `organization_id` renseigne

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Profiles relies a Auth | Les deux lignes existent avec les bons roles et un `organization_id` valide | A renseigner | Relancer `seed.sql` ou inserer les profils manuellement depuis `auth.users` |

### 1.8 Verifier les variables `.env`

1. Copier `.env.example` vers `.env`
2. Renseigner :

```env
VITE_SUPABASE_URL=https://<votre-projet>.supabase.co
VITE_SUPABASE_ANON_KEY=<votre-cle-anon>
VITE_APP_NAME=Logix Famille
VITE_SUPPORT_EMAIL=contact@logixfamille.fr
VITE_DEMO_BANNER_TEXT=Donnees de demonstration - ne pas presenter comme resultats reels.
VITE_RGPD_POLICY_VERSION=2026-07
```

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Variables front presentes | `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont definies et pointent vers le bon projet | A renseigner | Corriger `.env`, redemarrer Vite et verifier l'URL/cle du projet |

## 2. Lancement local

### 2.1 Installer

```bash
pnpm install
```

### 2.2 Lancer l'application

```bash
pnpm run dev
```

Adresse locale a ouvrir :

- `http://localhost:5173`
- Si le port `5173` est occupe, Vite peut proposer `5174` ou un autre port libre

### 2.3 Erreurs possibles et solutions

| Erreur possible | Cause probable | Solution |
| --- | --- | --- |
| `Supabase n'est pas configure` | `.env` absent ou incomplet | Verifier `.env`, puis relancer `pnpm run dev` |
| `Invalid login credentials` | Compte Auth absent ou mauvais mot de passe | Revoir `Authentication > Users`, verifier `LogixDemo123!` |
| Ecran vide apres login | `profiles` absent pour l'utilisateur | Verifier `public.profiles` puis relancer `seed.sql` |
| `permission denied for table ...` | Grants ou RLS incomplets | Reexecuter `schema.sql` puis `rls.sql` |
| Donnees manquantes | `seed.sql` non execute ou incomplet | Reexecuter `seed.sql` apres verification des comptes Auth |

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Install locale | `pnpm install` termine sans erreur | A renseigner | Relancer l'installation, verifier la version de Node/Pnpm si necessaire |
| Serveur Vite | L'application repond sur l'URL locale | A renseigner | Corriger `.env`, verifier la console Vite, relancer le serveur |

## 3. Test compte administrateur

Compte a utiliser :

- Email : `admin@logixfamille.demo`
- Mot de passe : `LogixDemo123!`

### 3.1 Connexion admin

1. Ouvrir `/login`
2. Se connecter avec le compte admin
3. Verifier la redirection vers `/app/dashboard`

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Connexion admin | Connexion reussie et acces au dashboard | A renseigner | Verifier le compte Auth, `profiles`, les variables `.env` et les erreurs reseau |

### 3.2 Acces dashboard

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Dashboard admin | Le dashboard charge sans erreur avec les cartes et statistiques | A renseigner | Verifier les requetes Supabase, les donnees seed et les erreurs console |

### 3.3 Acces beneficiaires

1. Ouvrir `/app/beneficiaries`
2. Verifier la liste
3. Ouvrir une fiche beneficiaire

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Liste beneficiaires admin | Tous les beneficiaires de demo sont visibles | A renseigner | Verifier le seed, les policies `beneficiaries_*` et la session active |
| Detail beneficiaire admin | La fiche detail s'ouvre dans l'application | A renseigner | Verifier le routage React et la requete `getBeneficiaryById` |

### 3.4 Creation beneficiaire

1. Ouvrir `/app/beneficiaries/new`
2. Renseigner tous les champs obligatoires
3. Cocher le consentement RGPD
4. Enregistrer

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Creation beneficiaire admin | Le beneficiaire est cree et visible dans la liste | A renseigner | Verifier la validation du formulaire, RLS `beneficiaries_insert` et `consents` |

### 3.5 Edition beneficiaire

1. Ouvrir la fiche d'un beneficiaire
2. Cliquer sur modifier
3. Changer au moins un champ
4. Enregistrer

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Edition beneficiaire admin | Les modifications sont sauvegardees | A renseigner | Verifier la route d'edition, le payload et RLS `beneficiaries_update` |

### 3.6 Archivage

1. Passer le statut du beneficiaire a `archive`
2. Verifier l'etat dans la liste

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Archivage admin | Le beneficiaire reste trace mais apparait archive | A renseigner | Verifier le champ `status` et la mise a jour en base |

### 3.7 Suppression

1. Choisir un beneficiaire de test
2. Supprimer
3. Verifier qu'il disparait de la liste

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Suppression admin | Le beneficiaire est supprime avec confirmation explicite | A renseigner | Verifier la logique de suppression et RLS `beneficiaries_delete` |

### 3.8 Diagnostic

1. Ouvrir un beneficiaire
2. Lancer un diagnostic
3. Renseigner les 10 axes
4. Valider

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Diagnostic admin | Le diagnostic est enregistre et consultable | A renseigner | Verifier `diagnostics`, `diagnostic_scores` et la validation du formulaire |

### 3.9 Parcours genere

1. Apres le diagnostic, verifier le parcours propose
2. Ouvrir la page modules du beneficiaire

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Parcours auto | Les modules affectes correspondent au diagnostic | A renseigner | Verifier la logique de generation et l'ecriture dans `beneficiary_modules` |

### 3.10 Validation competences

1. Ouvrir les modules d'un beneficiaire
2. Valider une ou plusieurs competences

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Validation competences admin | Les competences validees sont enregistrees pour le bon beneficiaire | A renseigner | Verifier `beneficiary_skills` et la liaison beneficiaire/module/skill |

### 3.11 Atelier

1. Ouvrir `/app/workshops`
2. Creer un atelier
3. Ajouter un ou plusieurs beneficiaires

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Creation atelier admin | L'atelier apparait avec ses participants | A renseigner | Verifier `workshops`, `workshop_participants` et les policies ateliers |

### 3.12 Presence

1. Ouvrir l'atelier
2. Aller sur la page de presence
3. Marquer `present`, `absent`, `retard` ou `excuse`

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Enregistrement presence admin | La presence est enregistree sans `prompt()` et reste visible au rechargement | A renseigner | Verifier `attendances`, le formulaire et RLS `attendances_access` |

### 3.13 Note

1. Ouvrir les notes d'un beneficiaire
2. Ajouter une note simple
3. Ajouter si besoin une note sensible admin

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Note admin | La note est enregistree et visible | A renseigner | Verifier `follow_up_notes` et RLS `notes_insert` |
| Note sensible admin | La note sensible est visible pour l'admin | A renseigner | Verifier `is_sensitive` et la policy `notes_select` |

### 3.14 Export CSV

1. Ouvrir `/app/exports`
2. Lancer chaque export

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Exports admin | Tous les CSV se telechargent sans erreur | A renseigner | Verifier le service CSV, les requetes et le navigateur |

### 3.15 Acces parametres

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Parametres admin | `/app/settings` est accessible | A renseigner | Verifier `RoleGuard` et le role du profil |

### 3.16 Acces RGPD

1. Ouvrir `/app/rgpd`
2. Verifier le contenu de la page

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Page RGPD admin | La page RGPD est accessible et coherente | A renseigner | Verifier le routage et le contenu de la page |

## 4. Test compte formateur

Compte a utiliser :

- Email : `formateur@logixfamille.demo`
- Mot de passe : `LogixDemo123!`

### 4.1 Connexion formateur

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Connexion formateur | Connexion reussie et acces au dashboard | A renseigner | Verifier le compte Auth, `profiles` et le role `formateur` |

### 4.2 Verifier qu'il ne voit que ses beneficiaires

1. Ouvrir `/app/beneficiaries`
2. Noter les beneficiaires visibles

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Filtrage beneficiaires formateur | Le formateur ne voit que les beneficiaires qui lui sont affectes | A renseigner | Verifier `formateur_id`, RLS `beneficiaries_select` et la session active |

### 4.3 Verifier qu'il ne voit pas les parametres globaux

1. Tenter d'ouvrir `/app/settings`

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Parametres interdits formateur | L'acces est refuse ou redirige | A renseigner | Verifier `RoleGuard` et le role du profil |

### 4.4 Verifier qu'il ne peut pas exporter les notes sensibles

1. Ouvrir `/app/exports`
2. Exporter les notes
3. Ouvrir le CSV

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Export notes filtre formateur | Les notes sensibles admin sont absentes du CSV | A renseigner | Verifier RLS `notes_select` et le contenu du CSV exporte |

### 4.5 Verifier qu'il peut creer un diagnostic

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Diagnostic formateur | Le formateur peut creer un diagnostic sur ses beneficiaires | A renseigner | Verifier `diagnostics_access` et le `formateur_id` du beneficiaire |

### 4.6 Verifier qu'il peut ajouter une note autorisee

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Note autorisee formateur | Une note non sensible peut etre ajoutee et lue | A renseigner | Verifier `notes_insert` et l'absence de flag sensible |

### 4.7 Verifier qu'il peut valider les competences

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Validation competences formateur | Les validations restent limitees a ses beneficiaires | A renseigner | Verifier `beneficiary_skills_access` et l'affectation du beneficiaire |

## 5. Test RLS

### 5.1 Creer un deuxieme formateur

1. Creer `formateur2@logixfamille.demo` dans `Authentication > Users`
2. Lui attribuer `LogixDemo123!`
3. Inserer son profil comme explique dans [SUPABASE_SETUP.md](/Users/moimageur/Documents/New%20project/SUPABASE_SETUP.md:178)

### 5.2 Lui attribuer un beneficiaire different

Executer :

```sql
update public.beneficiaries
set formateur_id = (
  select id
  from public.profiles
  where email = 'formateur2@logixfamille.demo'
)
where id = '66666666-6666-4666-8666-666666666666';
```

### 5.3 Verifications croisees

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Formateur 1 ne voit pas les beneficiaires du formateur 2 | `formateur@logixfamille.demo` ne voit pas `Fatou Mendy` apres reaffectation | A renseigner | Verifier `formateur_id`, session, RLS `beneficiaries_select` |
| Formateur 2 ne voit pas les beneficiaires du formateur 1 | `formateur2@logixfamille.demo` ne voit que ses beneficiaires | A renseigner | Verifier l'affectation reelle et les policies RLS |
| Admin voit tout | `admin@logixfamille.demo` voit tous les beneficiaires des deux formateurs | A renseigner | Verifier `is_admin()` et `profiles.role` |

## 6. Test CSV

Fichiers a exporter :

- beneficiaires
- diagnostics
- modules par beneficiaire
- competences validees
- presences
- statistiques

Pour chaque export :

1. Telecharger le fichier
2. Ouvrir dans LibreOffice ou Excel francais
3. Verifier le separateur `;`
4. Verifier les accents
5. Verifier les guillemets
6. Verifier les retours ligne
7. Verifier le BOM UTF-8

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Export beneficiaires | Le CSV s'ouvre correctement dans Excel francais | A renseigner | Verifier `csvService` et l'encodage |
| Export diagnostics | Le CSV contient les diagnostics attendus | A renseigner | Verifier la requete source et l'echappement des valeurs |
| Export modules | Les modules restent lies au bon beneficiaire | A renseigner | Verifier la jointure exportee |
| Export competences | Les validations sont rattachees au bon beneficiaire | A renseigner | Verifier les donnees `beneficiary_skills` |
| Export presences | Les presences refletent les statuts reels | A renseigner | Verifier `attendances` et le mapping CSV |
| Export statistiques | Les statistiques sont coherentes avec les donnees reelles | A renseigner | Verifier le calcul de stats et la requete d'export |
| Accents | Les caracteres accentues s'affichent correctement | A renseigner | Verifier BOM UTF-8 et l'ouverture dans Excel |
| Guillemets | Les champs contenant `;` ou texte libre sont correctement quotes | A renseigner | Verifier l'echappement CSV |
| Retours ligne | Les notes multilignes ne cassent pas le fichier | A renseigner | Verifier l'echappement des sauts de ligne |

## 7. Test RGPD

### 7.1 Consentement obligatoire

1. Tenter de creer un beneficiaire sans consentement
2. Tenter ensuite avec consentement coche

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Consentement obligatoire | La creation sans consentement est refusee | A renseigner | Verifier la validation UI et la logique de creation |

### 7.2 Absence de donnees medicales sensibles

1. Verifier les formulaires beneficiaire, diagnostic et notes
2. Verifier qu'aucun champ n'invite a stocker de donnees medicales sensibles detaillees

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Minimisation des donnees | Aucun formulaire ne demande de donnees medicales sensibles detaillees | A renseigner | Revoir le wording et supprimer tout champ excessif |

### 7.3 Archivage

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Archivage RGPD | Le statut archive conserve la trace sans exposition abusive | A renseigner | Revoir le traitement des listes et des exports |

### 7.4 Suppression

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Suppression RGPD | Une suppression explicite retire bien les donnees ciblees | A renseigner | Verifier les suppressions en cascade et les confirmations UI |

### 7.5 Exports minimises

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Export minimise | Le formateur ne recupere pas de notes sensibles ni de donnees hors perimetre | A renseigner | Verifier RLS et le contenu reel des CSV |

### 7.6 Page RGPD

| Test | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Page RGPD | Les informations RGPD sont accessibles depuis l'application | A renseigner | Verifier le routage et la page publique/interne RGPD |

## 8. Resultat attendu

### 8.1 Validation finale

Le projet est pret pour une phase pilote uniquement si :

- Supabase est configure sans erreur
- les comptes Auth et `profiles` sont correctement relies
- les tests admin passent
- les tests formateur passent
- la segregation RLS entre deux formateurs est validee
- les exports CSV sont lisibles dans Excel francais
- les controles RGPD sont satisfaisants

### 8.2 Journal de recette

| Zone | Statut attendu | Resultat obtenu | Correction a faire si echec |
| --- | --- | --- | --- |
| Supabase | Projet, Auth, schema, RLS et seed operationnels | A renseigner | Corriger le setup avant toute autre recette |
| Front local | L'application se lance et se connecte au bon projet | A renseigner | Corriger `.env`, relancer Vite, verifier les erreurs reseau |
| Admin | Toutes les fonctions metier admin critiques passent | A renseigner | Corriger prioritairement droits, persistence et formulaires |
| Formateur | Le perimetre formateur est utilisable et restreint | A renseigner | Corriger roles, RLS ou filtres UI |
| RLS | L'isolation entre formateurs est reelle | A renseigner | Bloquant avant donnees reelles |
| CSV | Les exports sont corrects pour Excel francais | A renseigner | Corriger l'encodage ou l'echappement |
| RGPD | Consentement, minimisation, archivage et acces info sont conformes | A renseigner | Bloquant avant donnees reelles |

### 8.3 Decision go / no-go

| Decision | Condition | Resultat obtenu |
| --- | --- | --- |
| GO pilote | Tous les tests critiques sont valides | A renseigner |
| NO-GO | Un echec subsiste sur RLS, consentement, export sensible ou persistence | A renseigner |
