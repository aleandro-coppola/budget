"use client";

import type { BudgetResult, CondivisaRow, PersonBudget } from "@/lib/budget";
import { euro } from "@/lib/format";

type Who = "ale" | "cris";
const NOME: Record<Who, string> = { ale: "Ale", cris: "Cristina" };

// Classi scritte per esteso: Tailwind le trova solo se compaiono intere nel sorgente.
const ACCENT = {
  ale: { text: "text-ale", ring: "ring-ale/30", border: "border-ale/30", bar: "bg-ale/60", dot: "bg-ale" },
  cris: { text: "text-cris", ring: "ring-cris/30", border: "border-cris/30", bar: "bg-cris/60", dot: "bg-cris" },
};

// ---------------------------------------------------------------------------
// Card Ale / Cristina: dove vanno i soldi liberi sul Revolut
// ---------------------------------------------------------------------------
export function PersonCard({ p }: { p: PersonBudget }) {
  const a = ACCENT[p.person];
  const c = p.categorie;
  const contoPersonale = c.spesePersonali + c.contoPersonale;

  const righe: { label: string; note?: string; valore: number; verde?: boolean }[] = [
    { label: "Cibo mensile", valore: c.cibo },
    { label: "Spese casa", valore: c.speseCasa },
    {
      label: "Conto cointestato",
      note: `${euro(c.quotaCondivise)} spese condivise + ${euro(c.cointestato)} divertimento`,
      valore: p.cointestatoTotale,
    },
    { label: "Viaggi", valore: c.viaggi },
    { label: "Investimenti", valore: c.investimenti },
    { label: "Imprevisti", valore: c.imprevisti },
    {
      label: "Conto personale",
      note: `${euro(c.spesePersonali)} di spese già note + ${euro(c.contoPersonale)} liberi da spendere`,
      valore: contoPersonale,
      verde: true,
    },
  ];

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 ring-1 ${a.ring}`}>
      <div className="flex items-start justify-between gap-3">
        <h2 className={`text-lg font-semibold ${a.text}`}>{NOME[p.person]}</h2>
        <div className="text-right">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Libero su Revolut</p>
          <p className="text-xl font-semibold tabular-nums text-slate-900">{euro(p.libero)}</p>
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Stipendio {euro(p.stipendio)} − spese BCC {euro(p.bcc)}
      </p>

      <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Dove vanno i {euro(p.libero)}
      </h3>
      <ul className="mt-1 divide-y divide-slate-100">
        {righe.map((r) => (
          <Voce key={r.label} {...r} libero={p.libero} barClass={r.verde ? "bg-emerald-500" : a.bar} />
        ))}
      </ul>
      <div className="mt-2 flex justify-between border-t-2 border-slate-200 pt-2 text-sm font-semibold text-slate-900">
        <span>Totale</span>
        <span className="tabular-nums">{euro(p.totale)}</span>
      </div>

      {p.compresso && (
        <p className="mt-3 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
          Rimanente stretto: pocket ridotti per lasciare il minimo sul conto personale.
          {p.deficit > 0 && ` Mancano ${euro(p.deficit)}.`}
        </p>
      )}
      {!p.compresso && p.deficit > 0 && (
        <p className="mt-3 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">Mancano {euro(p.deficit)}.</p>
      )}

      <details className="mt-3 text-xs text-slate-500">
        <summary className="cursor-pointer select-none">Dettaglio spese BCC ({euro(p.bcc)})</summary>
        <div className="mt-1 space-y-0.5">
          <MiniRiga label="Spese condivise /2 (senza paga-*)" value={euro(p.bccSharedNoPaga)} />
          <MiniRiga label="Spese condivise /2 (pagate da te)" value={euro(p.bccSharedPaga)} />
          <MiniRiga label="Tue spese BCC" value={euro(p.bccIndividuale)} />
        </div>
      </details>
    </div>
  );
}

function Voce({
  label,
  note,
  valore,
  libero,
  barClass,
}: {
  label: string;
  note?: string;
  valore: number;
  libero: number;
  barClass: string;
}) {
  const w = libero > 0 ? Math.min(100, Math.max(0, (valore / libero) * 100)) : 0;
  return (
    <li className="py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-sm text-slate-700">
          {label}
          {note && <span className="mt-0.5 block text-xs leading-snug text-slate-400">{note}</span>}
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{euro(valore)}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${w}%` }} />
      </div>
    </li>
  );
}

