import Link from "next/link";
import { Github, Terminal, Code2 } from "lucide-react";

import { StatusWidget } from "./openstatus";
import { DarkMode } from "./dark-mode";
import { HostingLink } from "./hosting-link";

export async function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/40 bg-muted/30">
      <div className="mx-auto w-full max-w-screen-xl px-6 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Link href="/" className="inline-block">
              <h3 className="text-base font-semibold tracking-tight">SICAP.ai</h3>
            </Link>
            <p className="text-sm text-muted-foreground">
              Sistem Inteligent de Căutare Achiziții Publice
            </p>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                Status: <StatusWidget />
              </span>
              <DarkMode />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold tracking-tight">Linkuri</h4>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link
                  href="/despre"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Despre
                </Link>
              </li>
              <li>
                <Link
                  href="/confidentialitate"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Confidentialitate
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold tracking-tight">Dezvoltatori</h4>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link
                  href="https://api.sicap.ai"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Terminal className="h-3.5 w-3.5" />
                  API
                </Link>
              </li>
              <li>
                <Link
                  href="/integreaza"
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  Embed
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/ciocan/SICAP.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="size-4" /> GitHub
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-4 text-sm text-muted-foreground sm:flex-row">
          <p>© 2020 - {currentYear} SICAP.ai</p>
          <HostingLink />
        </div>
      </div>
    </footer>
  );
}
