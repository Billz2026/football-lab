import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd());
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json; charset=utf-8"]
]);

function safeFilePath(requestUrl = "/") {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = resolve(root, normalize(relativePath));
  if (filePath !== root && !filePath.startsWith(`${root}/`)) return null;
  return filePath;
}

const server = createServer(async (request, response) => {
  try {
    let filePath = safeFilePath(request.url);
    if (!filePath) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    const fileStats = await stat(filePath);
    if (fileStats.isDirectory()) filePath = join(filePath, "index.html");
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes.get(extname(filePath)) || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(body);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

await new Promise((resolveListen, rejectListen) => {
  server.once("error", rejectListen);
  server.listen(0, "127.0.0.1", resolveListen);
});

const address = server.address();
if (!address || typeof address === "string") throw new Error("Unable to start the smoke-test server.");
const baseUrl = `http://127.0.0.1:${address.port}`;

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const runtimeErrors = [];

  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });

  await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.__footballLabMainV18), null, { timeout: 10_000 });

  const title = await page.title();
  if (!title.includes("Football Lab")) throw new Error(`Unexpected page title: ${title}`);

  // Wallet integration is intentionally read-only. A legacy Connect Wallet control,
  // when present in an older cached shell, must not open an interactive modal.
  const connectWallet = page.getByRole("button", { name: /connect wallet/i });
  if (await connectWallet.count()) {
    await connectWallet.first().click();
    if (await page.locator("#connect-modal").count()) {
      const modalIsVisible = await page.locator("#connect-modal").isVisible();
      if (modalIsVisible) throw new Error("Connect Wallet must remain read-only and must not open a modal.");
    }
  }

  await page.locator("#playClassic").click();
  await page.locator("#kickerSelectV13.is-open").waitFor({ state: "visible", timeout: 5_000 });
  await page.locator("#kickerConfirmV13").click();
  await page.locator("#gameScreen.is-active").waitFor({ state: "visible", timeout: 5_000 });
  await page.locator("#shotAction").waitFor({ state: "visible" });

  const actionText = (await page.locator("#shotAction").textContent())?.trim();
  if (actionText !== "START SHOT") throw new Error(`Expected START SHOT, received ${actionText || "empty text"}.`);

  await page.locator("#shotAction").click();
  await page.locator("#shotAction").click();
  const phaseTitle = (await page.locator("#phaseTitle").textContent())?.trim();
  if (phaseTitle !== "PICK YOUR SIDE") throw new Error(`Expected PICK YOUR SIDE, received ${phaseTitle || "empty text"}.`);

  if (runtimeErrors.length) {
    throw new Error(`Browser runtime errors:\n${runtimeErrors.join("\n")}`);
  }

  console.log("Golden path browser smoke test passed.");
} finally {
  await browser?.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}
