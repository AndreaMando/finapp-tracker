// Regenerates the login page's feature-carousel screenshots from the actual
// shipped redesign (they previously showed the pre-redesign UI, flagged by
// the finish review as a truth problem). One-off script, not part of the app;
// uses playwright (installed with --no-save).
const { chromium } = require("playwright");
const path = require("path");

const BASE = "http://localhost:3000";
const OUT_DIR = path.join(__dirname, "..", "public", "screenshots");
const EMAIL = "design.critique.qa@example.local";
const PASSWORD = "Critique#2026!";

// 16:10 aspect ratio to match the carousel's browser-chrome mockup frame.
const VIEWPORT = { width: 1280, height: 800 };

const PAGES = [
  { path: "/dashboard", name: "dashboard" },
  { path: "/income", name: "income" },
  { path: "/expenses", name: "expenses" },
  { path: "/goals", name: "goals" },
];

async function setLang(page, lang) {
  await page.evaluate((l) => {
    document.cookie = `vaulty_language=${l}; path=/`;
    window.localStorage.setItem("vaulty_language", l);
  }, lang);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(400);
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  await page.waitForTimeout(600);

  for (const lang of ["en", "it"]) {
    await setLang(page, lang);
    for (const { path: p, name } of PAGES) {
      await page.goto(`${BASE}${p}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(500); // settle entrance motion
      const out = path.join(OUT_DIR, `${name}_${lang}.png`);
      await page.screenshot({ path: out, fullPage: false });
      console.log("captured", out);
    }
  }

  await browser.close();
  console.log("done");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
