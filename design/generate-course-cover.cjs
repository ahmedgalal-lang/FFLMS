#!/usr/bin/env node
/**
 * Renders a course cover image (1600x900, matches the aspect-video card in
 * CourseCard) from design/course-cover-template.html, using the ForeFront
 * brand palette (Midnight Blue / Supernova Orange / Dark Navy).
 *
 * Usage:
 *   node design/generate-course-cover.cjs "Intro to Consulting" [output-slug] [icon]
 *
 * [icon] picks the large watermark glyph on the orange panel — one of the
 * ICONS keys below (default "graduation-cap"). Pick whichever best matches
 * the course topic; add more entries to ICONS as new topics come up (path
 * data lifted straight from lucide-react's icon set for visual consistency
 * with the rest of the app's iconography).
 *
 * Writes to public/course-covers/<slug>.png. Serve at
 * /course-covers/<slug>.png and set it as the course's cover image URL
 * (must be an absolute https:// URL when saved via the course settings form).
 *
 * Uses the same PW_CHROMIUM_PATH override as playwright.config.ts.
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

// Raw inner-SVG markup per icon, lifted from lucide-react's icon set (24x24
// viewBox, matching the app's iconography) so any element type — path,
// circle, polyline — is supported as-is.
const ICONS = {
  "graduation-cap": `
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
    <path d="M22 10v6"/>
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>`,
  trophy: `
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>`,
  handshake: `
    <path d="m11 17 2 2a1 1 0 1 0 3-3"/>
    <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/>
    <path d="m21 3 1 11h-2"/>
    <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/>
    <path d="M3 4h8"/>`,
  target: `
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>`,
  "trending-up": `
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>`,
  scale: `
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
    <path d="M7 21h10"/>
    <path d="M12 3v18"/>
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>`,
};

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function main() {
  const title = process.argv[2];
  if (!title) {
    console.error('Usage: node design/generate-course-cover.cjs "Course Title" [slug] [icon]');
    console.error(`Icons: ${Object.keys(ICONS).join(", ")}`);
    process.exit(1);
  }
  const slug = process.argv[3] || slugify(title);
  const icon = process.argv[4] || "graduation-cap";
  if (!ICONS[icon]) {
    console.error(`Unknown icon "${icon}". Options: ${Object.keys(ICONS).join(", ")}`);
    process.exit(1);
  }

  const templatePath = path.join(__dirname, "course-cover-template.html");
  const template = fs.readFileSync(templatePath, "utf8");
  const html = template
    .replace("{{TITLE}}", escapeHtml(title))
    .replace("{{ICON_PATHS}}", ICONS[icon]);

  const tmpHtml = path.join(__dirname, `.tmp-${slug}.html`);
  fs.writeFileSync(tmpHtml, html);

  const outDir = path.join(__dirname, "..", "public", "course-covers");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${slug}.png`);

  const browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto("file://" + tmpHtml);
  await page.screenshot({ path: outPath });
  await browser.close();
  fs.unlinkSync(tmpHtml);

  console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
  console.log(`Serve at: /course-covers/${slug}.png`);
}

main();
