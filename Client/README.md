# IgNITE Programme Dashboard — Frontend MVP

A frontend-only React prototype for the **IgNITE Programme — Awareness Sessions on
Increasing Girls' Participation in ITIs**. Built to demonstrate how the programme's
Daily / Weekly / Monthly reporting could look as a live monitoring dashboard.

No backend, database, auth, or AI — every number on screen is calculated at runtime
from a deterministic, centralized dummy dataset in `src/data/mockData.js`.

## Stack

React 18 · Vite · Tailwind CSS · React Router · Recharts · Lucide React

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`). It redirects to
`/dashboard`.

```bash
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

> This project was authored in an offline sandbox with no access to the npm
> registry, so the build could not be run and verified end-to-end before
> handing it to you. The code has been checked carefully — every local import
> was resolved and the full module graph was bundled successfully with esbuild
> (the same transform Vite uses), and the mock-data/aggregation logic was
> executed directly in Node to confirm it produces consistent, error-free
> output. Still, please run `npm install && npm run dev` as your first step
> and treat this as an unverified build until you've seen it render. If
> anything doesn't compile, it's most likely a small, easy-to-spot issue
> (e.g. a Tailwind class name or an icon export) — let me know and I can fix
> it immediately once you share the error.

## Pages

| Route          | Page                    | Notes                                                              |
|-----------------|-------------------------|----------------------------------------------------------------------|
| `/dashboard`    | Executive Dashboard     | Programme-wide KPIs, trend, sessions-by-type, state performance, planned vs achieved, management insights |
| `/daily`        | Daily Field Activities  | Searchable/filterable, sortable, paginated activity log with a detail drawer per row |
| `/performance`  | Performance             | Weekly/Monthly toggle — KPI summary, planned vs achieved, state ranking, trend, challenges/observations/recommendations |

## Data model

Everything lives in `src/data/mockData.js`:

- **Geography**: 8 states → 3 districts each → 2 blocks each → 2 schools each (96
  schools total), built deterministically from a seeded PRNG.
- **`DAILY_RECORDS`**: ~120 days of field activity ending 17 Aug 2026, one row per
  school visit, matching the Daily Report template's fields (reach by audience,
  attendance/feedback/IEC/geo-photo flags, remarks, regional expert, observation).
- **`WEEKLY_SERIES` / `MONTHLY_SERIES`**: "Achieved" is genuinely aggregated from
  `DAILY_RECORDS` (not separately hardcoded); "Planned" is a deterministic target
  scaled off Achieved, so Planned vs Achieved always stays in a believable range.
  Each period also carries a few Challenges / Observations / Recommendations drawn
  from small text pools.
- **`PROGRAMME_TOTALS`**: all-time rollups used by the Executive Dashboard KPI cards.

Because everything is derived at runtime via `src/utils/calculations.js`
(`groupByState`, `sumReach`, `documentationCompletion`, etc.), swapping in a real
API later mainly means replacing what `mockData.js` exports — the pages and charts
don't need to change.

## Known simplifications (this is a prototype)

- No Gram Panchayat level or "Nearest ITI" field — the brief only asked for
  Date/State/District/Block/School on the Daily table, so the geography tree stops
  at Block → School.
- "Documentation" on the Daily table is shown as a compact 4-icon cluster
  (Attendance / Feedback / IEC / Geo-photo) rather than four separate columns, to
  keep the table readable — full detail is in the row's drawer.
- I did not have your actual Excel workbook (it wasn't attached), so field names
  and value ranges are based on the terminology in your prompt rather than the
  workbook itself. If you attach it, I can re-align the data model to match it
  exactly.
