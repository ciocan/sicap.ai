import type { Metadata } from "next";
import { Code, Copy, ExternalLink, Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@sicap/ui";

export const metadata: Metadata = {
  title: "Widget Integrabil SICAP.ai - Integrează achizițiile publice pe site-ul tău",
  description:
    "Afișează ultimele achiziții publice ale unei autorități contractante direct pe site-ul tău folosind widget-ul SICAP.ai",
};

const DEMO_CUI = "4267117";

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative group">
      <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        className="absolute top-2 right-2 p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copiază codul"
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function IntegreazaPage() {
  const embedCode = `<iframe 
  src="https://sicap.ai/embed?cui=${DEMO_CUI}" 
  width="100%" 
  height="600" 
  frameborder="0"
  style="border: 1px solid #e2e8f0; border-radius: 8px;">
</iframe>`;

  const embedCodeMinimal = `<iframe src="https://sicap.ai/embed?cui=YOUR_CUI" width="100%" height="600" frameborder="0"></iframe>`;

  return (
    <main className="container max-w-4xl mx-auto py-12 px-4 space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          Nou
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Widget Integrabil <span className="text-primary">SICAP.ai</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Integrează ultimele achiziții publice ale oricărei autorități contractante direct pe
          site-ul tău, folosind un simplu cod iframe.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-primary" />
          Demo
        </h2>
        <p className="text-muted-foreground">
          Așa arată widget-ul în acțiune, afișând ultimele 10 achiziții pentru CUI{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{DEMO_CUI}</code>:
        </p>
        <div className="border rounded-lg overflow-hidden bg-background">
          <iframe
            src={`/embed?cui=${DEMO_CUI}`}
            width="100%"
            height="600"
            className="border-0"
            title="Demo widget SICAP.ai"
          />
        </div>
      </section>

      {/* How to Use */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Code className="h-5 w-5 text-primary" />
          Cum să folosești widget-ul
        </h2>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">1. Găsește CUI-ul autorității</h3>
          <p className="text-muted-foreground">
            CUI-ul (Codul Unic de Identificare) este identificatorul fiscal al autorității
            contractante. Îl poți găsi căutând autoritatea pe{" "}
            <a href="/" className="text-primary hover:underline">
              SICAP.ai
            </a>{" "}
            sau pe site-ul oficial{" "}
            <a
              href="https://e-licitatie.ro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              e-licitatie.ro
            </a>
            .
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">2. Copiază codul iframe</h3>
          <p className="text-muted-foreground">
            Înlocuiește{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">YOUR_CUI</code> cu
            CUI-ul autorității dorite:
          </p>
          <CodeBlock code={embedCodeMinimal} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">3. Adaugă pe site-ul tău</h3>
          <p className="text-muted-foreground">
            Lipeste codul în pagina HTML unde vrei să apară widget-ul. Poți ajusta{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">width</code> și{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">height</code> după
            preferințe.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-medium">Exemplu complet cu stilizare</h3>
        <CodeBlock code={embedCode} />
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Ce include widget-ul</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Achiziții Directe</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Afișează achizițiile directe din SEAP cu valoare, furnizor și data publicării.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Achiziții Offline</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Include și achizițiile offline raportate de autorități.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Licitații Publice</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Procedurile de licitație publică sunt incluse în rezultate.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Actualizare Automată</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Datele se actualizează automat, fără intervenție din partea ta.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Parametri disponibili</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Parametru</th>
                <th className="text-left p-3 font-medium">Tip</th>
                <th className="text-left p-3 font-medium">Descriere</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="p-3">
                  <code className="bg-muted px-1.5 py-0.5 rounded font-mono">cui</code>
                </td>
                <td className="p-3 text-muted-foreground">string</td>
                <td className="p-3 text-muted-foreground">
                  CUI-ul (codul fiscal) al autorității contractante. <strong>Obligatoriu.</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="text-center space-y-4 py-8 border-t">
        <h2 className="text-2xl font-semibold">Începe acum</h2>
        <p className="text-muted-foreground">
          Widget-ul este gratuit și poate fi folosit pe orice site web.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Caută o autoritate
          </a>
          <a
            href="mailto:contact@sicap.ai"
            className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-lg font-medium hover:bg-accent transition-colors"
          >
            Contactează-ne
          </a>
        </div>
      </section>
    </main>
  );
}
