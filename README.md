# Cap 4000 VTC

Application PWA mobile-first en React + TypeScript + Vite pour piloter une activité VTC avec plusieurs véhicules, plusieurs plateformes et des calculs de rentabilité réels.

## Installation

Avec `pnpm` :

```bash
pnpm install
```

Avec `npm` :

```bash
npm install
```

## Lancer en local

Avec `pnpm` :

```bash
pnpm run dev
```

Avec `npm` :

```bash
npm run dev
```

## Build de production

Avec `pnpm` :

```bash
pnpm run build
```

Avec `npm` :

```bash
npm run build
```

Le build final est généré dans `dist/`.

## Déploiement GitHub Pages

Le projet est configuré pour un dépôt nommé `vtc-objectif-4000`.

- `vite.config.ts` utilise `base: "/vtc-objectif-4000/"`
- le workflow GitHub Pages publie automatiquement le dossier `dist`
- le service worker et le manifest utilisent des chemins compatibles avec ce sous-répertoire

## Installer l’application sur téléphone

- Android / Chrome : ouvrir l’application en HTTPS puis choisir `Installer l’application`
- iPhone / Safari : ouvrir l’application puis choisir `Partager > Sur l’écran d’accueil`
- le mode hors ligne fonctionne après une première ouverture en ligne pour mettre en cache l’interface

## Fonctionnalités principales

- tableau de bord mensuel avec boutons rapides et rappels importants
- ajout de course avec décision `Accepter`, `Limite` ou `Refuser`
- calendrier mensuel avec résultat par jour, détail des courses et zones travaillées
- devis client privé avec prix minimum TTC, prix conseillé TTC, marge et arrondi
- profils véhicules complets avec coûts estimés, amortissement, crédit, LLD/LOA et entretien
- profils plateformes avec commission et frais fixes par course
- journal de dépenses réelles avec amortissement mensuel ou kilométrique
- journal carburant et journal recharge électrique
- modes de calcul `estimé`, `réel` et `mixte`
- rappels d’entretien par date, kilométrage ou les deux
- suivi spécial après changement moteur avec contrôles automatiques
- apprentissage progressif des temps par zone, jour et créneau horaire
- zones rentables avec revenu, attente, temps moyen et €/h net
- export JSON complet, import JSON et export CSV mensuel
- stockage local IndexedDB avec migration des anciennes données

## Stockage local

Les données sont enregistrées dans IndexedDB :

- paramètres globaux
- profils véhicules
- profils plateformes
- dépenses
- pleins carburant
- recharges électriques
- devis
- rappels
- courses avec snapshots véhicule, plateforme et coûts utilisés au moment de l’enregistrement

Les synthèses calendrier, zones et calibrage des temps sont recalculées depuis les courses et incluses dans l’export JSON.

Les anciennes courses restent visibles après migration.

## Calculs utilisés

Pour chaque course :

- `temps total = temps approche + temps attente + temps course`
- `km total = km approche + km course`
- `revenu brut = prix brut + pourboire + bonus`
- `commission plateforme = prix brut × commission %`
- `revenu après commission = revenu brut - commission plateforme`

Coût énergie :

- thermique / hybride : `km total × consommation L/100 ÷ 100 × prix carburant`
- électrique : `km total × consommation kWh/100 ÷ 100 × prix kWh`
- en mode `réel`, l’application utilise le coût réel au km issu des pleins ou recharges
- en mode `mixte`, elle utilise le réel s’il existe, sinon l’estimé

Coûts imputés :

- `assurance imputée = assurance mensuelle ÷ jours travaillés ÷ heures par jour ÷ 60 × temps total`
- `frais fixes imputés = frais fixes mensuels ÷ jours travaillés ÷ heures par jour ÷ 60 × temps total`
- `entretien = km total × coût entretien €/km`
- `pneus = km total × coût pneus €/km`
- `freins = km total × coût freins €/km`
- `vidange = km total × coût vidange €/km`
- `amortissement` selon le mode choisi : mensuel, au kilomètre ou mixte

Résultat :

- `frais totaux = énergie + assurance + frais fixes + amortissement + entretien + pneus + freins + vidange + réparations + péage + parking`
- `net réel = revenu après commission - frais totaux`
- `€/h net = net réel ÷ temps total × 60`
- `coût au km = frais totaux ÷ km total`

Pour un devis :

- `frais estimés TTC = énergie + amortissement + frais fixes imputés + entretien + péage estimé TTC + parking estimé TTC + frais divers TTC`
- `objectif net = 30 × temps total ÷ 60`
- `prix minimum TTC = frais estimés TTC + objectif net`
- `prix conseillé TTC = prix minimum TTC + marge de sécurité`
- `prix arrondi TTC` applique l’arrondi choisi : euro, 5 € ou 10 €

L’apprentissage des temps utilise uniquement les courses saisies :

- `temps moyen par km = temps course ÷ km course`
- `temps approche moyen par km = temps approche ÷ km approche`
- confiance `faible` sous 3 courses similaires, `moyen` de 3 à 10, `bon` au-delà de 10

## Règle de décision

- `Accepter` si `€/h net >= 30`
- `Limite` si `€/h net` est entre `27` et `30`
- `Refuser` si `€/h net < 27`

## PWA

- `public/manifest.json`
- `public/service-worker.js`
- installation mobile
- fonctionnement hors ligne
- compatible GitHub Pages avec le chemin `/vtc-objectif-4000/`
