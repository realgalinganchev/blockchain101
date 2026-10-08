#!/usr/bin/env node
// Browser smoke test: loads the app in headless Chrome with the headers it is really
// served with (CSP included), then adds a signed transaction, mines it, opens the block
// and runs the tamper demo. Fails on any CSP violation, uncaught exception or console
// error. Talks to Chrome over the DevTools protocol, so it needs no npm packages.
//
// Usage: node test/browser-smoke.mjs [url]     (Node 22+; CHROME_PATH defaults to google-chrome)
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const url = process.argv[2] ?? "http://localhost:9000";
const chromePath = process.env.CHROME_PATH ?? "google-chrome";
const port = 9333;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chrome = spawn(
  chromePath,
  ["--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "smoke-"))}`, "about:blank"],
  { stdio: "ignore" }
);

const problems = [];
const pending = new Map();
let nextId = 0;
let socket;

async function connect() {
  for (let i = 0; i < 80; i++) {
    try {
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
    } catch {
      // Chrome is still starting
    }
    await sleep(250);
  }
  throw new Error(`Chrome didn't start (CHROME_PATH=${chromePath})`);
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

async function evaluate(expression) {
  const { result, exceptionDetails } = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  return result.value;
}

async function waitFor(what, expression, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await sleep(200);
  }
  throw new Error(`timed out waiting for ${what}`);
}

const click = (selector, text = "") =>
  evaluate(`(() => {
    const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find((e) => e.textContent.includes(${JSON.stringify(text)}));
    if (!el) throw new Error(${JSON.stringify(`nothing to click: ${selector} ${text}`)});
    el.click();
  })()`);

const blockCount = "document.querySelectorAll('.block__open').length";
const verdict = "(document.querySelector('.modal__section .check')?.textContent ?? '')";

const steps = [
  ["the chain loads and verifies in the browser", () => waitFor("the chain to verify", "document.querySelector('.chain .check')?.textContent.includes('verified')")],
  [
    "the stylesheet applies",
    async () => {
      if ((await evaluate("getComputedStyle(document.body).backgroundColor")) === "rgba(0, 0, 0, 0)") throw new Error("no styles applied");
    },
  ],
  [
    "a signed transaction reaches the mempool",
    async () => {
      await click("button", "Add transaction");
      await waitFor("a pending transaction", "document.querySelectorAll('.tx--button').length > 0");
    },
  ],
  [
    "mining puts it in a new block",
    async () => {
      const before = await evaluate(blockCount);
      await click("button", "Mine block");
      await waitFor("the new block", `${blockCount} > ${before} && !!document.querySelector('.toast__action')`, 90000);
    },
  ],
  [
    "the new block opens and verifies",
    async () => {
      await click(".toast__action");
      await waitFor("a valid verdict", `${verdict}.includes('valid') && !${verdict}.includes('invalid')`);
    },
  ],
  [
    "tampering with it is detected",
    async () => {
      await click(".tamper__btn", "Tamper");
      await waitFor("an invalid verdict", `${verdict}.includes('invalid')`);
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
  for (const violation of await evaluate("window.__csp")) problems.push(`CSP: ${violation}`);
} catch (error) {
  failed = true;
  console.error(`✗ ${error.message}`);
}

problems.forEach((problem) => console.error(`✗ ${problem}`));
console.log(failed || problems.length ? "Browser smoke test failed" : "Browser smoke test passed: no CSP violations, exceptions or console errors");
socket?.close();
chrome.kill();
process.exit(failed || problems.length ? 1 : 0);
