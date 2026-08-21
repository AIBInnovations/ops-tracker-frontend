# Ops Tracker — UI Prototype

A production planning and control (PPC) interface for a research and manufacturing
plant: projects and client orders on one side, a floor of machines on the other, and
a schedule connecting them.

This is the **UI prototype**. It exists so the shape of the product can be reviewed
and argued about before any of it is built for real.

> ### Please read before drawing conclusions from the numbers
>
> **There is no backend, and every figure on screen is invented.** Clients, machines,
> jobs, dates, costs and revenues are fixture data written by hand. The schedule is
> produced by a simplified in-browser routine, not by the real planning engine.
>
> Treat the dates and rupee figures as **placeholders that demonstrate the layout**,
> never as estimates, quotes or commitments. The production engine is a different
> piece of work with different maths, and it will not reproduce these numbers.
>
> The app also runs against a fixed "today" (21 August 2026) so the screens look the
> same whenever they are opened. Nothing is stored: **a page refresh discards every
> change and resets the demo.**

## Running it

Requires Node 20 or newer.

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # production bundle into dist/
npm run preview  # serve that bundle locally
npm run lint
```

## What is on screen

| Screen | Route | What it shows |
| --- | --- | --- |
| Dashboard | `/` | Floor utilisation, machines running, work landing in the next 48 hours, exceptions, order fulfilment |
| Projects | `/projects` | Every project with client, priority, progress, revenue and projected fulfilment |
| Project detail | `/projects/:id` | One project's tasks, financial split and exceptions |
| Task bucket | `/tasks` | The full pool of work, filterable by status, project, machine type, client and priority |
| Task detail | `/tasks/:id` | One job: work order, batch maths, dependencies, schedule slot, cost and margin |
| Clients | `/clients` | Client roll-ups — open work, revenue, margin, when their work completes |
| Client detail | `/clients/:id` | One client's projects and tasks |
| Machines | `/machines` | Machine types and physical units, with capacity and utilisation |
| Machine type · unit | `/machines/:type`, `/machines/:type/:unit` | Queue, current job and utilisation for a type or a single unit |
| Timeline | `/timeline` | Gantt — which machine is producing what, and when |
| Utilisation | `/utilization` | Utilisation and profit per machine type, cost against revenue over time |
| Alerts | `/alerts` | Deadline risk, overdue work, blocked dependencies, capacity and idle-machine exceptions |

Press <kbd>Ctrl</kbd>+<kbd>K</kbd> (<kbd>⌘</kbd>+<kbd>K</kbd> on macOS) anywhere to
search across every project, task, client and machine.

## Notes on the interface

- **Light and dark themes**, resolved before first paint so a reload never flashes
  the wrong palette. The toggle is in the top bar.
- **Desktop-first**, because the plant runs on desktops — but every screen works down
  to 375px. Tables keep horizontal scrolling rather than collapsing into cards, since
  this is dense operational data.
- **Everything deep-links.** Filters live in the URL, so any filtered view can be
  copied and shared.
- One design system underpins it: semantic colour tokens, a fixed type scale, and a
  single mapping from domain state to colour, so a "blocked" job looks identical
  wherever it appears.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS · React Router · Zustand · Recharts

```
src/
  pages/        one file per screen
  components/   ui/ primitives · layout/ shell · feature components
  engine/       the simplified in-browser scheduler used for the demo
  data/         fixture data — replaced by the API
  lib/          selectors, formatting, routing, hooks
  styles/       design tokens
```

Components read from a store rather than touching fixtures directly, and the
`services/` layer is already shaped like an API client. Connecting the real backend
means changing those two places; the screens themselves stay as they are.

## Status

Reviewed and approved on the visual design. The functional flows are still being
worked through, and the planning engine, persistence, user accounts and permissions
all belong to the build that follows this prototype.
