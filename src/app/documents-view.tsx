import Link from "next/link";

// ---------------------------------------------------------------------------
// Dati (separati dal markup — struttura ad albero/grafo, testo ridotto al minimo)
// ---------------------------------------------------------------------------

interface Tool {
  name: string;
  url: string;
  use: string;
}
interface ToolGroup {
  title: string;
  tools: Tool[];
}

const TOOL_GROUPS: ToolGroup[] = [
  {
    title: "ETF — ISIN / TER / composizione",
    tools: [
      {
        name: "justETF",
        url: "https://www.justetf.com",
        use: "Database ETF UCITS · filtri TER/replica/paese · confronto fondi simili. Prima di ogni acquisto ETF.",
      },
      {
        name: "Curvo",
        url: "https://curvo.finance",
        use: "Backtest storico di portafogli (dati justETF) · simula il Core-Satellite nel passato.",
      },
    ],
  },
  {
    title: "Fondamentali & target analisti",
    tools: [
      { name: "StockAnalysis", url: "https://stockanalysis.com", use: "P/E · EPS · ricavi · crescita, senza paywall." },
      {
        name: "Simply Wall St",
        url: "https://simplywall.st",
        use: "Grafico \"snowflake\" valore/salute/dividendi · DCF automatico.",
      },
      { name: "TipRanks", url: "https://www.tipranks.com", use: "Consenso analisti · price target · insider tracking." },
      { name: "MarketScreener", url: "https://www.marketscreener.com", use: "Dati societari e stime." },
      { name: "GuruFocus", url: "https://www.gurufocus.com", use: "Fair value · storico investitori istituzionali." },
    ],
  },
  {
    title: "Analisi tecnica & grafici",
    tools: [
      { name: "TradingView", url: "https://www.tradingview.com", use: "Grafici · indicatori · screener (free: 1 alert attivo)." },
      { name: "Investing.com", url: "https://www.investing.com", use: "Grafici + calendario economico + news in un posto." },
    ],
  },
  {
    title: "Macro & calendario economico",
    tools: [
      {
        name: "FRED (St. Louis Fed)",
        url: "https://fred.stlouisfed.org",
        use: "Macro USA/globale: inflazione, PIL, tassi, massa monetaria — grafici componibili, illimitato.",
      },
      { name: "Trading Economics", url: "https://tradingeconomics.com", use: "Calendario macro globale + storico per paese." },
      {
        name: "Investing.com — Calendario",
        url: "https://www.investing.com/economic-calendar/",
        use: "Eventi macro (FOMC, BCE, CPI) con impatto atteso.",
      },
    ],
  },
  {
    title: "AI research (emergente)",
    tools: [
      { name: "OpenBB", url: "https://openbb.co", use: "Piattaforma open-source · scripting Python per chi approfondisce." },
      { name: "FinChat", url: "https://finchat.io", use: "Chat conversazionale sui bilanci aziendali." },
    ],
  },
];

const QUICKSTART = ["justETF", "StockAnalysis", "Investing.com (calendario)"];

interface PlaybookStep {
  n: number;
  title: string;
  items: string[];
}
interface Playbook {
  id: string;
  title: string;
  steps: PlaybookStep[];
}

