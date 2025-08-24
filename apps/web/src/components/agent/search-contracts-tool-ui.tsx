"use client";
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { SearchIcon, LoaderIcon, AlertCircleIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@sicap/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sicap/ui/components/ui/card";
import { ListItem } from "@/components/list-item";

interface SearchContract {
  id: string;
  index: string;
  fields: {
    date: string;
    name: string;
    code: string;
    cpvCode: string;
    cpvCodeAndName: string;
    value: string;
    supplierId: string;
    supplierName: string;
    localitySupplier: string;
    countySupplier: string;
    contractingAuthorityId: string;
    contractingAuthorityName: string;
    localityAuthority: string;
    countyAuthority: string;
    state: string;
    stateId: number;
    type: string;
    typeId: number;
    euFunds: string;
  };
}

interface SearchResult {
  took: number;
  total: number;
  items: SearchContract[];
}

export const SearchContractsToolUI: ToolCallMessagePartComponent = ({
  argsText,
  result,
  status,
}) => {
  const [showAll, setShowAll] = useState(false);

  // Parse arguments
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(argsText);
  } catch {
    // Ignore parsing errors
  }

  // Handle loading state
  if (status.type === "running") {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LoaderIcon className="h-5 w-5 animate-spin text-blue-600" />
            <CardTitle className="text-lg">Căutare contracte în desfășurare...</CardTitle>
          </div>
          {args.query && (
            <CardDescription>
              Căutare pentru: <span className="font-medium">"{args.query}"</span>
            </CardDescription>
          )}
        </CardHeader>
      </Card>
    );
  }

  // Handle error state
  if (status.type === "incomplete") {
    return (
      <Card className="w-full border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircleIcon className="h-5 w-5 text-red-600" />
            <CardTitle className="text-lg text-red-800">Eroare la căutarea contractelor</CardTitle>
          </div>
          <CardDescription className="text-red-600">
            A apărut o problemă în timpul căutării. Te rog încearcă din nou.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Handle success state
  if (!result || typeof result !== "object" || !("items" in result)) {
    return (
      <Card className="w-full">
        <CardContent className="py-8 text-center">
          <SearchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nu s-au găsit rezultate valide.</p>
        </CardContent>
      </Card>
    );
  }

  const searchResult = result as SearchResult;
  const displayItems = showAll ? searchResult.items : searchResult.items.slice(0, 5);

  return (
    <div className="w-full space-y-4">
      {/* Search Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Rezultate căutare contracte</CardTitle>
          </div>
          {args.query && (
            <CardDescription>
              Căutare pentru: <span className="font-medium">"{args.query}"</span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>
              <strong>{searchResult.total.toLocaleString("ro-RO")}</strong> rezultate găsite
            </span>
            <span>
              Căutare completată în <strong>{searchResult.took}ms</strong>
            </span>
            <span>
              Se afișează <strong>{displayItems.length}</strong> contracte
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Contract Results */}
      {searchResult.items.length > 0 ? (
        <div className="space-y-3">
          {displayItems.map((contract) => (
            <ListItem
              key={contract.id}
              fields={contract.fields}
              id={contract.id}
              index={contract.index}
            />
          ))}

          {/* Show More Button */}
          {searchResult.items.length > 5 && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAll(!showAll)}
                className="w-full max-w-xs"
              >
                {showAll
                  ? `Afișează mai puține (${searchResult.items.length - 5} ascunse)`
                  : `Afișează toate (încă ${searchResult.items.length - 5})`}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <SearchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nu s-au găsit contracte pentru căutarea efectuată.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
