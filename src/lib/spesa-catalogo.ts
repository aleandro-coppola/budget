// Dati statici di "Spesa & Ricette": reparti, listino ingredienti, ricette.
// Nessun prezzo qui: i prezzi arrivano solo dallo scontrino incollato dall'utente.
// Le quantita' delle ricette sono frazioni di confezione (es. 0.5 = mezza confezione).

export const REPARTI = [
  "Pesce",
  "Carne e salumi",
  "Frutta e verdura",
  "Latticini e uova",
  "Pasta e dispensa",
  "Surgelati e pronti",
  "Altro",
] as const;
export type Reparto = (typeof REPARTI)[number];

export type Tag = "pesce" | "legumi" | "carne" | "uova" | "pasta" | "verdure";
export const TAGS: Tag[] = ["pesce", "legumi", "carne", "uova", "pasta", "verdure"];

export interface Ingrediente {
  id: string;
  nome: string;
  reparto: Reparto;
  conf: string; // cosa e' una confezione/pezzo (descrizione, non un prezzo)
  alias: string[]; // radici per riconoscere le righe dello scontrino
  inCasa?: boolean; // gia' in casa di default
}

export interface Ricetta {
  id: string;
  nome: string;
  pasto: "pranzo" | "cena";
  tags: Tag[];
  deperibilita: number; // 1 = da usare per primo
  leggera: boolean;
  ingredienti: { id: string; qta: number }[];
  passi: string[];
}

export const PIZZA_ID = "pizza-serata";