const PLAYBOOKS: Playbook[] = [
  {
    id: "etf",
    title: "ETF",
    steps: [
      { n: 1, title: "ISIN", items: ["Cerca in app TR — nome esatto, non fidarti del titolo mostrato"] },
      {
        n: 2,
        title: "justETF",
        items: ["TER", "Metodologia: Physical/Replicato (mai Swap se evitabile)", "AUM > €500M meglio", "Acc vs Dist"],
      },
      { n: 3, title: "Composizione", items: ["App TR → Informazioni: Settori · Paesi · Top 25 società"] },
      { n: 4, title: "Overlap", items: ["Singolo titolo >10% e già in portafoglio → duplica rischio, non diversifica"] },
      { n: 5, title: "Filtri ESG/SRI", items: ["Spesso escludono energia/difesa/banche — coerenti con la tesi?"] },
      { n: 6, title: "Contesto macro", items: ["2 min su StockAnalysis / Trading Economics sul tema/regione"] },
    ],
  },
  {
    id: "azione",
    title: "Azione singola",
    steps: [
      { n: 1, title: "Fondamentali", items: ["StockAnalysis: P/E · EPS · crescita ricavi ultimi 2-3 trimestri"] },
      { n: 2, title: "Consenso", items: ["TipRanks / MarketScreener: target price · quanti \"sell\""] },
      { n: 3, title: "Catalizzatore", items: ["Trimestrale / contratto / trial concreto — o solo hype del giorno?"] },
      { n: 4, title: "Tecnica", items: ["TradingView: supporti/resistenze · drawdown da massimi 52 settimane"] },
      { n: 5, title: "Peso satellite", items: ["Resta sotto il tetto 5% patrimonio totale?"] },
      { n: 6, title: "Trigger", items: ["Prezzo ingresso + prezzo 2ª tranche fissati PRIMA — mai a data fissa"] },
    ],
  },
  {
    id: "settore",
    title: "Settore / tema nuovo",
    steps: [
      { n: 1, title: "Mercato", items: ["Investing.com / Trading Economics: dimensione · trend strutturale"] },
      { n: 2, title: "Valutazione", items: ["P/E settore vs P/E indice — a sconto o già caro?"] },
      { n: 3, title: "Filiera", items: ["Mappa i player per livello (materia prima → produzione → vendita)"] },
      { n: 4, title: "Rischio", items: ["Regolatorio · geopolitico · tecnologico, specifico del settore"] },
      { n: 5, title: "Veicolo", items: ["ETF tematico (diversificato) o singolo nome (tesi specifica)?"] },
    ],
  },
];

interface MonitorRow {
  freq: string;
  action: string;
}
const MONITOR_ROWS: MonitorRow[] = [
  { freq: "Non ogni giorno", action: "Controlli troppo frequenti → decisioni emotive. Rispetta la cadenza fissata." },
  { freq: "A ogni trimestrale", action: "StockAnalysis/TipRanks — i fondamentali sono ancora coerenti con la tesi d'ingresso?" },
  { freq: "Prima di eventi macro noti", action: "Calendario Investing.com: FOMC, BCE, CPI — non muoversi a ridosso senza motivo." },
  { freq: "Se il prezzo scende molto", action: "Tesi rotta (fondamentali/notizie) o rumore di mercato? Se rumore → non vendere in rosso." },
  { freq: "Periodicamente", action: "Ricalcola i pesi: satellite ancora sotto tetto? Core ancora bilanciato?" },
];

const SELL_QUESTIONS = [
  "Ho raggiunto un trigger di prezzo/regola definito in anticipo, o sto decidendo \"a sensazione\"?",
  "Se vendo ora, il costo (tasse + commissioni) è giustificato dal movimento atteso?",
  "La tesi originale è cambiata davvero, o sto reagendo solo al prezzo?",
];

interface Rule {
  n: number;
  text: string;
}

const CORE_RULES: Rule[] = [
  { n: 1, text: "Controllo portafoglio: max 2 volte l'anno (gennaio / luglio)." },
  { n: 2, text: "Ribilancia solo se un asset si scosta oltre ±5 punti percentuali dal target (75% VWCE / 15% Nasdaq / 10% Gold)." },
  { n: 3, text: "Buy-the-dip: Core −20% dai massimi storici → raddoppia il PAC per 4 mesi con la liquidità di riserva." },
];

