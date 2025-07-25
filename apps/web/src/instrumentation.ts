import {
  ATTR_SERVICE_NAME,
  NodeSDK,
  resourceFromAttributes,
} from "@mastra/core/telemetry/otel-vendor";
import { LangfuseExporter } from "langfuse-vercel";

import { env } from "./lib/env";

export function register() {
  const exporter = new LangfuseExporter({
    publicKey: env.LANGFUSE_PUBLIC_KEY,
    secretKey: env.LANGFUSE_SECRET_KEY,
    baseUrl: env.LANGFUSE_BASEURL,
  });
  // const sdk = new NodeSDK({
  //   resource: resourceFromAttributes({
  //     [ATTR_SERVICE_NAME]: "ai",
  //   }),
  //   traceExporter: exporter,
  // });
  // sdk.start();
}
