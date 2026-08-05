#!/usr/bin/env node
/**
 * Renders a course cover image (1600x900, matches the aspect-video card in
 * CourseCard) from design/course-cover-template.html, using the ForeFront
 * brand palette (Midnight Blue / Supernova Orange / Dark Navy).
 *
 * Usage:
 *   node design/generate-course-cover.cjs "Intro to Consulting" [output-slug]
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
    console.error('Usage: node design/generate-course-cover.cjs "Course Title" [slug]');
    process.exit(1);
  }
  const slug = process.argv[3] || slugify(title);

  const templatePath = path.join(__dirname, "course-cover-template.html");
  const template = fs.readFileSync(templatePath, "utf8");
  const html = template.replace("{{TITLE}}", escapeHtml(title));

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