export const INGREDIENTI: Ingrediente[] = [
  // Pesce
  { id: "cozze", nome: "Cozze", reparto: "Pesce", conf: "1 kg", alias: ["cozz", "mitil"] },
  { id: "orata", nome: "Orata", reparto: "Pesce", conf: "1 pz da ~350 g", alias: ["orata", "orate"] },
  { id: "platessa", nome: "Platessa", reparto: "Pesce", conf: "filetti 300 g", alias: ["platess"] },
  { id: "salmone", nome: "Salmone affumicato", reparto: "Pesce", conf: "100 g", alias: ["salmon"] },
  // Carne e salumi
  { id: "maiale", nome: "Arrosto di maiale", reparto: "Carne e salumi", conf: "600 g", alias: ["arrosto", "lonza", "maiale"] },
  { id: "pollo", nome: "Petto di pollo", reparto: "Carne e salumi", conf: "400 g", alias: ["pollo"] },
  { id: "salada", nome: "Carne salada", reparto: "Carne e salumi", conf: "100 g", alias: ["salada"] },
  // Frutta e verdura
  { id: "finocchio", nome: "Finocchi", reparto: "Frutta e verdura", conf: "1 pz", alias: ["finocch"] },
  { id: "limone", nome: "Limoni", reparto: "Frutta e verdura", conf: "3 pz", alias: ["limon"] },
  { id: "funghi", nome: "Funghi champignon", reparto: "Frutta e verdura", conf: "400 g", alias: ["fungh", "champignon"] },
  { id: "peperoni", nome: "Peperoni gialli", reparto: "Frutta e verdura", conf: "1 pz", alias: ["peperon"] },
  { id: "carote", nome: "Carote", reparto: "Frutta e verdura", conf: "500 g", alias: ["carot"] },
  { id: "pompelmo", nome: "Pompelmo rosa", reparto: "Frutta e verdura", conf: "1 pz", alias: ["pompelm"] },
  { id: "zucchine", nome: "Zucchine", reparto: "Frutta e verdura", conf: "500 g", alias: ["zucchin"] },
  { id: "cetrioli", nome: "Cetrioli", reparto: "Frutta e verdura", conf: "1 pz", alias: ["cetriol"] },
  { id: "pomodori", nome: "Pomodori", reparto: "Frutta e verdura", conf: "500 g", alias: ["pomodor"] },
  { id: "cipolla", nome: "Cipolle", reparto: "Frutta e verdura", conf: "500 g", alias: ["cipoll"] },
  { id: "patate", nome: "Patate", reparto: "Frutta e verdura", conf: "1 kg", alias: ["patat"] },
  { id: "sedano", nome: "Sedano", reparto: "Frutta e verdura", conf: "1 pz", alias: ["sedan"] },
  { id: "prezzemolo", nome: "Prezzemolo", reparto: "Frutta e verdura", conf: "mazzetto", alias: ["prezzem"] },
  { id: "rosmarino", nome: "Rosmarino", reparto: "Frutta e verdura", conf: "mazzetto", alias: ["rosmar"] },
  { id: "aglio", nome: "Aglio", reparto: "Frutta e verdura", conf: "1 testa", alias: ["aglio"], inCasa: true },
  // Latticini e uova
  { id: "uova", nome: "Uova", reparto: "Latticini e uova", conf: "6 pz", alias: ["uova", "uovo"] },
  { id: "feta", nome: "Feta", reparto: "Latticini e uova", conf: "200 g", alias: ["feta"] },
  { id: "pecorino", nome: "Pecorino", reparto: "Latticini e uova", conf: "100 g", alias: ["pecorin"] },
  { id: "stracchino", nome: "Stracchino", reparto: "Latticini e uova", conf: "100 g", alias: ["stracch"] },
  { id: "bocconcini", nome: "Mozzarella bocconcini", reparto: "Latticini e uova", conf: "150 g", alias: ["bocconc", "mozzarell"] },
  // Pasta e dispensa
  { id: "tagliatelle", nome: "Tagliatelle fresche", reparto: "Pasta e dispensa", conf: "250 g", alias: ["tagliatel"] },
  { id: "orecchiette", nome: "Orecchiette", reparto: "Pasta e dispensa", conf: "500 g", alias: ["orecchiet"] },
  {
    id: "pasta-corta",
    nome: "Pasta corta",
    reparto: "Pasta e dispensa",
    conf: "500 g",
    alias: ["ditalin", "pasta mista", "maccheron", "penne", "fusill"],
  },
  { id: "fagioli", nome: "Fagioli borlotti", reparto: "Pasta e dispensa", conf: "400 g", alias: ["fagiol", "borlott"] },
  { id: "ceci", nome: "Ceci", reparto: "Pasta e dispensa", conf: "400 g", alias: ["ceci"] },
  { id: "tonno", nome: "Tonno in scatola", reparto: "Pasta e dispensa", conf: "1 scatola", alias: ["tonno"] },
  { id: "olive", nome: "Olive nere", reparto: "Pasta e dispensa", conf: "1 vasetto", alias: ["olive"] },
  { id: "passata", nome: "Passata di pomodoro", reparto: "Pasta e dispensa", conf: "700 g", alias: ["passata"] },
  { id: "olio", nome: "Olio extravergine", reparto: "Pasta e dispensa", conf: "1 bottiglia", alias: ["olio"], inCasa: true },
  { id: "pane", nome: "Pane", reparto: "Pasta e dispensa", conf: "1 pz", alias: ["pane"], inCasa: true },
  // Surgelati e pronti
  { id: "piselli", nome: "Piselli surgelati", reparto: "Surgelati e pronti", conf: "450 g", alias: ["pisell"] },
  { id: "pizza", nome: "Pizza", reparto: "Surgelati e pronti", conf: "1 pz", alias: ["pizza"] },
];

const T = 1 / 3; // un terzo di confezione (es. 1 limone su 3), esatto in somma

