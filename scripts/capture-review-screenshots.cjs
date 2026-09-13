// One-off QA capture script for the finish-review pass. Not part of the app;
// uses playwright (installed with --no-save, not a project dependency) to
// log in with a throwaway test account and capture the pages/themes/viewports
// the finish reviewer needs as real files under .impeccable/review/.
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:3000";
const OUT_DIR = path.join(__dirname, "..", ".impeccable", "review");
const EMAIL = "design.critique.qa@example.local";
const PASSWORD = "Critique#2026!";

fs.mkdirSync(OUT_DIR, { recursive: true });

async function shot(page, name, { fullPage = true } = {}) {
  await page.waitForTimeout(400); // settle entrance motion before capture
  // fullPage screenshots break `position: fixed` elements (Playwright renders
  // them "pinned" at one pixel offset in the tall composite instead of at the
  // true viewport bottom) — the mobile bottom nav is fixed, so mobile captures
  // must use a normal viewport-sized screenshot, not fullPage.
  await page.screenshot({ path: path.join(OUT_DIR, name), fullPage });
  console.log("captured", name);
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    document.cookie = `vaulty_theme=${t}; path=/`;
  }, theme);
  await page.reload();
  await page.waitForTimeout(500);
}

(async () => {
  const browser = await chromium.launch();

  // ── Desktop context ────────────────────────────────────────────────
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dp = await desktop.newPage();

  // Warm-up: the first request to a route after a dev-server restart pays
  // Turbopack's cold-compile cost, which can exceed a normal settle wait and
  // make the capture look "stale" (painted before images decoded) even
  // though the served bytes are already correct. Hit it once and discard.
  await dp.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await dp.waitForTimeout(1500);

  await dp.reload({ waitUntil: "networkidle" });
  await dp.waitForTimeout(2500); // login has a staged 200ms/1200ms logo-intro animation — let it fully settle
  await shot(dp, "login-desktop.png");

  await dp.goto(`${BASE}/register`, { waitUntil: "networkidle" });
  await shot(dp, "register-desktop.png");

  // Log in
  await dp.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await dp.fill('input[type="email"]', EMAIL);
  await dp.fill('input[type="password"]', PASSWORD);
  await dp.click('button[type="submit"]');
  await dp.waitForURL(/dashboard/, { timeout: 15000 });
  await dp.waitForTimeout(800);

  await shot(dp, "desktop.png"); // Dashboard, light, canonical name
  await shot(dp, "dashboard-desktop.png");

  await setTheme(dp, "dark");
  await shot(dp, "dashboard-desktop-dark.png");
  await setTheme(dp, "light");

  await dp.goto(`${BASE}/income`, { waitUntil: "networkidle" });
  await shot(dp, "income-desktop.png");

  await dp.goto(`${BASE}/expenses`, { waitUntil: "networkidle" });
  await dp.click('button:has-text("Category")').catch(() => {});
  await shot(dp, "expenses-desktop-category.png");
  await dp.click('button:has-text("Date")').catch(() => {});
  await shot(dp, "expenses-desktop-date.png");
  await dp.click('button:has-text("Amount")').catch(() => {});
  await shot(dp, "expenses-desktop-amount.png");
  await dp.evaluate(() => document.getElementById("recurring")?.scrollIntoView());
  await shot(dp, "expenses-desktop-recurring.png");

  await dp.goto(`${BASE}/goals`, { waitUntil: "networkidle" });
  await shot(dp, "goals-desktop.png");

  await desktop.close();

  // ── Mobile context (shares nothing — re-login) ─────────────────────
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mobile.newPage();
  await mp.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await mp.fill('input[type="email"]', EMAIL);
  await mp.fill('input[type="password"]', PASSWORD);
  await mp.click('button[type="submit"]');
  await mp.waitForURL(/dashboard/, { timeout: 15000 });
  await mp.waitForTimeout(800);
  await shot(mp, "mobile.png", { fullPage: false }); // Dashboard, canonical name — viewport-only so the fixed bottom nav shows at its true position
  await mp.evaluate(() => window.scrollBy(0, 500));
  await shot(mp, "mobile-scrolled.png", { fullPage: false });

  await mp.goto(`${BASE}/expenses`, { waitUntil: "networkidle" });
  await shot(mp, "expenses-mobile.png", { fullPage: false });

  await mobile.close();

  // ── Tablet context (iPad-class portrait width) ─────────────────────
  const tablet = await browser.newContext({ viewport: { width: 820, height: 1180 } });
  const tp = await tablet.newPage();
  await tp.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await tp.fill('input[type="email"]', EMAIL);
  await tp.fill('input[type="password"]', PASSWORD);
  await tp.click('button[type="submit"]');
  await tp.waitForURL(/dashboard/, { timeout: 15000 });
  await tp.waitForTimeout(800);
  await shot(tp, "dashboard-tablet.png", { fullPage: false });
  await tp.goto(`${BASE}/expenses`, { waitUntil: "networkidle" });
  await shot(tp, "expenses-tablet.png", { fullPage: false });
  await tablet.close();

  await browser.close();
  console.log("done");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
