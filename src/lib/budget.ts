// Logica pura di calcolo del budget Ale & Cris.
// Nessuna dipendenza da Notion o da React: input = righe grezze, output = ripartizione.
// Segue le "Regole Budget Ale & Cris".

import { CONFIG, Person, PEOPLE } from "./config";

export interface SpesaRow {
  name: string;
  spesa: number; // gia' normalizzato a 0 se null
  tags: string[]; // es. ["bcc", "shared", "paga-ale"]
  accounts: string[]; // id pagina account (normalizzati senza trattini)
}

export interface PersonBudget {
  person: Person;
  stipendio: number;
  bcc: number;
  libero: number;
  // dettaglio BCC (auditabile)
  bccSharedNoPaga: number; // meta' delle righe shared+bcc senza paga
  bccSharedPaga: number; // meta' delle righe shared+bcc+paga-{persona}
  bccIndividuale: number; // righe non-shared+bcc del suo account
  contoBase: number; // spese individuali reali (revolut, non shared)
  categorie: {
    cibo: number;
    investimenti: number;
    contoPersonale: number;
    viaggi: number;
    fondoComune: number;
    speseCasa: number;
  };
  // percentuale di ogni categoria sul libero
  perc: {
    cibo: number;
    investimenti: number;
    contoPersonale: number;
    viaggi: number;
    fondoComune: number;
    speseCasa: number;
  };
  totale: number;
  compresso: boolean; // true se il libero non bastava e si e' compresso
  deficit: number; // >0 se libero insufficiente anche dopo compressione
}

export interface BudgetResult {
  ale: PersonBudget;
  cris: PersonBudget;
  speseCasaTotale: number; // righe reali + extra (prima del /2)
  speseCasaRigheReali: number;
  casaExtraTotale: number;
  casaRows: SpesaRow[];
  differenzaComune: number; // Ale - Cris sui contributi condivisi (viaggi+fondo+casa)
  differenzaChi: Person | null;
}

// ---- Impostazioni configurabili dall'utente ----
export type CatMode = "eur" | "pct";
export type EditableCat = "cibo" | "investimenti" | "viaggi" | "fondoComune";

export interface CategorySetting {
  mode: CatMode; // "eur" = valore fisso in €, "pct" = percentuale del libero
  target: number; // € se mode="eur", 0-100 se mode="pct"
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
  const mk = (v: number): CategorySetting => ({ mode: "eur", target: v, cap: v });
  return {
    salaries: { ale: CONFIG.stipendio.ale, cris: CONFIG.stipendio.cris },
    casaExtraTotale: CONFIG.casaExtraTotale,
    ale: {
      cibo: mk(CONFIG.cibo.ale),
      investimenti: mk(CONFIG.investimentiCap.ale),
      viaggi: mk(CONFIG.viaggiCap.ale),
      fondoComune: mk(CONFIG.fondoCap.ale),
    },
    cris: {
      cibo: mk(CONFIG.cibo.cris),
      investimenti: mk(CONFIG.investimentiCap.cris),
      viaggi: mk(CONFIG.viaggiCap.cris),
      fondoComune: mk(CONFIG.fondoCap.cris),
    },
  };
}

const has = (row: SpesaRow, tag: string) => row.tags.includes(tag);
const belongsTo = (row: SpesaRow, personId: string) =>
  row.accounts.some((a) => norm(a) === norm(personId));

export const norm = (id: string) => id.replace(/-/g, "").toLowerCase();

