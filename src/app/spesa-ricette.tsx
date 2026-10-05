"use client";

import { useMemo } from "react";
import { RICETTE, catalogoCompleto, costoRicetta, euro, fmtQta, type Ricetta, type TabProps } from "@/lib/spesa";

const SEZIONI: { pasto: Ricetta["pasto"]; titolo: string }[] = [
  { pasto: "cena", titolo: "Cene" },
  { pasto: "pranzo", titolo: "Pranzi" },
];

export default function RicetteTab({ state }: TabProps) {
  const catalogo = useMemo(() => catalogoCompleto(state.custom), [state.custom]);

  return (
    <div className="space-y-6">
      {SEZIONI.map(({ pasto, titolo }) => (
        <section key={pasto}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{titolo}</h2>
          <ul className="space-y-3">
            {RICETTE.filter((r) => r.pasto === pasto).map((r) => {
              const { costo, mancanti, completo } = costoRicetta(r, state.prezzi, catalogo);
              return (
                <li key={r.id} className="rounded-2xl border border-slate-200 bg-white">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{r.nome}</p>
                        <p className="mt-1 flex flex-wrap gap-1">
                          {r.tags.map((t) => (
                            <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                              {t}
                            </span>
                          ))}
                        </p>
                      </div>
                      <span className="shrink-0 text-right text-xs">
                        {completo ? (
                          <span className="text-sm font-semibold tabular-nums text-slate-800">{euro(costo)}</span>
                        ) : (
                          <span className="text-slate-400">
                            {costo > 0 ? `≥ ${euro(costo)}` : "—"}
                            <br />
                            mancano {mancanti.length} prezzi
                          </span>
                        )}
                      </span>
                    </summary>
                    <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Ingredienti per 2 persone
                      </h3>
                      <ul className="mt-1 space-y-0.5 text-sm text-slate-700">
                        {r.ingredienti.map((i) => {
                          const ing = catalogo.find((c) => c.id === i.id);
                          return (
                            <li key={i.id} className="flex justify-between gap-3">
                              <span>{ing?.nome ?? i.id}</span>
                              <span className="text-xs tabular-nums text-slate-400">
                                {fmtQta(i.qta)} × {ing?.conf}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      <h3 className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Preparazione
                      </h3>
                      <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                        {r.passi.map((p, k) => (
                          <li key={k}>{p}</li>
                        ))}
                      </ol>
                      <p className="mt-3 text-xs text-slate-400">
                        Costo stimato dai prezzi inseriti, in proporzione alla quantità usata
                        {!completo && ` (mancano: ${mancanti.join(", ")})`}.
                      </p>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
