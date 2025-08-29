import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { Button } from "@sicap/ui/components/ui/button";
import { timeAgo } from "@/utils";
import { useThreadsQuery, useThreadId } from "@/hooks/agent/use-threads";

interface Thread {
  id: string;
  title: string;
  createdAt: string;
}

export function ThreadList() {
  const { data, isLoading } = useThreadsQuery();
  const { threadId: activeThreadId } = useThreadId();

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
        <Link href="/agent2">
          <PlusIcon className="size-4 mr-2" />
          Conversatie noua
        </Link>
      </Button>
      {data.threads.map((thread: Thread) => {
        const isActive = thread.id === activeThreadId;
        const title = thread.title.startsWith("New Thread") ? "Conversatie noua..." : thread.title;
        return (
          <Link
            key={thread.id}
            href={`/agent2?t=${thread.id}`}
            className={`block p-3 rounded-lg transition-colors ${
              isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent"
            }`}
          >
            <div className="text-sm font-medium line-clamp-1">{title}</div>
            <div className="text-xs text-muted-foreground mt-1">{timeAgo(thread.createdAt)}</div>
          </Link>
        );
      })}
    </div>
  );
}
