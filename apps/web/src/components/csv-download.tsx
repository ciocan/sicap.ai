"use client";
import { Button, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@sicap/ui";
import { Download } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { stringify } from "csv-stringify/sync";

import { getCompanyLicitatii } from "@sicap/api";
import type { Awaited } from "@/utils/types";
import { captureCSVDownloadButtonClick } from "@/lib/telemetry";
import { escapeCsvString } from "@/utils";

type GetCompanyLicitatiiReturnType = Awaited<ReturnType<typeof getCompanyLicitatii>>;

interface Props {
  items: GetCompanyLicitatiiReturnType["items"];
}

export function CSVDownload({ items }: Props) {
  const session = useSession();
  const router = useRouter();
  const isAuthenticated = session.status === "authenticated";

  const handleDownload = () => {
    captureCSVDownloadButtonClick({ isAuthenticated });

    if (!isAuthenticated) {
      return router.push("/autentificare");
    }
    if (!items) {
      return;
    }

    const header =
      "ID,Tip licitatie,Code,Data,Stare,Tip,Valoare,CPV,Nume,Autoritate contractanta,Oras,Judet,Nume firma,Oras, Judet, Adresa e-licitatie.ro";
    const rows = items.map((item) => {
      if (!item.fields) {
        return [];
      }
      const { id, index } = item;
      const {
        code,
        date,
        state,
        type,
        value,
        cpvCodeAndName,
        name,
        contractingAuthorityName,
        localityAuthority,
        countyAuthority,
        supplierName,
        localitySupplier,
        countySupplier,
      } = item.fields;

      const isAchizitii = index === "achizitii-directe";
      const istoricThresholdDate = isAchizitii ? "2018-03-30" : "2018-12-28";
      const istoric = new Date(date) <= new Date(istoricThresholdDate);

      const seapUrlAchizitii = `https://${
        istoric ? "istoric." : ""
      }e-licitatie.ro/pub/direct-acquisition/view/${id}`;

      const seapUrlLicitatii = `https://${
        istoric ? "istoric." : ""
      }e-licitatie.ro/pub/notices/ca-notices/view-c/${id}`;

      const url = isAchizitii ? seapUrlAchizitii : seapUrlLicitatii;

      return [
        id,
        index,
        code,
        date,
        state,
        type,
        value,
        escapeCsvString(cpvCodeAndName),
        escapeCsvString(name),
        escapeCsvString(contractingAuthorityName),
        localityAuthority,
        countyAuthority,
        escapeCsvString(supplierName),
        localitySupplier,
        countySupplier,
        url,
      ];
    });

    const csvContent = `data:text/csv;charset=utf-8,${header}\n${stringify(rows, {
      quoted: true,
    })}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sicap_list.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={handleDownload}>
            <Download className="h-[1.2rem] w-[1.2rem] transition-all" />
            <span className="sr-only">Descarca CSV</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Descarca CSV</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
