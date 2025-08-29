import type { FC } from "react";
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
import { formatDateTime } from "@sicap/api/utils/date";

import { Button } from "@sicap/ui/components/ui/button";
import { timeAgo } from "@/utils";
import { useIdentify } from "@/hooks";

export function ThreadList() {
  return <div>ThreadList</div>;
}