const ENTRY_RULES: Rule[] = [
  { n: 1, text: "Verifica sempre ISIN/nome esatto in app prima di ordinare — mai da chat o screenshot vecchio." },
  { n: 2, text: "ETF: preferisci Physical/Replicato, mai Swap se evitabile." },
  { n: 3, text: "Tetto satellite: max 5% del patrimonio totale, su tutte le posizioni tattiche insieme." },
  { n: 4, text: "Titoli volatili (beta alto) → ingresso a tranche, mai tutto subito." },
  { n: 5, text: "Mega-cap stabili (beta <1) → size piena in un colpo; scaglionare non riduce il rischio specifico." },
  { n: 6, text: "Trigger per la 2ª tranche = un livello di prezzo, mai una data fissa a calendario." },
  { n: 7, text: "Controlla sempre l'overlap con quello che già possiedi prima di aprire una nuova posizione." },
  { n: 8, text: "Niente PAC su satellite tattico — solo acquisti singoli e consapevoli." },
  { n: 9, text: "Un solo satellite/tesi alla volta da decidere — non aprire 3 ricerche parallele." },
  { n: 10, text: "Non inseguire un titolo già esploso (es. +100/+180% in un giorno) — aspetta che l'euforia si stabilizzi." },
];

const EXIT_RULES: Rule[] = [
  { n: 1, text: "Mai vendere sotto il PMC per rumore di mercato — si ribilancia solo comprando di più." },
  { n: 2, text: "Profit taking solo a +40% dal PMC → vendi il 10% della posizione, non tutto." },
  { n: 3, text: "Calcola sempre il costo di un giro vendo-e-rientro: 26% su plusvalenza + commissione vendita + riacquisto." },
  { n: 4, text: "Le minusvalenze da azioni compensano solo plusvalenze da azioni, non da ETF." },
  { n: 5, text: "Mai vendere per anticipare un evento macro noto (FOMC/BCE) — se atteso, è già in gran parte scontato nel prezzo." },
  { n: 6, text: "Rispondi sempre alle 3 domande prima di vendere (vedi sopra) — se una non è chiara, non vendere." },
];

interface Chain {
  cause: string;
  effect: string;
  note: string;
}
const RELATIONS: Chain[] = [
  { cause: "Tassi ↑", effect: "Obbligazioni esistenti ↓", note: "le nuove emissioni rendono di più, le vecchie a cedola fissa valgono meno" },
  { cause: "Tassi ↓", effect: "Obbligazioni esistenti ↑", note: "vale il contrario — le vecchie cedole più alte diventano preziose" },
  { cause: "Duration lunga", effect: "Sensibilità ai tassi ↑↑", note: "20 anni si muove molto di più di 2 anni per lo stesso Δtasso" },
  { cause: "Tassi ↑", effect: "Azioni growth/tech ↓↓", note: "utili attesi lontani nel tempo, scontati a un valore più basso oggi" },
  { cause: "Tassi reali ↑", effect: "Oro ↓", note: "l'oro non paga interessi, meno attraente se il \"sicuro\" rende di più" },
  { cause: "Dollaro forte", effect: "Oro ↓ · Mercati emergenti ↓", note: "oro quotato in USD; debito EM spesso in dollari, più pesante" },
];

interface CyclePhase {
  id: string;
  title: string;
  desc: string;
  best: string;
  worst: string;
}
const CYCLE: CyclePhase[] = [
  {
    id: "ripresa",
    title: "1 · Ripresa / Reflazione",
    desc: "Crescita riparte · inflazione bassa · tassi bassi/in calo",
    best: "Ciclico (small/mid cap), materie prime, corporate bond, immobiliare",
    worst: "Gov bond, dollaro, difensivi",
  },
  {
    id: "espansione",
    title: "2 · Espansione",
    desc: "Crescita forte · inflazione in salita · tassi in salita",
    best: "Value, finanziari, energia, materie prime",
    worst: "Obbligazioni a lunga scadenza",
  },
  {
    id: "stagflazione",
    title: "3 · Rallentamento / Stagflazione",
    desc: "Crescita in frenata · inflazione ancora alta · tassi alti",
    best: "Oro, materie prime, liquidità, difensivi (staples, utilities)",
    worst: "Growth/tech, obbligazioni, immobiliare, valute EM",
  },
  {
    id: "recessione",
    title: "4 · Recessione / Deflazione",
    desc: "Crescita negativa · inflazione in calo · tassi in calo",
    best: "Gov bond lunga duration, oro, difensivi, liquidità",
    worst: "Ciclico, materie prime industriali, high yield",
  },
];

