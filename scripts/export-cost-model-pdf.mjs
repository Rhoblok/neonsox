import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "docs");
const htmlPath = path.join(outDir, "NEONSOX-cost-model.html");
const pdfPath = path.join(outDir, "NEONSOX-cost-model.pdf");

const SUBSCRIBERS = [100, 1_000, 5_000, 10_000, 100_000];
const COL_COUNT = SUBSCRIBERS.length + 1;

const MODEL = {
  membershipPrice: 9.99,
  avgCampaignPrice: 149,
  campaignsPerSubscriber: 0.35,
  gensPerCampaign: 3.5,
  costPerGeneration: 1.35,
  postsPerCampaign: 100,
  xPostShare: 0.25,
  xCostPerPost: 0.18,
  unifiedCostPer1kPosts: 8.5,
  unifiedPostShare: 0.75,
  redditMonthly: 1_000,
  stripeRate: 0.029,
  stripeFixedPerCharge: 0.3,
};

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n).toLocaleString("en-US")}`;
  return `$${Math.round(n)}`;
}

function effectiveCampaigns(s) {
  return s * MODEL.campaignsPerSubscriber;
}

function subscriptionRevenue(s) {
  return s * MODEL.membershipPrice;
}

function campaignRevenue(s) {
  return effectiveCampaigns(s) * MODEL.avgCampaignPrice;
}

function totalRevenue(s) {
  return subscriptionRevenue(s) + campaignRevenue(s);
}

function runwayElevenLabs(s) {
  return effectiveCampaigns(s) * MODEL.gensPerCampaign * MODEL.costPerGeneration;
}

function elevenLabsPlan(s) {
  if (s <= 100) return 22;
  if (s <= 5_000) return 99;
  if (s <= 10_000) return 299;
  return 990;
}

function supabase(s) {
  return s >= 10_000 ? 599 : 25;
}

function storage(s) {
  if (s <= 100) return 5;
  if (s <= 1_000) return 15;
  if (s <= 5_000) return 55;
  if (s <= 10_000) return 86;
  return 500;
}

function compute(s) {
  if (s <= 100) return 15;
  if (s <= 1_000) return 40;
  if (s <= 5_000) return 110;
  if (s <= 10_000) return 210;
  return 960;
}

function vercel(s) {
  if (s <= 5_000) return 20;
  if (s <= 10_000) return 50;
  return 200;
}

function authMau(s) {
  return s >= 100_000 ? 65 : 0;
}

function egress(s) {
  if (s <= 100) return 0;
  if (s <= 1_000) return 5;
  if (s <= 5_000) return 15;
  if (s <= 10_000) return 35;
  return 185;
}

function infraSubtotal(s) {
  return supabase(s) + storage(s) + compute(s) + vercel(s) + authMau(s) + egress(s);
}

function totalPosts(s) {
  return effectiveCampaigns(s) * MODEL.postsPerCampaign;
}

function xApi(s) {
  return totalPosts(s) * MODEL.xPostShare * MODEL.xCostPerPost;
}

function unifiedSocial(s) {
  return totalPosts(s) * MODEL.unifiedPostShare * (MODEL.unifiedCostPer1kPosts / 1000);
}

function stripeFees(s) {
  const rev = totalRevenue(s);
  return rev * MODEL.stripeRate + (s + effectiveCampaigns(s)) * MODEL.stripeFixedPerCharge;
}

function totalCost(s) {
  return (
    infraSubtotal(s) +
    elevenLabsPlan(s) +
    runwayElevenLabs(s) +
    MODEL.redditMonthly +
    xApi(s) +
    unifiedSocial(s) +
    stripeFees(s)
  );
}

function profit(s) {
  return totalRevenue(s) - totalCost(s);
}

function margin(s) {
  const rev = totalRevenue(s);
  return rev ? `${((profit(s) / rev) * 100).toFixed(1)}%` : "—";
}

function sectionHeader(label) {
  return `<tr class="section"><td colspan="${COL_COUNT}">${label}</td></tr>`;
}

function row(label, fn, bold = false) {
  const cls = bold ? ' class="total"' : "";
  const cells = SUBSCRIBERS.map((s) => `<td>${typeof fn === "function" ? fmt(fn(s)) : fmt(fn)}</td>`).join("");
  return `<tr${cls}><td>${label}</td>${cells}</tr>`;
}

function rowText(label, fn, bold = false) {
  const cls = bold ? ' class="total"' : "";
  const cells = SUBSCRIBERS.map((s) => `<td>${fn(s)}</td>`).join("");
  return `<tr${cls}><td>${label}</td>${cells}</tr>`;
}

function barChartSvg(items, { width = 680, height = 220, title = "" } = {}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const padL = 120;
  const padR = 24;
  const padT = title ? 28 : 12;
  const padB = 16;
  const chartW = width - padL - padR;
  const barH = Math.min(22, (height - padT - padB) / items.length - 6);
  const gap = 6;
  const colors = ["#2563eb", "#059669", "#7c3aed", "#ea580c", "#0891b2", "#ca8a04", "#db2777"];

  const bars = items
    .map((item, i) => {
      const y = padT + i * (barH + gap);
      const w = Math.max(2, (item.value / max) * chartW);
      const color = colors[i % colors.length];
      return `
        <text x="${padL - 8}" y="${y + barH * 0.72}" text-anchor="end" font-size="11" fill="#333">${item.label}</text>
        <rect x="${padL}" y="${y}" width="${w}" height="${barH}" fill="${color}" rx="3"/>
        <text x="${padL + w + 6}" y="${y + barH * 0.72}" font-size="10" fill="#555">${fmt(item.value)}</text>`;
    })
    .join("");

  const titleEl = title ? `<text x="${width / 2}" y="18" text-anchor="middle" font-size="13" font-weight="600" fill="#111">${title}</text>` : "";

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="${title}">${titleEl}${bars}</svg>`;
}

