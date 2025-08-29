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

export default function Agent() {
  const { messages, status, setInput, displayValue, handleSubmit } = useAgent();

  return (
    <div className="relative mt-auto flex h-[calc(100vh/1.5)] w-full max-w-xl flex-col justify-self-end overflow-hidden">
      <div className="flex h-full flex-col">
        <div className="relative mb-2 flex-1 overflow-hidden">
          <Conversation className="h-full pb-2">
            <ConversationContent className="pb-28">
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
          <div className="sticky bottom-0 mx-2 overflow-auto rounded-2xl border-2 border-gray-200/20 backdrop-blur-xl">
            <PromptInput className="bg-transparent" onSubmit={handleSubmit}>
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ce vrei sa stii despre achizițiile publice?"
                value={displayValue}
              />
              <PromptInputToolbar>
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
