# Somlar

Personal site and digital study — built with [Astro 7](https://astro.build/), featuring editorial typography, light/dark themes, and a curated content system.

**[somlar.com](https://somlar.com)**

![Somlar — homepage preview](https://cdn.somlar.com/2026/06/0f2b3131e310789d3b3489a648605334.png)

## Features

- **Digital Study design** — warm editorial palette with Cormorant Garamond + Inter, light ("日光书房") and dark ("灯下夜读") themes
- **Blog** — 50+ posts with tag filtering, reading time, table of contents, a top reading-progress bar, code-copy buttons, image lightbox, and Shiki dual-theme syntax highlighting
- **Library (书影音)** — a [NeoDB](https://neodb.social)-synced shelf of books, films, TV, music, games and podcasts:
  - Cover grid ("书架") and month-by-month timeline ("时间轴") views
  - Category filter (Books / Movies & TV / Music / Games / Podcasts) + a status sub-filter (看过 / 在看 / 想看)
  - Click any item for a detail modal — your rating, community rating, review, synopsis, tags, and a link back to NeoDB
  - `>!spoiler!<` markup rendered as reveal-on-hover blocks
  - Data is fetched at **build time**; covers are served via Cloudflare image transformations (resized to WebP/AVIF, reachable from mainland China)
- **Projects** — curated showcase of personal and course work
- **Labs** — space for experiments, prototypes, and small demos
- **Friends** — blogroll / link exchange page
- **Comments** — self-hosted [Twikoo](https://twikoo.js.org/) on blog posts
- **Search** — full-text client search powered by [Pagefind](https://pagefind.app/)

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Astro 7 (Content Layer API, View Transitions) |
| Styling | Tailwind CSS v4 + custom design tokens |
| Typography | Cormorant Garamond, Inter, JetBrains Mono |
| Icons | astro-icon + Iconify (Simple Icons, Lucide) |
| Syntax | Shiki (github-light / github-dark) |
| Search | Pagefind |
| Comments | Twikoo |
| Library data | NeoDB API (CI-synced snapshot) |
| Media | Cloudflare R2 CDN |

## Configuration

Environment variables live in `.env` (gitignored). Copy `.env.example` to `.env` and fill in:

| Variable | Used by | Notes |
|----------|---------|-------|
| `PUBLIC_TWIKOO_ENV_ID` | Comments | Twikoo backend URL / env id. `PUBLIC_`-prefixed, so it's exposed to the client (required by the widget). |
| `NEODB_TOKEN` | Library | NeoDB personal access token with **read** scope. Used by `npm run sync:neodb` / `astro dev` locally and as a GitHub Actions secret — not needed on Cloudflare, never shipped to the client. Generate one at `https://<instance>/developer`. |
| `NEODB_INSTANCE` | Library | NeoDB instance base URL. Defaults to `https://neodb.social`. |

> When deploying, set these in your host's **build environment variables** — `.env` is never committed.

### How the Library sync works

Library data lives in a committed snapshot, `src/data/library-snapshot.json`, which production builds read directly (no NeoDB call at build time, so builds are deterministic).

- **Sync** — [`.github/workflows/refresh-library.yml`](.github/workflows/refresh-library.yml) runs `scripts/sync-neodb.mjs` every few hours. It pulls every shelf (`wishlist` / `progress` / `complete` / `dropped`) from `GET /api/me/shelf/{type}` and commits the snapshot **only if your marks changed** (shelf, rating, comment, tags, date, title, cover). That push triggers the Cloudflare Pages build, so the site deploys on your own commits and on real NeoDB changes — never on a blind timer. Changes to community ratings / synopses alone don't trigger a deploy; they're refreshed with the next real change, or on demand via *Run workflow → force*. Requires a `NEODB_TOKEN` repo secret (optional `NEODB_INSTANCE` repo variable).
- **Local** — `npm run sync:neodb` does the same with the token from `.env` (add `-- --force` to rewrite regardless); review the diff and commit. `astro dev` fetches live from NeoDB (cached 24h in `node_modules/.cache/neodb/`) so you can preview new marks before syncing.
- **Covers** — NeoDB's `cover_image_url` wrapped in a Cloudflare image-transformation URL (`/cdn-cgi/image/...`), so they serve from this zone (reachable in mainland China, unlike neodb.social) and are resized/reformatted at the edge. Requires the zone's Transformations to allow `neodb.social` as a source origin. Lazy-loaded; no local image pipeline.
- **Resilience** — a failed or empty NeoDB response never overwrites the snapshot, so an outage just means no update.

## Development

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # production build (reads Library snapshot + indexes search)
npm run sync:neodb # refresh the Library snapshot from NeoDB
npm run preview    # preview the production build
```

## Project Structure

```
src/
├── content/blog/       # Markdown blog posts
├── layouts/            # Base + Page layout wrappers
├── components/
│   ├── layout/         # Header, Footer
│   ├── interactive/    # ThemeToggle, SearchDialog, TwikooComments, BackToTop
│   └── content/        # MediaCover, RatingStars, LibraryModal
├── pages/
│   ├── index.astro     # Homepage (+ "From the Library" strip)
│   ├── blog/           # Blog list + [slug] detail
│   ├── projects/       # Project showcase
│   ├── labs/           # Experiments
│   ├── library/        # 书影音 — NeoDB shelf + timeline
│   ├── friends.astro   # Blogroll
│   └── about.astro     # About + social links
├── lib/                # Blog utilities, site config, NeoDB sync (neodb.ts)
└── styles/             # Global CSS + design tokens
```

## License

[MIT](LICENSE)
