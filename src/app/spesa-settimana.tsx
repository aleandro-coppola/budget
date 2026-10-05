"use client";

import {
  RICETTE,
  TAGS,
  aggiungiGiorni,
  cambiaGiornoPizza,
  cambiaInizio,
  fromIso,
  indicePizza,
  riepilogoTag,
  suggerisciSettimana,
  GIORNI,
  type GiornoPizza,
  type Tag,
  type TabProps,
} from "@/lib/spesa";

const TAG_LABEL: Record<Tag, string> = {
  pesce: "Pesce",
  legumi: "Legumi",
  carne: "Carne",
  uova: "Uova",
  pasta: "Pasta",
  verdure: "Verdure",
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const PRANZI = RICETTE.filter((r) => r.pasto === "pranzo");
const CENE = RICETTE.filter((r) => r.pasto === "cena");

export default function SettimanaTab({ state, update }: TabProps) {
  const pizzaIdx = indicePizza(state.inizio, state.pizza);
  const tag = riepilogoTag(state);

  function setSlot(kind: "pranzi" | "cene", i: number, id: string) {
    update((s) => ({ ...s, [kind]: s[kind].map((x, k) => (k === i ? id : x)) }));
  }

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Inizio settimana</span>
          <input
            type="date"
            value={state.inizio}
            onChange={(e) => e.target.value && update((s) => cambiaInizio(s, e.target.value))}
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Giorno pizza</span>
          <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 text-sm">
            {(["gio", "ven"] as GiornoPizza[]).map((g) => (
              <button
                key={g}
                onClick={() => update((s) => cambiaGiornoPizza(s, g))}
                aria-pressed={state.pizza === g}
                className={`px-3 py-2 ${state.pizza === g ? "bg-slate-900 text-white" : "bg-white text-slate-500"}`}
              >
                {g === "gio" ? "Giovedì" : "Venerdì"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => update((s) => ({ ...s, ...suggerisciSettimana(s) }))}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Suggerisci settimana
        </button>
        <p className="basis-full text-xs text-slate-400">
          Pesce a inizio settimana (più deperibile), max 3 cene di pesce e 2 di carne, nessuna ricetta ripetuta, prima
          le ricette leggere. Una cena pizza ogni settimana.
        </p>
      </section>

      <section className="flex flex-wrap gap-1.5" aria-label="Riepilogo settimana">
        {TAGS.map((t) => (
          <span
            key={t}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              tag[t] > 0 ? "border-slate-300 bg-white text-slate-700" : "border-slate-200 bg-slate-100 text-slate-400"
            }`}
          >
            {TAG_LABEL[t]} <span className="tabular-nums">{tag[t]}</span>
          </span>
        ))}
      </section>

      <ul className="space-y-3">
        {Array.from({ length: GIORNI }, (_, i) => {
          const d = fromIso(aggiungiGiorni(state.inizio, i));
          return (
            <li key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-slate-800">
                  {cap(d.toLocaleDateString("it-IT", { weekday: "long" }))}
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    {d.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                  </span>
                </h2>
                {i === pizzaIdx && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    Serata pizza
                  </span>
                )}
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <SlotSelect
                  label="Pranzo"
                  value={state.pranzi[i]}
                  options={PRANZI}
                  onChange={(id) => setSlot("pranzi", i, id)}
                />
                <SlotSelect
                  label="Cena"
                  value={state.cene[i]}
                  options={CENE}
                  onChange={(id) => setSlot("cene", i, id)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SlotSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; nome: string }[];
  onChange: (id: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nome}
          </option>
        ))}
      </select>
    </label>
  );
}
