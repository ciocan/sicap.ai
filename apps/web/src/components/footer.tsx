"use client";
import Link from "next/link";

import { Separator } from "@sicap/ui";

export function Footer(): JSX.Element {
  return (
    <footer className="mt-auto">
      <Separator />
      <div className="mx-auto w-full max-w-screen-xl p-4">
        <ul className="flex opacity-60 text-xs justify-center gap-6">
          <li>
            <Link href="/confidentialitate" className="hover:underline">
              Politica de confidentialitate
            </Link>
          </li>
          <li>
            <Link target="_blank" href="https://cloudify.ro" className="hover:underline">
              Hosting oferit de Cloudify.ro
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
