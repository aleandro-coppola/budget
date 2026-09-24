// Test della logica di calcolo contro i dati reali del DB Notion "Spese"
// (snapshot letto il 2026-09-25). Esegui con: npm test
import { computeBudget, defaultSettings, SpesaRow } from "../src/lib/budget";

const ALE = "27253915e41880c89c84f4adfa38de8d";
const CRIS = "27253915e41880d1b464d47b60f2ef99";

function r(name: string, spesa: number | null, tags: string[], accounts: string[]): SpesaRow {
  return { name, spesa: spesa ?? 0, tags, accounts };
}

const rows: SpesaRow[] = [
  r("Moto - Tagliando", null, ["bcc", "dynamic", "sfizio"], [ALE]),
  r("Auto Cris - Tagliando", 200, ["bcc", "dynamic"], [CRIS]),
  r("Cris - Risparmi BCC", 150, ["bcc", "dynamic"], [CRIS]),
  r("Cris - varie", 0, ["bcc", "dynamic"], [CRIS]),
  r("Auto Ale - Tagliando", null, ["bcc", "dynamic"], [ALE]),
  r("Moto - Revisione", 6.6, ["bcc", "sfizio"], [ALE]),
  r("Moto - Assicurazione", 45, ["bcc", "sfizio"], [ALE]),
  r("Moto - Bollo", 7.5, ["bcc", "sfizio"], [ALE]),
  r("Telepass / Benzina", 100, ["shared", "dynamic", "revolut"], [CRIS, ALE]),
  r("Casa - Vodafone", 38, ["bcc", "shared", "paga-ale", "spesa-casa"], [ALE, CRIS]),
  r("Casa - Caldaia", 3.5, ["bcc", "shared", "spesa-casa"], [CRIS, ALE]),
  r("Auto Cris - Revisione", 8, ["bcc"], [CRIS]),
  r("Auto Cris - bollo", 12, ["bcc"], [CRIS]),
  r("Auto Cris - Assicurazione", 27, ["bcc"], [CRIS]),
  r("Ale - Assicurazione", 41, ["bcc"], [ALE]),
  r("Auto - Bollo", 11, ["bcc"], [ALE]),
  r("Auto - Revisione", 6, ["bcc"], [ALE]),
  r("Auto - Assicurazione", null, ["bcc"], [ALE]),
  r("Ale - Spese BCC 80€", 7, ["bcc"], [ALE]),
  r("Cris - Spese BCC 80€", 7, ["bcc"], [CRIS]),
  r("Ale - Investimenti BCC", 100, ["bcc"], [ALE]),
  r("Cris - Investimenti BCC", 100, ["bcc"], [CRIS]),
  r("Cris - Teatro", 500, ["bcc"], [CRIS]),
  r("Cris - Dentista", 0, ["bcc"], [CRIS]),
  r("Ale - Risparmi BCC", 100, ["bcc"], [ALE]),
  r("Ale - Fondo Pensione BCC", null, ["bcc"], [ALE]),
  r("Aleandro - Visita medica VDS", 5, ["bcc"], [ALE]),
  r("Aleandro - Spese varie", null, ["bcc"], [ALE]),
  r("Ale - P.IVA: Commercialista", 38, ["bcc"], [ALE]),
  r("Ale - Patente rinnovo", null, ["bcc"], [ALE]),
  r("Ale - Hobby (Volo)", 50, ["dynamic", "revolut", "sfizio"], [ALE]),
  r("Casa - Bolletta acqua", 25, ["dynamic", "shared", "revolut", "spesa-casa"], [CRIS, ALE]),
  r("Sanità - Lenti a contatto", null, ["revolut", "dynamic"], [ALE]),
  r("SkyDemon", 18, ["revolut", "sfizio"], [ALE]),
  r("Extra - Spotify", 3, ["revolut", "shared", "paga-ale", "sfizio"], [ALE, CRIS]),
  r("Extra - Netflix", 14, ["revolut", "shared", "paga-ale", "sfizio"], [ALE, CRIS]),
  r("iCloud", 0.99, ["revolut"], [ALE]),
  r("Ale - P.IVA: Fatture in cloud", 4, ["revolut"], [ALE]),
  r("Ale - Dominio", 1.7, ["revolut"], [ALE]),
  r("Sanità", 25, ["shared", "dynamic", "revolut", "paga-cris"], [CRIS, ALE]),
  r("Casa - Bollette", 100, ["shared", "dynamic", "spesa-casa", "revolut"], [CRIS, ALE]),
  r("Claude AI", 20, ["shared", "paga-ale", "sfizio"], [ALE, CRIS]),
  r("Amazon Prime", 4.2, ["shared", "revolut", "paga-ale"], []),
  r("Casa - Tari 1° Rata", 6, ["shared", "revolut", "spesa-casa"], [CRIS, ALE]),
  r("Casa - Assicurazione", 35, ["shared", "revolut", "spesa-casa"], [CRIS, ALE]),
  r("Casa - Imu 1° rata", 10, ["shared", "revolut", "spesa-casa"], [CRIS, ALE]),
  r("Casa - Imu 2° rata", 10, ["shared", "revolut", "spesa-casa"], [CRIS, ALE]),
  r("Casa - Tari 2° Rata", 6, ["shared", "revolut", "spesa-casa"], [CRIS, ALE]),
  r("Nespresso", 20, ["shared", "sfizio", "paga-ale"], [CRIS, ALE]),
  r("Casa - Manutenzione", 40, ["shared", "spesa-casa", "revolut", "dynamic"], [CRIS, ALE]),
];

