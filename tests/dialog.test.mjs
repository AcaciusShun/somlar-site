import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = ts.transpileModule(
  readFileSync(new URL("../src/lib/dialog.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function page() {
  const jobs = [], scrolls = [], focuses = [], handlers = new Map();
  const document = {
    body: { style: { position: "relative", top: "", left: "", width: "90%" } },
    documentElement: { style: { overflow: "scroll" } },
  };
  const window = {
    scrollX: 12, scrollY: 640,
    scrollTo(x, y) { this.scrollX = x; this.scrollY = y; scrolls.push([x, y]); },
  };
  const exports = {};
  vm.runInNewContext(source, { exports, window, document });
  const dialog = {
    open: false,
    addEventListener(name, handler) { handlers.set(name, handler); },
    showModal() { this.open = true; },
    close() { this.open = false; jobs.push(() => handlers.get("close")()); },
    getBoundingClientRect() { return { left: 20, right: 320, top: 40, bottom: 400 }; },
  };
  const trigger = { isConnected: true, focus(options) { focuses.push(options); } };
  const controller = exports.createDialogController(dialog);
  return {
    window, document, dialog, trigger, controller, scrolls, focuses,
    flush() { while (jobs.length) jobs.shift()(); },
    click(x, y) { handlers.get("click")({ target: dialog, clientX: x, clientY: y }); },
  };
}

test("opening a dialog holds the document at its current reading position", () => {
  const p = page();
  p.controller.open(p.trigger);
  assert.equal(p.document.body.style.position, "fixed");
  assert.equal(p.document.body.style.top, "-640px");
  assert.equal(p.document.body.style.left, "-12px");
  assert.equal(p.document.documentElement.style.overflow, "hidden");
});

test("a contents jump survives the later native close event", () => {
  const p = page();
  p.controller.open(p.trigger);
  p.controller.close();
  assert.deepEqual(p.scrolls.at(-1), [12, 640]);
  p.window.scrollTo(0, 1800);
  p.flush();
  assert.deepEqual(p.scrolls.at(-1), [0, 1800]);
  assert.equal(p.focuses.length, 1);
  assert.equal(p.document.body.style.position, "relative");
  assert.equal(p.document.body.style.width, "90%");
});

test("native Escape or form close restores scroll, styles and trigger focus", () => {
  const p = page();
  p.controller.open(p.trigger);
  p.dialog.close();
  p.flush();
  assert.deepEqual(p.scrolls, [[12, 640]]);
  assert.equal(p.document.documentElement.style.overflow, "scroll");
  assert.equal(p.focuses.length, 1);
  assert.equal(p.focuses[0].preventScroll, true);
});

test("interior whitespace does not dismiss the dialog; backdrop does", () => {
  const p = page();
  p.controller.open(p.trigger);
  p.click(100, 180);
  assert.equal(p.dialog.open, true);
  p.click(400, 180);
  assert.equal(p.dialog.open, false);
  p.flush();
  assert.equal(p.document.body.style.position, "relative");
});

test("reopening an already open dialog retains its original focus return", () => {
  const p = page();
  p.controller.open(p.trigger);
  p.controller.open({ isConnected: true, focus() { throw new Error("wrong trigger"); } });
  p.controller.close();
  p.flush();
  assert.equal(p.focuses.length, 1);
});

test("closing remains safe when the opening control has left the document", () => {
  const p = page();
  p.controller.open(p.trigger);
  p.trigger.isConnected = false;
  p.controller.close();
  p.flush();
  assert.equal(p.focuses.length, 0);
  assert.deepEqual(p.scrolls.at(-1), [12, 640]);
});
