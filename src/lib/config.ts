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
    ale: Number(process.env.SALARY_ALE ?? 2359),
    cris: Number(process.env.SALARY_CRIS ?? 1500),
  } as Record<Person, number>,

  // Cibo: importo fisso mensile (non dal DB)
  cibo: { ale: 225, cris: 125 } as Record<Person, number>,

  // Investimenti: tetto massimo mensile (Cristina 0, Ale 100)
  investimentiCap: { ale: 100, cris: 0 } as Record<Person, number>,

  // Viaggi: tetto massimo mensile
  viaggiCap: { ale: 150, cris: 100 } as Record<Person, number>,

  // Fondo comune: tetto massimo mensile
  fondoCap: { ale: 120, cris: 70 } as Record<Person, number>,

  // Spese casa: extra fisso TOTALE aggiunto alle righe reali (poi diviso 50/50)
  casaExtraTotale: 40,

  // Conto personale: floor discrezionale teorico per persona (punto aperto).
  // Il conto personale copre comunque sempre le spese individuali reali gia' sostenute.
  contoFloorDiscrezionale: 50,
};

export const PEOPLE: Person[] = ["ale", "cris"];
export const PERSON_LABEL: Record<Person, string> = { ale: "Ale", cris: "Cristina" };
