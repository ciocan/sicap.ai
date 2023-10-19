"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";

import {
  Button,
  Dialog,
  DialogTrigger,
  Input,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  Toaster,
} from "@sicap/ui";
import { AdvancedSearch } from "./search-advanced";

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
    <Dialog>
      <TooltipProvider delayDuration={250}>
        <div className="flex flex-col items-center w-full">
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
            {hideButton && (
              <Tooltip>
                <DialogTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-[1.2rem] w-[1.2rem] transition-all" />
                    </Button>
                  </TooltipTrigger>
                </DialogTrigger>
                <TooltipContent>
                  <p>Cautare avansata</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {!hideButton && (
            <DialogTrigger asChild>
              <Button variant="link">cautare avansata</Button>
            </DialogTrigger>
          )}
        </div>
        <AdvancedSearch query={search} />
      </TooltipProvider>
      <Toaster />
    </Dialog>
  );
}
