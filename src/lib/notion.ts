// Lettura del DB "Spese" da Notion, lato SERVER.
// Il token NON e' mai esposto al client: sta solo in process.env.NOTION_TOKEN.
import { Client } from "@notionhq/client";
import { NOTION } from "./config";
import { SpesaRow } from "./budget";

function getClient() {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    throw new Error("NOTION_TOKEN mancante. Impostalo in .env.local o nelle env di Vercel.");
  }
  return new Client({ auth: token });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRow(page: any): SpesaRow {
  const props = page.properties ?? {};

  const titleProp = props["Name"];
  const name =
    titleProp?.title?.map((t: any) => t.plain_text).join("") || "(senza nome)";

  const spesa: number = props["Spesa"]?.number ?? 0;

  const tags: string[] = (props["Tags"]?.multi_select ?? []).map((o: any) => o.name);

  const accounts: string[] = (props["Accounts"]?.relation ?? []).map((rel: any) => rel.id);

  return { name, spesa, tags, accounts };
}

export async function fetchSpese(): Promise<SpesaRow[]> {
  const notion = getClient();
  const rows: SpesaRow[] = [];
  let cursor: string | undefined = undefined;

  do {
    const res = await notion.databases.query({
      database_id: NOTION.databaseId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const page of res.results) {
      rows.push(extractRow(page));
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return rows;
}
