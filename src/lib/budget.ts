// Logica pura di calcolo del budget Ale & Cris.
// Nessuna dipendenza da Notion o da React: input = righe grezze, output = ripartizione.
//
// Flusso per persona:
//   Stipendio - BCC                                   = Libero (va su Revolut)
//   Libero - Cibo - Casa - Revolut personali - Quota condivise = Rimanente
//   Rimanente -> Investimenti / Viaggi / Cointestato / Imprevisti (in % o €) + Conto personale (residuo)
//
// Tag Notion:
//   bcc          -> spesa pagata dalla BCC (resta sul conto BCC)
//   (non bcc)    -> spesa pagata da Revolut
//   shared       -> condivisa, divisa /2
//   spesa-casa   -> (con shared, non bcc) va nel pocket Spese Casa
//   paga-ale/cris-> (con shared) chi la anticipa con la sua carta
//
// Spese condivise non-casa: ognuno versa la sua meta' nel conto cointestato; chi ha
// anticipato ritira dal cointestato. Senza paga-* la spesa si paga dal cointestato.

import { CONFIG, Person } from "./config";

export interface SpesaRow {
  name: string;
  spesa: number; // gia' normalizzato a 0 se null
  tags: string[];
  accounts: string[]; // id pagina account
}

// ---- Impostazioni configurabili dall'utente ----
export type CatMode = "eur" | "pct";
export type PocketCat = "investimenti" | "viaggi" | "cointestato" | "imprevisti";
export type EditableCat = "cibo" | PocketCat;

export const POCKETS: PocketCat[] = ["investimenti", "viaggi", "cointestato", "imprevisti"];
// Ordine di taglio quando il conto personale scende sotto il minimo.
const COMPRESSION_ORDER: PocketCat[] = ["cointestato", "viaggi", "investimenti", "imprevisti"];

export interface CategorySetting {
  mode: CatMode; // "eur" = valore fisso, "pct" = % (del libero per cibo, del rimanente per i pocket)
  target: number;
  cap: number; // tetto massimo in €
}

export type PersonSettings = Record<EditableCat, CategorySetting>;

export interface BudgetSettings {
  salaries: { ale: number; cris: number };
  casaExtraTotale: number; // extra fisso TOTALE aggiunto alle righe casa (poi /2)
  ale: PersonSettings;
  cris: PersonSettings;
}

export function defaultSettings(): BudgetSettings {
  const person = (p: Person): PersonSettings => {
    const pockets = Object.fromEntries(
      POCKETS.map((k) => {
        const v = CONFIG.pockets[k][p];
        return [k, { mode: "pct", target: v.pct, cap: v.cap }];
      })
    ) as Record<PocketCat, CategorySetting>;
    return { cibo: { mode: "eur", target: CONFIG.cibo[p], cap: CONFIG.cibo[p] }, ...pockets };
  };
  return {
    salaries: { ale: CONFIG.stipendio.ale, cris: CONFIG.stipendio.cris },
    casaExtraTotale: CONFIG.casaExtraTotale,
    ale: person("ale"),
    cris: person("cris"),
  };
}

// ---- Risultato ----
export interface Categorie {
  cibo: number;
  speseCasa: number;
  spesePersonali: number; // spese Revolut individuali (non shared, non bcc)
  quotaCondivise: number; // meta' delle spese shared non-casa non gia' in BCC
  investimenti: number;
  viaggi: number;
  cointestato: number;
  imprevisti: number;
  contoPersonale: number; // residuo
}

export interface PersonBudget {
  person: Person;
  stipendio: number;
  bcc: number;
  libero: number;
  bccSharedNoPaga: number;
  bccSharedPaga: number;
  bccIndividuale: number;
  rimanente: number;
  cointestatoTotale: number; // quota condivise + % cointestato: bonifico totale al cointestato
  categorie: Categorie;
  // % delle voci fisse sul libero, % di pocket e conto personale sul rimanente
  perc: Categorie;
  totale: number;
  compresso: boolean;
  deficit: number;
}

export interface CondivisaRow extends SpesaRow {
  lato: "bcc" | "revolut";
  pagante: Person | null; // null = pagata direttamente dal cointestato
  ritiro: number; // quanto il pagante ritira dal cointestato
}

export interface BudgetResult {
  ale: PersonBudget;
  cris: PersonBudget;
  speseCasaTotale: number;
  speseCasaRigheReali: number;
  casaExtraTotale: number;
  casaRows: SpesaRow[];
  condiviseRows: CondivisaRow[];
  ritiri: Record<Person, number>; // da ritirare dal cointestato per le spese anticipate
}

