import type { FC } from "react";
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useThreadListItem,
} from "@assistant-ui/react";
import { ArchiveIcon, PlusIcon } from "lucide-react";

import {
  TooltipIconButton,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@sicap/ui";
import { formatDateTime } from "@sicap/api/dist/utils/date.mjs";

import { useIsActiveThread } from "./hooks/thread-context";
import { Button } from "@sicap/ui/components/ui/button";
import { timeAgo } from "@/utils";

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
        className="data-active:bg-muted hover:bg-muted flex items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start cursor-pointer"
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
  const isActive = useIsActiveThread();
  const listItem = useThreadListItem();
  const [title, createdAt] = listItem?.title?.split("||") ?? [];
  const displayTitle = isActive
    ? title
    : title && title.length > 35
      ? `${title.substring(0, 35)}...`
      : (title ?? "Lista se incarca...");

  return (
    <ThreadListItemPrimitive.Root className="group/item data-active:bg-primary-foreground data-active:dark:bg-muted hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2">
      <ThreadListItemPrimitive.Trigger className="flex-grow px-3 py-1 text-start cursor-pointer">
        <p className="text-sm">{displayTitle}</p>
        {createdAt && (
          <span className="text-xs text-muted-foreground" title={formatDateTime(createdAt)}>
            {timeAgo(createdAt)}
          </span>
        )}
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemArchive />
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemArchive: FC = () => {
  const isActive = useIsActiveThread();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <TooltipIconButton
          className="hover:text-foreground/60 p-4 text-foreground ml-auto mr-1 size-4 opacity-0 translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-200 cursor-pointer"
          variant="ghost"
          tooltip="Arhivează conversatia"
          onClick={(e) => e.stopPropagation()}
        >
          <ArchiveIcon />
          <span className="sr-only">Arhivează conversatia</span>
        </TooltipIconButton>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Arhivează conversatia</AlertDialogTitle>
          <AlertDialogDescription>
            Vrei să arhivezi această conversație? Această acțiune nu poate fi revocata.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anulează</AlertDialogCancel>
          <AlertDialogAction asChild>
            <ThreadListItemPrimitive.Archive asChild>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/80 text-destructive-foreground"
                onClick={() => {
                  if (isActive) {
                    window.history.replaceState(null, "", "/agent");
                  }
                }}
              >
                Arhivează
              </AlertDialogAction>
            </ThreadListItemPrimitive.Archive>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
