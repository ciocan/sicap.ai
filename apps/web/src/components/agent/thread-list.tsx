import type { FC } from "react";
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useThreadListItem,
} from "@assistant-ui/react";
import { ArchiveIcon, PlusIcon } from "lucide-react";

import { Button } from "@sicap/ui/components/ui/button";
import { TooltipIconButton } from "@sicap/ui";
import { timeAgo } from "@/utils";
import { parseAsString, useQueryState } from "nuqs";

export const ThreadList: FC = () => {
  return (
    <ThreadListPrimitive.Root className="text-foreground flex flex-col items-stretch gap-1.5">
      <ThreadListNew />
      <ThreadListItems />
    </ThreadListPrimitive.Root>
  );
};

const ThreadListNew: FC = () => {
  return (
    <ThreadListPrimitive.New asChild>
      <Button
        className="data-active:bg-muted hover:bg-muted flex items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start"
        variant="ghost"
      >
        <PlusIcon />
        Conversatie nouă
      </Button>
    </ThreadListPrimitive.New>
  );
};

const ThreadListItems: FC = () => {
  return <ThreadListPrimitive.Items components={{ ThreadListItem }} />;
};

const ThreadListItem: FC = () => {
  const listItem = useThreadListItem();
  const [threadId] = useQueryState("t", parseAsString.withDefault(""));
  const [title, createdAt] = listItem?.title?.split("||") ?? [];
  const isActive = threadId === listItem?.id;
  const displayTitle = isActive ? title : `${title?.substring(0, 35)}...`;

  return (
    <ThreadListItemPrimitive.Root className="group/item data-active:bg-muted hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2">
      <ThreadListItemPrimitive.Trigger className="flex-grow px-3 py-1 text-start">
        <p className="text-sm">{displayTitle}</p>
        <span className="text-xs text-muted-foreground" title={createdAt}>
          {timeAgo(createdAt ?? new Date())}
        </span>
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemArchive />
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemArchive: FC = () => {
  return (
    <ThreadListItemPrimitive.Archive asChild>
      <TooltipIconButton
        className="hover:text-foreground/60 p-4 text-foreground ml-auto mr-1 size-4 opacity-0 translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-200"
        variant="ghost"
        tooltip="Arhivează conversatia"
        onClick={() => {
          console.log("-------------------------------- archive");
        }}
      >
        <ArchiveIcon />
      </TooltipIconButton>
    </ThreadListItemPrimitive.Archive>
  );
};