let failures = 0;
function eq(label: string, actual: number, expected: number) {
  const ok = Math.abs(actual - expected) < 0.01;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: ${actual}${ok ? "" : ` (atteso ${expected})`}`);
  if (!ok) failures++;
}
function is(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: ${actual}${ok ? "" : ` (atteso ${expected})`}`);
  if (!ok) failures++;
}

const b = computeBudget(rows);

console.log("\n=== ALE ===");
eq("BCC Ale", b.ale.bcc, 387.85);
eq("Libero Ale", b.ale.libero, 1512.15);
eq("Cibo Ale", b.ale.categorie.cibo, 220);
eq("Casa Ale", b.ale.categorie.speseCasa, 136);
eq("Revolut personali Ale", b.ale.categorie.spesePersonali, 74.69);
// metà di Telepass, Spotify, Netflix, Sanità, Claude, Amazon, Nespresso (Vodafone è già nella sua BCC)
eq("Quota condivise Ale", b.ale.categorie.quotaCondivise, 93.1);
eq("Rimanente Ale", b.ale.rimanente, 988.36);
eq("Investimenti Ale 10%", b.ale.categorie.investimenti, 98.84);
eq("Viaggi Ale 15%", b.ale.categorie.viaggi, 148.25);
eq("Cointestato Ale 30%", b.ale.categorie.cointestato, 296.51);
eq("Imprevisti Ale 5%", b.ale.categorie.imprevisti, 49.42);
eq("Conto personale Ale", b.ale.categorie.contoPersonale, 395.34);
eq("Cointestato totale Ale", b.ale.cointestatoTotale, 389.61);
eq("Totale Ale = libero", b.ale.totale, b.ale.libero);

console.log("\n=== CRISTINA ===");
eq("BCC Cris", b.cris.bcc, 1005.75);
eq("Libero Cris", b.cris.libero, 494.25);
eq("Revolut personali Cris", b.cris.categorie.spesePersonali, 0);
// 93.1 come Ale + metà di Vodafone (19) pagato dalla BCC di Ale
eq("Quota condivise Cris", b.cris.categorie.quotaCondivise, 112.1);
eq("Rimanente Cris", b.cris.rimanente, 116.15);
eq("Investimenti Cris 0%", b.cris.categorie.investimenti, 0);
eq("Viaggi Cris 15%", b.cris.categorie.viaggi, 17.42);
eq("Cointestato Cris 30%", b.cris.categorie.cointestato, 34.85);
eq("Imprevisti Cris 5%", b.cris.categorie.imprevisti, 5.81);
eq("Conto personale Cris", b.cris.categorie.contoPersonale, 58.07);
is("Cris compresso", b.cris.compresso, false);
eq("Totale Cris = libero", b.cris.totale, b.cris.libero);

console.log("\n=== COMUNE ===");
eq("Spese casa righe reali", b.speseCasaRigheReali, 232);
eq("Spese casa totale", b.speseCasaTotale, 272);
// Ale: Claude+Nespresso+Amazon+Spotify+Netflix per intero (61.2) + metà Vodafone BCC (19)
eq("Ritiro Ale", b.ritiri.ale, 80.2);
eq("Ritiro Cris (Sanità)", b.ritiri.cris, 25);
is("Telepass pagata dal cointestato", b.condiviseRows.find((x) => x.name.startsWith("Telepass"))?.pagante, null);

console.log("\n=== COINTESTATO: esempio 100 vs 90 ===");
const ex = computeBudget([
  r("Pagata da Ale", 100, ["shared", "revolut", "paga-ale"], []),
  r("Pagata da Cris", 90, ["shared", "revolut", "paga-cris"], []),
]);
eq("Versano ognuno", ex.ale.categorie.quotaCondivise, 95);
eq("Ale ritira", ex.ritiri.ale, 100);
eq("Cris ritira", ex.ritiri.cris, 90);
// saldo: Ale 95 - 100 = -5, Cris 95 - 90 = +5 -> come un conguaglio di 5 € da Cris ad Ale
eq("Saldo Cris - Ale", (ex.cris.categorie.quotaCondivise - ex.ritiri.cris) - (ex.ale.categorie.quotaCondivise - ex.ritiri.ale), 10);

console.log("\n=== % + TETTO ===");
const s1 = defaultSettings();
s1.ale.viaggi = { mode: "pct", target: 20, cap: 150 };
eq("Viaggi Ale 20% con tetto 150", computeBudget(rows, s1).ale.categorie.viaggi, 150);

const s2 = defaultSettings();
s2.ale.viaggi = { mode: "eur", target: 100, cap: 100 };
eq("Viaggi Ale fisso 100 €", computeBudget(rows, s2).ale.categorie.viaggi, 100);

const s3 = defaultSettings();
s3.casaExtraTotale = 100;
const p3 = computeBudget(rows, s3);
eq("Casa quota con extra 100", p3.ale.categorie.speseCasa, 166);
eq("Totale Ale = libero (extra casa)", p3.ale.totale, p3.ale.libero);

console.log(`\n${failures === 0 ? "TUTTI I TEST PASSATI ✅" : `${failures} TEST FALLITI ❌`}`);
process.exit(failures === 0 ? 0 : 1);
