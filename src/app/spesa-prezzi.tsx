"use client";

import { useEffect, useMemo, useState } from "react";
import {
  REPARTI,
  aggiungiVoce,
  applicaScontrino,
  catalogoCompleto,
  euro,
  fromIso,
  parseScontrino,
  toIso,
  type NonRiconosciuta,
  type Reparto,
  type TabProps,
} from "@/lib/spesa";

const btnPrimary = "rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700";
const btnTiny = "shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100";

const dataBreve = (iso: string) => fromIso(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short" });

export default function PrezziTab({ state, update }: TabProps) {
  const catalogo = useMemo(() => catalogoCompleto(state.custom), [state.custom]);
  const [testo, setTesto] = useState("");
  const [esito, setEsito] = useState("");

  function importa() {
    const r = parseScontrino(testo, catalogo);
    update((s) => applicaScontrino(s, r, toIso(new Date())));
    setEsito(
      r.riconosciute.length + r.nonRiconosciute.length === 0
        ? "Nessuna riga con prezzo trovata. Formato atteso: NOME 1,99"
        : `${r.riconosciute.length} prezzi aggiornati, ${r.nonRiconosciute.length} righe non riconosciute.`
    );
    setTesto("");
  }

  function setPrezzo(id: string, prezzo: number | undefined) {
    update((s) => {
      const prezzi = { ...s.prezzi };
      if (prezzo === undefined) delete prezzi[id];
      else prezzi[id] = { prezzo, data: toIso(new Date()) };
      return { ...s, prezzi };
    });
  }

  function rimuoviVoce(id: string) {
    update((s) => {
      const prezzi = { ...s.prezzi };
      const extra = { ...s.extra };
      delete prezzi[id];
      delete extra[id];
      return { ...s, custom: s.custom.filter((c) => c.id !== id), prezzi, extra };
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">Importa da scontrino</h2>
        <p className="mt-1 text-xs text-slate-500">
          Incolla le righe, una per riga nel formato <code className="rounded bg-slate-100 px-1">NOME 1,99</code>. Ogni
          riga viene abbinata a un ingrediente (es. &quot;FINOCCH&quot; → Finocchi) e ne aggiorna il prezzo. Totale,
          resto, IVA e sconti vengono ignorati.
        </p>
        <textarea
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          rows={6}
          placeholder={"FINOCCHI 1,99\nCOZZE 1KG 4,50"}
          aria-label="Righe dello scontrino"
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button onClick={importa} disabled={!testo.trim()} className={`${btnPrimary} disabled:opacity-40`}>
            Importa prezzi
          </button>
          {esito && <span className="text-xs text-slate-600">{esito}</span>}
        </div>
      </section>

      {state.nonRiconosciute.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-900">Righe non riconosciute</h2>
          <p className="mt-1 text-xs text-amber-800">
            Aggiungile al listino come voci personalizzate per usarle come extra nella lista.
          </p>
          <ul className="mt-2 divide-y divide-amber-200">
            {state.nonRiconosciute.map((n) => (
              <NonRiconosciutaRiga
                key={`${n.nome}-${n.prezzo}`}
                n={n}
                onAggiungi={(reparto) =>
                  update((s) => aggiungiVoce(s, n.nome, n.prezzo, reparto, toIso(new Date()), Date.now().toString(36)))
                }
                onScarta={() =>
                  update((s) => ({ ...s, nonRiconosciute: s.nonRiconosciute.filter((x) => !(x.nome === n.nome && x.prezzo === n.prezzo)) }))
                }
              />
            ))}
          </ul>
        </section>
      )}

      {REPARTI.map((reparto) => {
        const voci = catalogo.filter((c) => c.reparto === reparto);
        if (voci.length === 0) return null;
        return (
          <section key={reparto} className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{reparto}</h2>
            <ul className="mt-1 divide-y divide-slate-100">
              {voci.map((v) => {
                const p = state.prezzi[v.id];
                const custom = state.custom.some((c) => c.id === v.id);
                return (
                  <li key={v.id} className="flex items-center gap-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">{v.nome}</p>
                      <p className="text-xs text-slate-400">
                        {v.conf}
                        {p && ` · agg. ${dataBreve(p.data)}`}
                      </p>
                    </div>
                    <PriceInput value={p?.prezzo} onCommit={(n) => setPrezzo(v.id, n)} label={v.nome} />
                    {custom && (
                      <button onClick={() => rimuoviVoce(v.id)} className={btnTiny} aria-label={`Elimina ${v.nome}`}>
                        ✕
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <p className="text-center text-xs text-slate-400">Il prezzo è per confezione o pezzo, come indicato sotto il nome.</p>
    </div>
  );
}

function NonRiconosciutaRiga({
  n,
  onAggiungi,
  onScarta,
}: {
  n: NonRiconosciuta;
  onAggiungi: (reparto: Reparto) => void;
  onScarta: () => void;
}) {
  const [reparto, setReparto] = useState<Reparto>("Altro");
  return (
    <li className="flex flex-wrap items-center gap-2 py-2">
      <span className="min-w-0 flex-1 text-sm text-amber-950">
        {n.nome} <span className="tabular-nums text-amber-800">{euro(n.prezzo)}</span>
      </span>
      <select
        value={reparto}
        onChange={(e) => setReparto(e.target.value as Reparto)}
        aria-label={`Reparto per ${n.nome}`}
        className="rounded-md border border-amber-300 bg-white px-1 py-1 text-xs"
      >
        {REPARTI.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      <button onClick={() => onAggiungi(reparto)} className={btnTiny}>
        + listino
      </button>
      <button onClick={onScarta} className={btnTiny} aria-label={`Scarta ${n.nome}`}>
        ✕
      </button>
    </li>
  );
}

const parse = (d: string): number | undefined => {
  if (d.trim() === "") return undefined;
  const n = Number(d.replace(",", "."));
  return isFinite(n) && n >= 0 ? n : undefined;
};
const mostra = (v: number | undefined) => (v === undefined ? "" : String(v).replace(".", ","));

function PriceInput({
  value,
  onCommit,
  label,
}: {
  value: number | undefined;
  onCommit: (n: number | undefined) => void;
  label: string;
}) {
  const [draft, setDraft] = useState(mostra(value));
  // Se il valore cambia da fuori (import scontrino) aggiorna il campo.
  useEffect(() => {
    setDraft((d) => (parse(d) === value ? d : mostra(value)));
  }, [value]);

  return (
    <div className="flex shrink-0 items-center rounded-md border border-slate-300 px-1 focus-within:border-slate-900">
      <span className="pl-1 text-xs text-slate-400">€</span>
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        placeholder="—"
        aria-label={`Prezzo ${label}`}
        onChange={(e) => {
          const v = e.target.value;
          if (!/^\d*[.,]?\d{0,2}$/.test(v)) return;
          setDraft(v);
          if (v.trim() === "") onCommit(undefined);
          else {
            const n = parse(v);
            if (n !== undefined) onCommit(n);
          }
        }}
        className="w-16 bg-transparent px-1 py-1 text-right text-sm tabular-nums outline-none"
      />
    </div>
  );
}
