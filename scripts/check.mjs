// Fast pre-push sanity check (no browser): `npm run check`
//  1. every browser script parses
//  2. every <script>/<link> in index.html and every file the service worker
//     precaches actually exists (a missing precache file breaks SW install)
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

let failed = 0;
const fail = (msg) => { console.error("✗ " + msg); failed++; };

const scripts = ["src/js/config.js", "src/js/services.js", ...readdirSync("src/js/app").filter((f) => f.endsWith(".js")).sort().map((f) => join("src/js/app", f)), "sw.js"];
for (const f of scripts) {
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); }
  catch (e) { fail(`${f} does not parse:\n${e.stderr}`); }
}

const html = readFileSync("index.html", "utf8");
for (const [, src] of html.matchAll(/(?:src|href)="\.?\/?((?:src|assets)\/[^"?#]+)/g))
  if (!existsSync(src)) fail(`index.html references missing ${src}`);
const appScripts = [...html.matchAll(/src="\.\/(src\/js\/app\/[^"]+)"/g)].map((m) => m[1]);
const onDisk = readdirSync("src/js/app").filter((f) => f.endsWith(".js")).map((f) => `src/js/app/${f}`).sort();
if (JSON.stringify([...appScripts].sort()) !== JSON.stringify(onDisk)) fail("index.html <script> list doesn't match src/js/app/*.js");
if (JSON.stringify(appScripts) !== JSON.stringify([...appScripts].sort())) fail("app scripts must load in numeric order");

const sw = readFileSync("sw.js", "utf8");
const assets = [...sw.matchAll(/"\.\/([^"?]+)(?:\?[^"]*)?"/g)].map((m) => m[1]).filter(Boolean);
for (const a of assets) if (!existsSync(a)) fail(`sw.js precaches missing ${a}`);
for (const s of onDisk) if (!assets.includes(s)) fail(`sw.js doesn't precache ${s}`);

if (failed) { console.error(`\n${failed} problem(s)`); process.exit(1); }
console.log(`✓ ${scripts.length} scripts parse, index.html + sw.js references all exist`);
