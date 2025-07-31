import { useExternalStoreRuntime } from "@assistant-ui/react";

import { useSendMessage } from "./use-send-message";
import { coreMessageToThreadMessageLike } from "./converters";
import { useMastraThreadList } from "./use-mastra-threadlist";

export interface UseMastraRuntimeArgs {
  agentId: string;
  resourceId: string;
  threadId: string;
  setThreadId(threadId: string): void;
}

export const useMastraRuntime = (args: UseMastraRuntimeArgs) => {
  const { messages, setMessages, sendMessage, isRunning, isDisabled } = useSendMessage({
    config: {
      agentId: args.agentId,
      resourceId: args.resourceId,
      threadId: args.threadId,
    },
  });

  const threadList = useMastraThreadList({
    agentId: args.agentId,
    threadId: args.threadId,
    resourceId: args.resourceId,
    setThreadId: args.setThreadId,
  });

  return useExternalStoreRuntime({
    messages,
    setMessages,
    onNew: sendMessage,
    convertMessage: coreMessageToThreadMessageLike,
    isRunning,
    isDisabled,
    adapters: {
      threadList,
    },
  });
};
