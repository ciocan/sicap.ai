import { RefreshCcwIcon, CopyIcon, ThumbsDown, ThumbsUp } from "lucide-react";
import { Actions, Action } from "@sicap/ui/components/ui/ai/actions";

interface MessageMetadata {
  vote: {
    [key: number]: "up" | "down";
  };
}

interface MessageActionsProps {
  messageId: string;
  text: string;
  isLastMessage: boolean;
  metadata?: MessageMetadata;
  branchIndex?: number;
  onThumbsUp: (messageId: string, branchIndex?: number) => void;
  onThumbsDown: (messageId: string, branchIndex?: number) => void;
  onRegenerate: (messageId: string) => void;
}

export function MessageActions({
  messageId,
  text,
  isLastMessage,
  metadata,
  branchIndex = 0,
  onThumbsUp,
  onThumbsDown,
  onRegenerate,
}: MessageActionsProps) {
  const isVotedUp = metadata?.vote?.[branchIndex] === "up";
  const isVotedDown = metadata?.vote?.[branchIndex] === "down";
  const isVoted = isVotedUp || isVotedDown;

  return (
    <Actions className="mt-2">
      <Action
        onClick={() => navigator.clipboard.writeText(text)}
        label="Copiază"
        tooltip="Copiază mesajul"
      >
        <CopyIcon className="size-3" />
      </Action>
      {isVoted ? (
        isVotedUp ? (
          <Action label="Raspuns bun" tooltip="Raspuns bun" className="text-primary">
            <ThumbsUp className="size-3" />
          </Action>
        ) : (
          <Action label="Răspuns slab" tooltip="Răspuns slab" className="text-primary">
            <ThumbsDown className="size-3" />
          </Action>
        )
      ) : (
        <>
          <Action
            onClick={() => onThumbsUp(messageId, branchIndex)}
            label="Raspuns bun"
            tooltip="Raspuns bun"
          >
            <ThumbsUp className="size-3" />
          </Action>
          <Action
            onClick={() => onThumbsDown(messageId, branchIndex)}
            label="Răspuns slab"
            tooltip="Răspuns slab"
          >
            <ThumbsDown className="size-3" />
          </Action>
        </>
      )}
      {isLastMessage && (
        <Action
          onClick={() => onRegenerate(messageId)}
          label="Regenerează"
          tooltip="Regenerează mesajul"
        >
          <RefreshCcwIcon className="size-3" />
        </Action>
      )}
    </Actions>
  );
}
