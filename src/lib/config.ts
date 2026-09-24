// Configurazione Budget Ale & Cris
// Costanti NON presenti nel DB Notion (stipendi, cibo, tetti).
// Modifica qui i valori quando cambiano stipendi o regole.
// Gli stipendi possono anche essere sovrascritti da variabili d'ambiente.

export type Person = "ale" | "cris";

export const NOTION = {
  // Database "Spese" nel Finance Tracker
  databaseId: "27253915-e418-80f3-9617-f42f80794725",
  // ID delle pagine Account per relazione "Accounts"
  accountId: {
    ale: "27253915-e418-80c8-9c84-f4adfa38de8d",
    cris: "27253915-e418-80d1-b464-d47b60f2ef99",
  } as Record<Person, string>,
};

export const CONFIG = {
  // Stipendio lordo mensile (env override: SALARY_ALE / SALARY_CRIS)
  stipendio: {
    ale: Number(process.env.SALARY_ALE ?? 1900),
    cris: Number(process.env.SALARY_CRIS ?? 1500),
  } as Record<Person, number>,

  // Cibo: importo fisso mensile (non dal DB, non scala col reddito)
  cibo: { ale: 220, cris: 130 } as Record<Person, number>,

  // Pocket in % del RIMANENTE (libero - cibo - casa - spese Revolut personali - quota condivise).
  // cap = tetto massimo mensile in €.
  // Cointestato 30%: ~3-4 cene, un paio di cinema e uscite nel weekend (~300€/mese in due).
  pockets: {
    investimenti: { ale: { pct: 10, cap: 200 }, cris: { pct: 0, cap: 100 } },
    viaggi: { ale: { pct: 15, cap: 250 }, cris: { pct: 15, cap: 150 } },
    cointestato: { ale: { pct: 30, cap: 400 }, cris: { pct: 30, cap: 250 } },
    imprevisti: { ale: { pct: 5, cap: 100 }, cris: { pct: 5, cap: 60 } },
  } as Record<"investimenti" | "viaggi" | "cointestato" | "imprevisti", Record<Person, { pct: number; cap: number }>>,

  // Spese casa: extra fisso TOTALE aggiunto alle righe reali (poi diviso 50/50)
  casaExtraTotale: 40,

  // Conto personale (residuo): minimo discrezionale per persona; sotto questa soglia
  // i pocket vengono compressi.
  contoFloorDiscrezionale: 50,
};

export const PEOPLE: Person[] = ["ale", "cris"];
export const PERSON_LABEL: Record<Person, string> = { ale: "Ale", cris: "Cristina" };
