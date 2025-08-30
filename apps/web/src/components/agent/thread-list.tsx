import Link from "next/link";
import { PlusIcon, MoreHorizontal, Archive } from "lucide-react";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { timeAgo } from "@/utils";
import { useThreadsQuery, useThreadId, useArchiveThreadMutation } from "@/hooks/agent/use-threads";

interface Thread {
  id: string;
  title: string;
  createdAt: string;
}

export function ThreadList() {
  const { data, isLoading } = useThreadsQuery();
  const { threadId: activeThreadId } = useThreadId();
  const { mutate: handleArchiveThread } = useArchiveThreadMutation();

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">Se incarca lista de conversatii...</div>
    );
  }

  if (!data?.threads?.length) {
    return <div className="p-4 text-sm text-muted-foreground">Nu exista conversatii</div>;
  }

  return (
    <div className="space-y-1">
      <Button variant="outline" size="sm" asChild className="w-full justify-start my-4">
        <Link href="/agent">
          <PlusIcon className="size-4 mr-2" />
          Conversatie noua
        </Link>
      </Button>
      {data.threads.map((thread: Thread) => {
        const isActive = thread.id === activeThreadId;
        const title = thread.title.startsWith("New Thread") ? "Conversatie noua..." : thread.title;
        return (
          <div
            key={thread.id}
            className={`group/item relative rounded-lg transition-colors ${
              isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent"
            }`}
          >
            <Link href={`/agent?t=${thread.id}`} className="block p-3 pr-12">
              <div className="text-sm font-medium line-clamp-1">{title}</div>
              <div className="text-xs text-muted-foreground mt-1">{timeAgo(thread.createdAt)}</div>
            </Link>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity">
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Optiuni thread</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="cursor-pointer">
                        <Archive className="mr-2 h-4 w-4" />
                        Arhiveaza
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Arhiveaza conversatia</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esti sigur ca vrei sa arhivezi aceasta conversatie? Aceasta actiune nu poate
                      fi anulata.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuleaza</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/80 text-destructive-foreground"
                      onClick={() => handleArchiveThread(thread.id)}
                    >
                      Arhiveaza
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );
      })}
    </div>
  );
}
