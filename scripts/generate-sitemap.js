// scripts/generate-sitemap.js
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://stockpulse-mu-three.vercel.app";
const today = new Date().toISOString().split("T")[0];

const staticPages = [
  { url: "/", priority: "1.0", changefreq: "daily" },
  { url: "/markets", priority: "0.9", changefreq: "hourly" },
  { url: "/disclaimer", priority: "0.5", changefreq: "monthly" },
  { url: "/terms", priority: "0.5", changefreq: "monthly" },
  { url: "/privacy", priority: "0.5", changefreq: "monthly" },
];

let stockSymbols = [];
try {
  const stocksPath = path.join(__dirname, "../server/data/stocks.json");
  if (fs.existsSync(stocksPath)) {
    const raw = JSON.parse(fs.readFileSync(stocksPath, "utf-8"));
    stockSymbols = raw
      .map((s) => s.symbol.replace(".NS", "").replace(".BO", "").toUpperCase())
      .filter(Boolean);
  }
} catch (err) {
  console.warn("Could not read stocks.json:", err.message);
}

const uniqueSymbols = [...new Set(stockSymbols)];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

// Static Pages
for (const page of staticPages) {
  xml += `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
}

// Stock Pages
for (const sym of uniqueSymbols) {
  xml += `  <url>
    <loc>${BASE_URL}/stock/${encodeURIComponent(sym)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;
}

xml += `</urlset>
`;

const outputPath = path.join(__dirname, "../client/public/sitemap.xml");
fs.writeFileSync(outputPath, xml, "utf-8");
console.log(`Successfully generated sitemap with ${staticPages.length + uniqueSymbols.length} URLs at: ${outputPath}`);