function groupedBarChartSvg(categories, series, { width = 680, height = 260, title = "" } = {}) {
  const max = Math.max(...series.flatMap((s) => s.values), 1);
  const padL = 48;
  const padR = 16;
  const padT = title ? 32 : 16;
  const padB = 52;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const groupW = chartW / categories.length;
  const barW = Math.min(28, (groupW - 12) / series.length);
  const colors = ["#2563eb", "#059669"];

  let bars = "";
  categories.forEach((cat, gi) => {
    const gx = padL + gi * groupW + groupW / 2;
    series.forEach((s, si) => {
      const v = s.values[gi];
      const h = (v / max) * chartH;
      const x = gx - (series.length * barW) / 2 + si * barW;
      const y = padT + chartH - h;
      bars += `<rect x="${x}" y="${y}" width="${barW - 4}" height="${h}" fill="${colors[si]}" rx="2"/>`;
    });
    bars += `<text x="${gx}" y="${height - 18}" text-anchor="middle" font-size="10" fill="#333">${cat}</text>`;
  });

  const legend = series
    .map(
      (s, i) =>
        `<rect x="${padL + i * 140}" y="8" width="10" height="10" fill="${colors[i]}"/><text x="${padL + 16 + i * 140}" y="17" font-size="10" fill="#333">${s.name}</text>`
    )
    .join("");

  const titleEl = title ? `<text x="${width / 2}" y="22" text-anchor="middle" font-size="13" font-weight="600" fill="#111">${title}</text>` : "";

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img">${titleEl}${legend}${bars}</svg>`;
}

const s10k = 10_000;
const costMix10k = [
  { label: "Stripe", value: stripeFees(s10k) },
  { label: "Runway+EL", value: runwayElevenLabs(s10k) },
  { label: "X API", value: xApi(s10k) },
  { label: "Social", value: unifiedSocial(s10k) },
  { label: "Reddit", value: MODEL.redditMonthly },
  { label: "Infra", value: infraSubtotal(s10k) },
  { label: "EL plan", value: elevenLabsPlan(s10k) },
].sort((a, b) => b.value - a.value);

