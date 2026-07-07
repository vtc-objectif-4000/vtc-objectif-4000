# Cap 4000 VTC

Application PWA mobile-first en React + TypeScript + Vite pour un chauffeur VTC. Elle aide à viser **4 000 € de chiffre d'affaires brut par mois** en analysant chaque course avec un seuil de rentabilité **minimum de 30 €/h net**.

## Installation des dépendances

```bash
npm install
```

## Lancer en local

```bash
npm run dev
```

Vite démarre par défaut sur `http://localhost:5173`.

## Build de production

```bash
npm run build
```

Le build final est généré dans `dist/`.

## Installer l'application sur téléphone

L'application est prévue pour être installable comme une PWA.

- Android / Chrome : ouvrez l'application sur une URL HTTPS, puis utilisez `Menu > Installer l'application`.
- iPhone / Safari : ouvrez l'application, puis utilisez `Partager > Sur l'écran d'accueil`.
- Hors ligne : ouvrez une première fois l'application en ligne pour permettre au service worker de mettre en cache l'interface.

## Écrans inclus

- Tableau de bord mensuel
- Ajout de course avec décision automatique
- Véhicule et frais d'exploitation
- Entretien véhicule avec alertes
- Données : export JSON, import JSON, export CSV du mois, suppression du mois, suppression complète

## Stockage

Les données sont stockées dans **IndexedDB**.

Sont enregistrés :

- paramètres véhicule
- paramètres d'entretien
- toutes les courses avec date, mois, prix, temps, kilomètres, frais, net et décision

## Calculs utilisés

L'application applique les formules suivantes pour chaque course :

- `temps total = temps approche + temps attente + temps course`
- `kilomètres totaux = km approche + km course`
- `coût carburant = km total × consommation L/100 ÷ 100 × prix carburant`
- `assurance imputée = assurance mensuelle ÷ jours travaillés ÷ heures travaillées par jour ÷ 60 × temps total`
- `entretien provisionné = km total × coût entretien €/km`
- `frais totaux = carburant + assurance + entretien`
- `net réel = prix course - frais totaux`
- `€/h brut = prix course ÷ temps total × 60`
- `€/h net = net réel ÷ temps total × 60`
- `prix minimum avec frais = 30 × temps total ÷ 60 + frais totaux`
- `écart = prix proposé - prix minimum avec frais`

## Règle de décision

- `Accepter` si `€/h net >= 30`
- `Limite` si `€/h net` est entre `27` et `30`
- `Refuser` si `€/h net < 27`

## Hypothèses complémentaires

- l'objectif mensuel brut est fixé à `4 000 €`
- le montant restant par jour prévu est calculé à partir des `jours travaillés par mois` configurés
- les alertes d'entretien passent à `bientôt` quand le kilométrage actuel approche du prochain seuil