function MiniRiga({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conto cointestato: entrano / escono / restano, e cosa fa ognuno
// ---------------------------------------------------------------------------
export function CointestatoSection({ data }: { data: BudgetResult }) {
  const c = data.cointestato;
  const rimborsi = c.ritira.ale.totale + c.ritira.cris.totale;

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold text-slate-800">Conto cointestato</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        Ogni mese ognuno versa la sua parte. Chi ha pagato una spesa condivisa con la propria carta si fa rimborsare
        ritirando dal cointestato. Quello che resta è il budget divertimento di coppia.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Tile segno="+" titolo="Entrano" valore={c.entrano} sub="versamenti di Ale e Cristina" />
        <Tile
          segno="−"
          titolo="Escono"
          valore={c.escono}
          sub={
            c.pagateDirette > 0
              ? `rimborsi ${euro(rimborsi)} + spese pagate dal conto ${euro(c.pagateDirette)}`
              : "rimborsi a chi ha anticipato le spese"
          }
        />
        <Tile
          evidenza
          segno="="
          titolo="Restano per il divertimento"
          valore={c.restano}
          sub="cene, cinema, uscite"
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Passi who="ale" data={data} />
        <Passi who="cris" data={data} />
      </div>

      <details className="mt-4" open>
        <summary className="cursor-pointer select-none text-sm font-semibold text-slate-700">
          Spese condivise: chi ritira cosa
        </summary>
        <ul className="mt-1 divide-y divide-slate-100">
          {[...data.condiviseRows].sort(perPagante).map((r, i) => (
            <li key={i} className="py-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 text-sm text-slate-700">{r.name}</span>
                <span className="shrink-0 text-sm tabular-nums text-slate-900">{euro(r.spesa)}</span>
              </div>
              <p className="mt-0.5 text-xs leading-snug text-slate-500">
                <Descrizione r={r} />
              </p>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

const ORDINE: Record<string, number> = { ale: 0, cris: 1, nessuno: 2 };
const perPagante = (a: CondivisaRow, b: CondivisaRow) => ORDINE[a.pagante ?? "nessuno"] - ORDINE[b.pagante ?? "nessuno"];

function Persona({ who }: { who: Who }) {
  return <span className={`font-semibold ${ACCENT[who].text}`}>{NOME[who]}</span>;
}

function Descrizione({ r }: { r: CondivisaRow }) {
  if (!r.pagante) {
    return <>Pagata direttamente dal cointestato: ognuno ne versa metà ({euro(r.spesa / 2)}), nessuno ritira.</>;
  }
  if (r.lato === "bcc") {
    return (
      <>
        Pagata da <Persona who={r.pagante} /> dalla BCC (la sua metà è già lì): ritira {euro(r.ritiro)} sulla BCC.
      </>
    );
  }
  return (
    <>
      Pagata da <Persona who={r.pagante} /> col suo Revolut: ritira {euro(r.ritiro)} sul Revolut.
    </>
  );
}

function Tile({
  segno,
  titolo,
  valore,
  sub,
  evidenza,
}: {
  segno: string;
  titolo: string;
  valore: number;
  sub: string;
  evidenza?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        evidenza ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className={`text-xs font-medium ${evidenza ? "text-emerald-800" : "text-slate-500"}`}>{titolo}</p>
      <p className={`mt-0.5 text-xl font-semibold tabular-nums ${evidenza ? "text-emerald-800" : "text-slate-900"}`}>
        <span className="mr-1 text-slate-400">{segno}</span>
        {euro(valore)}
      </p>
      <p className={`mt-0.5 text-[11px] leading-snug ${evidenza ? "text-emerald-700" : "text-slate-400"}`}>{sub}</p>
    </div>
  );
}

function Passi({ who, data }: { who: Who; data: BudgetResult }) {
  const a = ACCENT[who];
  const v = data.cointestato.versa[who];
  const r = data.cointestato.ritira[who];
  const saldo = data.cointestato.saldo[who];

  let frase: string;
  if (saldo > 0.005) frase = `versi ${euro(saldo)}`;
  else if (saldo < -0.005) frase = `ricevi ${euro(-saldo)}`;
  else frase = "in pari";

  return (
    <div className={`rounded-xl border p-4 ${a.border}`}>
      <h3 className={`text-sm font-semibold ${a.text}`}>{NOME[who]}</h3>
      <ol className="mt-3 space-y-3">
        <Passo n={1} titolo="Versa sul cointestato" valore={v.totale}>
          {euro(v.condivise)} spese condivise + {euro(v.divertimento)} divertimento
        </Passo>
        <Passo n={2} titolo="Ritira dal cointestato" valore={r.totale}>
          {r.totale === 0 ? (
            "Niente da ritirare"
          ) : (
            <>
              {r.revolut > 0 && <span className="block">→ {euro(r.revolut)} sul tuo Revolut</span>}
              {r.bcc > 0 && <span className="block">→ {euro(r.bcc)} sulla tua BCC</span>}
            </>
          )}
        </Passo>
      </ol>
      <p className="mt-3 flex items-baseline justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <span>Saldo netto con il cointestato</span>
        <span className="text-sm font-semibold tabular-nums text-slate-900">{frase}</span>
      </p>
    </div>
  );
}

function Passo({
  n,
  titolo,
  valore,
  children,
}: {
  n: number;
  titolo: string;
  valore: number;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-slate-800">{titolo}</span>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{euro(valore)}</span>
        </div>
        <div className="mt-0.5 text-xs leading-snug text-slate-500">{children}</div>
      </div>
    </li>
  );
}