export const RICETTE: Ricetta[] = [
  // ---- Cene dal menu del 5 ottobre 2026 ----
  {
    id: "impepata-cozze",
    nome: "Impepata di cozze",
    pasto: "cena",
    tags: ["pesce"],
    deperibilita: 1,
    leggera: true,
    ingredienti: [
      { id: "cozze", qta: 1 },
      { id: "limone", qta: T },
      { id: "prezzemolo", qta: 0.25 },
      { id: "aglio", qta: 0.1 },
      { id: "pane", qta: 0.1 },
      { id: "olio", qta: 0.05 },
    ],
    passi: [
      "Pulisci le cozze, elimina il bisso e lavale sotto acqua corrente.",
      "In un tegame largo scalda olio e aglio, aggiungi le cozze e copri.",
      "Quando si aprono spegni, aggiungi prezzemolo, pepe e succo di limone.",
      "Servi con pane tostato.",
    ],
  },
  {
    id: "orata-finocchi-olive",
    nome: "Orata con finocchi e olive nere",
    pasto: "cena",
    tags: ["pesce", "verdure"],
    deperibilita: 2,
    leggera: true,
    ingredienti: [
      { id: "orata", qta: 2 },
      { id: "finocchio", qta: 1 },
      { id: "olive", qta: 0.25 },
      { id: "limone", qta: T },
      { id: "olio", qta: 0.05 },
    ],
    passi: [
      "Taglia i finocchi a spicchi e infornali 15 minuti a 200 °C con un filo d'olio.",
      "Aggiungi le orate pulite e le olive nere, cuoci altri 20 minuti.",
      "Finisci con succo di limone.",
    ],
  },
  {
    id: "platessa-limone-piselli",
    nome: "Platessa al limone con piselli",
    pasto: "cena",
    tags: ["pesce", "verdure"],
    deperibilita: 3,
    leggera: true,
    ingredienti: [
      { id: "platessa", qta: 1 },
      { id: "limone", qta: T },
      { id: "piselli", qta: 0.5 },
      { id: "prezzemolo", qta: 0.25 },
      { id: "aglio", qta: 0.05 },
      { id: "olio", qta: 0.05 },
    ],
    passi: [
      "Cuoci i piselli in padella con olio, aglio e un goccio d'acqua per 10 minuti.",
      "Cuoci i filetti di platessa 3 minuti per lato in padella antiaderente.",
      "Servi con succo di limone e prezzemolo.",
    ],
  },
  {
    id: "tagliatelle-funghi-pecorino",
    nome: "Tagliatelle ai funghi e pecorino",
    pasto: "cena",
    tags: ["pasta", "verdure"],
    deperibilita: 4,
    leggera: true,
    ingredienti: [
      { id: "tagliatelle", qta: 1 },
      { id: "funghi", qta: 1 },
      { id: "pecorino", qta: 0.3 },
      { id: "aglio", qta: 0.05 },
      { id: "prezzemolo", qta: 0.25 },
      { id: "olio", qta: 0.05 },
    ],
    passi: [
      "Affetta i funghi e saltali a fuoco vivo con olio e aglio.",
      "Cuoci le tagliatelle fresche 2-3 minuti in acqua salata.",
      "Manteca con i funghi, il pecorino e il prezzemolo.",
    ],
  },
  {
    id: PIZZA_ID,
    nome: "Serata pizza con insalata di finocchi e pompelmo",
    pasto: "cena",
    tags: ["verdure"],
    deperibilita: 5,
    leggera: true,
    ingredienti: [
      { id: "pizza", qta: 2 },
      { id: "finocchio", qta: 1 },
      { id: "pompelmo", qta: 1 },
      { id: "salmone", qta: 1 },
      { id: "olive", qta: 0.2 },
      { id: "olio", qta: 0.03 },
    ],
    passi: [
      "Taglia i finocchi a fettine sottili e il pompelmo a spicchi pelati a vivo.",
      "Condisci con olive nere, olio e un po' di succo di pompelmo.",
      "Servi con il salmone affumicato accanto alla pizza.",
    ],
  },
  {
    id: "arrosto-maiale-peperoni-carote",
    nome: "Arrosto di maiale con peperoni gialli e carote",
    pasto: "cena",
    tags: ["carne", "verdure"],
    deperibilita: 7,
    leggera: false,
    ingredienti: [
      { id: "maiale", qta: 1 },
      { id: "peperoni", qta: 2 },
      { id: "carote", qta: 0.5 },
      { id: "rosmarino", qta: 0.5 },
      { id: "aglio", qta: 0.1 },
      { id: "olio", qta: 0.05 },
    ],
    passi: [
      "Rosola l'arrosto da tutti i lati con olio, aglio e rosmarino.",
      "Aggiungi peperoni a pezzi e carote a rondelle con un mestolo d'acqua.",
      "Cuoci coperto a fuoco basso 45-50 minuti, poi affetta e servi con le verdure.",
    ],
  },
  {
    id: "pasta-fagioli",
    nome: "Pasta e fagioli",
    pasto: "cena",
    tags: ["legumi", "pasta", "verdure"],
    deperibilita: 9,
    leggera: true,
    ingredienti: [
      { id: "fagioli", qta: 1 },
      { id: "pasta-corta", qta: 0.3 },
      { id: "passata", qta: 0.3 },
      { id: "sedano", qta: 0.25 },
      { id: "carote", qta: 0.2 },
      { id: "cipolla", qta: 0.1 },
      { id: "rosmarino", qta: 0.25 },
      { id: "aglio", qta: 0.05 },
      { id: "olio", qta: 0.05 },
    ],
    passi: [
      "Soffriggi sedano, carota e cipolla tritati con olio, aglio e rosmarino.",
      "Aggiungi passata e fagioli, cuoci 15 minuti schiacciandone un po'.",
      "Unisci la pasta con acqua calda e cuoci fino a cottura, lasciando cremoso.",
    ],
  },
  // ---- Cene aggiuntive leggere ----
  {
    id: "pollo-limone-zucchine",
    nome: "Petto di pollo al limone con zucchine",
    pasto: "cena",
    tags: ["carne", "verdure"],
    deperibilita: 6,
    leggera: true,
    ingredienti: [
      { id: "pollo", qta: 1 },
      { id: "limone", qta: T },
      { id: "zucchine", qta: 0.8 },
      { id: "olio", qta: 0.05 },
    ],
    passi: [
      "Taglia le zucchine a rondelle e saltale in padella con un filo d'olio.",
      "Cuoci il pollo a fettine 4 minuti per lato, sfuma con succo di limone.",
      "Servi con le zucchine.",
    ],
  },
  // ---- Pranzi jolly ----
  {
    id: "insalata-ceci-tonno",
    nome: "Insalata di ceci e tonno",
    pasto: "pranzo",
    tags: ["pesce", "legumi", "verdure"],
    deperibilita: 2,
    leggera: true,
    ingredienti: [
      { id: "ceci", qta: 1 },
      { id: "tonno", qta: 1 },
      { id: "pomodori", qta: 0.4 },
      { id: "cipolla", qta: 0.1 },
      { id: "prezzemolo", qta: 0.25 },
      { id: "limone", qta: T },
      { id: "olio", qta: 0.03 },
    ],
    passi: [
      "Scola e sciacqua i ceci, mescolali con il tonno sgocciolato.",
      "Aggiungi pomodori a dadini, cipolla sottile e prezzemolo.",
      "Condisci con olio e limone.",
    ],
  },
  {
    id: "insalata-greca",
    nome: "Insalata greca",
    pasto: "pranzo",
    tags: ["verdure"],
    deperibilita: 3,
    leggera: true,
    ingredienti: [
      { id: "pomodori", qta: 0.6 },
      { id: "cetrioli", qta: 1 },
      { id: "feta", qta: 0.5 },
      { id: "olive", qta: 0.2 },
      { id: "cipolla", qta: 0.1 },
      { id: "olio", qta: 0.03 },
    ],
    passi: [
      "Taglia pomodori e cetrioli a pezzi, la cipolla a fettine sottili.",
      "Aggiungi la feta a cubetti e le olive.",
      "Condisci con olio e origano.",
    ],
  },
  {
    id: "piatto-freddo",
    nome: "Piatto freddo: carne salada, stracchino, cetrioli",
    pasto: "pranzo",
    tags: ["carne"],
    deperibilita: 4,
    leggera: true,
    ingredienti: [
      { id: "salada", qta: 1 },
      { id: "stracchino", qta: 1 },
      { id: "cetrioli", qta: 0.5 },
      { id: "pane", qta: 0.25 },
    ],
    passi: [
      "Disponi la carne salada su un piatto con lo stracchino.",
      "Affetta i cetrioli e aggiungi un filo d'olio.",
      "Servi con pane.",
    ],
  },
  {
    id: "pasta-bocconcini-olive",
    nome: "Pasta con bocconcini e olive",
    pasto: "pranzo",
    tags: ["pasta"],
    deperibilita: 5,
    leggera: true,
    ingredienti: [
      { id: "pasta-corta", qta: 0.3 },
      { id: "bocconcini", qta: 1 },
      { id: "olive", qta: 0.2 },
      { id: "pomodori", qta: 0.3 },
      { id: "olio", qta: 0.03 },
    ],
    passi: [
      "Cuoci la pasta e raffreddala sotto acqua corrente.",
      "Condisci con bocconcini, olive nere e pomodori a dadini.",
      "Finisci con olio a crudo.",
    ],
  },
  {
    id: "frittata-verdure-feta",
    nome: "Frittata di verdure e feta",
    pasto: "pranzo",
    tags: ["uova", "verdure"],
    deperibilita: 6,
    leggera: true,
    ingredienti: [
      { id: "uova", qta: 4 / 6 },
      { id: "zucchine", qta: 0.4 },
      { id: "cipolla", qta: 0.1 },
      { id: "feta", qta: 0.5 },
      { id: "olio", qta: 0.03 },
    ],
    passi: [
      "Salta zucchine e cipolla a fettine con poco olio.",
      "Versa le uova sbattute con la feta sbriciolata.",
      "Cuoci coperta a fuoco basso, poi girala o finiscila in forno.",
    ],
  },
  {
    id: "minestrone-fagioli",
    nome: "Minestrone di verdure e fagioli",
    pasto: "pranzo",
    tags: ["legumi", "verdure"],
    deperibilita: 7,
    leggera: true,
    ingredienti: [
      { id: "carote", qta: 0.4 },
      { id: "zucchine", qta: 0.4 },
      { id: "patate", qta: 0.4 },
      { id: "sedano", qta: 0.25 },
      { id: "fagioli", qta: 0.5 },
      { id: "cipolla", qta: 0.1 },
      { id: "passata", qta: 0.2 },
      { id: "olio", qta: 0.05 },
    ],
    passi: [
      "Taglia le verdure a dadini e soffriggi cipolla e sedano.",
      "Aggiungi le altre verdure, la passata e acqua, cuoci 25 minuti.",
      "Unisci i fagioli a fine cottura e servi con un filo d'olio.",
    ],
  },
  {
    id: "orecchiette-piselli-pecorino",
    nome: "Orecchiette con piselli e pecorino",
    pasto: "pranzo",
    tags: ["pasta", "verdure"],
    deperibilita: 8,
    leggera: true,
    ingredienti: [
      { id: "orecchiette", qta: 0.4 },
      { id: "piselli", qta: 0.5 },
      { id: "pecorino", qta: 0.3 },
      { id: "aglio", qta: 0.05 },
      { id: "olio", qta: 0.05 },
    ],
    passi: [
      "Cuoci i piselli in padella con olio, aglio e acqua per 10 minuti.",
      "Cuoci le orecchiette e saltale con i piselli.",
      "Manteca con pecorino grattugiato.",
    ],
  },
];
