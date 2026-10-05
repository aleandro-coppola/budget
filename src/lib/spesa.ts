// Logica pura di "Spesa & Ricette": nessuna dipendenza da React.
import {
  INGREDIENTI,
  PIZZA_ID,
  REPARTI,
  RICETTE,
  TAGS,
  type Ingrediente,
  type Reparto,
  type Ricetta,
  type Tag,
} from "./spesa-catalogo";

export { INGREDIENTI, PIZZA_ID, REPARTI, RICETTE, TAGS };
export type { Ingrediente, Reparto, Ricetta, Tag };

// ---------------------------------------------------------------------------
// Stato
// ---------------------------------------------------------------------------
export type GiornoPizza = "gio" | "ven";

export interface Prezzo {
  prezzo: number; // per confezione/pezzo
  data: string; // ISO yyyy-mm-dd
}
export interface VocePersonalizzata {
  id: string;
  nome: string;
  reparto: Reparto;
  conf: string;
}
export interface NonRiconosciuta {
  nome: string;
  prezzo: number;
}

export interface SpesaState {
  inizio: string;
  pizza: GiornoPizza;
  pranzi: string[]; // 7 id ricetta ("" = vuoto)
  cene: string[];
  prezzi: Record<string, Prezzo>;
  carrello: Record<string, boolean>; // id voce (extra: "extra:<id>")
  inCasa: Record<string, boolean>;
  extra: Record<string, number>; // id ingrediente -> confezioni
  custom: VocePersonalizzata[];
  nonRiconosciute: NonRiconosciuta[];
}

export const GIORNI = 7;

// ---------------------------------------------------------------------------
// Date
// ---------------------------------------------------------------------------
const pad = (n: number) => String(n).padStart(2, "0");
export const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export function lunediDi(d: Date): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return toIso(x);
}
export function aggiungiGiorni(iso: string, n: number): string {
  const d = fromIso(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}
const isIso = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

// Indice (0-6) del giovedi'/venerdi' rispetto al primo giorno della settimana.
export function indicePizza(inizio: string, pizza: GiornoPizza): number {
  const target = pizza === "gio" ? 4 : 5; // Date.getDay()
  return (target - fromIso(inizio).getDay() + 7) % 7;
}

// ---------------------------------------------------------------------------
// Catalogo (ingredienti + voci personalizzate)
// ---------------------------------------------------------------------------
export function catalogoCompleto(custom: VocePersonalizzata[]): Ingrediente[] {
  return [
    ...INGREDIENTI,
    ...custom.map((c) => ({ id: c.id, nome: c.nome, reparto: c.reparto, conf: c.conf, alias: [normalizza(c.nome)] })),
  ];
}
export const ricettaPerId = (id: string): Ricetta | undefined => RICETTE.find((r) => r.id === id);

// ---------------------------------------------------------------------------
// Stato iniziale: menu di lunedi' 5 ottobre 2026, pizza di venerdi'
// ---------------------------------------------------------------------------
export const MENU_5_OTTOBRE = [
  "impepata-cozze",
  "orata-finocchi-olive",
  "platessa-limone-piselli",
  "tagliatelle-funghi-pecorino",
  "arrosto-maiale-peperoni-carote",
  "pasta-fagioli",
];

export function distribuisciCene(ricette: string[], pizzaIdx: number): string[] {
  const cene = Array<string>(GIORNI).fill("");
  let k = 0;
  for (let i = 0; i < GIORNI; i++) {
    if (i === pizzaIdx) cene[i] = PIZZA_ID;
    else cene[i] = ricette[k++] ?? "";
  }
  return cene;
}

export function statoIniziale(now: Date): SpesaState {
  const inizio = lunediDi(now);
  const inCasa: Record<string, boolean> = {};
  for (const i of INGREDIENTI) if (i.inCasa) inCasa[i.id] = true;
  return {
    inizio,
    pizza: "ven",
    pranzi: Array<string>(GIORNI).fill(""),
    cene: distribuisciCene(MENU_5_OTTOBRE, indicePizza(inizio, "ven")),
    prezzi: {},
    carrello: {},
    inCasa,
    extra: {},
    custom: [],
    nonRiconosciute: [],
  };
}

// Ricostruisce uno stato valido da JSON salvato (campi mancanti o corrotti -> default).
export function caricaStato(raw: unknown, now: Date): SpesaState {
  const base = statoIniziale(now);
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const slots = (v: unknown, fallback: string[]) =>
    Array.isArray(v) && v.length === GIORNI && v.every((x) => typeof x === "string") ? (v as string[]) : fallback;
  const rec = <T>(v: unknown, ok: (x: unknown) => boolean, fallback: Record<string, T>) => {
    if (!v || typeof v !== "object" || Array.isArray(v)) return fallback;
    const out: Record<string, T> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) if (ok(x)) out[k] = x as T;
    return out;
  };
  const num = (x: unknown) => typeof x === "number" && isFinite(x) && x >= 0;
  const custom = Array.isArray(r.custom)
    ? (r.custom as unknown[]).filter(
        (c): c is VocePersonalizzata =>
          !!c &&
          typeof c === "object" &&
          typeof (c as VocePersonalizzata).id === "string" &&
          typeof (c as VocePersonalizzata).nome === "string" &&
          (REPARTI as readonly string[]).includes((c as VocePersonalizzata).reparto) &&
          typeof (c as VocePersonalizzata).conf === "string"
      )
    : base.custom;
  const nonRic = Array.isArray(r.nonRiconosciute)
    ? (r.nonRiconosciute as unknown[]).filter(
        (n): n is NonRiconosciuta =>
          !!n && typeof n === "object" && typeof (n as NonRiconosciuta).nome === "string" && num((n as NonRiconosciuta).prezzo)
      )
    : base.nonRiconosciute;
  return {
    inizio: isIso(r.inizio) ? r.inizio : base.inizio,
    pizza: r.pizza === "gio" ? "gio" : "ven",
    pranzi: slots(r.pranzi, base.pranzi),
    cene: slots(r.cene, base.cene),
    prezzi: rec<Prezzo>(
      r.prezzi,
      (x) => !!x && typeof x === "object" && num((x as Prezzo).prezzo) && typeof (x as Prezzo).data === "string",
      base.prezzi
    ),
    carrello: rec<boolean>(r.carrello, (x) => typeof x === "boolean", base.carrello),
    inCasa: rec<boolean>(r.inCasa, (x) => typeof x === "boolean", base.inCasa),
    extra: rec<number>(r.extra, (x) => num(x), base.extra),
    custom,
    nonRiconosciute: nonRic,
  };
}

