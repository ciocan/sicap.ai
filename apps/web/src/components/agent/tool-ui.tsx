"use client";

import type { FC, ReactNode } from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { CheckCircle, OctagonX, TriangleAlert } from "lucide-react";
import { LoaderCircle } from "lucide-react";
import Image from "next/image";

import { Card, CardContent } from "@sicap/ui";

type ToolStatus = "running" | "complete" | "incomplete" | "requires-action";

const statusIconMap: Record<ToolStatus, ReactNode> = {
  running: <LoaderCircle className="animate-spin text-indigo-500 size-4" />,
  complete: <CheckCircle className="text-emerald-500 size-4" />,
  "requires-action": <TriangleAlert className="text-amber-500 size-4" />,
  incomplete: <OctagonX className="text-rose-500 size-4" />,
};

const SearchWebToolUi = makeAssistantToolUI({
  toolName: "SEARCH_WEB",
  render: ({ status }) => {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center gap-2">
            <Image src="/dds.png" alt="duckduckgo" width={25} height={25} />
            <span>Search Web</span>
            <span>{statusIconMap[status.type]}</span>
          </div>
        </CardContent>
      </Card>
    );
  },
});

const ToolUIWrapper: FC = () => {
  return <SearchWebToolUi />;
};

export const ToolsByNameComponents = {
  SEARCH_WEB: SearchWebToolUi,
};

export default ToolUIWrapper;
