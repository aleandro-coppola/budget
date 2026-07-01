# Budget Ale & Cris

App Next.js + Tailwind che legge **dal vivo** il database "Spese" su Notion, ricalcola la
ripartizione del budget nelle 6 categorie per Ale e Cristina, e la mostra dietro una pagina di
login a password.

Il token Notion resta **solo lato server** (variabile d'ambiente): non è mai nel codice né nel
bundle inviato al browser.

---

## ⚠️ Prima di tutto: sicurezza del token

Il token Notion che avevi condiviso va considerato **compromesso**. Su Notion vai su
**Settings → Connections** (o la pagina dell'integrazione) e **rigeneralo**. Usa quello nuovo qui
sotto. Non incollare mai un token in chat, in un commit o in un file tracciato da git.

---

## 1. Avvio in locale

```bash
cd "budget-app"
npm install
cp .env.example .env.local     # poi apri .env.local e metti i valori veri
npm run dev
```

Apri http://localhost:3000 → verrai rediretto al login → inserisci `APP_PASSWORD`.

Per lanciare il test del calcolo (validato sui dati reali):

```bash
npm test
```

---

## 2. Variabili d'ambiente

| Nome           | Obbligatoria | Descrizione                                      |
| -------------- | ------------ | ------------------------------------------------ |
| `NOTION_TOKEN` | sì           | Token dell'integrazione Notion (rigenerato)      |
| `APP_PASSWORD` | sì           | Password fissa per entrare nell'app              |
| `SESSION_SALT` | consigliata  | Stringa a caso per firmare il cookie di sessione |
| `SALARY_ALE`   | no           | Override stipendio Ale (default 2359)            |
| `SALARY_CRIS`  | no           | Override stipendio Cristina (default 1500)       |

L'integrazione Notion deve avere accesso al database "Spese" (condividi la pagina/DB con
l'integrazione dentro Notion, altrimenti la query torna vuota).

---

## 3. Pubblicare su GitHub

Dalla cartella `budget-app`:

```bash
git init
git add .
git commit -m "Budget Ale & Cris - initial"
```

Crea un repo su GitHub (consigliato **privato**), poi:

```bash
git remote add origin https://github.com/<tuo-utente>/budget-ale-cris.git
git branch -M main
git push -u origin main
```

`.env.local` **non** verrà caricato (è in `.gitignore`). Verifica con `git status` che non compaia.

---

## 4. Deploy su Vercel

1. Vai su https://vercel.com → **Add New → Project** → importa il repo GitHub.
2. Framework: Vercel riconosce **Next.js** in automatico. Root directory: `budget-app`
   (se il repo contiene solo questa cartella, lascia la radice).
3. In **Environment Variables** aggiungi: `NOTION_TOKEN`, `APP_PASSWORD`, `SESSION_SALT`
   (e opzionalmente `SALARY_ALE` / `SALARY_CRIS`).
4. **Deploy**. Otterrai un URL tipo `https://budget-ale-cris.vercel.app`.

Se cambi le env dopo il primo deploy, fai **Redeploy**.

---

## 5. Come vengono calcolati i numeri

Tutto parte dalle righe grezze del DB "Spese" (le colonne formula del DB "Accounts" non sono
leggibili via integrazione, quindi si ricalcola da zero).

- **BCC persona** = `(shared & bcc senza paga)/2 + (shared & bcc & paga-persona)/2 + (non-shared & bcc del suo account)`
- **Libero** = Stipendio − BCC persona
- **Allocazione** (priorità: Cibo → Investimenti → Conto personale → Viaggi → Fondo comune → Spese casa):
  - Cibo: fisso (Ale 225 / Cris 125)
  - Investimenti: tetto Ale 100 / Cris 0
  - Viaggi: tetto Ale 150 / Cris 100
  - Fondo comune: tetto Ale 120 / Cris 70
  - Spese casa: righe reali (`spesa-casa` + `revolut` + `shared`, non `bcc`) + 40 extra totale, diviso 50/50
  - Conto personale: spese individuali reali (`revolut`, non `shared`) + tutto il surplus residuo
- Se il libero non basta, si comprimono **solo** le voci discrezionali dal basso
  (Fondo comune → Viaggi → Investimenti); Cibo e Spese casa non si toccano.

**Impostazioni dall'app**: stipendi, extra casa, e per ogni categoria discrezionale (Cibo,
Investimenti, Viaggi, Fondo comune) un **target** in `%` del libero o in `€` fisso più un **tetto**
massimo. L'effettivo è `min(target, tetto)`. Conto personale (residuo) e Spese casa (Notion + extra)
si adeguano per tenere il totale al 100%. Le impostazioni si salvano nel browser (localStorage). I
valori di partenza sono in `src/lib/config.ts`.

> I numeri sono **live**: possono differire dallo snapshot nelle regole del progetto, che è una
> foto a una certa data.

---

## 6. Sicurezza — nota onesta

La password fissa è una "tenda", non una vera autenticazione: chi la conosce entra, e non c'è
protezione contro tentativi ripetuti. Per soli numeri di budget può bastare. Se un domani vuoi
qualcosa di più solido: repo privato (fatto), e in aggiunta la Vercel Password Protection
(Deployment Protection) o un vero provider di login.
