"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BudgetResult, PersonBudget } from "@/lib/budget";

const euro = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

const CATS: { key: keyof PersonBudget["categorie"]; label: string }[] = [
  { key: "cibo", label: "Cibo" },
  { key: "investimenti", label: "Investimenti" },
  { key: "contoPersonale", label: "Conto personale" },
  { key: "viaggi", label: "Viaggi" },
  { key: "fondoComune", label: "Fondo comune" },
  { key: "speseCasa", label: "Spese casa" },
];

const DEFAULT_ALE = "2359";
const DEFAULT_CRIS = "1500";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<BudgetResult | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [aleSalary, setAleSalary] = useState(DEFAULT_ALE);
  const [crisSalary, setCrisSalary] = useState(DEFAULT_CRIS);

  async function load(override?: { ale: string; cris: string }) {
    const a = (override?.ale ?? aleSalary).trim();
    const c = (override?.cris ?? crisSalary).trim();
    setLoading(true);
    setError("");
    // ricorda i valori nel browser
    try {
      localStorage.setItem("salary_ale", a);
      localStorage.setItem("salary_cris", c);
    } catch {
      /* localStorage non disponibile: ignora */
    }
    const params = new URLSearchParams();
    if (a !== "") params.set("ale", a);
    if (c !== "") params.set("cris", c);
    const url = "/api/budget" + (params.toString() ? `?${params}` : "");
    try {
      const res = await fetch(url, { cache: "no-store" });
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
    let a = DEFAULT_ALE;
    let c = DEFAULT_CRIS;
    try {
      a = localStorage.getItem("salary_ale") ?? DEFAULT_ALE;
      c = localStorage.getItem("salary_cris") ?? DEFAULT_CRIS;
    } catch {
      /* ignora */
    }
    setAleSalary(a);
    setCrisSalary(c);
    load({ ale: a, cris: c });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {/* Input stipendi */}
      <section className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4">
        <SalaryInput
          label="Stipendio Ale"
          accent="ale"
          value={aleSalary}
          onChange={setAleSalary}
          onEnter={() => load()}
        />
        <SalaryInput
          label="Stipendio Cristina"
          accent="cris"
          value={crisSalary}
          onChange={setCrisSalary}
          onEnter={() => load()}
        />
        <button
          onClick={() => load()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Ricalcola
        </button>
        <button
          onClick={() => {
            setAleSalary(DEFAULT_ALE);
            setCrisSalary(DEFAULT_CRIS);
            load({ ale: DEFAULT_ALE, cris: DEFAULT_CRIS });
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          Reset
        </button>
      </section>

      {loading && <p className="mt-10 text-center text-slate-500">Caricamento…</p>}

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && !loading && (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <PersonCard p={data.ale} accent="ale" />
            <PersonCard p={data.cris} accent="cris" />
          </section>

          {/* Tabella riepilogo */}
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
                {CATS.map((c) => {
                  const a = data.ale.categorie[c.key];
                  const cr = data.cris.categorie[c.key];
                  return (
                    <tr key={c.key} className="border-t border-slate-100">
                      <td className="px-4 py-2">{c.label}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{euro(a)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{euro(cr)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-500">
                        {euro(a + cr)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                  <td className="px-4 py-2">Totale (= libero)</td>
                  <td className="px-4 py-2 text-right tabular-nums">{euro(data.ale.totale)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{euro(data.cris.totale)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {euro(data.ale.totale + data.cris.totale)}
                  </td>
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
                  <span
                    className={
                      data.differenzaChi === "ale"
                        ? "font-semibold text-ale"
                        : "font-semibold text-cris"
                    }
                  >
                    {data.differenzaChi === "ale" ? "Ale" : "Cristina"}
                  </span>{" "}
                  versa {euro(Math.abs(data.differenzaComune))} in piu&#39; nel comune.
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Non implica un trasferimento dovuto: dipende dal criterio di equita&#39; scelto.
            </p>
          </section>

          {/* Dettaglio spese casa */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">Dettaglio Spese casa</h2>
            <p className="mt-1 text-xs text-slate-500">
              Righe reali {euro(data.speseCasaRigheReali)} + extra fisso ={" "}
              {euro(data.speseCasaTotale)} · diviso 50/50 ={" "}
              {euro(data.speseCasaTotale / 2)} a testa
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
            Numeri calcolati dal vivo dalle righe del DB &quot;Spese&quot;. Possono differire dallo
            snapshot nelle regole.
          </footer>
        </>
      )}
    </main>
  );
}

function SalaryInput({
  label,
  accent,
  value,
  onChange,
  onEnter,
}: {
  label: string;
  accent: "ale" | "cris";
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
}) {
  const text = accent === "ale" ? "text-ale" : "text-cris";
  return (
    <label className="flex flex-col gap-1">
      <span className={`text-xs font-medium ${text}`}>{label}</span>
      <div className="flex items-center rounded-lg border border-slate-300 px-2 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10">
        <span className="text-sm text-slate-400">€</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEnter();
          }}
          className="w-28 bg-transparent px-2 py-2 text-sm outline-none tabular-nums"
        />
      </div>
    </label>
  );
}

function PersonCard({ p, accent }: { p: PersonBudget; accent: "ale" | "cris" }) {
  const ring = accent === "ale" ? "ring-ale/30" : "ring-cris/30";
  const text = accent === "ale" ? "text-ale" : "text-cris";
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 ring-1 ${ring}`}>
      <div className="flex items-baseline justify-between">
        <h2 className={`text-lg font-semibold ${text}`}>
          {p.person === "ale" ? "Ale" : "Cristina"}
        </h2>
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

function Row({
  label,
  value,
  bold,
  small,
}: {
  label: string;
  value: string;
  bold?: boolean;
  small?: boolean;
}) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-slate-900" : ""}`}>
      <dt className={small ? "text-slate-400" : ""}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
