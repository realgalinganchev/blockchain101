#!/usr/bin/env node
// Browser smoke test: loads the app in headless Chrome with the headers it is really
// served with (CSP included), then adds a signed transaction, mines it, opens the block
// and runs the tamper demo. Fails on any CSP violation, uncaught exception or console
// error. Talks to Chrome over the DevTools protocol, so it needs no npm packages.
//
// Usage: node test/browser-smoke.mjs [url]     (Node 22+; CHROME_PATH defaults to google-chrome)
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const url = process.argv[2] ?? "http://localhost:9000";
const chromePath = process.env.CHROME_PATH ?? "google-chrome";
const STARTUP_TIMEOUT_MS = 45000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const problems = [];
const pending = new Map();
let nextId = 0;
let socket;
let chrome;
let chromeOutput = "";
let chromeExited = false;

// Chrome picks a free port itself (--remote-debugging-port=0) and writes it to
// DevToolsActivePort in the profile once DevTools is listening: no port clashes, and
// no guessing when it's ready.
function launchChrome() {
  const profile = mkdtempSync(join(tmpdir(), "smoke-"));
  chromeOutput = "";
  chromeExited = false;
  chrome = spawn(chromePath, ["--headless=new", "--no-sandbox", "--disable-gpu", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], {
    stdio: ["ignore", "ignore", "pipe"],
  });
  chrome.stderr.on("data", (chunk) => {
    chromeOutput = (chromeOutput + chunk).slice(-2000);
  });
  chrome.on("error", (error) => {
    chromeOutput += ` spawn failed: ${error.message}`;
    chromeExited = true;
  });
  chrome.on("exit", (code) => {
    chromeOutput += ` (exited with code ${code})`;
    chromeExited = true;
  });
  return profile;
}

async function devtoolsPort(profile) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline && !chromeExited) {
    try {
      const port = Number(readFileSync(join(profile, "DevToolsActivePort"), "utf8").split("\n")[0]);
      if (port) return port;
    } catch {
      // not written yet
    }
    await sleep(250);
  }
  return null;
}

async function connect() {
  // A cold start on a busy CI runner occasionally stalls, so allow one fresh retry
  for (let attempt = 1; attempt <= 2; attempt++) {
    const port = await devtoolsPort(launchChrome());
    if (port) {
      for (let i = 0; i < 40; i++) {
        const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page");
        if (page) {
          socket = new WebSocket(page.webSocketDebuggerUrl);
          await new Promise((resolve, reject) => {
            socket.onopen = resolve;
            socket.onerror = reject;
          });
          socket.onmessage = (event) => onMessage(JSON.parse(event.data));
          return;
        }
        await sleep(250);
      }
    }
    console.error(`Chrome didn't start (attempt ${attempt}, CHROME_PATH=${chromePath}): ${oneLine(chromeOutput.slice(-600)) || "no output"}`);
    chrome.kill("SIGKILL");
  }
  throw new Error("Chrome didn't start after 2 attempts");
}

function onMessage(msg) {
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  } else if (msg.method === "Runtime.exceptionThrown") {
    problems.push(`uncaught: ${msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text}`);
  } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
    problems.push(`console.error: ${msg.params.args.map((a) => a.value ?? a.description).join(" ")}`);
  } else if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
    problems.push(`browser: ${msg.params.entry.text}`);
  }
}

function send(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

// Runs a function in the page. Arguments travel as protocol values and are never
// spliced into code, so nothing here builds JavaScript from strings.
async function inPage(fn, ...args) {
  const { result: global } = await send("Runtime.evaluate", { expression: "globalThis" });
  const { result, exceptionDetails } = await send("Runtime.callFunctionOn", {
    objectId: global.objectId,
    functionDeclaration: fn.toString(),
    arguments: args.map((value) => ({ value })),
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  return result.value;
}

async function waitFor(what, timeoutMs, fn, ...args) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await inPage(fn, ...args)) return;
    await sleep(200);
  }
  throw new Error(`timed out waiting for ${what}`);
}

// Page-side helpers: serialized into the page, so they only use the page's globals.
function clickElement(selector, text) {
  const el = [...document.querySelectorAll(selector)].find((e) => e.textContent.includes(text));
  if (!el) throw new Error(`nothing to click: ${selector} ${text}`);
  el.click();
}
const chainVerified = () => document.querySelector(".chain .check")?.textContent.includes("verified");
const bodyBackground = () => getComputedStyle(document.body).backgroundColor;
const hasPending = () => document.querySelectorAll(".tx--button").length > 0;
const blockCount = () => document.querySelectorAll(".block__open").length;
const minedPast = (before) => document.querySelectorAll(".block__open").length > before && !!document.querySelector(".toast__action");
const verdictIs = (expected) => {
  const verdict = document.querySelector(".modal__section .check")?.textContent ?? "";
  return expected === "valid" ? verdict.includes("valid") && !verdict.includes("invalid") : verdict.includes(expected);
};
const cspViolations = () => window.__csp;

const click = (selector, text = "") => inPage(clickElement, selector, text);
// Browser messages are page-controlled: drop line breaks so they can't forge log lines
const oneLine = (text) => String(text).replace(/\n|\r/g, "");

const steps = [
  ["the chain loads and verifies in the browser", () => waitFor("the chain to verify", 30000, chainVerified)],
  [
    "the stylesheet applies",
    async () => {
      if ((await inPage(bodyBackground)) === "rgba(0, 0, 0, 0)") throw new Error("no styles applied");
    },
  ],
  [
    "a signed transaction reaches the mempool",
    async () => {
      await click("button", "Add transaction");
      await waitFor("a pending transaction", 30000, hasPending);
    },
  ],
  [
    "mining puts it in a new block",
    async () => {
      const before = await inPage(blockCount);
      await click("button", "Mine block");
      await waitFor("the new block", 90000, minedPast, before);
    },
  ],
  [
    "the new block opens and verifies",
    async () => {
      await click(".toast__action");
      await waitFor("a valid verdict", 30000, verdictIs, "valid");
    },
  ],
  [
    "tampering with it is detected",
    async () => {
      await click(".tamper__btn", "Tamper");
      await waitFor("an invalid verdict", 30000, verdictIs, "invalid");
    },
  ],
];

let failed = false;
try {
  await connect();
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: "window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} blocked ${e.blockedURI}`));",
  });
  await send("Page.navigate", { url });

  for (const [name, run] of steps) {
    await run();
    console.log(`✓ ${name}`);
  }
  for (const violation of await inPage(cspViolations)) problems.push(`CSP: ${violation}`);
} catch (error) {
  failed = true;
  console.error(`✗ ${oneLine(error.message)}`);
}

problems.forEach((problem) => console.error(`✗ ${oneLine(problem)}`));
console.log(failed || problems.length ? "Browser smoke test failed" : "Browser smoke test passed: no CSP violations, exceptions or console errors");
socket?.close();
chrome?.kill();
process.exit(failed || problems.length ? 1 : 0);
