"use client";

import { useMemo, useState } from "react";
import {
  REPARTI,
  calcolaLista,
  catalogoCompleto,
  euro,
  testoLista,
  type TabProps,
  type VoceLista,
} from "@/lib/spesa";

const btnPrimary = "rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700";
const btnSecondary =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100";
const btnTiny = "shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 print:hidden";

export default function ListaTab({ state, update }: TabProps) {
  const lista = useMemo(() => calcolaLista(state), [state]);
  const catalogo = useMemo(() => catalogoCompleto(state.custom), [state.custom]);
  const [msg, setMsg] = useState("");
  const [extraId, setExtraId] = useState("");

  const vociDaComprare = [...lista.gruppi.flatMap((g) => g.voci).map((v) => v.id), ...lista.extra.map((v) => `extra:${v.id}`)];
  const senzaPrezzo = Array.from(new Set(lista.senzaPrezzo.map((v) => v.nome)));
  const nelCarrello = vociDaComprare.filter((k) => state.carrello[k]).length;

  const toggle = (key: string) => update((s) => ({ ...s, carrello: { ...s.carrello, [key]: !s.carrello[key] } }));
  const setInCasa = (id: string, v: boolean) => update((s) => ({ ...s, inCasa: { ...s.inCasa, [id]: v } }));
  const setExtra = (id: string, n: number) =>
    update((s) => {
      const extra = { ...s.extra };
      if (n > 0) extra[id] = n;
      else delete extra[id];
      return { ...s, extra };
    });

  async function copia() {
    const testo = testoLista(lista, state.inizio);
    try {
      await navigator.clipboard.writeText(testo);
      setMsg("Lista copiata negli appunti");
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = testo;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        setMsg(ok ? "Lista copiata negli appunti" : "Copia non riuscita");
      } catch {
        setMsg("Copia non riuscita");
      }
    }
    setTimeout(() => setMsg(""), 2500);
  }

  const vuota = lista.gruppi.length === 0 && lista.extra.length === 0 && lista.inCasa.length === 0;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-slate-500">Totale stimato</p>
            <p className="text-2xl font-semibold tabular-nums">{euro(lista.totale)}</p>
          </div>
          <p className="text-xs text-slate-500">
            {nelCarrello}/{vociDaComprare.length} nel carrello
          </p>
        </div>
        {senzaPrezzo.length > 0 && (
          <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
            {senzaPrezzo.length} {senzaPrezzo.length === 1 ? "voce senza prezzo" : "voci senza prezzo"}, non incluse nel
            totale: {senzaPrezzo.join(", ")}. Inseriscile nella tab Prezzi.
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 print:hidden">
          <button onClick={copia} className={btnPrimary}>
            Copia lista
          </button>
          <button onClick={() => window.print()} className={btnSecondary}>
            Stampa
          </button>
          <button onClick={() => update((s) => ({ ...s, carrello: {} }))} className={btnSecondary}>
            Azzera spunte
          </button>
          {msg && <span className="text-xs text-emerald-700">{msg}</span>}
        </div>
      </section>

      {vuota && (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Nessuna ricetta in settimana: scegline qualcuna nella tab Settimana per generare la lista.
        </p>
      )}

      {lista.gruppi.map((g) => (
        <section key={g.reparto} className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{g.reparto}</h2>
          <ul className="mt-1 divide-y divide-slate-100">
            {g.voci.map((v) => (
              <Riga
                key={v.id}
                v={v}
                checked={!!state.carrello[v.id]}
                onToggle={() => toggle(v.id)}
                azione={
                  <button onClick={() => setInCasa(v.id, true)} className={btnTiny}>
                    ho già
                  </button>
                }
              />
            ))}
          </ul>
        </section>
      ))}

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Extra</h2>
        <div className="mt-2 flex gap-2 print:hidden">
          <select
            value={extraId}
            onChange={(e) => setExtraId(e.target.value)}
            aria-label="Voce extra da aggiungere"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm outline-none focus:border-slate-900"
          >
            <option value="">Aggiungi una voce del listino…</option>
            {REPARTI.map((r) => {
              const voci = catalogo.filter((c) => c.reparto === r);
              if (voci.length === 0) return null;
              return (
                <optgroup key={r} label={r}>
                  {voci.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          <button
            disabled={!extraId}
            onClick={() => {
              setExtra(extraId, (state.extra[extraId] ?? 0) + 1);
              setExtraId("");
            }}
            className={`${btnPrimary} disabled:opacity-40`}
          >
            Aggiungi
          </button>
        </div>
        {lista.extra.length > 0 && (
          <ul className="mt-2 divide-y divide-slate-100">
            {lista.extra.map((v) => (
              <Riga
                key={v.id}
                v={v}
                checked={!!state.carrello[`extra:${v.id}`]}
                onToggle={() => toggle(`extra:${v.id}`)}
                azione={
                  <span className="flex shrink-0 items-center gap-1 print:hidden">
                    <button onClick={() => setExtra(v.id, v.confezioni - 1)} className={btnTiny} aria-label="Una in meno">
                      −
                    </button>
                    <button onClick={() => setExtra(v.id, v.confezioni + 1)} className={btnTiny} aria-label="Una in più">
                      +
                    </button>
                  </span>
                }
              />
            ))}
          </ul>
        )}
      </section>

      {lista.inCasa.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Già in casa</h2>
          <ul className="mt-1 divide-y divide-slate-200">
            {lista.inCasa.map((v) => (
              <li key={v.id} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1 text-sm text-slate-600">
                  {v.nome} <span className="text-xs text-slate-400">{v.conf}</span>
                </span>
                <button onClick={() => setInCasa(v.id, false)} className={btnTiny}>
                  devo comprarlo
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Riga({
  v,
  checked,
  onToggle,
  azione,
}: {
  v: VoceLista;
  checked: boolean;
  onToggle: () => void;
  azione: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        aria-label={`${v.nome} nel carrello`}
        className="h-5 w-5 shrink-0 accent-slate-900"
      />
      <div className={`min-w-0 flex-1 ${checked ? "text-slate-400 line-through" : "text-slate-800"}`}>
        <span className="text-sm font-medium">{v.nome}</span>
        <span className="ml-1 text-xs text-slate-400">
          {v.confezioni} × {v.conf}
        </span>
      </div>
      <span className="text-sm tabular-nums text-slate-500">{v.totale !== undefined ? euro(v.totale) : "—"}</span>
      {azione}
    </li>
  );
}