// ---------------------------------------------------------------------------
// Settimana
// ---------------------------------------------------------------------------
function scambia(cene: string[], a: number, b: number): string[] {
  if (a === b) return cene;
  const out = [...cene];
  [out[a], out[b]] = [out[b], out[a]];
  return out;
}

// Cambia il giorno pizza: la cena pizza si scambia con quella del nuovo giorno.
export function cambiaGiornoPizza(s: SpesaState, nuovo: GiornoPizza): SpesaState {
  const da = indicePizza(s.inizio, s.pizza);
  const a = indicePizza(s.inizio, nuovo);
  return { ...s, pizza: nuovo, cene: scambia(s.cene, da, a) };
}

// Cambia la data di inizio: la pizza resta sul giovedi'/venerdi' scelto.
export function cambiaInizio(s: SpesaState, nuovo: string): SpesaState {
  if (!isIso(nuovo)) return s;
  const da = indicePizza(s.inizio, s.pizza);
  const a = indicePizza(nuovo, s.pizza);
  return { ...s, inizio: nuovo, cene: scambia(s.cene, da, a) };
}

const MAX_CENE_PESCE = 3;
const MAX_CENE_CARNE = 2;

// Suggerisce pranzi e cene: pesce all'inizio (piu' deperibile), max 3 cene di pesce
// e 2 di carne, nessuna ricetta ripetuta, prima le ricette leggere. Pizza sul giorno scelto.
export function suggerisciSettimana(s: SpesaState): { pranzi: string[]; cene: string[] } {
  const pizzaIdx = indicePizza(s.inizio, s.pizza);
  const perPriorita = (a: Ricetta, b: Ricetta) =>
    Number(b.leggera) - Number(a.leggera) || a.deperibilita - b.deperibilita;

  // Cene: slot liberi = tutti tranne la pizza.
  const slotCena = Array.from({ length: GIORNI }, (_, i) => i).filter((i) => i !== pizzaIdx);
  const candidate = RICETTE.filter((r) => r.pasto === "cena" && r.id !== PIZZA_ID).sort(perPriorita);
  const scelte: Ricetta[] = [];
  let pesce = 0;
  let carne = 0;
  for (const r of candidate) {
    if (scelte.length >= slotCena.length) break;
    const isPesce = r.tags.includes("pesce");
    const isCarne = r.tags.includes("carne");
    if (isPesce && pesce >= MAX_CENE_PESCE) continue;
    if (isCarne && carne >= MAX_CENE_CARNE) continue;
    scelte.push(r);
    if (isPesce) pesce++;
    if (isCarne) carne++;
  }
  scelte.sort((a, b) => a.deperibilita - b.deperibilita); // il pesce finisce a inizio settimana
  const cene = Array<string>(GIORNI).fill("");
  cene[pizzaIdx] = PIZZA_ID;
  slotCena.forEach((slot, k) => (cene[slot] = scelte[k]?.id ?? ""));

  // Pranzi: nessuna ripetizione, ordinati per deperibilita'.
  const pr = RICETTE.filter((r) => r.pasto === "pranzo")
    .sort(perPriorita)
    .slice(0, GIORNI)
    .sort((a, b) => a.deperibilita - b.deperibilita);
  const pranzi = Array.from({ length: GIORNI }, (_, i) => pr[i]?.id ?? "");
  return { pranzi, cene };
}

