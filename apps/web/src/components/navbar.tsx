"use client";
import Link from "next/link";

import { ModeToggle, Separator } from "@sicap/ui";

export function Navbar(): JSX.Element {
  return (
    <>
      <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-50 w-full bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center lg:max-w-7xl">
          <nav className="flex items-center w-full mx-auto justify-between">
            <Link href="/">
              <h4>
                <span className="font-bold">SICAP</span>.ai
              </h4>
            </Link>
            <div>
              <ModeToggle />
            </div>
          </nav>
        </div>
      </header>
      <Separator />
    </>
  );
}
