// import-vragen.js  (CommonJS)
// Install: npm i axios csv-parse

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { parse } = require("csv-parse/sync");

/** ====== PAS HIER AAN ====== */
const STRAPI_URL = "https://usable-gem-b6d579597b.strapiapp.com"; // jouw Strapi Cloud URL
const STRAPI_TOKEN = "d93616f745160047a4899c0f7baa6de61fc74efc843c7c7d024f211d1eff680db8e4337218d210e7807f652273de2ea200aeaa8c63fba6733a5a21202569420797c3a053d39785124cc98c85cb5161a51f11cd201095b733a7c1a7bdb863dc8eb77eccc98f7277c3dc545da95e876241ef9e63a1eae9833c8d4b7e0cda0db77a"; // Cloud Admin → Settings → API Tokens
const CSV_PATH = "./vragen.csv";                        // pad naar jouw CSV
let   DRY_RUN = true;                                   // --write om echt te schrijven
const CONTENT_TYPE_API_ID = "questions";                // /api/<dit-pad> (controleer in Content-type Builder)
const REQUIRE_STATUS_1 = true;                          // filter status==1
const LOCALE = "nl";                                    // i18n locale (Nederlands)
/** ============================================ */

// Questions-velden
const SLUG_FIELD = "slug";
const QUESTION_FIELD = "question";
const ANSWERS_FIELD = "answers";              // repeatable component
const DIFFICULTY_FIELD = "difficulty";        // enum: A..F
const YEAR_FIELD = "year";                    // integer
const EXPLANATION_FIELD = "explanation";     // tekstveld op Questions
const USER_REL_FIELD = "users_permissions_user";
const USER_REL_ID = 1;

// Answers component
const ANSWER_COMPONENT_TEXT_FIELD = "text";
const ANSWER_COMPONENT_CORRECT_FIELD = "isCorrect";

// THEMES-relatie (MANY-TO-MANY)
const THEMES_REL_FIELD = "themes";            // veld op Questions (M2M)
const THEMES_LOOKUP_FIELD = "name";           // op Theme zoeken op 'name'
const THEMES_ALLOW_MULTIPLE = true;           // M2M = true
const THEMES_SPLIT_REGEX = /[,|;]+/;          // "Sport, Muziek" → ["Sport","Muziek"]

/** ========================================= */

// CLI: --id=1000  (enkel die rij)  |  --write  (DRY_RUN=false)
const argId = process.argv.find(a => a.startsWith("--id="))?.split("=")[1];
if (process.argv.includes("--write")) DRY_RUN = false;
const ONLY_ID = argId ? String(argId).trim() : "";

/** =========== Helpers =========== */
const api = axios.create({
  baseURL: `${STRAPI_URL.replace(/\/$/, "")}/api`,
  headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
  timeout: 30000,
});

function toStr(v) { return v == null ? "" : String(v).trim(); }
function numOrNull(v) { const s = toStr(v); if (!s) return null; const n = Number(s); return Number.isFinite(n) ? n : null; }
function buildSlugFromId(id) {
  return String(id).toLowerCase().replace(/[^a-z0-9\-_.~]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}
function mapDifficulty(v) {
  const raw = toStr(v).toUpperCase();
  const ALLOWED = new Set(["A","B","C","D","E","F"]);
  const numMap = { "1":"A","2":"B","3":"C","4":"D","5":"E","6":"F" };
  const val = numMap[raw] || raw;
  return ALLOWED.has(val) ? val : undefined; // undefined = overslaan
}
function logAxiosError(ctx, err) {
  const r = err.response;
  if (r) {
    const method = r.config?.method?.toUpperCase();
    const url = `${r.config?.baseURL || ""}${r.config?.url || ""}`;
    console.error(`❌ ${ctx}: HTTP ${r.status} ${r.statusText} — ${method} ${url}`);
    try { console.error("↳ body:", JSON.stringify(r.data, null, 2)); } catch {}
  } else {
    console.error(`❌ ${ctx}:`, err?.message || err);
  }
}

// POST met fallback: eerst body {locale}, bij 404 extra proberen met ?locale=...
async function postWithLocaleFallback(path, payload, locale) {
  try {
    return await api.post(path, { data: payload });
  } catch (e) {
    if (e?.response?.status !== 404) throw e;
    const sep = path.includes("?") ? "&" : "?";
    const url = `${path}${sep}locale=${encodeURIComponent(locale)}`;
    return await api.post(url, { data: payload });
  }
}

/** ===== Preflights ===== */
let THEME_API_PATH = "/themes"; // wordt automatisch gedetecteerd

async function preflightQuestions() {
  await api.get(`/${CONTENT_TYPE_API_ID}`, { params: { "pagination[pageSize]": 1, locale: LOCALE } });
  console.log(`✅ Questions OK: "/${CONTENT_TYPE_API_ID}" (locale=${LOCALE})`);
}

async function preflightThemePath() {
  // probeer eerst /themes, anders /theme
  try {
    await api.get(`/themes`, { params: { "pagination[pageSize]": 1 } });
    THEME_API_PATH = "/themes";
  } catch {
    await api.get(`/theme`, { params: { "pagination[pageSize]": 1 } });
    THEME_API_PATH = "/theme";
  }
  console.log(`✅ Theme pad gedetecteerd: "${THEME_API_PATH}"`);
}

/** ===== CRUD ===== */
async function findBySlug(slug) {
  const res = await api.get(`/${CONTENT_TYPE_API_ID}`, {
    params: {
      [`filters[${SLUG_FIELD}][$eq]`]: slug,
      "pagination[pageSize]": 1,
      locale: LOCALE,
      "fields[0]": "documentId", // (id komt standaard mee)
    },
  });
  const item = res?.data?.data?.[0];
  return item ? { id: item.id, documentId: item.documentId } : null;
}

async function createItem(payload) {
  try {
    const res = await postWithLocaleFallback(`/${CONTENT_TYPE_API_ID}`, payload, LOCALE);
    return res.data?.data?.id;
  } catch (err) {
    logAxiosError("create", err);
    throw err;
  }
}

// In v5: PUT naar /:documentId?locale=... werkt op de juiste vertaling
async function updateOrLocalizeItem(documentId, payload) {
  try {
    const res = await api.put(`/${CONTENT_TYPE_API_ID}/${documentId}?locale=${encodeURIComponent(LOCALE)}`, { data: payload });
    return { id: res.data?.data?.id, localized: false };
  } catch (err) {
    logAxiosError(`update ${documentId}`, err);
    throw err;
  }
}

/** ===== CSV ===== */
function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return parse(raw, { columns: true, skip_empty_lines: true, relax_column_count: true, delimiter: [",",";","\t"], bom: true, trim: true });
}

