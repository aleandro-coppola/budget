// Test della logica di calcolo contro i dati reali del DB Notion "Spese"
// (snapshot letto il 2026-07-02). Esegui con: npm test
import { computeBudget, defaultSettings, SpesaRow } from "../src/lib/budget";

const ALE = "27253915e41880c89c84f4adfa38de8d";
const CRIS = "27253915e41880d1b464d47b60f2ef99";

function r(name: string, spesa: number | null, tags: string[], accounts: string[]): SpesaRow {
  return { name, spesa: spesa ?? 0, tags, accounts };
}

// Righe reali dal DB (Name, Spesa, Tags, Accounts)
const rows: SpesaRow[] = [
  r("Moto - Revisione", 6.6, ["bcc"], [ALE]),
  r("Auto Cris - Revisione", 8, ["bcc"], [CRIS]),
  r("Auto Cris - bollo", 12, ["bcc"], [CRIS]),
  r("Auto Cris - Tagliando", 200, ["bcc", "dynamic"], [CRIS]),
  r("Auto Cris - Assicurazione", 27, ["bcc"], [CRIS]),
  r("Ale - Assicurazione", 41, ["bcc"], [ALE]),
  r("Casa - Bollette", 100, ["shared", "dynamic", "spesa-casa", "revolut"], [CRIS, ALE]),
  r("Casa - Tari 1", 6, ["shared", "revolut", "spesa-casa"], [CRIS, ALE]),
  r("Casa - Assicurazione", 35, ["shared", "revolut", "spesa-casa"], [CRIS, ALE]),
  r("Casa - Vodafone", 38, ["bcc", "shared", "paga-ale", "spesa-casa"], [ALE, CRIS]),
  r("Casa - Imu 1", 10, ["shared", "revolut", "spesa-casa", "paga-cris"], [CRIS, ALE]),
  r("Casa - Imu 2", 10, ["shared", "revolut", "spesa-casa"], [CRIS, ALE]),
  r("Casa - Tari 2", 6, ["shared", "revolut", "spesa-casa"], [CRIS, ALE]),
  r("Casa - Caldaia", 3.5, ["bcc", "shared", "spesa-casa"], [CRIS, ALE]),
  r("iCloud", 0.99, ["revolut"], [ALE]),
  r("Moto - Assicurazione", 41, ["bcc"], [ALE]),
  r("Telepass / Benzina", 150, ["bcc", "shared", "paga-ale", "dynamic"], [CRIS, ALE]),
  r("Auto - Bollo bcc", 11, ["bcc"], [ALE]),
  r("Auto - Revisione", 6, ["bcc"], [ALE]),
  r("Auto - Assicurazione", null, ["bcc"], [ALE]),
  r("Ale - Spese BCC 80", 7, ["bcc"], [ALE]),
  r("Cris - Spese BCC 80", 7, ["bcc"], [CRIS]),
  r("Ale - P.IVA Fatture", 4, ["revolut"], [ALE]),
  r("Ale - Investimenti BCC", 100, ["bcc"], [ALE]),
  r("Sanita", 40, ["shared", "dynamic", "revolut"], [CRIS, ALE]),
  r("Cris - Investimenti BCC", 100, ["bcc"], [CRIS]),
  r("Ale - Hobby Volo", 50, ["dynamic", "revolut"], [ALE]),
  r("Cris - Teatro", null, ["bcc"], [CRIS]),
  r("Casa - Manutenzione", 40, ["shared", "spesa-casa", "revolut", "dynamic"], [CRIS, ALE]),
  r("Cris - Dentista", 0, ["bcc"], [CRIS]),
  r("Cris - Risparmi BCC", 150, ["bcc", "dynamic"], [CRIS]),
  r("Ale - Risparmi BCC", 100, ["bcc"], [ALE]),
  r("(vuota)", null, ["shared"], []),
  r("Ale - Fondo Pensione BCC", 10, ["bcc"], [ALE]),
  r("Sanita - Lenti", 18, ["revolut", "dynamic"], [ALE]),
  r("Cris - varie", 0, ["bcc", "dynamic"], [CRIS]),
  r("ForeFlight", 145, ["revolut"], [ALE]),
  r("Ale - Visita medica VDS", 50, ["bcc"], [ALE]),
  r("Casa - Acqua", 25, ["dynamic", "shared", "revolut"], [CRIS, ALE]),
  r("Aleandro - Spese varie", 200, ["bcc"], [ALE]),
  r("Extra - Spotify", 3, ["revolut", "shared", "paga-ale"], [ALE, CRIS]),
  r("Ale - P.IVA Commercialista", 38, ["bcc"], [ALE]),
  r("Moto - Bollo bcc", 7.5, ["bcc"], [ALE]),
  r("Moto - Tagliando", 350, ["bcc", "dynamic"], [ALE]),
  r("Extra - Netflix", 14, ["revolut", "shared", "paga-ale"], [ALE, CRIS]),
  r("Auto Ale - Tagliando", null, ["bcc", "dynamic"], [ALE]),
  r("Ale - Patente rinnovo", null, ["bcc"], [ALE]),
];

