import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PAGES = [
  {
    href: "/budget",
    title: "Budget",
    desc: "Ripartizione mensile stipendi/categorie, calcolo live da Notion.",
    accent: "text-ale",
    ring: "hover:ring-ale/30 hover:border-ale/40",
  },
  {
    href: "/documents",
    title: "Documents",
    desc: "Guida tecnica investimenti — strumenti, protocollo, glossario.",
    accent: "text-cris",
    ring: "hover:ring-cris/30 hover:border-cris/40",
  },
];

export default function Home() {
  const session = cookies().get(SESSION_COOKIE)?.value;
  if (!isValidSession(session)) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Ale &amp; Cris</h1>
      <p className="mt-1 text-sm text-slate-500">Scegli una sezione.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:shadow-md ${p.ring}`}
          >
            <h2 className={`text-base font-semibold ${p.accent}`}>{p.title}</h2>
            <p className="mt-1.5 text-sm text-slate-500">{p.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