const scaleLabels = ["100", "1K", "5K", "10K", "100K"];

const masterRows = [
  sectionHeader("COSTS"),
  row("Infrastructure (Supabase, storage, compute, Vercel)", infraSubtotal),
  row("ElevenLabs plan (fixed tier)", elevenLabsPlan),
  row("Runway + ElevenLabs API (variable)", runwayElevenLabs),
  row("Reddit commercial API", () => MODEL.redditMonthly),
  row("X API (pay-per-use)", xApi),
  row("Social API — unified (Bluesky, TG, Discord, TikTok)", unifiedSocial),
  row("Stripe fees (2.9% + $0.30/charge)", stripeFees),
  row("Σ ALL COSTS", totalCost, true),
  sectionHeader("REVENUE"),
  row(`Subscription ($${MODEL.membershipPrice}/mo × subscribers)`, subscriptionRevenue),
  row(`Campaign ($${MODEL.avgCampaignPrice} × ${MODEL.campaignsPerSubscriber} per sub)`, campaignRevenue),
  row("Σ ALL REVENUE", totalRevenue, true),
  sectionHeader("SUMMARY"),
  row("PROFIT (revenue − costs)", profit, true),
  rowText("MARGIN", margin, true),
  rowText("Effective campaigns / mo", (s) => effectiveCampaigns(s).toFixed(0)),
  rowText("Revenue per subscriber / mo", (s) => `$${(totalRevenue(s) / s).toFixed(2)}`),
  rowText("Cost per subscriber / mo", (s) => `$${(totalCost(s) / s).toFixed(2)}`),
].join("\n");

const infraRows = [
  row("Supabase", supabase),
  row("Storage", storage),
  row("Compute (backend + ffmpeg)", compute),
  row("Vercel", vercel),
  row("Auth MAU overage", authMau),
  row("Egress", egress),
  row("Infra subtotal", infraSubtotal, true),
].join("\n");