const has = (row: SpesaRow, tag: string) => row.tags.includes(tag);
export const norm = (id: string) => id.replace(/-/g, "").toLowerCase();
const belongsTo = (row: SpesaRow, personId: string) =>
  row.accounts.some((a) => norm(a) === norm(personId));
const other = (p: Person): Person => (p === "ale" ? "cris" : "ale");

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ---- BCC per persona ----
function computeBcc(rows: SpesaRow[], person: Person, accountId: string) {
  const pagaTag = person === "ale" ? "paga-ale" : "paga-cris";

  let sharedNoPaga = 0;
  let sharedPaga = 0;
  let individuale = 0;

  for (const r of rows) {
    if (!has(r, "bcc")) continue;

    if (has(r, "shared")) {
      const hasAnyPaga = has(r, "paga-ale") || has(r, "paga-cris");
      if (!hasAnyPaga) {
        sharedNoPaga += r.spesa;
      } else if (has(r, pagaTag)) {
        sharedPaga += r.spesa;
      }
    } else if (belongsTo(r, accountId)) {
      individuale += r.spesa;
    }
  }

  return {
    bccSharedNoPaga: sharedNoPaga / 2,
    bccSharedPaga: sharedPaga / 2,
    bccIndividuale: individuale,
    bcc: sharedNoPaga / 2 + sharedPaga / 2 + individuale,
  };
}

// ---- Spese Revolut personali: non bcc, non shared, del proprio account ----
function computePersonali(rows: SpesaRow[], accountId: string) {
  return rows
    .filter((r) => !has(r, "bcc") && !has(r, "shared") && belongsTo(r, accountId))
    .reduce((s, r) => s + r.spesa, 0);
}

// ---- Spese casa: shared + spesa-casa, non bcc (+ extra totale), divise 50/50 ----
const isCasaPocket = (r: SpesaRow) => has(r, "shared") && has(r, "spesa-casa") && !has(r, "bcc");

function computeCasa(rows: SpesaRow[], casaExtraTotale: number) {
  const casaRows = rows.filter(isCasaPocket);
  const righeReali = casaRows.reduce((s, r) => s + r.spesa, 0);
  const totale = righeReali + casaExtraTotale;
  return { casaRows, righeReali, totale, quota: totale / 2 };
}

// ---- Spese condivise non-casa: quota da versare nel cointestato + ritiri di chi anticipa ----
function payerOf(r: SpesaRow): Person | null {
  const a = has(r, "paga-ale");
  const c = has(r, "paga-cris");
  if (a === c) return null;
  return a ? "ale" : "cris";
}

function computeCondivise(rows: SpesaRow[]) {
  const quota: Record<Person, number> = { ale: 0, cris: 0 };
  const ritiri: Record<Person, number> = { ale: 0, cris: 0 };
  const list: CondivisaRow[] = [];

  for (const r of rows) {
    // Le righe casa (Revolut) sono pagate dal pocket Spese Casa.
    if (!has(r, "shared") || isCasaPocket(r)) continue;
    const half = r.spesa / 2;
    const payer = payerOf(r);
    const bcc = has(r, "bcc");

    // BCC senza pagante unico: gia' divisa 50/50 nelle due BCC.
    if (bcc && !payer) continue;

    let ritiro = 0;
    if (bcc) {
      // La BCC del pagante contiene gia' la sua meta': nel cointestato va solo quella dell'altro.
      quota[other(payer as Person)] += half;
      ritiro = half;
    } else {
      quota.ale += half;
      quota.cris += half;
      if (payer) ritiro = r.spesa;
    }
    if (payer) ritiri[payer] += ritiro;

    if (r.spesa > 0) list.push({ ...r, lato: bcc ? "bcc" : "revolut", pagante: payer, ritiro });
  }

  return { quota, ritiri: { ale: round2(ritiri.ale), cris: round2(ritiri.cris) }, list };
}

// Risolve un target (%/€) in € sulla base indicata e lo limita al tetto.
function resolveCat(c: CategorySetting, base: number): number {
  const raw = c.mode === "pct" ? (base * c.target) / 100 : c.target;
  return Math.max(0, Math.min(raw, c.cap));
}

