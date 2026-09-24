import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";
import { fetchSpese } from "@/lib/notion";
import {
  computeBudget,
  defaultSettings,
  BudgetSettings,
  CategorySetting,
  EditableCat,
  PersonSettings,
} from "@/lib/budget";

const CATS: EditableCat[] = ["cibo", "investimenti", "viaggi", "cointestato", "imprevisti"];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Unisce i settings ricevuti dal client con i default, validando i numeri.
function mergeSettings(input: unknown): BudgetSettings {
  const d = defaultSettings();
  if (!input || typeof input !== "object") return d;
  const i = input as Record<string, unknown>;
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && isFinite(v) && v >= 0 ? v : fallback;

  const cat = (v: unknown, dc: CategorySetting): CategorySetting => {
    if (!v || typeof v !== "object") return dc;
    const c = v as Record<string, unknown>;
    return {
      mode: c.mode === "pct" ? "pct" : c.mode === "eur" ? "eur" : dc.mode,
      target: num(c.target, dc.target),
      cap: num(c.cap, dc.cap),
    };
  };

  const person = (v: unknown, dp: PersonSettings): PersonSettings => {
    const p = (v ?? {}) as Record<string, unknown>;
    return Object.fromEntries(CATS.map((k) => [k, cat(p[k], dp[k])])) as PersonSettings;
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
