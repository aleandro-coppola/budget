import { NextResponse } from "next/server";
import { checkPassword, sessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let password = "";
  try {
    const body = await req.json();
    password = String(body?.password ?? "");
  } catch {
    return NextResponse.json({ ok: false, error: "Richiesta non valida" }, { status: 400 });
  }

  if (!process.env.APP_PASSWORD) {
    return NextResponse.json(
      { ok: false, error: "APP_PASSWORD non configurata sul server" },
      { status: 500 }
    );
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ ok: false, error: "Password errata" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 giorni
  });
  return res;
}
