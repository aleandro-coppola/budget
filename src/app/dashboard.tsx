"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BudgetResult, BudgetSettings, Categorie, CatMode, EditableCat, PersonBudget } from "@/lib/budget";

const euro = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
const pct = (n: number) => `${n.toFixed(1).replace(".", ",")}%`;

type Who = "ale" | "cris";
const WHO_LABEL: Record<Who, string> = { ale: "Ale", cris: "Cristina" };

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

const STORAGE_KEY = "budget_settings_v2";

const CATS: { key: EditableCat; label: string; base: string }[] = [
  { key: "cibo", label: "Cibo", base: "del libero" },
  { key: "investimenti", label: "Investimenti", base: "del rimanente" },
  { key: "viaggi", label: "Viaggi", base: "del rimanente" },
  { key: "cointestato", label: "Cointestato (divertimento)", base: "del rimanente" },
  { key: "imprevisti", label: "Imprevisti", base: "del rimanente" },
];

type Riga = { key: keyof Categorie; label: string; note?: string };

const RIGHE_FISSE: Riga[] = [
  { key: "cibo", label: "Cibo mensile" },
  { key: "speseCasa", label: "Spese casa", note: "da Notion + extra" },
  { key: "spesePersonali", label: "Spese Revolut personali", note: "da Notion" },
  { key: "quotaCondivise", label: "Cointestato · spese condivise (metà)", note: "da Notion, vedi sotto" },
];

const RIGHE_POCKET: Riga[] = [
  { key: "investimenti", label: "Investimenti" },
  { key: "viaggi", label: "Viaggi", note: "viaggi e sfizi" },
  { key: "cointestato", label: "Cointestato · divertimento" },
  { key: "imprevisti", label: "Imprevisti" },
  { key: "contoPersonale", label: "Conto personale", note: "residuo" },
];

function fromDefaults(d: BudgetSettings): Settings {
  const cats = Object.fromEntries(
    CATS.map(({ key }) => [
      key,
      {
        mode: d.ale[key].mode,
        target: { ale: String(d.ale[key].target), cris: String(d.cris[key].target) },
        cap: { ale: String(d.ale[key].cap), cris: String(d.cris[key].cap) },
      },
    ])
  ) as Record<EditableCat, CatSet>;
  return {
    salaries: { ale: String(d.salaries.ale), cris: String(d.salaries.cris) },
    casaExtra: String(d.casaExtraTotale),
    cats,
  };
}

function loadSettings(defaults: Settings): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p?.salaries && CATS.every(({ key }) => p?.cats?.[key])) return p as Settings;
    }
  } catch {
    /* ignora */
  }
  return defaults;
}

function toPayload(s: Settings) {
  const n = (v: string) => {
    const x = Number(v);
    return isFinite(x) && x >= 0 ? x : 0;
  };
  const person = (who: Who) =>
    Object.fromEntries(
      CATS.map(({ key }) => {
        const c = s.cats[key];
        return [key, { mode: c.mode, target: n(c.target[who]), cap: n(c.cap[who]) }];
      })
    );
  return {
    salaries: { ale: n(s.salaries.ale), cris: n(s.salaries.cris) },
    casaExtraTotale: n(s.casaExtra),
    ale: person("ale"),
    cris: person("cris"),
  };
}