/** ===== Themes lookup op 'name' (M2M → documentId) ===== */
const themeCache = new Map(); // key = lowercased name → documentId

async function fetchThemeIdsByNames(names) {
  const unique = [...new Set((names || []).map(s => (s || "").trim()).filter(Boolean))];
  const ids = []; // dit worden documentIds

  for (const raw of unique) {
    const key = raw.toLowerCase();
    if (themeCache.has(key)) { ids.push(themeCache.get(key)); continue; }

    // NL + draft visible
    let params = {
      "filters[name][$eqi]": raw,
      "pagination[pageSize]": 1,
      "publicationState": "preview",
      "locale": "nl",
      "fields[0]": "name",
    };
    let res = await api.get(THEME_API_PATH, { params }).catch(() => null);
    let item = res?.data?.data?.[0];

    // fallback: zonder locale
    if (!item) {
      params = {
        "filters[name][$eqi]": raw,
        "pagination[pageSize]": 1,
        "publicationState": "preview",
        "fields[0]": "name",
      };
      res = await api.get(THEME_API_PATH, { params }).catch(() => null);
      item = res?.data?.data?.[0];
    }

    // laatste fallback: containsi (NL → no-locale)
    if (!item) {
      for (const p of [
        { "filters[name][$containsi]": raw, locale: "nl" },
        { "filters[name][$containsi]": raw },
      ]) {
        res = await api.get(THEME_API_PATH, { params: { ...p, "publicationState": "preview", "pagination[pageSize]": 1, "fields[0]": "name" } }).catch(() => null);
        item = res?.data?.data?.[0];
        if (item) break;
      }
    }

    if (item?.documentId) {
      themeCache.set(key, item.documentId);   // ⬅️ cache de DOCUMENT ID
      ids.push(item.documentId);
      console.log(`🧭 theme match: "${raw}" → documentId=${item.documentId}`);
    } else {
      console.warn(`⚠️  Theme niet gevonden (name="${raw}") — relatie wordt overgeslagen`);
    }
  }
  return ids; // lijst van documentIds
}

