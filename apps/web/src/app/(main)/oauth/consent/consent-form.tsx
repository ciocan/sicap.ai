"use client";

import { useState } from "react";

export function ConsentForm() {
  const [busy, setBusy] = useState(false);

  async function decide(accept: boolean) {
    setBusy(true);
    try {
      // consent_code is read from the signed oidc_consent_prompt cookie set during authorize.
      const res = await fetch("/api/auth/oauth2/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ accept }),
      });
      const data = (await res.json()) as { redirectURI?: string };
      if (data.redirectURI) {
        window.location.href = data.redirectURI;
      }
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 flex gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => decide(true)}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        Permite
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => decide(false)}
        className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
      >
        Refuză
      </button>
    </div>
  );
}
