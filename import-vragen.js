// import-vragen.js — Strapi v5 Cloud (alleen slug + question)
// Install: npm i axios csv-parse
// Run:    node import-vragen.js [--id=8089] [--write]

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { parse } = require("csv-parse/sync");

/** ====== CONFIG ====== */
const STRAPI_URL   = "https://usable-gem-b6d579597b.strapiapp.com";
const STRAPI_TOKEN = "d93616f745160047a4899c0f7baa6de61fc74efc843c7c7d024f211d1eff680db8e4337218d210e7807f652273de2ea200aeaa8c63fba6733a5a21202569420797c3a053d39785124cc98c85cb5161a51f11cd201095b733a7c1a7bdb863dc8eb77eccc98f7277c3dc545da95e876241ef9e63a1eae9833c8d4b7e0cda0db77a";
const CSV_PATH     = "./vragen.csv";
let   DRY_RUN      = true;                 // --write = echt schrijven

// Content type + locale
const CONTENT_TYPE_API_ID = "questions";
const LOCALE = "nl";

// Filter: alleen status==1 importeren?
const REQUIRE_STATUS_1 = true;

/** ====== Veldnamen ====== */
const SLUG_FIELD     = "slug";
const QUESTION_FIELD = "question";

/** ===== CLI ===== */
const argId = process.argv.find(a => a.startsWith("--id="))?.split("=")[1];
if (process.argv.includes("--write")) DRY_RUN = false;
const ONLY_ID = argId ? String(argId).trim() : "";

/** ===== Helpers ===== */
const api = axios.create({
  baseURL: `${STRAPI_URL.replace(/\/$/, "")}/api`,
  headers: { Authorization: `Bearer ${STRAPI_TOKEN}`, "Content-Type": "application/json" },
  timeout: 30000,
});

const toStr = v => (v == null ? "" : String(v).trim());
const buildSlugFromId = id => String(id)
  .toLowerCase()
  .replace(/[^a-z0-9\-_.~]+/g, "-")
  .replace(/-+/g, "-")
  .replace(/^-+|-+$/g, "");

function logAxiosError(ctx, err, payload) {
  const r = err?.response;
  if (r) {
    const method = r.config?.method?.toUpperCase();
    const url = `${r.config?.baseURL || ""}${r.config?.url || ""}`;
    console.error(`❌ ${ctx}: HTTP ${r.status} ${r.statusText} — ${method} ${url}`);
    try { console.error("↳ body:", JSON.stringify(r.data, null, 2)); } catch {}
    if (payload) { try { console.error("↳ payload:", JSON.stringify(payload, null, 2)); } catch {} }
  } else {
    console.error(`❌ ${ctx}:`, err?.message || err);
  }
}

/** ===== Preflight ===== */
async function preflight() {
  await api.get(`/${CONTENT_TYPE_API_ID}`, { params: { "pagination[pageSize]": 1, locale: LOCALE } });
  console.log(`✅ Endpoint OK: "/${CONTENT_TYPE_API_ID}" (locale=${LOCALE})`);
}

/** ===== CRUD ===== */
async function findBySlug(slug) {
  const res = await api.get(`/${CONTENT_TYPE_API_ID}`, {
    params: {
      [`filters[${SLUG_FIELD}][$eq]`]: slug,
      "pagination[pageSize]": 1,
      locale: LOCALE,
      "fields[0]": "documentId",
    },
  });
  const it = res?.data?.data?.[0];
  return it ? { id: it.id, documentId: it.documentId } : null;
}

async function postCreateMinimal(slug, question) {
  const payload = { data: { [SLUG_FIELD]: slug, [QUESTION_FIELD]: question, locale: LOCALE } };
  console.log("➡️  POST payload:", JSON.stringify(payload, null, 2));
  const res = await api.post(`/${CONTENT_TYPE_API_ID}`, payload)
    .catch(err => { logAxiosError("create(minimal)", err, payload); throw err; });
  const d = res?.data?.data || {};
  return { id: d.id, documentId: d.documentId };
}

async function putUpdateMinimal(documentId, slug, question) {
  const payload = { data: { [SLUG_FIELD]: slug, [QUESTION_FIELD]: question } };
  const url = `/${CONTENT_TYPE_API_ID}/${documentId}?locale=${encodeURIComponent(LOCALE)}`;
  console.log("➡️  PUT payload:", JSON.stringify(payload, null, 2));
  const res = await api.put(url, payload)
    .catch(err => { logAxiosError(`update ${documentId}`, err, payload); throw err; });
  const d = res?.data?.data || {};
  return { id: d.id };
}

/** ===== CSV ===== */
function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return parse(raw, { columns: true, skip_empty_lines: true, relax_column_count: true, delimiter: [",",";","\t"], bom: true, trim: true });
}

/** ===== Main ===== */
(async () => {
  try { await preflight(); } catch (e) { logAxiosError("preflight", e); process.exit(1); }

  const csvAbs = path.resolve(CSV_PATH);
  if (!fs.existsSync(csvAbs)) { console.error(`⚠️  CSV niet gevonden: ${csvAbs}`); process.exit(1); }

  const rows = readCsv(csvAbs);
  const norm = obj => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]));

  const items = [];
  for (const r0 of rows) {
    const r = norm(r0);

    const idRaw = r.id ?? r["vraagid"] ?? r["qid"] ?? r["ref"] ?? r["id"] ?? r["Id"];
    const id = toStr(idRaw);
    if (!id) continue;

    if (ONLY_ID && id !== ONLY_ID) continue;
    if (REQUIRE_STATUS_1 && Number(r.status) !== 1) continue;

    const question = toStr(r.vraag ?? r["question"] ?? r["titel"]);
    if (!question) continue;

    const slug = buildSlugFromId(id);
    items.push({ slug, question });
  }

  if (!items.length) {
    console.log(ONLY_ID ? `Geen match voor ID=${ONLY_ID} (status==1).` : "Niets te importeren.");
    return;
  }

  console.log(`🔎 Te verwerken: ${items.length} rijen. DRY_RUN=${DRY_RUN} ${ONLY_ID ? `(filter: ID=${ONLY_ID})` : ""}`);
  console.log("Voorbeeld payload (indicatief):", {
    slug: items[0].slug,
    question: items[0].question,
    locale: LOCALE,
  });

  let created = 0, updated = 0, skipped = 0;

  for (const it of items) {
    try {
      if (DRY_RUN) { console.log(`📝 zou upserten: ${it.slug}`, { data: { slug: it.slug, question: it.question, locale: LOCALE } }); continue; }

      const existing = await findBySlug(it.slug);
      if (!existing) {
        await postCreateMinimal(it.slug, it.question);
        created++;
        console.log(`✅ created: ${it.slug} (locale=${LOCALE})`);
      } else {
        await putUpdateMinimal(existing.documentId, it.slug, it.question);
        updated++;
        console.log(`♻️  updated: ${it.slug} (doc=${existing.documentId}, locale=${LOCALE})`);
      }
    } catch {
      // fout al gelogd
    }
  }

  if (!DRY_RUN) console.log(`\nKlaar. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
  else          console.log(`\nDRY RUN klaar. Items bekeken: ${items.length}, Skipped: ${skipped}`);
})().catch((e) => { console.error("Onverwachte fout:", e); process.exit(1); });
