# SL Marketplace Vision — CLAUDE.md

Dashboard client-side pour visualiser les exports CSV de ventes Second Life Marketplace. Zéro serveur, tout tourne dans le navigateur.

## Commandes

```bash
npm run dev        # dev server
npm run build      # production build (tsc -b && vite build)
npm run test:run   # tests unitaires (29 tests)
```

## Stack technique

| Rôle | Lib |
|---|---|
| Build | Vite + React 18 + TypeScript |
| Styles | Tailwind CSS v4 (`@import "tailwindcss"`, pas de config file) |
| Charts | Recharts |
| Drag & drop | react-dropzone |
| CSV | PapaParse |
| Persistance | Dexie.js (IndexedDB, DB name: `sl-marketplace`) |
| State | Zustand |
| Date picker | react-datepicker |
| Tests | Vitest + jsdom + @testing-library/react |

**Tailwind v4** : pas de `tailwind.config.js`. Le plugin s'importe dans `vite.config.ts` (`@tailwindcss/vite`). Les couleurs arbitraires se font avec `bg-[#hex]`.

**Vitest** : l'import doit être `from 'vitest/config'` dans `vite.config.ts` (pas `from 'vite'`). Le setup file importe `@testing-library/jest-dom/vitest` (pas `@testing-library/jest-dom`).

## Format CSV Linden Lab

Parsing **par index de colonne** (language-agnostic — les headers peuvent être en français, anglais, etc.). La première ligne est toujours sautée.

| Index | Champ | Type |
|---|---|---|
| 0 | date | `31/12/2024 14 h 13 +00:00` |
| 1 | orderId | integer (clé de dédup) |
| 2 | sku | string |
| 3 | productName | string |
| 4 | orderItemId | integer |
| 5 | buyer | string |
| 6 | recipient | string |
| 7 | price | integer L$ |
| 8 | status | string (`"Delivered"`) |
| 9 | commission | integer L$ |
| 10 | allocations | integer L$ |
| 11 | netAmount | integer L$ |

**Règles de parsing** :
- Seules les lignes `status === "Delivered"` sont importées
- Déduplication par `orderId` (contre IndexedDB + dans le fichier courant)
- Articles gratuits (`price === 0`) : comptés dans le volume, exclus du CA
- Validation sur la première ligne de données uniquement (12 colonnes, index 0 parseable en date, index 1/7/9/10/11 numériques)

## Architecture

```
src/
  types.ts               — Transaction, ChartTab ('area'|'bar'), ChartMetric ('revenue'|'volume')
  main.tsx               — entry point (importe index.css + react-datepicker/dist/react-datepicker.css)
  App.tsx                — layout h-screen, grille 180px / 1fr / 230px + ChartArea flex-1
  index.css              — @import tailwindcss, dark theme datepicker, .slim-scroll scrollbar
  db/database.ts         — Dexie schema (table transactions, PK: orderId) + helpers
  lib/
    csvParser.ts         — PapaParse wrapper, parsing par index, validation
    csvParser.test.ts    — 12 tests TDD
    computeKPIs.ts       — computeKPIs, groupByTime, groupByProduct, buildHeatmap
    computeKPIs.test.ts  — 17 tests TDD
  store/useStore.ts      — Zustand store
  components/
    Dropzone.tsx         — react-dropzone, import CSV → IndexedDB → store
    ControlBar.tsx       — date pickers, quick selectors, ProductFilter, roue dentée Préférences
    ProductFilter.tsx    — multi-select dropdown avec toggle ALL
    KPICards.tsx         — Revenue, Net Amount, Total Sales
    ChartArea.tsx        — tab switcher + toggle Revenue/Volume
    PreferencesModal.tsx — modal reset data (accepte props open/onClose)
    charts/
      SalesAreaChart.tsx — Recharts AreaChart type="monotone", height="100%"
      TopArticlesChart.tsx — Recharts BarChart layout="vertical", zone scroll slim-scroll
```

## Zustand store

```ts
transactions: Transaction[]          // tout ce qui est en IndexedDB
filteredTransactions: Transaction[]  // dérivé, recalculé à chaque setFilters
filters: { dateStart, dateEnd, selectedProducts[] }  // selectedProducts vide = tout
importStatus: { state, message, count }
activeTab: 'area' | 'bar'
chartMetric: 'revenue' | 'volume'
```

`filteredTransactions` est toujours pré-filtré. Les composants chart ne filtrent pas eux-mêmes.

## Calculs KPI (`computeKPIs`)

- **Revenue** : somme des `price` où `price > 0`
- **Net Amount** : somme des `netAmount` où `price > 0`
- **Total Sales** : count de toutes les transactions (gratuits inclus)

## Calculs chart (`computeKPIs`)

- **groupByTime** : reçoit `filteredTransactions` + `dateStart`/`dateEnd` (pour déterminer la granularité uniquement). Granularité : ≤ 90 jours → par jour (`YYYY-MM-DD`), > 90 jours → par mois (`YYYY-MM`).
- **groupByProduct** : agrège par `productName`, trié par revenue desc.
- **buildHeatmap** : 168 cellules 7×24. Convention jour : `(getDay()+6)%7` → lundi=0.

## Quick selectors (ControlBar)

- **All** : dateStart=null, dateEnd=null
- **Last Year** : rolling 12 mois (aujourd'hui − 1 an → aujourd'hui)
- **Y-1** : l'année avant Last Year (aujourd'hui − 2 ans → aujourd'hui − 1 an)
- **Last Month** : rolling 30 jours

## Palette de couleurs

| Usage | Valeur |
|---|---|
| Background page | `#050805` |
| Panel/section | `#070d07` |
| Card/input/dropdown | `#0b130b` |
| Bordure subtle | `#1a3a1a` |
| Texte secondaire | `#3a6a3a` |
| Texte moyen | `#7a9e7a` |
| Accent néon | `#00e676` |
| Texte sur fond néon | `black` |

## Scrollbar élégante

Classe CSS `.slim-scroll` (définie dans `index.css`) : 4px, fond transparent, pouce `#1a3a1a` → `#00e676` au hover. Utilisée sur le dropdown ProductFilter et la liste TopArticlesChart.

## Points d'attention

- **PreferencesModal** n'a plus de bouton intégré. Il accepte `{ open, onClose }` en props. Le bouton (roue dentée) est dans ControlBar en bas à gauche (`mt-auto`).
- **SalesHeatmap** a été supprimée (commit `9642e86`). Le type `ChartTab` est `'area' | 'bar'` seulement.
- **Avg. Cart** KPI a été supprimé — jugé inutile.
- La grille du haut a `shrink-0` pour ne pas se comprimer ; ChartArea a `flex-1` pour prendre toute la hauteur restante.
- `overflow-hidden` sur le root App empêche les ascenseurs parasites au survol des charts Recharts.