const unitRows = [
  ["Subscription revenue / sub / mo", `$${MODEL.membershipPrice}`],
  ["Campaign revenue / sub / mo", `$${(campaignRevenue(s10k) / s10k).toFixed(2)}`],
  ["Total revenue / sub / mo", `$${(totalRevenue(s10k) / s10k).toFixed(2)}`],
  ["Total cost / sub / mo", `$${(totalCost(s10k) / s10k).toFixed(2)}`],
  ["Profit / sub / mo", `$${(profit(s10k) / s10k).toFixed(2)}`],
  ["Video generation API cost", `$${MODEL.costPerGeneration} per gen`],
  ["Campaigns per sub (assumed)", `${MODEL.campaignsPerSubscriber}/mo`],
]
  .map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`)
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>NEONSOX Launch Cost Model</title>
  <style>
    @page { size: landscape; margin: 12mm; }
    body { font-family: Segoe UI, Arial, sans-serif; color: #111; font-size: 11px; line-height: 1.45; margin: 0; padding: 16px 20px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    h2 { font-size: 14px; margin: 24px 0 10px; page-break-after: avoid; }
    .sub { color: #444; margin-bottom: 14px; }
    .assumptions, .note { background: #f4f6f8; border: 1px solid #d0d7de; padding: 10px 12px; margin-bottom: 14px; border-radius: 6px; }
    .note-warn { background: #fff8e6; border-color: #e6c200; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .chart-box { border: 1px solid #d0d7de; border-radius: 6px; padding: 10px; background: #fff; page-break-inside: avoid; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; page-break-inside: avoid; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: right; }
    th:first-child, td:first-child { text-align: left; }
    th { background: #1a2332; color: #fff; font-weight: 600; }
    tr:nth-child(even):not(.section):not(.total) td { background: #fafafa; }
    tr.section td { background: #1a2332; color: #fff; font-weight: 700; text-align: left; padding: 7px 10px; }
    tr.total td { background: #dbeafe; font-weight: 700; }
    .footer { color: #666; font-size: 10px; margin-top: 16px; }
    ul { margin: 6px 0 0 18px; padding: 0; }
    li { margin-bottom: 4px; }
  </style>
</head>
<body>
  <h1>NEONSOX — Launch Cost Model</h1>
  <p class="sub">Subscribers per month (columns) · Option B: Runway + ElevenLabs + social · Generated ${new Date().toLocaleDateString("en-US")}</p>

  <div class="assumptions">
    <strong>Assumptions:</strong>
    Membership $${MODEL.membershipPrice}/mo per subscriber ·
    ${MODEL.campaignsPerSubscriber} campaigns per subscriber per month (~1 every 3 mo) × $${MODEL.avgCampaignPrice} avg campaign ·
    ${MODEL.gensPerCampaign} video gens per campaign · $${MODEL.costPerGeneration}/gen ·
    Reddit $${MODEL.redditMonthly}/mo commercial · Signal excluded.
  </div>

  <h2>Master spreadsheet</h2>
  <table>
    <thead>
      <tr>
        <th>Line item</th>
        <th>100 subs</th>
        <th>1K subs</th>
        <th>5K subs</th>
        <th>10K subs</th>
        <th>100K subs</th>
      </tr>
    </thead>
    <tbody>${masterRows}</tbody>
  </table>

  <h2>Charts</h2>
  <div class="grid-2">
    <div class="chart-box">
      ${barChartSvg(costMix10k, { title: "Cost mix at 10,000 subscribers", height: 210 })}
      <p style="margin:8px 0 0;font-size:10px;color:#555;">10K subs × ${MODEL.campaignsPerSubscriber} campaigns/sub = ${effectiveCampaigns(s10k).toFixed(0)} effective campaigns/mo</p>
    </div>
    <div class="chart-box">
      ${groupedBarChartSvg(
        scaleLabels,
        [
          { name: "Total revenue", values: SUBSCRIBERS.map(totalRevenue) },
          { name: "Total costs", values: SUBSCRIBERS.map(totalCost) },
        ],
        { title: "Revenue vs costs by subscriber tier" }
      )}
    </div>
  </div>
  <div class="chart-box" style="max-width:680px;">
    ${groupedBarChartSvg(scaleLabels, [{ name: "Monthly profit", values: SUBSCRIBERS.map(profit) }], {
      title: "Monthly profit by subscriber tier",
    })}
  </div>

  <h2>Infrastructure detail</h2>
  <table>
    <thead>
      <tr>
        <th>Line item</th>
        <th>100 subs</th>
        <th>1K subs</th>
        <th>5K subs</th>
        <th>10K subs</th>
        <th>100K subs</th>
      </tr>
    </thead>
    <tbody>${infraRows}</tbody>
  </table>

  <h2>Per-subscriber unit economics (at 10K subs)</h2>
  <table style="max-width:480px;">
    <thead><tr><th>Metric</th><th>Value</th></tr></thead>
    <tbody>${unitRows}</tbody>
  </table>

  <div class="note note-warn">
    <strong>Tune the model</strong>
    <ul>
      <li>Change <strong>campaigns per subscriber</strong> if attach rate differs (0.2 = 1 every 5 mo · 0.5 = 1 every 2 mo).</li>
      <li>Reddit $1K/mo flat hurts at 100 subs — delay commercial Reddit until ~500+ subscribers.</li>
      <li>Skip X in Phase 1 to cut social API ~25%. Signal has no posting API.</li>
    </ul>
  </div>

  <p class="footer">NEONSOX Platform · Internal planning document · API costs are estimates from public pricing Jul 2026</p>
</body>
</html>`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(htmlPath, html, "utf8");

const edgePaths = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];

const browser = edgePaths.find((p) => fs.existsSync(p));
if (!browser) {
  console.log("HTML written:", htmlPath);
  process.exit(0);
}

const fileUrl = "file:///" + htmlPath.replace(/\\/g, "/");
execFileSync(browser, ["--headless", "--disable-gpu", `--print-to-pdf=${pdfPath}`, fileUrl], {
  stdio: "inherit",
});

console.log("PDF exported:", pdfPath);
