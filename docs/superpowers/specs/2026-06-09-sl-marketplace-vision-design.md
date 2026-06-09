# SL Marketplace Vision — Design Spec

Date: 2026-06-09

## Overview

Single-page dashboard application for visualizing Second Life marketplace sales from CSV exports. Runs entirely client-side. Data persists locally via IndexedDB.

## Tech Stack

| Role | Library |
|---|---|
| Build | Vite + React 18 |
| Styles | Tailwind CSS v4 |
| Charts | Recharts |
| Drag & drop | react-dropzone |
| CSV parsing | PapaParse |
| Storage | Dexie.js (IndexedDB) |
| State | Zustand |
| Date picker | react-datepicker |

## CSV Format

French-language headers from Linden Lab export:

```
Date, Commande #, Unité de stock, Article, ID d'article de la commande,
Acheteur, Destinataire, Prix, État, Commission, Allocations, Montant net
```

Date format: `31/12/2024 14 h 13 +00:00`

## Data Rules

- **Deduplication**: by `Commande #` — re-importing an existing order is silently ignored
- **Status filter**: only `État = "Delivered"` transactions are stored and used
- **Free items** (Prix = 0): counted in volume metrics, excluded from revenue/net calculations

## Layout

Full-page dark-theme dashboard. Three-column top row + full-width chart area below.

```
┌──────────────┬────────────────────────┬──────────────────┐
│   Dropzone   │       Controls         │    KPI Cards     │
│  (180px)     │                        │   (280px)        │
└──────────────┴────────────────────────┴──────────────────┘
┌────────────────────────────────────────────────────────────┐
│                     Chart Area                             │
│  [Sales Over Time] [Top Articles] [Sales Heatmap]  toggle  │
│                                                            │
└────────────────────────────────────────────────────────────┘
                                          [⚙ Preferences] ←fixed bottom-right
```

### Dropzone (top left, 180px wide)

- Dashed border, file icon, "Drag & Drop Linden Lab Transactions (CSV)"
- Click to open file explorer
- After import: shows transaction count loaded or error message

### Controls (top center)

- **Date range**: two date inputs (start / end)
- **Quick selectors**: All / Last Year / Last Month buttons
  - *All*: no date filter applied
  - *Last Year*: rolling 12 months from today
  - *Last Month*: rolling 30 days from today
- **Product filter**: multi-select dropdown with "ALL" toggle at top of list

### KPI Cards (top right, 280px wide)

Four cards, calculated from filtered transactions:

| Card | Calculation |
|---|---|
| Revenue (L$) | Sum of `Prix` where Prix > 0 |
| Net Amount (L$) | Sum of `Montant net` where Prix > 0 |
| Total Sales | Count of all filtered transactions (incl. free) |
| Avg. Cart (L$) | Revenue / count of paid transactions |

### Chart Area (full width)

Three tabs, one visible at a time. Toggle **Revenue L$ / Volume** appears in the tab bar (right-aligned), active when relevant to the current tab.

#### Tab 1 — Sales Over Time (Area Chart)
- X axis: date (grouped by day if range ≤ 90 days, by month otherwise)
- Y axis: Revenue L$ or Volume (toggle)
- Smoothed area, Recharts `AreaChart` with `type="monotone"`

#### Tab 2 — Top Articles (Horizontal Bar Chart)
- One bar per product, sorted descending
- Toggle: Revenue L$ or Volume
- Recharts `BarChart` with `layout="vertical"`

#### Tab 3 — Sales Heatmap
- Grid: 7 rows (days of week, Mon–Sun) × 24 columns (hours 0–23)
- Cell color intensity = sale volume in that slot
- Custom component (no library)
- Based on filtered date range

### Preferences Button

Fixed position, bottom-right corner of the screen. Opens a modal with:
- **Reset Data**: clears all IndexedDB data, with confirmation dialog before executing

## State (Zustand)

```ts
{
  transactions: Transaction[]        // all stored transactions, loaded at startup
  filters: {
    dateStart: Date | null
    dateEnd: Date | null
    selectedProducts: string[]       // empty = all selected
  }
  filteredTransactions: Transaction[] // derived, recomputed on filter change
  importStatus: {
    state: 'idle' | 'loading' | 'success' | 'error'
    message: string
    count: number
  }
}
```

## Data Flow

```
CSV drop
  → PapaParse (parse + column validation)
  → Filter État === "Delivered"
  → Deduplicate by "Commande #" against IndexedDB
  → Dexie.js write
  → Zustand: reload transactions[]
  → Derived filteredTransactions (date + product filters)
  → KPI cards + Recharts components re-render
```

## Components

| Component | Responsibility |
|---|---|
| `App` | Root layout, CSS grid |
| `Dropzone` | react-dropzone + import feedback |
| `ControlBar` | DateRangePicker + quick selectors + ProductFilter |
| `ProductFilter` | Multi-select dropdown with ALL toggle |
| `KPICards` | 4 stat cards |
| `ChartArea` | Tab switcher + Revenue/Volume toggle + conditional render |
| `AreaChart` | Recharts smoothed area — time series |
| `BarChart` | Recharts horizontal bars — top articles |
| `Heatmap` | Custom 7×24 grid component |
| `PreferencesModal` | Reset data modal with confirmation |

## File Structure

```
src/
  components/
    Dropzone.tsx
    ControlBar.tsx
    ProductFilter.tsx
    KPICards.tsx
    ChartArea.tsx
    charts/
      SalesAreaChart.tsx
      TopArticlesChart.tsx
      SalesHeatmap.tsx
    PreferencesModal.tsx
  store/
    useStore.ts          // Zustand store
  db/
    database.ts          // Dexie schema + helpers
  lib/
    csvParser.ts         // PapaParse wrapper + validation
    computeKPIs.ts       // KPI calculations
  App.tsx
  main.tsx
```
