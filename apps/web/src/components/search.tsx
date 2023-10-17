"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button, Input } from "@sicap/ui";

export function Search({ hideButton }: { hideButton?: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const [search, setSearch] = useState(q);

  const handleSearch = () => {
    if (!search) {
      return;
    }
    router.push(`/cauta?q=${encodeURIComponent(search)}`);
  };

  return (
    <div className="flex space-x-2 w-full">
      <Input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder="cauta achizitii publice..."
        className="w-full"
      />
      {!hideButton && <Button onClick={handleSearch}>Cautǎ</Button>}
    </div>
  );
}
