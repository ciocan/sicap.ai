import type { RateLimitInfo } from "hono-rate-limiter";
import { z } from "zod";

export type Env = {
  Variables: {
    userId: string;
    rateLimit: RateLimitInfo;
  };
};

export type JsonInputSchema<T extends z.ZodType> = {
  in: {
    json: z.input<T>;
  };
  out: {
    json: z.infer<T>;
  };
};

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
});

// Chat schemas
export const UIMessageSchema = z
  .object({
    id: z.string(),
    role: z.enum(["user", "assistant", "system", "data"]),
  })
  .passthrough(); // Allow additional properties from AI SDK

export const ChatRequestSchema = z.object({
  threadId: z.string(),
  message: UIMessageSchema,
});

// Thread schemas
export const ThreadMetadataSchema = z
  .object({
    isArchived: z.boolean().optional(),
  })
  .catchall(z.unknown());

export const ThreadSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  resourceId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: ThreadMetadataSchema.optional(),
});

export const GetThreadRequestSchema = z.object({
  threadId: z.string(),
});

export const GetThreadResponseSchema = z.object({
  uiMessages: z.array(UIMessageSchema),
});

export const ListThreadsResponseSchema = z.object({
  threads: z.array(ThreadSchema),
});

export const ArchiveThreadRequestSchema = z.object({
  threadId: z.string(),
});

export const GenerateTitleRequestSchema = z.object({
  message: z.string(),
});

// Message schemas
export const VoteMessageRequestSchema = z.object({
  threadId: z.string(),
  vote: z.enum(["up", "down"]),
  branchIndex: z.number().optional(),
});

// Type exports
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type UIMessage = z.infer<typeof UIMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type Thread = z.infer<typeof ThreadSchema>;
export type GetThreadRequest = z.infer<typeof GetThreadRequestSchema>;
export type GetThreadResponse = z.infer<typeof GetThreadResponseSchema>;
export type ListThreadsResponse = z.infer<typeof ListThreadsResponseSchema>;
export type ArchiveThreadRequest = z.infer<typeof ArchiveThreadRequestSchema>;
export type GenerateTitleRequest = z.infer<typeof GenerateTitleRequestSchema>;
export type VoteMessageRequest = z.infer<typeof VoteMessageRequestSchema>;
