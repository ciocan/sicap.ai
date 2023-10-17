"use client";
import { Separator } from "@sicap/ui";

export default function NotFound() {
  return (
    <div className="m-auto p-4 flex gap-4 items-center">
      <h2 className="text-2xl">404</h2>
      <Separator orientation="vertical" className="h-6" />
      <p>Aceasta paginǎ nu a fost gasitǎ.</p>
    </div>
  );
}