function allocate(
  libero: number,
  fisse: { speseCasa: number; spesePersonali: number; quotaCondivise: number },
  ps: PersonSettings
) {
  const cibo = resolveCat(ps.cibo, libero);
  const rimanente = libero - cibo - fisse.speseCasa - fisse.spesePersonali - fisse.quotaCondivise;
  const base = Math.max(0, rimanente);

  const pockets = Object.fromEntries(POCKETS.map((k) => [k, resolveCat(ps[k], base)])) as Record<
    PocketCat,
    number
  >;
  let conto = rimanente - POCKETS.reduce((s, k) => s + pockets[k], 0);

  let compresso = false;
  let mancante = CONFIG.contoFloorDiscrezionale - conto;
  for (const k of COMPRESSION_ORDER) {
    if (mancante <= 0) break;
    const take = Math.min(pockets[k], mancante);
    if (take > 0) compresso = true;
    pockets[k] -= take;
    conto += take;
    mancante -= take;
  }

  return { cibo, rimanente, pockets, conto, compresso, deficit: conto < 0 ? round2(-conto) : 0 };
}

function buildPerson(
  rows: SpesaRow[],
  person: Person,
  accountId: string,
  casaQuota: number,
  quotaCondivise: number,
  stipendio: number,
  ps: PersonSettings
): PersonBudget {
  const bcc = computeBcc(rows, person, accountId);
  const libero = stipendio - bcc.bcc;
  const spesePersonali = computePersonali(rows, accountId);
  const a = allocate(libero, { speseCasa: casaQuota, spesePersonali, quotaCondivise }, ps);

  const categorie: Categorie = {
    cibo: round2(a.cibo),
    speseCasa: round2(casaQuota),
    spesePersonali: round2(spesePersonali),
    quotaCondivise: round2(quotaCondivise),
    investimenti: round2(a.pockets.investimenti),
    viaggi: round2(a.pockets.viaggi),
    cointestato: round2(a.pockets.cointestato),
    imprevisti: round2(a.pockets.imprevisti),
    contoPersonale: 0,
  };
  // Il residuo assorbe gli arrotondamenti, cosi' il totale coincide al centesimo col libero.
  categorie.contoPersonale = round2(
    round2(libero) - Object.values(categorie).reduce((s, v) => s + v, 0)
  );

  const onLibero = (v: number) => (libero > 0 ? round2((v / libero) * 100) : 0);
  const onRimanente = (v: number) => (a.rimanente > 0 ? round2((v / a.rimanente) * 100) : 0);
  const perc: Categorie = {
    cibo: onLibero(a.cibo),
    speseCasa: onLibero(casaQuota),
    spesePersonali: onLibero(spesePersonali),
    quotaCondivise: onLibero(quotaCondivise),
    investimenti: onRimanente(a.pockets.investimenti),
    viaggi: onRimanente(a.pockets.viaggi),
    cointestato: onRimanente(a.pockets.cointestato),
    imprevisti: onRimanente(a.pockets.imprevisti),
    contoPersonale: onRimanente(a.conto),
  };

  const totale = round2(Object.values(categorie).reduce((s, v) => s + v, 0));

  return {
    person,
    stipendio,
    bcc: round2(bcc.bcc),
    libero: round2(libero),
    bccSharedNoPaga: round2(bcc.bccSharedNoPaga),
    bccSharedPaga: round2(bcc.bccSharedPaga),
    bccIndividuale: round2(bcc.bccIndividuale),
    rimanente: round2(a.rimanente),
    cointestatoTotale: round2(categorie.quotaCondivise + categorie.cointestato),
    categorie,
    perc,
    totale,
    compresso: a.compresso,
    deficit: a.deficit,
  };
}

export function computeBudget(rows: SpesaRow[], settings?: BudgetSettings): BudgetResult {
  const s = settings ?? defaultSettings();
  const casa = computeCasa(rows, s.casaExtraTotale);
  const condivise = computeCondivise(rows);

  const accIds = {
    ale: "27253915-e418-80c8-9c84-f4adfa38de8d",
    cris: "27253915-e418-80d1-b464-d47b60f2ef99",
  };

  const valid = (n: unknown) => typeof n === "number" && isFinite(n) && n >= 0;
  const stipAle = valid(s.salaries?.ale) ? s.salaries.ale : CONFIG.stipendio.ale;
  const stipCris = valid(s.salaries?.cris) ? s.salaries.cris : CONFIG.stipendio.cris;

  const ale = buildPerson(rows, "ale", accIds.ale, casa.quota, condivise.quota.ale, stipAle, s.ale);
  const cris = buildPerson(rows, "cris", accIds.cris, casa.quota, condivise.quota.cris, stipCris, s.cris);

  return {
    ale,
    cris,
    speseCasaTotale: round2(casa.totale),
    speseCasaRigheReali: round2(casa.righeReali),
    casaExtraTotale: round2(s.casaExtraTotale),
    casaRows: casa.casaRows,
    condiviseRows: condivise.list,
    ritiri: condivise.ritiri,
  };
}
