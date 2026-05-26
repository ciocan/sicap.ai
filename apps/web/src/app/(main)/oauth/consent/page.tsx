import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ConsentForm } from "./consent-form";

const SCOPE_LABELS: Record<string, string> = {
  openid: "Identitatea contului tău",
  profile: "Numele și datele de profil",
  email: "Adresa de email",
  offline_access: "Acces continuu (reîmprospătare token)",
};

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string; scope?: string }>;
}) {
  const { client_id, scope } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);

  if (!session) {
    redirect("/autentificare");
  }

  const scopes = (scope ?? "openid profile email").split(" ").filter(Boolean);

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-xl font-semibold">Autorizează accesul</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        O aplicație{client_id ? ` (${client_id})` : ""} cere acces la contul tău SICAP.ai pentru:
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        {scopes.map((s) => (
          <li key={s} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{SCOPE_LABELS[s] ?? s}</span>
          </li>
        ))}
      </ul>
      <ConsentForm />
    </div>
  );
}
