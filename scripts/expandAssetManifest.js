#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const https = require("https");

const MANIFEST_PATH = path.join(__dirname, "..", "src", "assets", "manifest.json");
const COLLECTION_URL = "https://api.iconify.design/collection?prefix=mdi";
const SOURCE = "SVGRepo - Material Design Icons (via Iconify API)";
const LICENSE = "Apache 2.0";
const DEFAULT_LIMIT = 1544;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "shape-motion-lab-asset-expand/1.0" } }, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
          } catch (err) {
            reject(err);
          }
        });
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

function normalizeCategory(label) {
  return String(label || "")
    .toLowerCase()
    .replace(/\s*\/\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "uncategorized";
}

function pickNames(meta, limit) {
  const categoryByIcon = new Map();
  for (const [cat, names] of Object.entries(meta.categories || {})) {
    const norm = normalizeCategory(cat);
    for (const name of names) {
      if (!categoryByIcon.has(name)) categoryByIcon.set(name, norm);
    }
  }
  for (const name of meta.uncategorized || []) {
    if (!categoryByIcon.has(name)) categoryByIcon.set(name, "uncategorized");
  }
  const allNames = Array.from(categoryByIcon.keys()).sort((a, b) => a.localeCompare(b));
  const selected = allNames.slice(0, Math.max(0, limit));
  return selected.map((name) => ({
    id: `mdi-${name}`,
    url: `https://api.iconify.design/mdi/${name}.svg`,
    category: categoryByIcon.get(name) || "uncategorized",
    license: LICENSE,
    source: SOURCE,
  }));
}

async function main() {
  const requested = Number.parseInt(process.argv[2] || `${DEFAULT_LIMIT}`, 10);
  const limit = Number.isFinite(requested) && requested > 0 ? requested : DEFAULT_LIMIT;

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  const byId = new Map(manifest.map((entry) => [entry.id, entry]));

  const meta = await fetchJson(COLLECTION_URL);
  const additions = pickNames(meta, limit);

  let added = 0;
  let updated = 0;
  for (const entry of additions) {
    if (byId.has(entry.id)) {
      byId.set(entry.id, { ...byId.get(entry.id), ...entry });
      updated++;
    } else {
      byId.set(entry.id, entry);
      added++;
    }
  }

  const merged = Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(merged, null, 2) + "\n", "utf-8");

  console.log(`MDI expansion target: ${limit}`);
  console.log(`Manifest updated: +${added} new, ${updated} refreshed, total ${merged.length}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
