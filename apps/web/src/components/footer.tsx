import Link from "next/link";

import { StatusWidget } from "./openstatus";
import { DarkMode } from "./dark-mode";
import { HostingLink } from "./hosting-link";
import { Terminal } from "lucide-react";

export async function Footer() {
  return (
    <footer className="mt-auto">
      <div className="mx-auto w-full max-w-screen-xl p-4 space-y-2 border-t border-t-1 border-secondary/80">
        <ul className="flex opacity-60 text-xs justify-center items-center gap-6">
          <li>
            <Link href="/confidentialitate" className="hover:underline">
              Politica de confidentialitate
            </Link>
          </li>
          <li>
            <HostingLink />
          </li>
          <li>
            <Link href="/despre" className="hover:underline">
              Despre
            </Link>
          </li>
        </ul>
        <ul className="flex opacity-60 text-xs justify-center items-center gap-4">
          <li>
            <StatusWidget />
          </li>
          <li className="scale-[75%]">
            <DarkMode />
          </li>
          <li>
            <Link href="https://api.sicap.ai" className="hover:underline" target="_blank">
              <Terminal className="w-4 h-4 inline-block mr-1" />
              API
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
