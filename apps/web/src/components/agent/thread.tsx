"use client";
import { HatGlasses, RefreshCcwIcon, CopyIcon, ThumbsDown, ThumbsUp } from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@sicap/ui/components/ui/ai/conversation";
import { Loader } from "@sicap/ui/components/ui/loaders";
import { Message, MessageAvatar, MessageContent } from "@sicap/ui/components/ui/ai/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@sicap/ui/components/ui/ai/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@sicap/ui/components/ui/ai/reasoning";
import { Response } from "@sicap/ui/components/ui/ai/response";
import {
  Branch,
  BranchMessages,
  BranchPage,
  BranchNext,
  BranchPrevious,
  BranchSelector,
} from "@sicap/ui/components/ui/ai/branch";
import { Actions, Action } from "@sicap/ui/components/ui/ai/actions";

import { ThreadWelcome } from "./welcome";

import { useAgent } from "@/hooks/agent/use-agent";
import { useIdentify } from "@/hooks/use-identify";

interface MessageMetadata {
  vote: {
    [key: number]: "up" | "down";
  };
}

export default function Thread() {
  const {
    messages,
    status,
    setInput,
    input,
    handleSubmit,
    data,
    isLoadingThread,
    handleRegenerate,
    currentBranchIndex,
    handleThumbsDown,
    handleThumbsUp,
  } = useAgent();
  const { user } = useIdentify();

  return (
    <div className="relative mt-auto flex mx-auto h-full w-full flex-col justify-self-end overflow-hidden">
      <div className="flex h-full flex-col">
        {messages.length === 0 &&
          !isLoadingThread &&
          (!data?.uiMessages || data?.uiMessages.length === 0) && (
            <ThreadWelcome onSetInput={setInput} />
          )}
        <div className="relative mb-0 flex-1 overflow-hidden">
          <Conversation className="h-full pb-2">
            <ConversationContent className="pb-28 max-w-3xl mx-auto">
              {messages.map((message, messageIndex) => (
                <div key={message.id}>
                  {message.role === "assistant" &&
                  message.parts.filter((part) => part.type === "text").length > 1 ? (
                    <Branch defaultBranch={currentBranchIndex}>
                      <BranchMessages>
                        {message.parts
                          .filter((part) => part.type === "text")
                          .map((part, partIndex) => {
                            const isLastMessage = messageIndex === messages.length - 1;
                            const voteMetadata = message.metadata as MessageMetadata;
                            const isVotedUp = voteMetadata?.vote?.[partIndex] === "up";
                            const isVotedDown = voteMetadata?.vote?.[partIndex] === "down";
                            const isVoted = isVotedUp || isVotedDown;

                            return (
                              <Message
                                from={message.role}
                                key={`${message.id}-branch-${partIndex}`}
                              >
                                <MessageContent>
                                  <Response>{part.text}</Response>
                                  <Actions className="mt-2">
                                    <Action
                                      onClick={() => navigator.clipboard.writeText(part.text)}
                                      label="Copiază"
                                      tooltip="Copiază mesajul"
                                    >
                                      <CopyIcon className="size-3" />
                                    </Action>
                                    {isVoted ? (
                                      isVotedUp ? (
                                        <Action
                                          onClick={() => {}}
                                          label="Raspuns bun"
                                          tooltip="Raspuns bun"
                                          disabled
                                          className="text-primary"
                                        >
                                          <ThumbsUp className="size-3" />
                                        </Action>
                                      ) : (
                                        <Action
                                          onClick={() => {}}
                                          label="Răspuns slab"
                                          tooltip="Răspuns slab"
                                          disabled
                                          className="text-primary"
                                        >
                                          <ThumbsDown className="size-3" />
                                        </Action>
                                      )
                                    ) : (
                                      <>
                                        <Action
                                          onClick={() => handleThumbsUp(message.id, partIndex)}
                                          label="Raspuns bun"
                                          tooltip="Raspuns bun"
                                        >
                                          <ThumbsUp className="size-3" />
                                        </Action>
                                        <Action
                                          onClick={() => handleThumbsDown(message.id, partIndex)}
                                          label="Răspuns slab"
                                          tooltip="Răspuns slab"
                                        >
                                          <ThumbsDown className="size-3" />
                                        </Action>
                                      </>
                                    )}
                                    {isLastMessage && (
                                      <Action
                                        onClick={() => handleRegenerate(message.id)}
                                        label="Regenerează"
                                        tooltip="Regenerează mesajul"
                                      >
                                        <RefreshCcwIcon className="size-3" />
                                      </Action>
                                    )}
                                  </Actions>
                                </MessageContent>
                                <MessageAvatar
                                  name="SICAP"
                                  src={<HatGlasses className="size-4" />}
                                />
                              </Message>
                            );
                          })}
                      </BranchMessages>
                      <BranchSelector from={message.role}>
                        <BranchPrevious />
                        <BranchPage />
                        <BranchNext />
                      </BranchSelector>
                    </Branch>
                  ) : (
                    <Message from={message.role} key={message.id}>
                      <MessageContent>
                        {message.parts.map((part, i: number) => {
                          const isLastMessage = messageIndex === messages.length - 1;

                          const voteMetadata = message.metadata as MessageMetadata;
                          const isVotedUp = voteMetadata?.vote?.[0] === "up";
                          const isVotedDown = voteMetadata?.vote?.[0] === "down";
                          const isVoted = isVotedUp || isVotedDown;

                          switch (part.type) {
                            case "text":
                              return (
                                <div key={`${message.id}-${i}`}>
                                  <Response>{part.text}</Response>
                                  {message.role === "assistant" && (
                                    <Actions className="mt-2">
                                      <Action
                                        onClick={() => navigator.clipboard.writeText(part.text)}
                                        label="Copiază"
                                        tooltip="Copiază mesajul"
                                      >
                                        <CopyIcon className="size-3" />
                                      </Action>
                                      {isVoted ? (
                                        isVotedUp ? (
                                          <Action
                                            onClick={() => {}}
                                            label="Raspuns bun"
                                            tooltip="Raspuns bun"
                                            disabled
                                            className="text-primary"
                                          >
                                            <ThumbsUp className="size-3" />
                                          </Action>
                                        ) : (
                                          <Action
                                            onClick={() => {}}
                                            label="Răspuns slab"
                                            tooltip="Răspuns slab"
                                            disabled
                                            className="text-primary"
                                          >
                                            <ThumbsDown className="size-3" />
                                          </Action>
                                        )
                                      ) : (
                                        <>
                                          <Action
                                            onClick={() => handleThumbsUp(message.id)}
                                            label="Raspuns bun"
                                            tooltip="Raspuns bun"
                                          >
                                            <ThumbsUp className="size-3" />
                                          </Action>
                                          <Action
                                            onClick={() => handleThumbsDown(message.id)}
                                            label="Răspuns slab"
                                            tooltip="Răspuns slab"
                                          >
                                            <ThumbsDown className="size-3" />
                                          </Action>
                                        </>
                                      )}
                                      {isLastMessage && (
                                        <Action
                                          onClick={() => handleRegenerate(message.id)}
                                          label="Regenerează"
                                          tooltip="Regenerează mesajul"
                                        >
                                          <RefreshCcwIcon className="size-3" />
                                        </Action>
                                      )}
                                    </Actions>
                                  )}
                                </div>
                              );
                            case "reasoning":
                              return (
                                <Reasoning
                                  className="w-full"
                                  isStreaming={status === "streaming"}
                                  key={`${message.id}-${i}`}
                                >
                                  <ReasoningTrigger />
                                  <ReasoningContent>{part.text}</ReasoningContent>
                                </Reasoning>
                              );
                            default:
                              return null;
                          }
                        })}
                      </MessageContent>
                      <MessageAvatar
                        name={message.role === "user" ? user?.name : "SICAP"}
                        src={
                          message.role === "user" ? user?.image : <HatGlasses className="size-4" />
                        }
                      />
                    </Message>
                  )}
                </div>
              ))}
              {status === "submitted" && <Loader variant="dots" size="sm" />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
          <div className="sticky bottom-0 overflow-auto bg-transparent max-w-3xl mx-auto px-2 pt-[2px]">
            <PromptInput
              className="relative border-8 border-primary-foreground border-b-0 flex w-full bg-muted/70 backdrop-blur-sm flex-col rounded-none rounded-t-[1.5rem] focus-within:ring-1 focus-within:ring-secondary-foreground/30"
              onSubmit={handleSubmit}
            >
              {/* biome-ignore lint/correctness/useUniqueElementIds: id used to focus the input */}
              <PromptInputTextarea
                id="composer-input"
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ce vrei sa stii despre achizițiile publice?"
                value={input}
                className="border-border dark:border-muted-foreground/15 focus:outline-primary placeholder:text-muted-foreground max-h-[calc(50dvh)] min-h-16 w-full resize-none rounded-t-[1.5rem] border-t px-4 pt-3 pb-3 text-base outline-none"
              />
              <PromptInputToolbar className="bg-transparent">
                <PromptInputTools></PromptInputTools>
                <PromptInputSubmit
                  className="ml-auto"
                  disabled={!input.trim() || status === "streaming"}
                  status={status}
                />
              </PromptInputToolbar>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  );
}
