import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";
import Dashboard from "../dashboard";

export const dynamic = "force-dynamic";

export default function BudgetPage() {
  const session = cookies().get(SESSION_COOKIE)?.value;
  if (!isValidSession(session)) {
    redirect("/login");
  }
  return <Dashboard />;
}
