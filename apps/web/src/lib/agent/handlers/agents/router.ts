import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { describeRoute } from "hono-openapi";
import type { BodyLimitOptions } from "../../types";
import { executeAgentToolHandler } from "../tools/handlers";
import {
  generateHandler,
  getAgentByIdHandler,
  getAgentsHandler,
  getEvalsByAgentIdHandler,
  getLiveEvalsByAgentIdHandler,
  setAgentInstructionsHandler,
  streamGenerateHandler,
  streamVNextGenerateHandler,
} from "./handlers";

export function agentsRouter(bodyLimitOptions: BodyLimitOptions) {
  const router = new Hono();

  router.get(
    "/",
    describeRoute({
      description: "Get all available agents",
      tags: ["agents"],
      responses: {
        200: {
          description: "List of all agents",
        },
      },
    }),
    getAgentsHandler,
  );

  router.get(
    "/:agentId",
    describeRoute({
      description: "Get agent by ID",
      tags: ["agents"],
      parameters: [
        {
          name: "agentId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Agent details",
        },
        404: {
          description: "Agent not found",
        },
      },
    }),
    getAgentByIdHandler,
  );

  router.get(
    "/:agentId/evals/ci",
    describeRoute({
      description: "Get CI evals by agent ID",
      tags: ["agents"],
      parameters: [
        {
          name: "agentId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "List of evals",
        },
      },
    }),
    getEvalsByAgentIdHandler,
  );

  router.get(
    "/:agentId/evals/live",
    describeRoute({
      description: "Get live evals by agent ID",
      tags: ["agents"],
      parameters: [
        {
          name: "agentId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "List of evals",
        },
      },
    }),
    getLiveEvalsByAgentIdHandler,
  );

  router.post(
    "/:agentId/generate",
    bodyLimit(bodyLimitOptions),
    describeRoute({
      description: "Generate a response from an agent",
      tags: ["agents"],
      parameters: [
        {
          name: "agentId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                messages: {
                  type: "array",
                  items: { type: "object" },
                },
                threadId: { type: "string" },
                resourceId: { type: "string", description: "The resource ID for the conversation" },
                resourceid: {
                  type: "string",
                  description:
                    "The resource ID for the conversation (deprecated, use resourceId instead)",
                  deprecated: true,
                },
                runId: { type: "string" },
                output: { type: "object" },
              },
              required: ["messages"],
            },
          },
        },
      },
      responses: {
        200: {
          description: "Generated response",
        },
        404: {
          description: "Agent not found",
        },
      },
    }),
    generateHandler,
  );

  router.post(
    "/:agentId/stream",
    bodyLimit(bodyLimitOptions),
    describeRoute({
      description: "Stream a response from an agent",
      tags: ["agents"],
      parameters: [
        {
          name: "agentId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                messages: {
                  type: "array",
                  items: { type: "object" },
                },
                threadId: { type: "string" },
                resourceId: { type: "string", description: "The resource ID for the conversation" },
                resourceid: {
                  type: "string",
                  description:
                    "The resource ID for the conversation (deprecated, use resourceId instead)",
                  deprecated: true,
                },
                runId: { type: "string" },
                output: { type: "object" },
              },
              required: ["messages"],
            },
          },
        },
      },
      responses: {
        200: {
          description: "Streamed response",
        },
        404: {
          description: "Agent not found",
        },
      },
    }),
    streamGenerateHandler,
  );

  router.post(
    "/:agentId/streamVNext",
    bodyLimit(bodyLimitOptions),
    describeRoute({
      description: "Stream a response from an agent using the VNext streaming API",
      tags: ["agents"],
      parameters: [
        {
          name: "agentId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                messages: {
                  type: "array",
                  items: { type: "object" },
                },
                runId: { type: "string" },
                output: { type: "object" },
                experimental_output: { type: "object" },
                instructions: { type: "string" },
                toolsets: { type: "object" },
                clientTools: { type: "object" },
                context: {
                  type: "array",
                  items: { type: "object" },
                },
                memory: {
                  type: "object",
                  properties: {
                    threadId: { type: "string" },
                    resourceId: {
                      type: "string",
                      description: "The resource ID for the conversation",
                    },
                  },
                },
                toolChoice: {
                  oneOf: [
                    { type: "string", enum: ["auto", "none", "required"] },
                    {
                      type: "object",
                      properties: { type: { type: "string" }, toolName: { type: "string" } },
                    },
                  ],
                },
              },
              required: ["messages"],
            },
          },
        },
      },
      responses: {
        200: {
          description: "Streamed response",
        },
        404: {
          description: "Agent not found",
        },
      },
    }),
    streamVNextGenerateHandler,
  );

  router.post(
    "/:agentId/tools/:toolId/execute",
    bodyLimit(bodyLimitOptions),
    describeRoute({
      description: "Execute a tool through an agent",
      tags: ["agents"],
      parameters: [
        {
          name: "agentId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "toolId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: { type: "object" },
                runtimeContext: { type: "object" },
              },
              required: ["data"],
            },
          },
        },
      },
      responses: {
        200: {
          description: "Tool execution result",
        },
        404: {
          description: "Tool or agent not found",
        },
      },
    }),
    executeAgentToolHandler,
  );

  return router;
}

export function agentsRouterDev(bodyLimitOptions: BodyLimitOptions) {
  const router = new Hono();

  router.post(
    "/:agentId/instructions",
    bodyLimit(bodyLimitOptions),
    describeRoute({
      description: "Update an agent's instructions",
      tags: ["agents"],
      parameters: [
        {
          name: "agentId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                instructions: {
                  type: "string",
                  description: "New instructions for the agent",
                },
              },
              required: ["instructions"],
            },
          },
        },
      },
      responses: {
        200: {
          description: "Instructions updated successfully",
        },
        403: {
          description: "Not allowed in non-playground environment",
        },
        404: {
          description: "Agent not found",
        },
      },
    }),
    setAgentInstructionsHandler,
  );

  return router;
}
