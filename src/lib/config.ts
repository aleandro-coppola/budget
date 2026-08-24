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

  // Investimenti: tetto massimo mensile (20% del residuo dopo cibo, sul libero attuale)
  investimentiCap: { ale: 191.43, cris: 76.85 } as Record<Person, number>,

  // Viaggi: tetto massimo mensile (15% del residuo dopo cibo, sul libero attuale)
  viaggiCap: { ale: 143.57, cris: 57.64 } as Record<Person, number>,

  // Fondo comune: tetto massimo mensile (10% del residuo dopo cibo, sul libero attuale)
  fondoCap: { ale: 95.72, cris: 38.43 } as Record<Person, number>,

  // Spese casa: extra fisso TOTALE aggiunto alle righe reali (poi diviso 50/50)
  casaExtraTotale: 40,

  // Conto personale: floor discrezionale teorico per persona (punto aperto).
  // Il conto personale copre comunque sempre le spese individuali reali gia' sostenute.
  contoFloorDiscrezionale: 50,
};

export const PEOPLE: Person[] = ["ale", "cris"];
export const PERSON_LABEL: Record<Person, string> = { ale: "Ale", cris: "Cristina" };