type Confidence = "certo" | "probabile" | "ipotesi";

interface GoldDriver {
  context: string;
  why: string;
  confidence: Confidence;
  note?: string;
  warn?: boolean;
}
const GOLD_DRIVERS: GoldDriver[] = [
  {
    context: "Recessione \"da domanda\" (tassi in calo)",
    why: "Anticipa i tagli tassi e l'allentamento monetario — l'oro non paga interessi, tassi reali in calo lo favoriscono",
    confidence: "certo",
    note: "meccanismo consolidato",
  },
  {
    context: "Stagflazione (anni '70 il caso di riferimento)",
    why: "Azioni e obbligazioni soffrono insieme (utili in calo + tassi in salita) — l'oro resta l'unico a proteggere il potere d'acquisto",
    confidence: "ipotesi",
    note: "un solo vero periodo storico di stagflazione nei dati moderni — trarne certezze statistiche è rischioso",
  },
  {
    context: "Crisi sistemiche acute (2008, 2020)",
    why: "La correlazione con le azioni si inverte bruscamente, l'oro fa da scudo",
    confidence: "certo",
  },
  {
    context: "Periodi \"normali\" (oggi incluso)",
    why: "Correlazione oro-azioni ultimi 20 anni leggermente positiva (+0,14), resta positiva su orizzonti di 36 mesi — nei periodi non di crisi si muovono insieme, spinti dalla liquidità globale",
    confidence: "certo",
    note: "dato Morningstar/UBS 2025",
    warn: true,
  },
];

interface BondCase {
  type: string;
  protects: boolean;
  note: string;
}
const BOND_CASES: BondCase[] = [
  { type: "Da domanda / deflazionistica (tassi scendono)", protects: true, note: "asset di riferimento in questo scenario" },
  { type: "Stagflazionistica (tassi alti/in salita + inflazione alta)", protects: false, note: "soffrono come tutto il resto" },
];

interface RegimeRow {
  ind: string;
  val: string;
  signal: string;
  tone: "red" | "amber" | "warn";
}
const REGIME_NOW: RegimeRow[] = [
  { ind: "Inflazione USA/Eurozona", val: "3,0–3,7%, sopra target", signal: "Verso stagflazione", tone: "red" },
  { ind: "Crescita PIL eurozona", val: "Rivista a +0,8% 2026", signal: "Debole", tone: "red" },
  { ind: "Fed", val: "Board diviso, bias hawkish", signal: "Restrittivo", tone: "amber" },
  { ind: "BCE", val: "Rialzo atteso 10/9 (~95% probabilità)", signal: "Restrittivo", tone: "amber" },
  { ind: "Valutazioni oro", val: "Storicamente elevate", signal: "Rischio ingresso caro", tone: "warn" },
];

