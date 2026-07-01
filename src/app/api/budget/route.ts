import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";
import { fetchSpese } from "@/lib/notion";
import { computeBudget, defaultSettings, BudgetSettings } from "@/lib/budget";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Unisce i settings ricevuti dal client con i default, validando i numeri.
function mergeSettings(input: unknown): BudgetSettings {
  const d = defaultSettings();
  if (!input || typeof input !== "object") return d;
  const i = input as Record<string, unknown>;
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && isFinite(v) && v >= 0 ? v : fallback;

  const cat = (v: unknown, dc: BudgetSettings["ale"]["cibo"]) => {
    const c = (v ?? {}) as Record<string, unknown>;
    return {
      mode: c.mode === "pct" ? "pct" : "eur",
      target: num(c.target, dc.target),
      cap: num(c.cap, dc.cap),
    } as BudgetSettings["ale"]["cibo"];
  };

  const person = (v: unknown, dp: BudgetSettings["ale"]) => {
    const p = (v ?? {}) as Record<string, unknown>;
    return {
      cibo: cat(p.cibo, dp.cibo),
      investimenti: cat(p.investimenti, dp.investimenti),
      viaggi: cat(p.viaggi, dp.viaggi),
      fondoComune: cat(p.fondoComune, dp.fondoComune),
    };
  };

  const sal = (i.salaries ?? {}) as Record<string, unknown>;
  return {
    salaries: {
      ale: num(sal.ale, d.salaries.ale),
      cris: num(sal.cris, d.salaries.cris),
    },
    casaExtraTotale: num(i.casaExtraTotale, d.casaExtraTotale),
    ale: person(i.ale, d.ale),
    cris: person(i.cris, d.cris),
  };
}

export async function POST(req: Request) {
  const session = cookies().get(SESSION_COOKIE)?.value;
  if (!isValidSession(session)) {
    return NextResponse.json({ ok: false, error: "Non autorizzato" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const settings = mergeSettings(body);

  try {
    const rows = await fetchSpese();
    const result = computeBudget(rows, settings);
    return NextResponse.json({ ok: true, result, settingsUsed: settings, generatedAt: new Date().toISOString() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore sconosciuto";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
