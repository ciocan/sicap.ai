import { useMutation } from "@tanstack/react-query";
import type { MastraMessageV2 } from "@mastra/core/memory";

const voteMessage = async ({
  threadId,
  messageId,
  vote,
  branchIndex,
}: {
  threadId: string;
  messageId: string;
  vote: "up" | "down";
  branchIndex?: number;
}) => {
  const response = await fetch(`/api/agent/messages/${messageId}/vote`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId, vote, branchIndex }),
  });
  return response.json();
};

export const useVoteMessageMutation = ({
  onSuccess,
}: {
  onSuccess?: (data: { success: boolean; message: MastraMessageV2 }) => void;
} = {}) => {
  return useMutation({
    mutationFn: voteMessage,
    onSuccess,
  });
};
