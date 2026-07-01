// Autenticazione a password fissa, lato SERVER.
// La password sta in APP_PASSWORD (env), mai nel codice/bundle client.
import { createHash } from "crypto";

export const SESSION_COOKIE = "budget_session";

function secret() {
  return process.env.APP_PASSWORD ?? "";
}

// Token di sessione = hash della password + un sale d'ambiente opzionale.
// Non e' un JWT: e' una "tenda" semplice come richiesto, ma il valore in chiaro
// della password non finisce mai nel cookie.
export function sessionToken(): string {
  const salt = process.env.SESSION_SALT ?? "budget-ale-cris";
  return createHash("sha256").update(`${secret()}::${salt}`).digest("hex");
}

export function checkPassword(input: string): boolean {
  const expected = secret();
  if (!expected) return false;
  // confronto a lunghezza costante
  if (input.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export function isValidSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  return cookieValue === sessionToken();
}
