#!/usr/bin/env node
// Refresh src/data/library-snapshot.json from NeoDB.
//
//   NEODB_TOKEN=... node scripts/sync-neodb.mjs          # write only if your marks changed
//   NEODB_TOKEN=... node scripts/sync-neodb.mjs --force  # always rewrite (also refreshes community ratings)
//
// Exit codes: 0 = done (file may or may not have changed), 1 = fetch/config error
// (snapshot left untouched). CI commits the file only when `git diff` shows a change,
// and that push is what triggers the Cloudflare Pages build.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { fetchLibraryFromNeoDB, fingerprint } from "../src/lib/neodb-fetch.mjs";

const SNAPSHOT = fileURLToPath(new URL("../src/data/library-snapshot.json", import.meta.url));
const SITE_URL = "https://somlar.com"; // keep in sync with siteConfig.url

const token = process.env.NEODB_TOKEN;
const base = process.env.NEODB_INSTANCE || "https://neodb.social";
const force = process.argv.includes("--force") || process.env.FORCE === "true";

if (!token) {
  console.error("NEODB_TOKEN is not set");
  process.exit(1);
}

const items = await fetchLibraryFromNeoDB({ base, token, siteUrl: SITE_URL });
if (items.length === 0) {
  // An empty library is far more likely an API/auth hiccup than reality — don't wipe the site.
  console.error("NeoDB returned 0 marks; refusing to overwrite the snapshot");
  process.exit(1);
}

let previous = [];
try {
  previous = JSON.parse(await readFile(SNAPSHOT, "utf8"));
} catch {
  /* first run */
}

const marksChanged = fingerprint(previous) !== fingerprint(items);
if (!marksChanged && !force) {
  console.log(`No changes to your marks (${items.length} items) — snapshot untouched.`);
  process.exit(0);
}

await writeFile(SNAPSHOT, JSON.stringify(items, null, 2) + "\n");
console.log(
  `${marksChanged ? "Marks changed" : "Forced refresh"}: wrote ${items.length} items (was ${previous.length}).`,
);
