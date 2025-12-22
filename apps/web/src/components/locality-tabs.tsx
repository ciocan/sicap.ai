"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@sicap/ui";
import { LocalityTopAuthoritiesList } from "./locality-top-authorities-list";
import { LocalityTopAuthoritiesCharts } from "./locality-top-authorities-charts";
import { LocalityTopCompaniesList } from "./locality-top-companies-list";
import { LocalityTopCompaniesCharts } from "./locality-top-companies-charts";
import type { LocalityTopAuthority, LocalityTopCompany } from "@sicap/api";

interface LocalityTabsProps {
  authorities: LocalityTopAuthority[];
  companies: LocalityTopCompany[];
}

export function LocalityTabs({ authorities, companies }: LocalityTabsProps) {
  const [activeTab, setActiveTab] = useState("authorities");

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Top 30 - Entitati din localitate</h3>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="authorities" className="text-sm">
            Autoritati ({authorities.length})
          </TabsTrigger>
          <TabsTrigger value="companies" className="text-sm">
            Firme ({companies.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="authorities" className="mt-6 space-y-6">
          {authorities.length > 0 ? (
            <>
              <LocalityTopAuthoritiesCharts authorities={authorities} />
              <LocalityTopAuthoritiesList authorities={authorities} />
            </>
          ) : (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Nu exista autoritati contractante din aceasta localitate
            </div>
          )}
        </TabsContent>

        <TabsContent value="companies" className="mt-6 space-y-6">
          {companies.length > 0 ? (
            <>
              <LocalityTopCompaniesCharts companies={companies} />
              <LocalityTopCompaniesList companies={companies} />
            </>
          ) : (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Nu exista firme din aceasta localitate
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