// ---- BCC per persona (formula validata sulle regole) ----
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
        sharedNoPaga += r.spesa; // diviso 2 dopo
      } else if (has(r, pagaTag)) {
        sharedPaga += r.spesa; // diviso 2 dopo
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

// ---- Conto personale base: spese individuali reali (revolut, non shared) ----
function computeContoBase(rows: SpesaRow[], accountId: string) {
  let sum = 0;
  for (const r of rows) {
    if (has(r, "revolut") && !has(r, "shared") && belongsTo(r, accountId)) {
      sum += r.spesa;
    }
  }
  return sum;
}

// ---- Spese casa: righe spesa-casa + revolut + shared, NON bcc, + extra totale ----
function computeCasa(rows: SpesaRow[], casaExtraTotale: number) {
  const casaRows = rows.filter(
    (r) => has(r, "spesa-casa") && has(r, "revolut") && has(r, "shared") && !has(r, "bcc")
  );
  const righeReali = casaRows.reduce((s, r) => s + r.spesa, 0);
  const totale = righeReali + casaExtraTotale;
  return { casaRows, righeReali, totale, quota: totale / 2 };
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Risolve un target (%/€) in € e lo limita al tetto.
function resolveCat(c: CategorySetting, libero: number): number {
  const raw = c.mode === "pct" ? (libero * c.target) / 100 : c.target;
  return Math.max(0, Math.min(raw, c.cap));
}

// ---- Allocazione per persona ----
function allocate(
  libero: number,
  contoBase: number,
  casaQuota: number,
  ps: PersonSettings
): PersonBudget["categorie"] & { compresso: boolean; deficit: number } {
  const cibo = resolveCat(ps.cibo, libero);
  const casa = casaQuota; // non comprimibile (gia' sostenuta)

  // Voci discrezionali: target (%/€) limitato al tetto
  let investimenti = resolveCat(ps.investimenti, libero);
  let viaggi = resolveCat(ps.viaggi, libero);
  let fondo = resolveCat(ps.fondoComune, libero);

  // Il conto personale assorbe il residuo
  let conto = libero - cibo - investimenti - viaggi - fondo - casa;

  // Floor del conto personale: almeno le spese individuali gia' sostenute,
  // e almeno il floor discrezionale teorico.
  const floor = Math.max(contoBase, CONFIG.contoFloorDiscrezionale);

  let compresso = false;
  if (conto < floor) {
    compresso = true;
    let deficit = floor - conto;
    // Comprimi dal basso: prima Fondo comune, poi Viaggi, poi Investimenti.
    // Cibo e Spese casa non si comprimono mai.
    for (const cut of ["fondo", "viaggi", "investimenti"] as const) {
      if (deficit <= 0) break;
      const current = cut === "fondo" ? fondo : cut === "viaggi" ? viaggi : investimenti;
      const take = Math.min(current, deficit);
      if (cut === "fondo") fondo -= take;
      else if (cut === "viaggi") viaggi -= take;
      else investimenti -= take;
      deficit -= take;
      conto += take;
    }
  }

  // Se anche dopo la compressione conto < contoBase, c'e' un deficit reale.
  const deficit = conto < contoBase ? round2(contoBase - conto) : 0;

  return {
    cibo: round2(cibo),
    investimenti: round2(investimenti),
    contoPersonale: round2(conto),
    viaggi: round2(viaggi),
    fondoComune: round2(fondo),
    speseCasa: round2(casa),
    compresso,
    deficit,
  };
}

function buildPerson(
  rows: SpesaRow[],
  person: Person,
  accountId: string,
  casaQuota: number,
  stipendio: number,
  ps: PersonSettings
): PersonBudget {
  const bcc = computeBcc(rows, person, accountId);
  const libero = stipendio - bcc.bcc;
  const contoBase = computeContoBase(rows, accountId);
  const alloc = allocate(libero, contoBase, casaQuota, ps);

  const categorie = {
    cibo: alloc.cibo,
    investimenti: alloc.investimenti,
    contoPersonale: alloc.contoPersonale,
    viaggi: alloc.viaggi,
    fondoComune: alloc.fondoComune,
    speseCasa: alloc.speseCasa,
  };
  const totale = round2(
    categorie.cibo +
      categorie.investimenti +
      categorie.contoPersonale +
      categorie.viaggi +
      categorie.fondoComune +
      categorie.speseCasa
  );

  const pc = (v: number) => (libero > 0 ? round2((v / libero) * 100) : 0);
  const perc = {
    cibo: pc(categorie.cibo),
    investimenti: pc(categorie.investimenti),
    contoPersonale: pc(categorie.contoPersonale),
    viaggi: pc(categorie.viaggi),
    fondoComune: pc(categorie.fondoComune),
    speseCasa: pc(categorie.speseCasa),
  };

  return {
    person,
    stipendio,
    bcc: round2(bcc.bcc),
    libero: round2(libero),
    bccSharedNoPaga: round2(bcc.bccSharedNoPaga),
    bccSharedPaga: round2(bcc.bccSharedPaga),
    bccIndividuale: round2(bcc.bccIndividuale),
    contoBase: round2(contoBase),
    categorie,
    perc,
    totale,
    compresso: alloc.compresso,
    deficit: alloc.deficit,
  };
}

export function computeBudget(rows: SpesaRow[], settings?: BudgetSettings): BudgetResult {
  const s = settings ?? defaultSettings();
  const casa = computeCasa(rows, s.casaExtraTotale);

  const accIds = {
    ale: "27253915-e418-80c8-9c84-f4adfa38de8d",
    cris: "27253915-e418-80d1-b464-d47b60f2ef99",
  };

  const salaries = s.salaries;
  // Stipendi: usa i valori passati (input utente) se validi, altrimenti i default del config.
  const valid = (n: unknown) => typeof n === "number" && isFinite(n) && n >= 0;
  const stipAle = valid(salaries?.ale) ? salaries.ale : CONFIG.stipendio.ale;
  const stipCris = valid(salaries?.cris) ? salaries.cris : CONFIG.stipendio.cris;

  const ale = buildPerson(rows, "ale", accIds.ale, casa.quota, stipAle, s.ale);
  const cris = buildPerson(rows, "cris", accIds.cris, casa.quota, stipCris, s.cris);

  // Differenza sui contributi al "comune": Viaggi + Fondo comune + Spese casa
  const comuneAle = ale.categorie.viaggi + ale.categorie.fondoComune + ale.categorie.speseCasa;
  const comuneCris = cris.categorie.viaggi + cris.categorie.fondoComune + cris.categorie.speseCasa;
  const differenzaComune = round2(comuneAle - comuneCris);

  return {
    ale,
    cris,
    speseCasaTotale: round2(casa.totale),
    speseCasaRigheReali: round2(casa.righeReali),
    casaExtraTotale: round2(s.casaExtraTotale),
    casaRows: casa.casaRows,
    differenzaComune,
    differenzaChi: differenzaComune > 0 ? "ale" : differenzaComune < 0 ? "cris" : null,
  };
}

void PEOPLE;
