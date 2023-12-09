import Link from "next/link";

import { StatusWidget } from "./openstatus";
import { DarkMode } from "./dark-mode";
import { HostingLink } from "./hosting-link";

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
        </ul>
      </div>
    </footer>
  );
}
