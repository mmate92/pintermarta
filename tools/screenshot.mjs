// Dev helper: screenshot a page after scrolling, using the installed Chrome.
// Usage: node tools/screenshot.mjs <url> <out.png> <width> <height> [scrollY] [clickSelector | js:expression]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';

const [url, out, w, h, scrollY = '0', click = ''] = process.argv.slice(2);
const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(process.cwd(), '_scrape', 'chrome-'));
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${w},${h}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(200);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {}
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
  await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await sleep(2500);
  await send('Runtime.evaluate', { expression: `window.scrollTo({top:${+scrollY},behavior:'instant'})` });
  // the last argument is a selector to click, or 'js:<expression>' to run
  if (click) await send('Runtime.evaluate', { expression: click.startsWith('js:') ? click.slice(3) : `document.querySelector(${JSON.stringify(click)}).click()`, awaitPromise: true });
  await sleep(1200);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(out, Buffer.from(shot.data, 'base64'));
  ws.close();
} finally { chrome.kill(); }
