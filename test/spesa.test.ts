// Test della logica "Spesa & Ricette". Esegui con: npm test
import {
  INGREDIENTI,
  RICETTE,
  PIZZA_ID,
  abbina,
  applicaScontrino,
  cambiaGiornoPizza,
  cambiaInizio,
  caricaStato,
  catalogoCompleto,
  calcolaLista,
  confezioniDa,
  costoRicetta,
  fmtQta,
  indicePizza,
  lunediDi,
  parseScontrino,
  riepilogoTag,
  statoIniziale,
  suggerisciSettimana,
  aggiungiVoce,
} from "../src/lib/spesa";

let failures = 0;
function is(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: ${JSON.stringify(actual)}${ok ? "" : ` (atteso ${JSON.stringify(expected)})`}`);
  if (!ok) failures++;
}
const nome = (id: string) => RICETTE.find((r) => r.id === id)?.nome ?? "";

const lunedi5 = new Date(2026, 9, 5); // lunedi' 5 ottobre 2026
const s0 = statoIniziale(lunedi5);

console.log("\n=== SETTIMANA INIZIALE ===");
is("inizio = lunedi' corrente", s0.inizio, "2026-10-05");
is("lunedi' di un mercoledi'", lunediDi(new Date(2026, 9, 7)), "2026-10-05");
is("lunedi' di una domenica", lunediDi(new Date(2026, 9, 11)), "2026-10-05");
is("pizza di venerdi' = indice 4", indicePizza(s0.inizio, "ven"), 4);
is("pizza di giovedi' = indice 3", indicePizza(s0.inizio, "gio"), 3);
is("cene del 5 ottobre", s0.cene.map(nome), [
  "Impepata di cozze",
  "Orata con finocchi e olive nere",
  "Platessa al limone con piselli",
  "Tagliatelle ai funghi e pecorino",
  "Serata pizza con insalata di finocchi e pompelmo",
  "Arrosto di maiale con peperoni gialli e carote",
  "Pasta e fagioli",
]);
is("pranzi vuoti", s0.pranzi.every((p) => p === ""), true);
is("nessun prezzo", Object.keys(s0.prezzi).length, 0);
is("in casa di default", Object.keys(s0.inCasa).sort(), ["aglio", "olio", "pane"]);
is("pizza ogni settimana", s0.cene.filter((c) => c === PIZZA_ID).length, 1);

console.log("\n=== GIORNO PIZZA ===");
const sGio = cambiaGiornoPizza(s0, "gio");
is("pizza spostata a giovedi'", sGio.cene[3], PIZZA_ID);
is("la cena di giovedi' passa a venerdi'", sGio.cene[4], "tagliatelle-funghi-pecorino");
is("ancora 1 sola pizza", sGio.cene.filter((c) => c === PIZZA_ID).length, 1);
is("tornando a venerdi' si ripristina", cambiaGiornoPizza(sGio, "ven").cene, s0.cene);
const sInizio = cambiaInizio(s0, "2026-10-12");
is("cambio data: pizza resta sul venerdi'", sInizio.cene[indicePizza("2026-10-12", "ven")], PIZZA_ID);

console.log("\n=== SUGGERISCI ===");
for (const pizza of ["ven", "gio"] as const) {
  const st = cambiaGiornoPizza({ ...s0, pranzi: Array(7).fill("") }, pizza);
  const sug = suggerisciSettimana(st);
  const ricette = (ids: string[]) => ids.map((id) => RICETTE.find((r) => r.id === id)!);
  const cene = ricette(sug.cene);
  const pranzi = ricette(sug.pranzi);
  const tutte = [...sug.cene, ...sug.pranzi];
  is(`[${pizza}] 1 pizza sul giorno scelto`, sug.cene[indicePizza(st.inizio, pizza)], PIZZA_ID);
  is(`[${pizza}] nessuna ripetuta`, new Set(tutte).size, tutte.length);
  is(`[${pizza}] tutti gli slot pieni`, tutte.every(Boolean), true);
  is(`[${pizza}] max 3 cene di pesce`, cene.filter((r) => r.tags.includes("pesce")).length <= 3, true);
  is(`[${pizza}] max 2 cene di carne`, cene.filter((r) => r.tags.includes("carne")).length <= 2, true);
  is(`[${pizza}] pranzi solo da pranzo`, pranzi.every((r) => r.pasto === "pranzo"), true);
  is(`[${pizza}] cene solo da cena`, cene.every((r) => r.pasto === "cena"), true);
  const nonPizza = cene.filter((r) => r.id !== PIZZA_ID);
  is(`[${pizza}] pesce prima di tutto`, nonPizza.slice(0, 3).map((r) => r.id), [
    "impepata-cozze",
    "orata-finocchi-olive",
    "platessa-limone-piselli",
  ]);
  is(`[${pizza}] pasta fresca dopo il pesce`, nonPizza[3].id, "tagliatelle-funghi-pecorino");
  is(`[${pizza}] niente arrosto (non leggero) se ce ne sono altre`, sug.cene.includes("arrosto-maiale-peperoni-carote"), false);
}

console.log("\n=== RIEPILOGO TAG ===");
const r0 = riepilogoTag(s0);
is("pesce (cozze, orata, platessa)", r0.pesce, 3);
is("legumi (pasta e fagioli)", r0.legumi, 1);
is("carne (arrosto)", r0.carne, 1);
is("uova", r0.uova, 0);
is("pasta (tagliatelle, pasta e fagioli)", r0.pasta, 2);
is("verdure (orata, platessa, tagliatelle, pizza, arrosto, pasta e fagioli)", r0.verdure, 6);

console.log("\n=== LISTA SPESA ===");
const l0 = calcolaLista(s0);
const trova = (id: string) => [...l0.gruppi.flatMap((g) => g.voci), ...l0.inCasa].find((v) => v.id === id);
is("limoni: 3 ricette da 1/3 = 1 confezione (no errore di somma)", trova("limone")?.confezioni, 1);
is("finocchi: orata 1 + pizza 1 = 2", trova("finocchio")?.confezioni, 2);
is("olive: 0.25+0.2 = 0.45 -> 1", trova("olive")?.confezioni, 1);
is("piselli: 0.5 -> 1 confezione", trova("piselli")?.confezioni, 1);
is("carote: 0.5+0.2 = 0.7 -> 1", trova("carote")?.confezioni, 1);
is("olio/aglio/pane in 'gia' in casa'", l0.inCasa.map((v) => v.id).sort(), ["aglio", "olio", "pane"]);
is("olio non e' tra le voci da comprare", l0.gruppi.flatMap((g) => g.voci).some((v) => v.id === "olio"), false);
is("reparti presenti", l0.gruppi.map((g) => g.reparto), [
  "Pesce",
  "Carne e salumi",
  "Frutta e verdura",
  "Latticini e uova",
  "Pasta e dispensa",
  "Surgelati e pronti",
]);
is("totale 0 senza prezzi", l0.totale, 0);
is("tutte le voci senza prezzo", l0.senzaPrezzo.length, l0.gruppi.flatMap((g) => g.voci).length);
is("arrotondamento 2.0000001 -> 3? no, 2", confezioniDa(1 / 3 + 1 / 3 + 1 / 3 + 1), 2);
is("arrotondamento 1.02 -> 2", confezioniDa(1.02), 2);

const sCasa = { ...s0, inCasa: { ...s0.inCasa, limone: true } };
is("'ho gia'' sposta in casa", calcolaLista(sCasa).inCasa.some((v) => v.id === "limone"), true);
const sTorna = { ...sCasa, inCasa: { ...sCasa.inCasa, limone: false } };
is("'devo comprarlo' rimette in lista", calcolaLista(sTorna).gruppi.flatMap((g) => g.voci).some((v) => v.id === "limone"), true);

console.log("\n=== PREZZI E TOTALE ===");
const sPrezzi = {
  ...s0,
  prezzi: { cozze: { prezzo: 5, data: "2026-10-05" }, finocchio: { prezzo: 1.5, data: "2026-10-05" } },
};
const lp = calcolaLista(sPrezzi);
is("totale = 1×5 + 2×1,5", lp.totale, 8);
is("le altre voci sono senza prezzo", lp.senzaPrezzo.some((v) => v.id === "cozze"), false);
const sExtra = { ...sPrezzi, extra: { cozze: 1, tonno: 2 } };
const le = calcolaLista(sExtra);
is("extra nel totale", le.totale, 13);
is("extra elencati", le.extra.map((v) => [v.id, v.confezioni]), [["cozze", 1], ["tonno", 2]]);
const cat = catalogoCompleto([]);
const impepata = RICETTE.find((r) => r.id === "impepata-cozze")!;
const c1 = costoRicetta(impepata, sPrezzi.prezzi, cat);
is("costo ricetta parziale", [c1.completo, Math.round(c1.costo * 100) / 100], [false, 5]);
is("costo ricetta senza prezzi", costoRicetta(impepata, {}, cat).costo, 0);

console.log("\n=== SCONTRINO ===");
const scontrino = `
FINOCCHI KG 1,99
COZZE RETE 1KG 4,50
OLIO EXTRAVERGINE OLIVA 6,90
OLIVE NERE DENOCC 1,29
LATTE PARZ SCREM 1L 1,45
PASSATA POMODORO 700G 1,10
DETERSIVO PIATTI 2,10
SCONTO FIDELITY -0,50
TOTALE EURO 17,33
RESTO 0,00
IVA 10% 1,50
CONTANTI 20,00
`;
const es = parseScontrino(scontrino, cat);
is("riconosciute", es.riconosciute.map((r) => [r.id, r.prezzo]), [
  ["finocchio", 1.99],
  ["cozze", 4.5],
  ["olio", 6.9],
  ["olive", 1.29],
  ["passata", 1.1],
]);
is("non riconosciute (ignora totale/resto/IVA/sconti)", es.nonRiconosciute, [
  { nome: "LATTE PARZ SCREM 1L", prezzo: 1.45 },
  { nome: "DETERSIVO PIATTI", prezzo: 2.1 },
]);
is("olio non confuso con olive", abbina("OLIO EXTRAVERGINE OLIVA", cat), "olio");
is("passata non confusa con pomodori", abbina("PASSATA POMODORO", cat), "passata");
is("alias a inizio parola: finocch -> finocchio", abbina("FINOCCH.VERDI", cat), "finocchio");

const sScont = applicaScontrino(s0, es, "2026-10-06");
is("prezzo aggiornato con data", sScont.prezzi.finocchio, { prezzo: 1.99, data: "2026-10-06" });
is("non riconosciute salvate", sScont.nonRiconosciute.length, 2);
const sVoce = aggiungiVoce(sScont, "DETERSIVO PIATTI", 2.1, "Altro", "2026-10-06", "x1");
is("'+ listino' crea la voce personalizzata", sVoce.custom.map((c) => c.nome), ["DETERSIVO PIATTI"]);
is("e ne salva il prezzo", Object.values(sVoce.prezzi).some((p) => p.prezzo === 2.1), true);
is("e la toglie dalle non riconosciute", sVoce.nonRiconosciute.length, 1);
const catC = catalogoCompleto(sVoce.custom);
is("voce personalizzata riconosciuta al prossimo scontrino", abbina("DETERSIVO PIATTI 2,10", catC), sVoce.custom[0].id);
const lc = calcolaLista({ ...sVoce, extra: { [sVoce.custom[0].id]: 2 } });
is("voce personalizzata come extra, con prezzo", lc.extra.map((v) => [v.nome, v.totale]), [["DETERSIVO PIATTI", 4.2]]);

console.log("\n=== FORMATO E PERSISTENZA ===");
is("1/2", fmtQta(0.5), "½");
is("1 e 1/2", fmtQta(1.5), "1½");
is("1/3", fmtQta(1 / 3), "⅓");
is("intero", fmtQta(2), "2");
is("0,4", fmtQta(0.4), "0,4");
is("stato corrotto -> default", caricaStato({ cene: "x", pranzi: [1, 2] }, lunedi5).cene, s0.cene);
is("null -> default", caricaStato(null, lunedi5).inizio, "2026-10-05");
const ricaricato = caricaStato(JSON.parse(JSON.stringify(sVoce)), lunedi5);
is("round-trip JSON", ricaricato, sVoce);
is("ingredienti delle ricette esistono tutti", RICETTE.every((r) => r.ingredienti.every((i) => INGREDIENTI.some((x) => x.id === i.id))), true);
is("nessun prezzo nel catalogo", JSON.stringify(INGREDIENTI).includes("prezzo"), false);

console.log(`\n${failures === 0 ? "TUTTI I TEST PASSATI ✅" : `${failures} TEST FALLITI ❌`}`);
process.exit(failures === 0 ? 0 : 1);
