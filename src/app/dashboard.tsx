"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BudgetResult, PersonBudget, CatMode } from "@/lib/budget";

const euro = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
const pct = (n: number) => `${n.toFixed(1).replace(".", ",")}%`;

type EditableCat = "cibo" | "investimenti" | "viaggi" | "fondoComune";
type Who = "ale" | "cris";

interface CatSet {
  mode: CatMode;
  target: Record<Who, string>;
  cap: Record<Who, string>;
}
interface Settings {
  salaries: Record<Who, string>;
  casaExtra: string;
  cats: Record<EditableCat, CatSet>;
}

const CAT_LABEL: Record<EditableCat, string> = {
  cibo: "Cibo",
  investimenti: "Investimenti",
  viaggi: "Viaggi",
  fondoComune: "Fondo comune",
};

// Ordine di visualizzazione completo (incluse le auto: conto e casa)
const ALL_CATS: { key: keyof PersonBudget["categorie"]; label: string; auto?: string }[] = [
  { key: "cibo", label: "Cibo" },
  { key: "investimenti", label: "Investimenti" },
  { key: "contoPersonale", label: "Conto personale", auto: "residuo" },
  { key: "viaggi", label: "Viaggi" },
  { key: "fondoComune", label: "Fondo comune" },
  { key: "speseCasa", label: "Spese casa", auto: "da Notion + extra" },
];

function defaultSettings(): Settings {
  const c = (a: string, cr: string): CatSet => ({
    mode: "eur",
    target: { ale: a, cris: cr },
    cap: { ale: a, cris: cr },
  });
  return {
    salaries: { ale: "1900", cris: "1500" },
    casaExtra: "40",
    cats: {
      cibo: c("220", "130"),
      investimenti: c("191.43", "76.85"),
      viaggi: c("143.57", "57.64"),
      fondoComune: c("95.72", "38.43"),
    },
  };
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem("budget_settings");
    if (raw) {
      const p = JSON.parse(raw);
      if (p?.cats?.cibo && p?.salaries) return p as Settings;
    }
  } catch {
    /* ignora */
  }
  return defaultSettings();
}