/** =========== Main =========== */
(function main() {
  (async () => {
    try {
      await preflightQuestions();
      await preflightThemePath();
    } catch (e) {
      logAxiosError("preflight", e);
      process.exit(1);
    }

    const csvAbs = path.resolve(CSV_PATH);
    if (!fs.existsSync(csvAbs)) { console.error(`⚠️  CSV niet gevonden: ${csvAbs}`); process.exit(1); }

    const rows = readCsv(csvAbs);
    const norm = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]));

    const items = [];
    for (const r0 of rows) {
      const r = norm(r0);

      const idRaw = r.id ?? r["vraagid"] ?? r["qid"] ?? r["ref"] ?? r["ID"] ?? r["Id"];
      const id = toStr(idRaw);
      if (!id) continue;

      if (ONLY_ID && id !== ONLY_ID) continue;
      if (REQUIRE_STATUS_1 && Number(r.status) !== 1) continue;

      const vraag = toStr(r.vraag ?? r["question"] ?? r["titel"]);
      const antwoord1 = toStr(r.antwoord ?? r["antwoord 1"] ?? r["answer"]);
      const antwoord2 = toStr(r.antwoord2 ?? r["antwoord 2"] ?? r["answer2"]);
      const difficulty = mapDifficulty(r.difficulty ?? r["niveau"] ?? r["level"]);
      const year = numOrNull(r.year);
      const extraInfo = toStr(r.extra_info ?? r["extra info"] ?? r.extrainfo ?? r.explanation ?? "");

      // EXTRA: verkeerde opties uit keuze1..keuze4
      const keuze1 = toStr(r.keuze1 ?? r["keuze 1"] ?? r.choice1 ?? "");
      const keuze2 = toStr(r.keuze2 ?? r["keuze 2"] ?? r.choice2 ?? "");
      const keuze3 = toStr(r.keuze3 ?? r["keuze 3"] ?? r.choice3 ?? "");
      const keuze4 = toStr(r.keuze4 ?? r["keuze 4"] ?? r.choice4 ?? "");
      const wrongChoices = [keuze1, keuze2, keuze3, keuze4].filter(Boolean);

      // answers component – voeg correcten toe, daarna unieke foute keuzes (niet gelijk aan correcte)
      const normText = (s) => s.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
      const seen = new Set();
      const answers = [];

      // correcte antwoorden
      for (const t of [antwoord1, antwoord2].filter(Boolean)) {
        const n = normText(t);
        if (!seen.has(n)) {
          answers.push({ [ANSWER_COMPONENT_TEXT_FIELD]: t, [ANSWER_COMPONENT_CORRECT_FIELD]: true });
          seen.add(n);
        }
      }
      // foute keuzes
      for (const t of wrongChoices) {
        const n = normText(t);
        if (!n) continue;
        if (seen.has(n)) continue; // gelijk aan antwoord1/antwoord2 of duplicate
        answers.push({ [ANSWER_COMPONENT_TEXT_FIELD]: t, [ANSWER_COMPONENT_CORRECT_FIELD]: false });
        seen.add(n);
      }

      const slug = buildSlugFromId(id);

      items.push({ slug, vraag, answers, difficulty, year, themeNames: toStr(r.themes ?? r["thema"] ?? "", extraInfo)
        ? (THEMES_ALLOW_MULTIPLE ? toStr(r.themes ?? r["thema"]).split(THEMES_SPLIT_REGEX) : [toStr(r.themes ?? r["thema"])])
          .map(s => s.trim()).filter(Boolean)
        : [] });
    }

    if (!items.length) {
      console.log(ONLY_ID
        ? `Geen match gevonden voor ID=${ONLY_ID} (en status==1).`
        : "Niets te importeren (geen rijen die voldoen aan de filters).");
      return;
    }

    console.log(`🔎 Te verwerken: ${items.length} rijen. DRY_RUN=${DRY_RUN} ${ONLY_ID ? `(filter: ID=${ONLY_ID})` : ""}`);
    console.log("Voorbeeld payload (indicatief):", {
      [SLUG_FIELD]: items[0].slug,
      [QUESTION_FIELD]: items[0].vraag,
      [ANSWERS_FIELD]: items[0].answers,
      [DIFFICULTY_FIELD]: items[0].difficulty,
      [YEAR_FIELD]: items[0].year,
      [USER_REL_FIELD]: USER_REL_ID,
      [THEMES_REL_FIELD]: items[0].themeNames,
      locale: LOCALE,
    });

    let created = 0, updated = 0, skipped = 0;

    for (const it of items) {
      if (!it.vraag) { skipped++; console.log(`⏭️  skip (lege question) slug=${it.slug}`); continue; }

      // resolve Theme IDs (M2M → documentIds)
      const themeIds = await fetchThemeIdsByNames(it.themeNames);

      // payload
      const payload = {
        [SLUG_FIELD]: it.slug,
        [QUESTION_FIELD]: it.vraag,
        [ANSWERS_FIELD]: it.answers,
        locale: LOCALE,
        [USER_REL_FIELD]: USER_REL_ID,
      };
      if (it.year != null) payload[YEAR_FIELD] = it.year;
      if (it.difficulty !== undefined) payload[DIFFICULTY_FIELD] = it.difficulty;
      if (themeIds.length) {
        payload[THEMES_REL_FIELD] = { set: themeIds }; // documentIds
      }
      if (it.extraInfo) payload[EXPLANATION_FIELD] = it.extraInfo;

      if (DRY_RUN) { console.log(`📝 zou upserten: ${it.slug}`, payload); continue; }

      try {
        const existing = await findBySlug(it.slug);
        if (existing) {
          const { id: updId } = await updateOrLocalizeItem(existing.documentId, payload);
          updated++;
          console.log(`♻️  updated: ${it.slug} (id=${updId}, locale=${LOCALE})`);
        } else {
          const newId = await createItem(payload);
          created++;
          console.log(`✅ created: ${it.slug} (id=${newId}, locale=${LOCALE})`);
        }
      } catch {
        // al gelogd
      }
    }

    if (!DRY_RUN) console.log(`\nKlaar. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    else          console.log(`\nDRY RUN klaar. Items bekeken: ${items.length}, Skipped: ${skipped}`);
  })().catch((e) => { console.error("Onverwachte fout:", e); process.exit(1); });
})();