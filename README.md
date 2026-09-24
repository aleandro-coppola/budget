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

**Tag**: `bcc` = pagata dalla BCC, tutto il resto = pagato da Revolut · `shared` = condivisa, /2 ·
`spesa-casa` (con shared, non bcc) = pocket Spese Casa · `paga-ale`/`paga-cris` (con shared) = chi
anticipa, l'altro gli deve metà.

- **BCC persona** = `(shared & bcc senza paga)/2 + (shared & bcc & paga-persona)/2 + (non-shared & bcc del suo account)`
- **Libero** = Stipendio − BCC persona
- **Spese fisse** (tolte dal libero):
  - Cibo: fisso (Ale 220 / Cris 130)
  - Spese casa: righe `shared` + `spesa-casa` non `bcc` + 40 extra totale, diviso 50/50
  - Spese Revolut personali: righe non `bcc`, non `shared`, del proprio account
  - Spese condivise (metà): metà di ogni riga `shared` non-casa; per le righe `bcc` con `paga-X`
    solo l'altro (la metà di X è già nella sua BCC)
- **Rimanente** = Libero − spese fisse, diviso in pocket (in % del rimanente, con tetto €):
  Investimenti (Ale 10% / Cris 0%), Viaggi 15%, Conto cointestato 30%, Imprevisti 5%,
  Conto personale = residuo.
- Se il conto personale scende sotto 50 €, si comprimono i pocket
  (Cointestato → Viaggi → Investimenti → Imprevisti).
- **Conguaglio** = metà delle spese shared pagate da Ale − metà di quelle pagate da Cris
  (righe casa escluse): positivo = Cris dà ad Ale, negativo = Ale dà a Cris. È un bonifico,
  fuori dal totale.

**Impostazioni dall'app**: stipendi, extra casa, e per Cibo e ogni pocket un **target** in `%` o
in `€` fisso più un **tetto** massimo. L'effettivo è `min(target, tetto)`. Le impostazioni si salvano
nel browser (localStorage). I valori di partenza sono in `src/lib/config.ts`.

> I numeri sono **live**: possono differire dallo snapshot nelle regole del progetto, che è una
> foto a una certa data.

---

## 6. Sicurezza — nota onesta

La password fissa è una "tenda", non una vera autenticazione: chi la conosce entra, e non c'è
protezione contro tentativi ripetuti. Per soli numeri di budget può bastare. Se un domani vuoi
qualcosa di più solido: repo privato (fatto), e in aggiunta la Vercel Password Protection
(Deployment Protection) o un vero provider di login.
