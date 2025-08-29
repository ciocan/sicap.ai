"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@sicap/ui/components/ui/ai/conversation";
import { Loader } from "@sicap/ui/components/ui/loader";
import { Message, MessageContent } from "@sicap/ui/components/ui/ai/message";
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

import { useAgent } from "@/hooks/agent/use-agent";

export default function Thread() {
  const { messages, status, setInput, displayValue, handleSubmit } = useAgent();

  return (
    <div className="relative mt-auto flex mx-auto h-full w-full flex-col justify-self-end overflow-hidden">
      <div className="flex h-full flex-col">
        <div className="relative mb-0 flex-1 overflow-hidden">
          <Conversation className="h-full pb-2">
            <ConversationContent className="pb-28 max-w-3xl mx-auto">
              {messages.map((message) => (
                <div key={message.id}>
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case "text":
                            return <Response key={`${message.id}-${i}`}>{part.text}</Response>;
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
                  </Message>
                </div>
              ))}
              {status === "submitted" && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
          <div className="sticky bottom-0 overflow-auto bg-transparent max-w-3xl mx-auto px-2 pt-[2px]">
            <PromptInput
              className="relative border-8 border-primary-foreground border-b-0 flex w-full bg-muted/70 backdrop-blur-sm flex-col rounded-none rounded-t-[1.5rem] focus-within:ring-1 focus-within:ring-secondary-foreground/30"
              onSubmit={handleSubmit}
            >
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ce vrei sa stii despre achizițiile publice?"
                value={displayValue}
                className="border-border dark:border-muted-foreground/15 focus:outline-primary placeholder:text-muted-foreground max-h-[calc(50dvh)] min-h-16 w-full resize-none rounded-t-[1.5rem] border-t px-4 pt-3 pb-3 text-base outline-none"
              />
              <PromptInputToolbar className="bg-transparent">
                <PromptInputTools></PromptInputTools>
                <PromptInputSubmit
                  className="ml-auto"
                  disabled={!displayValue.trim() || status === "streaming"}
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