function toPayload(s: Settings) {
  const n = (v: string) => {
    const x = Number(v);
    return isFinite(x) && x >= 0 ? x : 0;
  };
  const cat = (c: CatSet, who: Who) => ({ mode: c.mode, target: n(c.target[who]), cap: n(c.cap[who]) });
  const person = (who: Who) => ({
    cibo: cat(s.cats.cibo, who),
    investimenti: cat(s.cats.investimenti, who),
    viaggi: cat(s.cats.viaggi, who),
    fondoComune: cat(s.cats.fondoComune, who),
  });
  return {
    salaries: { ale: n(s.salaries.ale), cris: n(s.salaries.cris) },
    casaExtraTotale: n(s.casaExtra),
    ale: person("ale"),
    cris: person("cris"),
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<BudgetResult | null>(null);
  const [generatedAt, setGeneratedAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  async function load(s: Settings) {
    setLoading(true);
    setError("");
    try {
      localStorage.setItem("budget_settings", JSON.stringify(s));
    } catch {
      /* ignora */
    }
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(toPayload(s)),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (json.ok) {
        setData(json.result);
        setGeneratedAt(json.generatedAt);
      } else {
        setError(json.error ?? "Errore");
      }
    } catch {
      setError("Errore di rete");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    load(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setSalary(who: Who, v: string) {
    setSettings((p) => ({ ...p, salaries: { ...p.salaries, [who]: v } }));
  }
  function setCasaExtra(v: string) {
    setSettings((p) => ({ ...p, casaExtra: v }));
  }
  function setMode(cat: EditableCat, mode: CatMode) {
    setSettings((p) => {
      const next = structuredClone(p);
      next.cats[cat].mode = mode;
      return next;
    });
  }
  function setField(cat: EditableCat, field: "target" | "cap", who: Who, v: string) {
    setSettings((p) => {
      const next = structuredClone(p);
      next.cats[cat][field][who] = v;
      return next;
    });
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Budget Ale &amp; Cris</h1>
          {generatedAt && (
            <p className="text-xs text-slate-500">
              Calcolo live da Notion · {new Date(generatedAt).toLocaleString("it-IT")}
            </p>
          )}
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Esci
        </button>
      </header>

      {/* Stipendi */}
      <section className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4">
        <NumField label="Stipendio Ale" accent="ale" value={settings.salaries.ale} onChange={(v) => setSalary("ale", v)} />
        <NumField label="Stipendio Cristina" accent="cris" value={settings.salaries.cris} onChange={(v) => setSalary("cris", v)} />
        <NumField label="Extra casa (totale)" value={settings.casaExtra} onChange={setCasaExtra} />
        <button
          onClick={() => load(settings)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Ricalcola
        </button>
        <button
          onClick={() => {
            const d = defaultSettings();
            setSettings(d);
            load(d);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          Reset
        </button>
      </section>

      {/* Pannello impostazioni categorie */}
      <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4" open>
        <summary className="cursor-pointer select-none text-sm font-semibold text-slate-700">
          Impostazioni categorie (target %/€ + tetto)
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="px-2 py-1 font-medium">Categoria</th>
                <th className="px-2 py-1 font-medium">Modo</th>
                <th className="px-2 py-1 text-right font-medium text-ale">Ale target</th>
                <th className="px-2 py-1 text-right font-medium text-ale">Ale tetto €</th>
                <th className="px-2 py-1 text-right font-medium text-cris">Cris target</th>
                <th className="px-2 py-1 text-right font-medium text-cris">Cris tetto €</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(CAT_LABEL) as EditableCat[]).map((cat) => {
                const cs = settings.cats[cat];
                const unit = cs.mode === "pct" ? "%" : "€";
                return (
                  <tr key={cat} className="border-t border-slate-100">
                    <td className="px-2 py-1.5 font-medium text-slate-700">{CAT_LABEL[cat]}</td>
                    <td className="px-2 py-1.5">
                      <div className="inline-flex overflow-hidden rounded-md border border-slate-300 text-xs">
                        {(["eur", "pct"] as CatMode[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => setMode(cat, m)}
                            className={`px-2 py-1 ${cs.mode === m ? "bg-slate-900 text-white" : "bg-white text-slate-500"}`}
                          >
                            {m === "eur" ? "€" : "%"}
                          </button>
                        ))}
                      </div>
                    </td>
                    <MiniNum value={cs.target.ale} unit={unit} onChange={(v) => setField(cat, "target", "ale", v)} />
                    <MiniNum value={cs.cap.ale} unit="€" onChange={(v) => setField(cat, "cap", "ale", v)} />
                    <MiniNum value={cs.target.cris} unit={unit} onChange={(v) => setField(cat, "target", "cris", v)} />
                    <MiniNum value={cs.cap.cris} unit="€" onChange={(v) => setField(cat, "cap", "cris", v)} />
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-400">
            Effettivo = min(target, tetto). In &quot;%&quot; il target è calcolato sul libero. Conto personale
            (residuo) e Spese casa (Notion + extra) si adeguano per tenere il totale al 100%.
          </p>
        </div>
      </details>

      {loading && <p className="mt-10 text-center text-slate-500">Caricamento…</p>}
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {data && !loading && (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <PersonCard p={data.ale} accent="ale" />
            <PersonCard p={data.cris} accent="cris" />
          </section>

          {/* Tabella riepilogo con percentuali */}
          <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Categoria</th>
                  <th className="px-4 py-2 text-right font-medium text-ale">Ale</th>
                  <th className="px-4 py-2 text-right font-medium text-cris">Cristina</th>
                  <th className="px-4 py-2 text-right font-medium">Totale</th>
                </tr>
              </thead>
              <tbody>
                {ALL_CATS.map((c) => {
                  const a = data.ale.categorie[c.key];
                  const cr = data.cris.categorie[c.key];
                  const ap = data.ale.perc[c.key];
                  const cp = data.cris.perc[c.key];
                  return (
                    <tr key={c.key} className="border-t border-slate-100">
                      <td className="px-4 py-2">
                        {c.label}
                        {c.auto && <span className="ml-1 text-xs text-slate-400">({c.auto})</span>}
                      </td>
                      <Amount value={a} p={ap} />
                      <Amount value={cr} p={cp} />
                      <td className="px-4 py-2 text-right tabular-nums text-slate-500">{euro(a + cr)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                  <td className="px-4 py-2">Totale (= libero)</td>
                  <td className="px-4 py-2 text-right tabular-nums">{euro(data.ale.totale)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{euro(data.cris.totale)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{euro(data.ale.totale + data.cris.totale)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Differenza al comune */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">
              Differenza contributi al comune (Viaggi + Fondo + Casa)
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {data.differenzaChi === null ? (
                "Contributi pari."
              ) : (
                <>
                  <span className={data.differenzaChi === "ale" ? "font-semibold text-ale" : "font-semibold text-cris"}>
                    {data.differenzaChi === "ale" ? "Ale" : "Cristina"}
                  </span>{" "}
                  versa {euro(Math.abs(data.differenzaComune))} in piu&#39; nel comune.
                </>
              )}
            </p>
          </section>

          {/* Dettaglio spese casa */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">Dettaglio Spese casa</h2>
            <p className="mt-1 text-xs text-slate-500">
              Righe reali {euro(data.speseCasaRigheReali)} + extra {euro(data.casaExtraTotale)} ={" "}
              {euro(data.speseCasaTotale)} · diviso 50/50 = {euro(data.speseCasaTotale / 2)} a testa
            </p>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {data.casaRows.map((r, i) => (
                <li key={i} className="flex justify-between py-1">
                  <span className="text-slate-600">{r.name}</span>
                  <span className="tabular-nums">{euro(r.spesa)}</span>
                </li>
              ))}
            </ul>
          </section>

          <footer className="mt-8 text-center text-xs text-slate-400">
            Numeri calcolati dal vivo dalle righe del DB &quot;Spese&quot;. Impostazioni salvate nel browser.
          </footer>
        </>
      )}
    </main>
  );
}

function Amount({ value, p }: { value: number; p: number }) {
  return (
    <td className="px-4 py-2 text-right tabular-nums">
      {euro(value)}
      <span className="ml-1 text-xs text-slate-400">{pct(p)}</span>
    </td>
  );
}

function NumField({
  label,
  accent,
  value,
  onChange,
}: {
  label: string;
  accent?: "ale" | "cris";
  value: string;
  onChange: (v: string) => void;
}) {
  const text = accent === "ale" ? "text-ale" : accent === "cris" ? "text-cris" : "text-slate-600";
  return (
    <label className="flex flex-col gap-1">
      <span className={`text-xs font-medium ${text}`}>{label}</span>
      <div className="flex items-center rounded-lg border border-slate-300 px-2 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10">
        <span className="text-sm text-slate-400">€</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 bg-transparent px-2 py-2 text-sm outline-none tabular-nums"
        />
      </div>
    </label>
  );
}

function MiniNum({
  value,
  unit,
  onChange,
}: {
  value: string;
  unit: string;
  onChange: (v: string) => void;
}) {
  return (
    <td className="px-2 py-1.5 text-right">
      <div className="inline-flex items-center rounded-md border border-slate-300 px-1 focus-within:border-slate-900">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 bg-transparent px-1 py-1 text-right text-sm outline-none tabular-nums"
        />
        <span className="pr-1 text-xs text-slate-400">{unit}</span>
      </div>
    </td>
  );
}

function PersonCard({ p, accent }: { p: PersonBudget; accent: "ale" | "cris" }) {
  const ring = accent === "ale" ? "ring-ale/30" : "ring-cris/30";
  const text = accent === "ale" ? "text-ale" : "text-cris";
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 ring-1 ${ring}`}>
      <div className="flex items-baseline justify-between">
        <h2 className={`text-lg font-semibold ${text}`}>{p.person === "ale" ? "Ale" : "Cristina"}</h2>
        <span className="text-sm text-slate-500">Libero {euro(p.libero)}</span>
      </div>
      <dl className="mt-3 space-y-1 text-sm text-slate-600">
        <Row label="Stipendio" value={euro(p.stipendio)} />
        <Row label="− Spese BCC" value={euro(p.bcc)} />
        <Row label="= Libero (Revolut)" value={euro(p.libero)} bold />
      </dl>
      {p.compresso && (
        <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
          Libero insufficiente: voci discrezionali compresse.
          {p.deficit > 0 && ` Deficit residuo ${euro(p.deficit)}.`}
        </p>
      )}
      <details className="mt-3 text-xs text-slate-500">
        <summary className="cursor-pointer select-none">Dettaglio BCC / conto base</summary>
        <div className="mt-1 space-y-0.5">
          <Row label="BCC shared (no paga) /2" value={euro(p.bccSharedNoPaga)} small />
          <Row label="BCC shared (paga) /2" value={euro(p.bccSharedPaga)} small />
          <Row label="BCC individuale" value={euro(p.bccIndividuale)} small />
          <Row label="Conto personale base (reale)" value={euro(p.contoBase)} small />
        </div>
      </details>
    </div>
  );
}

function Row({ label, value, bold, small }: { label: string; value: string; bold?: boolean; small?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-slate-900" : ""}`}>
      <dt className={small ? "text-slate-400" : ""}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
