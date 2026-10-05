"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { caricaStato, type SpesaState } from "@/lib/spesa";
import SettimanaTab from "./spesa-settimana";
import ListaTab from "./spesa-lista";
import RicetteTab from "./spesa-ricette";
import PrezziTab from "./spesa-prezzi";

const STORAGE_KEY = "spesa_state_v1";

const TABS = [
  { id: "settimana", label: "Settimana" },
  { id: "lista", label: "Lista spesa" },
  { id: "ricette", label: "Ricette" },
  { id: "prezzi", label: "Prezzi" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function SpesaView() {
  const [state, setState] = useState<SpesaState | null>(null);
  const [tab, setTab] = useState<TabId>("settimana");

  useEffect(() => {
    let raw: unknown = null;
    try {
      raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    } catch {
      /* stato corrotto: si riparte dai default */
    }
    setState(caricaStato(raw, new Date()));
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage pieno o bloccato: lo stato resta solo in memoria */
    }
  }, [state]);

  const update = (fn: (s: SpesaState) => SpesaState) => setState((s) => (s ? fn(s) : s));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header>
        <Link href="/budget" className="text-xs font-medium text-slate-400 hover:text-slate-600 print:hidden">
          ← Budget
        </Link>
        <h1 className="text-2xl font-semibold">Spesa &amp; Ricette</h1>
        <p className="text-xs text-slate-500">Menù della settimana, lista della spesa e prezzi per 2 persone.</p>
      </header>

      <nav className="mt-5 grid grid-cols-4 gap-1 rounded-xl bg-slate-200/70 p-1 print:hidden" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-1 py-2 text-xs font-medium sm:text-sm ${
              tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {!state ? (
        <p className="mt-10 text-center text-slate-500">Caricamento…</p>
      ) : (
        <div className="mt-5">
          {tab === "settimana" && <SettimanaTab state={state} update={update} />}
          {tab === "lista" && <ListaTab state={state} update={update} />}
          {tab === "ricette" && <RicetteTab state={state} update={update} />}
          {tab === "prezzi" && <PrezziTab state={state} update={update} />}
        </div>
      )}

      <footer className="mt-10 text-center text-xs text-slate-400 print:hidden">
        Dati salvati nel browser di questo dispositivo.
      </footer>
    </main>
  );
}