export default function Dashboard({ defaults }: { defaults: BudgetSettings }) {
  const router = useRouter();
  const [data, setData] = useState<BudgetResult | null>(null);
  const [generatedAt, setGeneratedAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>(() => fromDefaults(defaults));

  async function load(s: Settings) {
    setLoading(true);
    setError("");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
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
    const s = loadSettings(fromDefaults(defaults));
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
          <Link href="/" className="text-xs font-medium text-slate-400 hover:text-slate-600">
            ← Home
          </Link>
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
            const d = fromDefaults(defaults);
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
          Impostazioni pocket (target %/€ + tetto)
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="px-2 py-1 font-medium">Pocket</th>
                <th className="px-2 py-1 font-medium">Modo</th>
                <th className="px-2 py-1 text-right font-medium text-ale">Ale target</th>
                <th className="px-2 py-1 text-right font-medium text-ale">Ale tetto €</th>
                <th className="px-2 py-1 text-right font-medium text-cris">Cris target</th>
                <th className="px-2 py-1 text-right font-medium text-cris">Cris tetto €</th>
              </tr>
            </thead>
            <tbody>
              {CATS.map(({ key, label, base }) => {
                const cs = settings.cats[key];
                const unit = cs.mode === "pct" ? "%" : "€";
                return (
                  <tr key={key} className="border-t border-slate-100">
                    <td className="px-2 py-1.5">
                      <span className="font-medium text-slate-700">{label}</span>
                      {cs.mode === "pct" && <span className="ml-1 text-xs text-slate-400">% {base}</span>}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="inline-flex overflow-hidden rounded-md border border-slate-300 text-xs">
                        {(["eur", "pct"] as CatMode[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => setMode(key, m)}
                            className={`px-2 py-1 ${cs.mode === m ? "bg-slate-900 text-white" : "bg-white text-slate-500"}`}
                          >
                            {m === "eur" ? "€" : "%"}
                          </button>
                        ))}
                      </div>
                    </td>
                    <MiniNum value={cs.target.ale} unit={unit} onChange={(v) => setField(key, "target", "ale", v)} />
                    <MiniNum value={cs.cap.ale} unit="€" onChange={(v) => setField(key, "cap", "ale", v)} />
                    <MiniNum value={cs.target.cris} unit={unit} onChange={(v) => setField(key, "target", "cris", v)} />
                    <MiniNum value={cs.cap.cris} unit="€" onChange={(v) => setField(key, "cap", "cris", v)} />
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-400">
            Effettivo = min(target, tetto). Rimanente = libero − cibo − spese casa − spese Revolut personali − metà
            spese condivise. Il conto personale prende il residuo (minimo 50 €: sotto, i pocket vengono compressi
            partendo dal cointestato).
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

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p>
              <span className="font-semibold">Conto cointestato:</span> Ale versa{" "}
              <span className="font-semibold">{euro(data.ale.cointestatoTotale)}</span>, Cristina versa{" "}
              <span className="font-semibold">{euro(data.cris.cointestatoTotale)}</span> (metà spese condivise +
              divertimento).
            </p>
            <p className="mt-1">
              <span className="font-semibold">Da ritirare</span> per le spese condivise anticipate:{" "}
              {(["ale", "cris"] as Who[]).map((w, i) => (
                <span key={w}>
                  {i > 0 && " · "}
                  {WHO_LABEL[w]} <span className="font-semibold">{euro(data.ritiri[w])}</span>
                </span>
              ))}
              .
            </p>
          </div>

          {/* Tabella riepilogo */}
          <section className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Pocket</th>
                  <th className="px-4 py-2 text-right font-medium text-ale">Ale</th>
                  <th className="px-4 py-2 text-right font-medium text-cris">Cristina</th>
                  <th className="px-4 py-2 text-right font-medium">Totale</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <td className="px-4 pb-1 pt-2" colSpan={4}>
                    Spese fisse · % sul libero
                  </td>
                </tr>
                {RIGHE_FISSE.map((r) => (
                  <CatRow key={r.key} riga={r} ale={data.ale} cris={data.cris} />
                ))}
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                  <td className="px-4 py-2">Rimanente</td>
                  <td className="px-4 py-2 text-right tabular-nums">{euro(data.ale.rimanente)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{euro(data.cris.rimanente)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{euro(data.ale.rimanente + data.cris.rimanente)}</td>
                </tr>
                <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <td className="px-4 pb-1 pt-2" colSpan={4}>
                    Pocket · % sul rimanente
                  </td>
                </tr>
                {RIGHE_POCKET.map((r) => (
                  <CatRow key={r.key} riga={r} ale={data.ale} cris={data.cris} />
                ))}
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                  <td className="px-4 py-2">Totale (= libero)</td>
                  <td className="px-4 py-2 text-right tabular-nums">{euro(data.ale.totale)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{euro(data.cris.totale)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{euro(data.ale.totale + data.cris.totale)}</td>
                </tr>
                <tr className="border-t border-slate-200 font-semibold text-slate-700">
                  <td className="px-4 py-2">
                    Totale da versare nel cointestato
                    <span className="ml-1 text-xs font-normal text-slate-400">(già incluso sopra)</span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{euro(data.ale.cointestatoTotale)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{euro(data.cris.cointestatoTotale)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {euro(data.ale.cointestatoTotale + data.cris.cointestatoTotale)}
                  </td>
                </tr>
                <RitiriRow ritiri={data.ritiri} />
              </tbody>
            </table>
          </section>

          {/* Spese condivise */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">Spese condivise → conto cointestato</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Ogni spesa condivisa (non casa) si divide a metà e ognuno versa la sua metà nel cointestato. Chi
              l&apos;ha anticipata con la sua carta la ritira dal cointestato. Per le spese BCC ritira solo la metà
              dell&apos;altro, perché la sua è già nella BCC. Senza paga-ale/paga-cris la spesa si paga
              direttamente dal cointestato.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-slate-400">
                  <tr>
                    <th className="py-1 pr-3 font-medium">Spesa</th>
                    <th className="py-1 pr-3 font-medium">Conto</th>
                    <th className="py-1 pr-3 font-medium">Pagata da</th>
                    <th className="py-1 pr-3 text-right font-medium">Totale</th>
                    <th className="py-1 pr-3 text-right font-medium">Metà</th>
                    <th className="py-1 text-right font-medium">Da ritirare</th>
                  </tr>
                </thead>
                <tbody>
                  {data.condiviseRows.map((r, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-1 pr-3 text-slate-600">{r.name}</td>
                      <td className="py-1 pr-3 text-xs uppercase text-slate-400">{r.lato}</td>
                      <td className="py-1 pr-3 text-xs">
                        {r.pagante ? (
                          <span className={r.pagante === "ale" ? "text-ale" : "text-cris"}>{WHO_LABEL[r.pagante]}</span>
                        ) : (
                          <span className="text-slate-500">Cointestato</span>
                        )}
                      </td>
                      <td className="py-1 pr-3 text-right tabular-nums">{euro(r.spesa)}</td>
                      <td className="py-1 pr-3 text-right tabular-nums text-slate-500">{euro(r.spesa / 2)}</td>
                      <td className="py-1 text-right tabular-nums">
                        {r.pagante ? (
                          <span className={r.pagante === "ale" ? "text-ale" : "text-cris"}>{euro(r.ritiro)}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-200 text-xs font-semibold text-slate-600">
                    <td className="py-1.5 pr-3" colSpan={4}>
                      Versano nel cointestato: Ale {euro(data.ale.categorie.quotaCondivise)} · Cristina{" "}
                      {euro(data.cris.categorie.quotaCondivise)}
                    </td>
                    <td className="py-1.5 text-right" colSpan={2}>
                      Ritirano: Ale {euro(data.ritiri.ale)} · Cristina {euro(data.ritiri.cris)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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

function CatRow({ riga, ale, cris }: { riga: Riga; ale: PersonBudget; cris: PersonBudget }) {
  const a = ale.categorie[riga.key];
  const c = cris.categorie[riga.key];
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-2">
        {riga.label}
        {riga.note && <span className="ml-1 text-xs text-slate-400">({riga.note})</span>}
      </td>
      <Amount value={a} p={ale.perc[riga.key]} />
      <Amount value={c} p={cris.perc[riga.key]} />
      <td className="px-4 py-2 text-right tabular-nums text-slate-500">{euro(a + c)}</td>
    </tr>
  );
}

function RitiriRow({ ritiri }: { ritiri: Record<Who, number> }) {
  const cell = (who: Who) =>
    ritiri[who] > 0 ? (
      <span className="text-emerald-700">+{euro(ritiri[who])} da ritirare</span>
    ) : (
      <span className="text-slate-400">—</span>
    );
  return (
    <tr className="border-t border-amber-200 bg-amber-50">
      <td className="px-4 py-2 font-medium text-amber-900">
        Conguaglio: da ritirare dal cointestato
        <span className="ml-1 text-xs font-normal text-amber-700">(spese anticipate)</span>
      </td>
      <td className="px-4 py-2 text-right text-sm font-semibold tabular-nums">{cell("ale")}</td>
      <td className="px-4 py-2 text-right text-sm font-semibold tabular-nums">{cell("cris")}</td>
      <td className="px-4 py-2 text-right text-sm font-semibold tabular-nums text-amber-900">
        {euro(ritiri.ale + ritiri.cris)}
      </td>
    </tr>
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
  const fisse = p.categorie.cibo + p.categorie.speseCasa + p.categorie.spesePersonali + p.categorie.quotaCondivise;
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 ring-1 ${ring}`}>
      <div className="flex items-baseline justify-between">
        <h2 className={`text-lg font-semibold ${text}`}>{p.person === "ale" ? "Ale" : "Cristina"}</h2>
        <span className="text-sm text-slate-500">Rimanente {euro(p.rimanente)}</span>
      </div>
      <dl className="mt-3 space-y-1 text-sm text-slate-600">
        <Row label="Stipendio" value={euro(p.stipendio)} />
        <Row label="− Spese BCC" value={euro(p.bcc)} />
        <Row label="= Libero (Revolut)" value={euro(p.libero)} bold />
        <Row label="− Spese fisse (cibo, casa, Revolut, condivise)" value={euro(fisse)} />
        <Row label="= Rimanente per i pocket" value={euro(p.rimanente)} bold />
      </dl>
      {p.compresso && (
        <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
          Rimanente stretto: pocket compressi per lasciare il minimo sul conto personale.
          {p.deficit > 0 && ` Mancano ${euro(p.deficit)}.`}
        </p>
      )}
      {!p.compresso && p.deficit > 0 && (
        <p className="mt-2 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">Mancano {euro(p.deficit)}.</p>
      )}
      <details className="mt-3 text-xs text-slate-500">
        <summary className="cursor-pointer select-none">Dettaglio BCC</summary>
        <div className="mt-1 space-y-0.5">
          <Row label="BCC shared (no paga) /2" value={euro(p.bccSharedNoPaga)} small />
          <Row label="BCC shared (paga) /2" value={euro(p.bccSharedPaga)} small />
          <Row label="BCC individuale" value={euro(p.bccIndividuale)} small />
        </div>
      </details>
    </div>
  );
}

function Row({ label, value, bold, small }: { label: string; value: string; bold?: boolean; small?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${bold ? "font-semibold text-slate-900" : ""}`}>
      <dt className={small ? "text-slate-400" : ""}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
