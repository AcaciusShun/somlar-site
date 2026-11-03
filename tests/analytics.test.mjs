import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const component = readFileSync(new URL("../src/components/analytics/GoogleAnalytics.astro", import.meta.url), "utf8");
const source = component.match(/<script is:inline define:vars=\{\{ measurementId \}\}>([\s\S]*?)<\/script>/)[1];

function browser({ choice = null, cookies = "", blocked = false } = {}) {
  const storage = new Map(choice ? [["somlar.analytics-consent.v1", choice]] : []);
  const requests = [], removals = [], events = [];
  let reloads = 0;
  const document = {
    documentElement: { dataset: {} },
    head: { append(script) { requests.push(script); } },
    createElement() { return { dataset: {} }; },
    get cookie() { return cookies; },
    set cookie(value) { removals.push(value); },
  };
  const window = { dispatchEvent(event) { events.push(event); } };
  const context = {
    window, document, measurementId: "G-TEST",
    location: { hostname: "www.somlar.com", reload() { reloads++; } },
    localStorage: {
      getItem(key) { if (blocked) throw new Error("blocked"); return storage.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw new Error("blocked"); storage.set(key, value); },
    },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  };
  vm.runInNewContext(source, context);
  return { window, document, requests, removals, storage, events, get reloads() { return reloads; } };
}

test("a new visitor makes no analytics request and starts opted out", () => {
  const page = browser();
  assert.equal(page.requests.length, 0);
  assert.equal(page.window["ga-disable-G-TEST"], true);
  assert.equal(page.window.somlarAnalytics.readChoice(), null);
});

test("stored rejection also clears legacy analytics cookies without loading Google", () => {
  const page = browser({ choice: "rejected", cookies: "_ga=old; session=keep" });
  assert.equal(page.requests.length, 0);
  assert.ok(page.removals.some((value) => value.startsWith("_ga=")));
  assert.ok(page.removals.every((value) => !value.startsWith("session=")));
});

test("explicit consent loads once and disables advertising features", () => {
  const page = browser();
  page.window.somlarAnalytics.setChoice("accepted");
  page.window.somlarAnalytics.setChoice("accepted");
  assert.equal(page.requests.length, 1);
  assert.equal(page.requests[0].async, true);
  assert.match(page.requests[0].src, /googletagmanager.com\/gtag\/js\?id=G-TEST$/);
  const config = page.window.dataLayer.find((args) => args[0] === "config")[2];
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  assert.equal(page.window.dataLayer[0][2].ad_storage, "denied");
  assert.equal(page.storage.get("somlar.analytics-consent.v1"), "accepted");
});

test("stored consent loads normally on the next document", () => {
  const page = browser({ choice: "accepted" });
  assert.equal(page.requests.length, 1);
  assert.equal(page.window["ga-disable-G-TEST"], false);
});

test("withdrawing consent disables collection without interrupting reading and clears parent-domain cookies", () => {
  const page = browser({ choice: "accepted", cookies: "_ga=old; _ga_TEST=old; session=keep" });
  page.window.somlarAnalytics.setChoice("rejected");
  assert.equal(page.window["ga-disable-G-TEST"], true);
  assert.equal(page.reloads, 0);
  assert.equal(page.storage.get("somlar.analytics-consent.v1"), "rejected");
  assert.ok(page.removals.some((value) => value.includes("Domain=.somlar.com")));
  assert.ok(page.removals.some((value) => value.includes("Domain=.www.somlar.com")));
  assert.ok(page.removals.every((value) => !value.startsWith("session=")));
});

test("reenabling statistics on the same page does not create a second loader", () => {
  const page = browser({ choice: "accepted" });
  page.window.somlarAnalytics.setChoice("rejected");
  page.window.somlarAnalytics.setChoice("accepted");
  assert.equal(page.requests.length, 1);
  assert.equal(page.window["ga-disable-G-TEST"], false);
  assert.equal(page.reloads, 0);
});

test("blocked localStorage still honors the current document's choice", () => {
  const page = browser({ blocked: true });
  page.window.somlarAnalytics.setChoice("accepted");
  assert.equal(page.window.somlarAnalytics.readChoice(), "accepted");
  page.window.somlarAnalytics.setChoice("rejected");
  assert.equal(page.window.somlarAnalytics.readChoice(), "rejected");
  assert.equal(page.window["ga-disable-G-TEST"], true);
});

test("unrecognized choices cannot enable analytics", () => {
  const page = browser();
  page.window.somlarAnalytics.setChoice("yes");
  assert.equal(page.requests.length, 0);
  assert.equal(page.window.somlarAnalytics.readChoice(), null);
});
