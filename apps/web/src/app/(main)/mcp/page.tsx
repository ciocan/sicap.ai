import type { Metadata } from "next";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Conector MCP — SICAP.ai",
  description:
    "Conectează datele de achiziții publice SICAP.ai în Claude sau alți agenți AI prin Model Context Protocol (MCP).",
};

const MCP_URL = `${env.BASE_URL}/api/mcp`;

const TOOLS: Array<{ name: string; desc: string }> = [
  { name: "search_contracts", desc: "caută contracte (licitații, achiziții directe, offline)" },
  { name: "get_contract", desc: "detaliile complete ale unui contract" },
  { name: "get_company", desc: "profilul unei firme după CUI" },
  { name: "get_authority", desc: "profilul unei autorități contractante după CUI" },
  { name: "get_locality_stats", desc: "statistici de achiziții pe localitate" },
  { name: "get_totals", desc: "numărul total de înregistrări pe seturi de date" },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-sm">{children}</pre>
  );
}

export default function McpPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Conector MCP</h1>
      <p className="mt-3 text-muted-foreground">
        Interoghează datele de achiziții publice din SICAP.ai direct din Claude sau din alți agenți
        compatibili MCP. Autentificarea se face cu contul tău SICAP.ai (Google) — nu trebuie să
        copiezi niciun token.
      </p>

      <h2 className="mt-8 text-lg font-medium">URL conector</h2>
      <CodeBlock>{MCP_URL}</CodeBlock>

      <h2 className="mt-8 text-lg font-medium">Claude (claude.ai și Desktop)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Settings → Connectors → Add custom connector → lipește URL-ul de mai sus.
      </p>

      <h2 className="mt-8 text-lg font-medium">Claude Code</h2>
      <CodeBlock>{`claude mcp add --transport http sicap ${MCP_URL}`}</CodeBlock>

      <h2 className="mt-8 text-lg font-medium">Cursor / VS Code</h2>
      <CodeBlock>{`{
  "mcpServers": {
    "sicap": { "url": "${MCP_URL}" }
  }
}`}</CodeBlock>

      <h2 className="mt-8 text-lg font-medium">Unelte disponibile</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {TOOLS.map((t) => (
          <li key={t.name} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <code className="font-mono font-medium">{t.name}</code>
            <span className="text-muted-foreground">— {t.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