export function riepilogoTag(s: SpesaState): Record<Tag, number> {
  const out = Object.fromEntries(TAGS.map((t) => [t, 0])) as Record<Tag, number>;
  for (const id of [...s.pranzi, ...s.cene]) {
    const r = ricettaPerId(id);
    if (r) for (const t of r.tags) out[t]++;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Lista della spesa
// ---------------------------------------------------------------------------
export interface VoceLista {
  id: string;
  nome: string;
  conf: string;
  reparto: Reparto;
  qta: number; // somma in confezioni (frazioni)
  confezioni: number; // arrotondate per eccesso
  prezzoUnit?: number;
  totale?: number;
}
export interface Lista {
  gruppi: { reparto: Reparto; voci: VoceLista[] }[];
  inCasa: VoceLista[];
  extra: VoceLista[];
  totale: number;
  senzaPrezzo: VoceLista[];
}

// Arrotonda per eccesso, tollerando l'errore di somma in virgola mobile.
export const confezioniDa = (qta: number) => Math.ceil(Math.round(qta * 1e6) / 1e6 - 1e-9);

export function calcolaLista(s: SpesaState): Lista {
  const catalogo = catalogoCompleto(s.custom);
  const perId = new Map(catalogo.map((i) => [i.id, i]));
  const somma = new Map<string, number>();
  for (const id of [...s.pranzi, ...s.cene]) {
    const r = ricettaPerId(id);
    if (!r) continue;
    for (const ing of r.ingredienti) somma.set(ing.id, (somma.get(ing.id) ?? 0) + ing.qta);
  }

  const voce = (id: string, qta: number, confezioni: number): VoceLista | null => {
    const ing = perId.get(id);
    if (!ing) return null;
    const prezzoUnit = s.prezzi[id]?.prezzo;
    return {
      id,
      nome: ing.nome,
      conf: ing.conf,
      reparto: ing.reparto,
      qta,
      confezioni,
      prezzoUnit,
      totale: prezzoUnit === undefined ? undefined : prezzoUnit * confezioni,
    };
  };
  const perNome = (a: VoceLista, b: VoceLista) => a.nome.localeCompare(b.nome, "it");

  const daComprare: VoceLista[] = [];
  const inCasa: VoceLista[] = [];
  for (const [id, qta] of somma) {
    const v = voce(id, qta, confezioniDa(qta));
    if (!v) continue;
    (s.inCasa[id] ? inCasa : daComprare).push(v);
  }
  const extra = Object.entries(s.extra)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => voce(id, n, n))
    .filter((v): v is VoceLista => v !== null)
    .sort(perNome);

  const gruppi = REPARTI.map((reparto) => ({
    reparto,
    voci: daComprare.filter((v) => v.reparto === reparto).sort(perNome),
  })).filter((g) => g.voci.length > 0);

  const tutte = [...daComprare, ...extra];
  return {
    gruppi,
    inCasa: inCasa.sort(perNome),
    extra,
    totale: tutte.reduce((t, v) => t + (v.totale ?? 0), 0),
    senzaPrezzo: tutte.filter((v) => v.totale === undefined),
  };
}

export function costoRicetta(r: Ricetta, prezzi: Record<string, Prezzo>, catalogo: Ingrediente[]) {
  let costo = 0;
  const mancanti: string[] = [];
  for (const ing of r.ingredienti) {
    const p = prezzi[ing.id]?.prezzo;
    if (p === undefined) mancanti.push(catalogo.find((c) => c.id === ing.id)?.nome ?? ing.id);
    else costo += p * ing.qta;
  }
  return { costo, mancanti, completo: mancanti.length === 0 };
}

export const euro = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

// Quantita' in frazioni leggibili: 0.5 -> "½", 1.5 -> "1½", 0.4 -> "0,4".
export function fmtQta(q: number): string {
  const frazioni: [number, string][] = [
    [1 / 4, "¼"],
    [1 / 3, "⅓"],
    [1 / 2, "½"],
    [2 / 3, "⅔"],
    [3 / 4, "¾"],
  ];
  const intero = Math.floor(q + 1e-9);
  const resto = q - intero;
  if (resto < 0.02) return String(intero);
  for (const [v, s] of frazioni) if (Math.abs(resto - v) < 0.02) return `${intero > 0 ? intero : ""}${s}`;
  return q.toFixed(2).replace(/0+$/, "").replace(/\.$/, "").replace(".", ",");
}

export function testoLista(lista: Lista, inizio: string): string {
  const righe: string[] = [`Lista della spesa — settimana dal ${fromIso(inizio).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}`];
  const riga = (v: VoceLista) => `- ${v.confezioni} × ${v.nome} (${v.conf})${v.totale !== undefined ? ` — ${euro(v.totale)}` : ""}`;
  for (const g of lista.gruppi) {
    righe.push("", g.reparto.toUpperCase(), ...g.voci.map(riga));
  }
  if (lista.extra.length > 0) righe.push("", "EXTRA", ...lista.extra.map(riga));
  righe.push("", `Totale stimato: ${euro(lista.totale)}`);
  if (lista.senzaPrezzo.length > 0) righe.push(`(${lista.senzaPrezzo.length} voci senza prezzo)`);
  return righe.join("\n");
}

// ---------------------------------------------------------------------------
// Scontrino
// ---------------------------------------------------------------------------
export function normalizza(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const IGNORA =
  /\b(totale|subtotale|resto|iva|sconto|sconti|contanti|pagamento|pagato|carta|bancomat|pos|importo|punti|saldo|buono|scontrino|documento|cassa|ricevuta|fattura|euro|eur)\b|\barrotond|\barticol/i;
const RIGA_PREZZO = /^(.*\S)\s+(-?\d+[.,]\d{1,2})\s*(?:€|eur)?\s*[A-Za-z]?\s*$/i;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Trova l'ingrediente con l'alias piu' lungo (a parita': piu' vicino all'inizio della riga).
export function abbina(nome: string, catalogo: Ingrediente[]): string | null {
  const n = normalizza(nome);
  let best: { id: string; len: number; pos: number } | null = null;
  for (const ing of catalogo) {
    for (const a of ing.alias) {
      const alias = normalizza(a);
      if (!alias) continue;
      const m = new RegExp(`\\b${esc(alias)}`).exec(n);
      if (!m) continue;
      if (!best || alias.length > best.len || (alias.length === best.len && m.index < best.pos)) {
        best = { id: ing.id, len: alias.length, pos: m.index };
      }
    }
  }
  return best?.id ?? null;
}

export interface EsitoScontrino {
  riconosciute: { id: string; nome: string; prezzo: number }[];
  nonRiconosciute: NonRiconosciuta[];
}

export function parseScontrino(testo: string, catalogo: Ingrediente[]): EsitoScontrino {
  const esito: EsitoScontrino = { riconosciute: [], nonRiconosciute: [] };
  for (const riga of testo.split(/\r?\n/)) {
    const t = riga.trim();
    if (!t || IGNORA.test(t)) continue;
    const m = RIGA_PREZZO.exec(t);
    if (!m) continue;
    const prezzo = Number(m[2].replace(",", "."));
    if (!isFinite(prezzo) || prezzo <= 0) continue;
    const nome = m[1].replace(/\s+/g, " ").trim();
    if (!/[a-zA-Z]{2,}/.test(nome)) continue;
    const id = abbina(nome, catalogo);
    if (id) esito.riconosciute.push({ id, nome, prezzo });
    else esito.nonRiconosciute.push({ nome, prezzo });
  }
  return esito;
}

export function applicaScontrino(s: SpesaState, esito: EsitoScontrino, oggi: string): SpesaState {
  const prezzi = { ...s.prezzi };
  for (const r of esito.riconosciute) prezzi[r.id] = { prezzo: r.prezzo, data: oggi };
  const visti = new Set(esito.nonRiconosciute.map((n) => n.nome.toLowerCase()));
  const nonRiconosciute = [
    ...s.nonRiconosciute.filter((n) => !visti.has(n.nome.toLowerCase())),
    ...esito.nonRiconosciute,
  ];
  return { ...s, prezzi, nonRiconosciute };
}

export function slug(s: string): string {
  return normalizza(s).replace(/\s+/g, "-").slice(0, 30) || "voce";
}

// Aggiunge una voce personalizzata al listino (dal pannello "non riconosciute").
export function aggiungiVoce(s: SpesaState, nome: string, prezzo: number, reparto: Reparto, oggi: string, uid: string): SpesaState {
  const id = `c-${slug(nome)}-${uid}`;
  return {
    ...s,
    custom: [...s.custom, { id, nome, reparto, conf: "1 pz" }],
    prezzi: { ...s.prezzi, [id]: { prezzo, data: oggi } },
    nonRiconosciute: s.nonRiconosciute.filter((n) => !(n.nome === nome && n.prezzo === prezzo)),
  };
}

// Tipi condivisi dai componenti delle tab.
export type Update = (fn: (s: SpesaState) => SpesaState) => void;
export interface TabProps {
  state: SpesaState;
  update: Update;
}
