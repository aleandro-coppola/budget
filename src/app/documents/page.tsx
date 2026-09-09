import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";
import DocumentsView from "../documents-view";

export const dynamic = "force-dynamic";

export default function DocumentsPage() {
  const session = cookies().get(SESSION_COOKIE)?.value;
  if (!isValidSession(session)) {
    redirect("/login");
  }
  return <DocumentsView />;
}
