// Plain-JS NeoDB client shared by `scripts/sync-neodb.mjs` (CI) and
// `src/lib/neodb.ts` (astro dev). No Astro / Vite dependencies, so it runs
// under bare Node in GitHub Actions.
//
// Endpoint: GET /api/me/shelf/{type}?page=N → { data: Mark[], pages, count }

export const SHELF_TYPES = ["complete", "progress", "wishlist", "dropped"];

// Fields that come from NeoDB's shared catalogue and drift as *other* people
// rate/edit items. They are refreshed whenever we sync, but a change in them
// alone is not a reason to redeploy.
export const VOLATILE_FIELDS = ["communityRating", "ratingCount", "description"];

// Covers go through Cloudflare Image Transformations on our own zone so they
// serve from somlar.com (reachable in mainland China) as resized WebP/AVIF.
function coverPrefix(siteUrl) {
  return `${siteUrl.replace(/\/$/, "")}/cdn-cgi/image/width=400,quality=80,format=auto`;
}

function mapMark(m, base, prefix) {
  const it = m.item;
  const url = it.url?.startsWith("http") ? it.url : base + it.url;
  return {
    uuid: it.uuid,
    category: it.category,
    title: it.display_title || it.title || "Untitled",
    cover: it.cover_image_url ? `${prefix}/${it.cover_image_url}` : null,
    rating: m.rating_grade ?? null,
    comment: m.comment_text || "",
    tags: m.tags || [],
    date: (m.created_time || "").slice(0, 10),
    shelf: m.shelf_type,
    url,
    communityRating: it.rating ?? null,
    ratingCount: it.rating_count ?? null,
    description: it.description || "",
  };
}

// Retry 429 / 5xx / network errors with backoff; fail fast on other 4xx.
async function fetchJson(url, token, retries = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) return await res.json();
      if (res.status < 500 && res.status !== 429) throw Object.assign(new Error(`HTTP ${res.status}`), { fatal: true });
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (err.fatal) throw err;
      lastErr = err;
    }
    if (attempt < retries) await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  throw lastErr;
}

async function fetchShelf(type, base, token) {
  const out = [];
  let page = 1;
  let pages = 1;
  do {
    const json = await fetchJson(`${base}/api/me/shelf/${type}?page=${page}`, token);
    if (!Array.isArray(json?.data)) throw new Error(`unexpected response for shelf ${type} page ${page}`);
    out.push(...json.data);
    pages = json.pages || 1;
    page += 1;
  } while (page <= pages);
  return out;
}

/**
 * Fetch every shelf and return LibraryItem[] in a deterministic order
 * (newest mark first, uuid as tie-breaker) so unchanged data produces a
 * byte-identical snapshot.
 * @param {{ base: string, token: string, siteUrl: string }} opts
 */
export async function fetchLibraryFromNeoDB({ base, token, siteUrl }) {
  const root = base.replace(/\/$/, "");
  const prefix = coverPrefix(siteUrl);
  const marks = (await Promise.all(SHELF_TYPES.map((t) => fetchShelf(t, root, token)))).flat();
  const items = marks.map((m) => mapMark(m, root, prefix));
  items.sort((a, b) => b.date.localeCompare(a.date) || a.uuid.localeCompare(b.uuid));
  return items;
}

/** Projection used to decide whether the user's own marks changed. */
export function fingerprint(items) {
  return JSON.stringify(
    [...items]
      .map((it) => {
        const copy = { ...it };
        for (const f of VOLATILE_FIELDS) delete copy[f];
        return copy;
      })
      .sort((a, b) => a.uuid.localeCompare(b.uuid)),
  );
}
