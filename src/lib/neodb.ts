// Library (书影音) data source.
//
// Production builds read ONLY the committed snapshot (src/data/library-snapshot.json).
// The snapshot is refreshed by .github/workflows/refresh-library.yml, which commits
// it only when your NeoDB marks actually change — that push is what triggers a
// Cloudflare Pages deploy. So every deploy maps to a real commit, and builds are
// deterministic (no network dependency on NeoDB).
//
// `astro dev` still fetches live from NeoDB (cached on disk for 24h) so you can
// preview new marks locally; run `npm run sync:neodb` to update the snapshot.

import { existsSync, readFileSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import librarySnapshot from "../data/library-snapshot.json";
import { siteConfig } from "./config";
import { fetchLibraryFromNeoDB } from "./neodb-fetch.mjs";

export type MediaCategory = "book" | "movie" | "tv" | "music" | "game" | "podcast";
export type ShelfType = "wishlist" | "progress" | "complete" | "dropped";

export interface LibraryItem {
  uuid: string;
  category: string; // NeoDB category; usually a MediaCategory
  title: string;
  cover: string | null;
  rating: number | null; // 1–10, null if unrated
  comment: string;
  tags: string[];
  date: string; // YYYY-MM-DD (mark.created_time)
  shelf: ShelfType;
  url: string;
  communityRating?: number | null; // item.rating (0–10 average)
  ratingCount?: number | null;
  description?: string; // item synopsis
}

const snapshotItems = librarySnapshot as LibraryItem[];

function useSnapshot(reason: string): LibraryItem[] {
  if (snapshotItems.length === 0) {
    throw new Error(`[neodb] ${reason}; committed Library snapshot is empty.`);
  }
  console.warn(`[neodb] ${reason} — using committed Library snapshot (${snapshotItems.length} items).`);
  return snapshotItems;
}

// ─── Dev cache ───
// In `astro dev` the page frontmatter re-runs on every request, so without a
// cache each /library load re-hits the NeoDB API (~10 calls) → slow & pending.

const CACHE_FILE = path.resolve("node_modules/.cache/neodb/items.json");
const DEV_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

function readDevCache(): LibraryItem[] | null {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    if (Date.now() - statSync(CACHE_FILE).mtimeMs > DEV_CACHE_TTL) return null;
    return JSON.parse(readFileSync(CACHE_FILE, "utf8")) as LibraryItem[];
  } catch {
    return null;
  }
}

async function writeDevCache(items: LibraryItem[]): Promise<void> {
  try {
    await mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await writeFile(CACHE_FILE, JSON.stringify(items));
  } catch {
    /* cache is best-effort */
  }
}

let memo: Promise<LibraryItem[]> | null = null;

// Memoized so multiple pages (home + /library) share a single fetch per process.
export function fetchLibraryItems(): Promise<LibraryItem[]> {
  if (!memo) memo = loadLibraryItems();
  return memo;
}

async function loadLibraryItems(): Promise<LibraryItem[]> {
  if (!import.meta.env.DEV) {
    if (snapshotItems.length === 0) throw new Error("[neodb] committed Library snapshot is empty.");
    console.log(`[neodb] using committed snapshot (${snapshotItems.length} items)`);
    return snapshotItems;
  }

  const cached = readDevCache();
  if (cached) {
    console.log(`[neodb] dev cache hit (${cached.length} items)`);
    return cached;
  }
  const token = import.meta.env.NEODB_TOKEN ?? process.env.NEODB_TOKEN;
  const base = import.meta.env.NEODB_INSTANCE ?? process.env.NEODB_INSTANCE ?? "https://neodb.social";

  if (!token) {
    return useSnapshot("NEODB_TOKEN not set");
  }

  try {
    const items = (await fetchLibraryFromNeoDB({ base, token, siteUrl: siteConfig.url })) as LibraryItem[];
    console.log(`[neodb] fetched ${items.length} marks from ${base} (dev)`);
    await writeDevCache(items);
    return items;
  } catch (err) {
    return useSnapshot(`fetch failed (${(err as Error).message})`);
  }
}
