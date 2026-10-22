// Prints the built /resume page to the downloadable PDF. Run via `npm run resume` (builds first).
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const chrome =
  process.env.CHROME ??
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].find(existsSync);
if (!chrome) throw new Error("Chrome not found; set CHROME=/path/to/chrome");

const out = resolve("public/Christy-Montejo-Resume.pdf");
execFileSync(
  chrome,
  [
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    // Ubuntu 24.04 runners block Chrome's sandbox.
    ...(process.env.CI ? ["--no-sandbox"] : []),
    `--print-to-pdf=${out}`,
    pathToFileURL(resolve("dist/resume/index.html")).href,
  ],
  { stdio: "inherit" },
);
console.log(`Wrote ${out}`);