interface Term {
  term: string;
  def: string;
}
const GLOSSARY: Term[] = [
  { term: "Acc / Dist", def: "Accumulazione = dividendi reinvestiti nel fondo. Distribuzione = pagati in contanti." },
  { term: "Azione", def: "Quota di proprietà di una singola azienda." },
  { term: "Backlog", def: "Ordini/contratti già acquisiti, non ancora fatturati — visibilità sui ricavi futuri." },
  { term: "Beta", def: "Movimento vs mercato. 1 = come il mercato, 2 = il doppio, <1 = meno." },
  { term: "Diversificazione", def: "Distribuire il capitale su più asset/settori/aree per ridurre il rischio specifico." },
  { term: "Dividendo / Yield", def: "Utile distribuito agli azionisti, espresso in % sul prezzo." },
  { term: "Drawdown", def: "Calo % dal massimo storico o recente di un asset." },
  { term: "Duration", def: "Sensibilità del prezzo di un bond ai tassi — più lunga la scadenza, più oscilla." },
  { term: "EPS", def: "Utile netto per azione." },
  { term: "ETF", def: "Fondo quotato che replica un indice — si compra come un'azione, dà esposizione a centinaia di titoli." },
  { term: "Guidance", def: "Previsioni di ricavi/utili comunicate dall'azienda al mercato." },
  { term: "Inflazione", def: "Aumento generale dei prezzi — riduce il potere d'acquisto del contante." },
  { term: "Interesse composto", def: "Interesse calcolato anche sugli interessi maturati — crescita esponenziale, non lineare." },
  { term: "ISIN", def: "Codice univoco di uno strumento finanziario — verificalo sempre prima di comprare." },
  { term: "Obbligazione (bond)", def: "Prestito a Stato/azienda: cedole periodiche + rimborso capitale a scadenza." },
  { term: "PAC", def: "Piano di Accumulo: investimento automatico a intervalli fissi." },
  { term: "P/E", def: "Prezzo / Utile — alto = molta crescita attesa (o caro), basso = a sconto (o problemi)." },
  { term: "PIL (GDP)", def: "Valore di tutto ciò che un Paese produce in un anno." },
  { term: "Plus/Minusvalenza", def: "Guadagno/perdita realizzato vendendo un asset rispetto al PMC." },
  { term: "PMC", def: "Prezzo Medio di Carico — prezzo medio pagato su più acquisti nel tempo." },
  { term: "Regime amministrato", def: "Il broker calcola e trattiene le tasse per te (es. 26% su plusvalenze)." },
  { term: "Spread (BTP-Bund)", def: "Differenza di rendimento BTP–Bund — misura il rischio percepito sul debito italiano." },
  { term: "Tasso d'interesse", def: "\"Prezzo del denaro\" fissato da BCE/Fed — influenza tutti gli altri rendimenti." },
  { term: "TER", def: "Costo annuo di gestione di un ETF, in % — più basso è meglio." },
  { term: "Volatilità", def: "Ampiezza delle oscillazioni di prezzo, in entrambe le direzioni." },
];

// ---------------------------------------------------------------------------
// UI primitives
// ---------------------------------------------------------------------------

const NAV = [
  { id: "strumenti", label: "Strumenti" },
  { id: "playbook", label: "Playbook" },
  { id: "monitoraggio", label: "Monitoraggio" },
  { id: "protocollo", label: "Protocollo" },
  { id: "relazioni", label: "Relazioni" },
  { id: "cicli", label: "Cicli macro" },
  { id: "glossario", label: "Glossario" },
];

function SectionHeading({ id, kicker, title }: { id: string; kicker: string; title: string }) {
  return (
    <div id={id} className="scroll-mt-20 pt-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{kicker}</p>
      <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{title}</h2>
    </div>
  );
}

function Card({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={`rounded-2xl border border-slate-200 bg-white ${className}`}>
      {children}
    </div>
  );
}

