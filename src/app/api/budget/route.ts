import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";
import { fetchSpese } from "@/lib/notion";
import { computeBudget } from "@/lib/budget";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = cookies().get(SESSION_COOKIE)?.value;
  if (!isValidSession(session)) {
    return NextResponse.json({ ok: false, error: "Non autorizzato" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parse = (v: string | null) => {
    if (v === null || v.trim() === "") return undefined;
    const n = Number(v);
    return isFinite(n) && n >= 0 ? n : undefined;
  };
  const salaries = { ale: parse(searchParams.get("ale")), cris: parse(searchParams.get("cris")) };

  try {
    const rows = await fetchSpese();
    const result = computeBudget(rows, salaries);
    return NextResponse.json({
      ok: true,
      result,
      salariesUsed: { ale: result.ale.stipendio, cris: result.cris.stipendio },
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore sconosciuto";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
