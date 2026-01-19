const express = require("express");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3030;

const ROOT_DIR = __dirname;
const BASIC_DIR = path.join(ROOT_DIR, "basic-samples");
const ADVANCED_DIR = path.join(ROOT_DIR, "advanced-samples");

app.use(express.static(ROOT_DIR));

function extractMeta(html, metaName) {
  const re = new RegExp(
    `<meta\\s+[^>]*name\\s*=\\s*["']${metaName}["'][^>]*content\\s*=\\s*["']([^"']+)["'][^>]*>`,
    "i"
  );
  const m = html.match(re);
  return m ? m[1].trim() : "";
}

function listHtmlFiles(dirAbs) {
  const out = [];
  if (!fs.existsSync(dirAbs)) return out;

  const walk = (current) => {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile() && e.name.toLowerCase().endsWith(".html")) out.push(full);
    }
  };

  walk(dirAbs);
  return out;
}

function toWebPath(fileAbs) {
  return "/" + path.relative(ROOT_DIR, fileAbs).replace(/\\/g, "/");
}

function collectExamples(dirAbs, group) {
  return listHtmlFiles(dirAbs)
    .filter((fileAbs) => toWebPath(fileAbs) !== "/index.html")
    .map((fileAbs) => {
      const html = fs.readFileSync(fileAbs, "utf8");
      const name =
        extractMeta(html, "example-title") ||
        (html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || "Untitled example");
      const description = extractMeta(html, "example-description") || "";
      const metaGroup = extractMeta(html, "example-group");

      const sourceFile = toWebPath(fileAbs);

      return {
        name,
        description,
        group: (metaGroup || group).toLowerCase(),
        sourceFile, // original file
        file: `/example?file=${encodeURIComponent(sourceFile)}` // served via injector
      };
    });
}

app.get("/api/examples", (req, res) => {
  try {
    const all = [
      ...collectExamples(BASIC_DIR, "basic"),
      ...collectExamples(ADVANCED_DIR, "advanced"),
    ].sort((a, b) => (a.group + a.name).localeCompare(b.group + b.name));

    res.json(all);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to build examples list" });
  }
});

// IMPORTANT: this endpoint injects PORTAL_SRC into HTML before browser loads api.js
app.get("/example", (req, res) => {
  try {
    const fileParam = req.query.file;
    if (!fileParam) return res.status(400).send("Missing file parameter");

    const rel = String(fileParam).replace(/^\/+/, "");
    const abs = path.join(ROOT_DIR, rel);
    const resolved = path.resolve(abs);

    if (!resolved.startsWith(path.resolve(ROOT_DIR))) {
      return res.status(400).send("Invalid file path");
    }
    if (!fs.existsSync(resolved)) return res.status(404).send("Example file not found");

    const portalSrc = String(req.query.portalSrc || process.env.PORTAL_SRC || "").trim();
    if (!portalSrc) return res.status(400).send("PORTAL_SRC is not set");

    let html = fs.readFileSync(resolved, "utf8");
    html = html.replace(/\{PORTAL_SRC\}/g, portalSrc.replace(/\/+$/, ""));

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to render example");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("PORTAL_SRC:", process.env.PORTAL_SRC || "(empty)");
});