export default function DocumentsView() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/" className="text-xs font-medium text-slate-400 hover:text-slate-600">
            ← Home
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Documents — Investimenti</h1>
          <p className="mt-1 text-sm text-slate-500">Guida tecnica: strumenti, protocollo operativo, glossario.</p>
        </div>
      </header>

      {/* TOC sticky */}
      <nav className="sticky top-0 z-10 -mx-4 mt-4 overflow-x-auto border-y border-slate-200 bg-slate-50/90 px-4 py-2 backdrop-blur">
        <ul className="flex w-max gap-1.5 text-xs">
          {NAV.map((n) => (
            <li key={n.id}>
              <a
                href={`#${n.id}`}
                className="block whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 hover:border-slate-900 hover:text-slate-900"
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ---------------- Strumenti ---------------- */}
      <section className="mt-8 space-y-4">
        <SectionHeading id="strumenti" kicker="01" title="Strumenti di ricerca" />

        <Card className="flex flex-wrap items-center gap-2 p-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quick start</span>
          {QUICKSTART.map((t, i) => (
            <span key={t} className="flex items-center gap-2">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">{t}</span>
              {i < QUICKSTART.length - 1 && <span className="text-slate-300">→</span>}
            </span>
          ))}
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {TOOL_GROUPS.map((g) => (
            <Card key={g.title} className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{g.title}</h3>
              <ul className="mt-3 space-y-3">
                {g.tools.map((t) => (
                  <li key={t.name} className="border-l-2 border-slate-200 pl-3">
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-slate-900 hover:underline"
                    >
                      {t.name}
                    </a>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{t.use}</p>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
          Nessun sostituto gratuito 1:1 per la classificazione &quot;regime economico&quot;: FRED + Trading Economics
          permettono di costruire una view simile partendo dai dati grezzi, ma richiedono più lavoro manuale.
        </p>
      </section>

      {/* ---------------- Playbook (alberi decisionali) ---------------- */}
      <section className="mt-10 space-y-4">
        <SectionHeading id="playbook" kicker="02" title="Prima di comprare — playbook" />
        <div className="grid gap-4 lg:grid-cols-3">
          {PLAYBOOKS.map((pb) => (
            <Card key={pb.id} id={pb.id} className="scroll-mt-20 p-4">
              <h3 className="text-sm font-semibold text-slate-900">{pb.title}</h3>
              <ol className="relative mt-4 space-y-4 border-l-2 border-slate-200 pl-5">
                {pb.steps.map((s) => (
                  <li key={s.n} className="relative">
                    <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                      {s.n}
                    </span>
                    <p className="text-xs font-semibold text-slate-700">{s.title}</p>
                    <ul className="mt-1 space-y-0.5">
                      {s.items.map((it) => (
                        <li key={it} className="text-xs leading-relaxed text-slate-500">
                          {it}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------------- Monitoraggio ---------------- */}
      <section className="mt-10 space-y-4">
        <SectionHeading id="monitoraggio" kicker="03" title="Durante — monitoraggio posizione aperta" />
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {MONITOR_ROWS.map((r, i) => (
                <tr key={r.freq} className={i > 0 ? "border-t border-slate-100" : ""}>
                  <td className="w-48 shrink-0 px-4 py-3 align-top text-xs font-semibold text-slate-700">{r.freq}</td>
                  <td className="px-4 py-3 text-xs leading-relaxed text-slate-500">{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="border-amber-200 bg-amber-50/60 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            ⚠ Le 3 domande prima di vendere
          </h3>
          <ol className="mt-3 space-y-2">
            {SELL_QUESTIONS.map((q, i) => (
              <li key={q} className="flex gap-2 text-xs leading-relaxed text-amber-900">
                <span className="font-bold">{i + 1}.</span>
                {q}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs font-semibold text-amber-900">
            Se la risposta a tutte e tre non è chiara → non vendere, aspetta un dato oggettivo.
          </p>
        </Card>
      </section>

      {/* ---------------- Protocollo ---------------- */}
      <section className="mt-10 space-y-4">
        <SectionHeading id="protocollo" kicker="04" title="Le regole del protocollo" />

        <Card className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Core strutturale — VWCE 75% / Nasdaq 15% / Gold 10%
          </h3>
          <RuleList rules={CORE_RULES} accent="slate" />
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-ale/20 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ale">✅ Prima di entrare</h3>
            <RuleList rules={ENTRY_RULES} accent="ale" />
          </Card>
          <Card className="border-cris/20 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-cris">🔴 Prima di vendere</h3>
            <RuleList rules={EXIT_RULES} accent="cris" />
          </Card>
        </div>
      </section>

      {/* ---------------- Relazioni chiave (grafo causa → effetto) ---------------- */}
      <section className="mt-10 space-y-4">
        <SectionHeading id="relazioni" kicker="05" title="Relazioni chiave — cosa muove i prezzi" />
        <div className="grid gap-3 sm:grid-cols-2">
          {RELATIONS.map((r) => (
            <Card key={r.cause + r.effect} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">{r.cause}</span>
                <span className="text-slate-300">→</span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {r.effect}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{r.note}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------------- Cicli macro (quadrante ciclico) ---------------- */}
      <section className="mt-10 space-y-4">
        <SectionHeading id="cicli" kicker="06" title="Cicli macroeconomici" />
        <Card className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <CycleCard p={CYCLE[0]} />
            <ArrowCell dir="right" />
            <CycleCard p={CYCLE[1]} />

            <ArrowCell dir="up" className="sm:order-none" />
            <div className="hidden items-center justify-center rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3 text-center sm:flex">
              <p className="text-[11px] font-semibold leading-snug text-amber-800">
                🪙 Oro — hedge strutturale
                <br />
                <span className="font-normal">bene in stagflazione E in recessione, vedi sotto ↓</span>
              </p>
            </div>
            <ArrowCell dir="down" />

            <CycleCard p={CYCLE[3]} />
            <ArrowCell dir="left" />
            <CycleCard p={CYCLE[2]} />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            ⚠ Tendenze storiche generali (investment clock classico), non regole matematiche garantite — ogni ciclo ha
            le sue eccezioni e i cicli reali si sovrappongono.
          </p>
        </Card>

        {/* Oro — due motori distinti */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-slate-900">🪙 Oro — due motori distinti, non uno</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Non è un hedge automatico in ogni ribasso: lo è soprattutto nelle crisi acute o negli scenari
            inflazionistici estremi. Nei cali &quot;normali&quot; di mercato può scendere insieme alle azioni.
          </p>
          <ul className="mt-4 space-y-3">
            {GOLD_DRIVERS.map((d) => (
              <li
                key={d.context}
                className={`rounded-xl border p-3 ${d.warn ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-800">
                    {d.warn && "⚠️ "}
                    {d.context}
                  </p>
                  <ConfidenceTag level={d.confidence} />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{d.why}</p>
                {d.note && <p className="mt-1 text-[11px] italic text-slate-400">{d.note}</p>}
              </li>
            ))}
          </ul>
        </Card>

        {/* Obbligazioni — dipende dal tipo di recessione */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-slate-900">
            📉 Obbligazioni governative — dipende dal TIPO di recessione
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {BOND_CASES.map((b) => (
              <div
                key={b.type}
                className={`rounded-xl border p-3 ${b.protects ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}
              >
                <p className={`text-xs font-semibold ${b.protects ? "text-emerald-800" : "text-rose-800"}`}>
                  {b.protects ? "✅ Proteggono — " : "❌ Non proteggono — "}
                  {b.type}
                </p>
                <p className={`mt-1 text-xs leading-relaxed ${b.protects ? "text-emerald-700" : "text-rose-700"}`}>
                  {b.note}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-800">⚠️ Le correlazioni possono rompersi — aprile 2025</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-900">
              Sotto i dazi Trump, azioni e obbligazioni USA sono scese insieme — la correlazione negativa &quot;da
              manuale&quot; si è rotta per perdita di fiducia nel dollaro come rifugio.
            </p>
            <p className="mt-2 text-[11px] font-medium leading-relaxed text-amber-800">
              Lezione pratica: i modelli di correlazione sono statistiche storiche, non leggi fisiche — possono
              smettere di funzionare quando cambia la fiducia strutturale in un sistema (es. status di valuta di
              riserva).
            </p>
          </div>
        </Card>

        {/* Regime attuale */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">🌡️ Il regime attuale</h3>
            <span className="text-[11px] font-medium text-slate-400">Settembre 2026</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="py-1.5 pr-3 font-medium">Indicatore</th>
                  <th className="py-1.5 pr-3 font-medium">Dato</th>
                  <th className="py-1.5 font-medium">Segnale</th>
                </tr>
              </thead>
              <tbody>
                {REGIME_NOW.map((r) => (
                  <tr key={r.ind} className="border-t border-slate-100">
                    <td className="py-2 pr-3 font-semibold text-slate-700">{r.ind}</td>
                    <td className="py-2 pr-3 text-slate-500">{r.val}</td>
                    <td className="py-2">
                      <SignalTag tone={r.tone} label={r.signal} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3">
            <p className="text-xs leading-relaxed text-sky-900">
              <span className="mr-1 rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white">
                Probabile
              </span>
              Il quadro attuale è più vicino a stagflazione/tardo ciclo che a una vera recessione — coerente con la
              scelta di mantenere l&apos;oro nel Core come hedge strutturale, ma spiega anche perché non ha
              &quot;esploso&quot; al rialzo: siamo in una fase di stagflazione moderata, non nello scenario acuto anni
              &apos;70.
            </p>
          </div>
        </Card>
      </section>

      {/* ---------------- Glossario ---------------- */}
      <section className="mt-10 space-y-4">
        <SectionHeading id="glossario" kicker="07" title="Glossario essenziale" />
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {GLOSSARY.map((g) => (
            <div key={g.term} className="border-l-2 border-slate-200 pl-3">
              <dt className="text-xs font-semibold text-slate-800">{g.term}</dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-slate-500">{g.def}</dd>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function RuleList({ rules, accent }: { rules: Rule[]; accent: "ale" | "cris" | "slate" }) {
  const dot = accent === "ale" ? "bg-ale" : accent === "cris" ? "bg-cris" : "bg-slate-400";
  return (
    <ol className="mt-3 space-y-2.5">
      {rules.map((r) => (
        <li key={r.n} className="flex gap-2.5">
          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
          <span className="text-xs leading-relaxed text-slate-600">{r.text}</span>
        </li>
      ))}
    </ol>
  );
}

function CycleCard({ p }: { p: CyclePhase }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-900">{p.title}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{p.desc}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-emerald-700">
        <span className="font-semibold">Meglio </span>
        {p.best}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-rose-700">
        <span className="font-semibold">Peggio </span>
        {p.worst}
      </p>
    </div>
  );
}

function ArrowCell({
  dir,
  className = "",
}: {
  dir: "up" | "down" | "left" | "right";
  className?: string;
}) {
  const glyph = { up: "↑", down: "↓", left: "←", right: "→" }[dir];
  return (
    <div className={`flex items-center justify-center text-xl text-slate-300 ${className}`}>
      <span className="sm:hidden">↓</span>
      <span className="hidden sm:inline">{glyph}</span>
    </div>
  );
}

function ConfidenceTag({ level }: { level: Confidence }) {
  const style = {
    certo: "bg-emerald-100 text-emerald-800",
    probabile: "bg-sky-100 text-sky-800",
    ipotesi: "bg-amber-100 text-amber-800",
  }[level];
  const label = { certo: "Certo", probabile: "Probabile", ipotesi: "Ipotesi" }[level];
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${style}`}>{label}</span>;
}

function SignalTag({ tone, label }: { tone: "red" | "amber" | "warn"; label: string }) {
  const style = {
    red: "bg-rose-100 text-rose-800",
    amber: "bg-amber-100 text-amber-800",
    warn: "bg-slate-200 text-slate-700",
  }[tone];
  const dot = { red: "🔴", amber: "🟡", warn: "⚠️" }[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style}`}>
      {dot} {label}
    </span>
  );
}
