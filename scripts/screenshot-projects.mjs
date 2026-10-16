// Captures each project's live site into public/projects/<url>.jpg for the project cards.
// Run: npm i --no-save playwright && npx playwright install chromium && node scripts/screenshot-projects.mjs
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

// ponytail: URLs are scraped from the projects array in HomePage.tsx so there's one source of truth.
const source = readFileSync(new URL("../src/components/HomePage.tsx", import.meta.url), "utf8");
const projectsBlock = source.slice(source.indexOf("export const projects"));
const urls = [...projectsBlock.matchAll(/url:\s*"([^"]+)"/g)].map((m) => m[1]);

const outDir = new URL("../public/projects/", import.meta.url);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
let failed = 0;

for (const url of urls) {
  try {
    await page.goto(`https://${url}`, { waitUntil: "networkidle", timeout: 45_000 });
    await page.waitForTimeout(5000); // let entrance animations settle
    await page.screenshot({ path: fileURLToPath(new URL(`${url}.jpg`, outDir)), type: "jpeg", quality: 75 });
    console.log(`ok   ${url}`);
  } catch (err) {
    failed++;
    console.error(`fail ${url}: ${err.message}`); // keep the previous screenshot
  }
}

await browser.close();
if (failed === urls.length) process.exit(1);
