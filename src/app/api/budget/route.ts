import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";
import { fetchSpese } from "@/lib/notion";
import { computeBudget } from "@/lib/budget";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = cookies().get(SESSION_COOKIE)?.value;
  if (!isValidSession(session)) {
    return NextResponse.json({ ok: false, error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const rows = await fetchSpese();
    const result = computeBudget(rows);
    return NextResponse.json({ ok: true, result, generatedAt: new Date().toISOString() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore sconosciuto";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
