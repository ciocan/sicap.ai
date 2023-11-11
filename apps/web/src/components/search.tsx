"use client";
import { useEffect, useState } from "react";
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
} from "@sicap/ui";
import { AdvancedSearch } from "./search-advanced";
import { captureOpenAdvancedSearchModal, captureSearchButtonClick } from "@/lib/telemetry";

export function Search({ hideButton }: { hideButton?: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const [search, setSearch] = useState(q);
  const [open, setOpen] = useState(false);

  const handleSearch = (type: string) => {
    if (!search) {
      return;
    }
    captureSearchButtonClick({ query: search, type, mode: "simple" });
    fetch("/api/search", {
      method: "POST",
      body: JSON.stringify({ query: search, mode: "simple" }),
    });
    router.push(`/cauta?q=${encodeURIComponent(search)}`);
  };

  useEffect(() => {
    setSearch(q);
  }, [q]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider delayDuration={250}>
        <div className="flex flex-col items-center w-full">
          <div className="flex space-x-2 w-full">
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch("input")}
              placeholder="cauta achizitii publice..."
              className="w-full"
            />
            {!hideButton && <Button onClick={() => handleSearch("button")}>Cautǎ</Button>}
            {hideButton && (
              <Tooltip>
                <DialogTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => captureOpenAdvancedSearchModal({ type: "icon" })}
                    >
                      <Filter className="h-[1.2rem] w-[1.2rem] transition-all" />
                      <span className="sr-only">Cautare avansata</span>
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
            <div className="">
              <span className="text-red-600 bg-yellow-50 dark:bg-yellow-200 dark:text-red-700 px-2 py-[2px] rounded-xl text-sm font-bold">
                Nou
              </span>
              <DialogTrigger asChild>
                <Button
                  variant="link"
                  onClick={() => captureOpenAdvancedSearchModal({ type: "link" })}
                >
                  cautare avansata
                </Button>
              </DialogTrigger>
            </div>
          )}
        </div>
        <AdvancedSearch query={search} setOpen={setOpen} />
      </TooltipProvider>
    </Dialog>
  );
}