let failures = 0;
function eq(label: string, actual: number, expected: number) {
  const ok = Math.abs(actual - expected) < 0.01;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: ${actual}${ok ? "" : ` (atteso ${expected})`}`);
  if (!ok) failures++;
}

const b = computeBudget(rows);

console.log("\n=== ALE ===");
eq("BCC Ale", b.ale.bcc, 1063.85);
eq("Libero Ale", b.ale.libero, 836.15);
eq("Conto base Ale", b.ale.contoBase, 217.99);
eq("Cibo Ale", b.ale.categorie.cibo, 220);
eq("Investimenti Ale", b.ale.categorie.investimenti, 191.43);
// Con stipendio 1900 e questo dataset, il floor (contoBase 217.99) comprime
// Fondo (azzerato) e parte di Viaggi.
eq("Viaggi Ale", b.ale.categorie.viaggi, 83.23);
eq("Fondo Ale", b.ale.categorie.fondoComune, 0);
eq("Casa Ale", b.ale.categorie.speseCasa, 123.5);
eq("Conto personale Ale", b.ale.categorie.contoPersonale, 217.99);
eq("Totale Ale = libero", b.ale.totale, b.ale.libero);

console.log("\n=== CRISTINA ===");
eq("BCC Cris", b.cris.bcc, 505.75);
eq("Libero Cris", b.cris.libero, 994.25);
eq("Conto base Cris", b.cris.contoBase, 0);
eq("Investimenti Cris", b.cris.categorie.investimenti, 76.85);
eq("Casa Cris", b.cris.categorie.speseCasa, 123.5);
eq("Conto personale Cris", b.cris.categorie.contoPersonale, 567.83);
eq("Totale Cris = libero", b.cris.totale, b.cris.libero);

console.log("\n=== COMUNE ===");
eq("Spese casa totale", b.speseCasaTotale, 247);
eq("Spese casa righe reali", b.speseCasaRigheReali, 207);

// --- Test modalita' percentuale + tetto ---
console.log("\n=== % + TETTO ===");
// Investimenti e Fondo azzerati in questi due sotto-test per isolare il
// comportamento di Viaggi (%/tetto) senza far scattare la compressione da floor.
const s1 = defaultSettings();
s1.ale.investimenti = { mode: "eur", target: 0, cap: 0 };
s1.ale.fondoComune = { mode: "eur", target: 0, cap: 0 };
// Ale viaggi: 10% del libero (836.15 -> 83.615), tetto 200 -> resta 83.62 (no cap)
s1.ale.viaggi = { mode: "pct", target: 10, cap: 200 };
const p1 = computeBudget(rows, s1);
eq("Viaggi Ale 10% (no cap)", p1.ale.categorie.viaggi, 83.62);
eq("Perc Viaggi Ale ~10%", p1.ale.perc.viaggi, 10);

const s2 = defaultSettings();
s2.ale.investimenti = { mode: "eur", target: 0, cap: 0 };
s2.ale.fondoComune = { mode: "eur", target: 0, cap: 0 };
// Ale viaggi: 20% del libero (167.23) ma tetto 150 -> limitato a 150
s2.ale.viaggi = { mode: "pct", target: 20, cap: 150 };
const p2 = computeBudget(rows, s2);
eq("Viaggi Ale 20% con tetto 150", p2.ale.categorie.viaggi, 150);

const s3 = defaultSettings();
// Extra casa portato a 100 -> casa totale 207+100=307 -> quota 153.5
s3.casaExtraTotale = 100;
const p3 = computeBudget(rows, s3);
eq("Casa quota con extra 100", p3.ale.categorie.speseCasa, 153.5);
eq("Totale Ale = libero (extra casa)", p3.ale.totale, p3.ale.libero);

console.log(`\n${failures === 0 ? "TUTTI I TEST PASSATI ✅" : `${failures} TEST FALLITI ❌`}`);
process.exit(failures === 0 ? 0 : 1);
