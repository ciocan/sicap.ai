import { registerOTel } from "@vercel/otel";
import { LangfuseExporter } from "langfuse-vercel";

import { env } from "@/lib/env";

const exporter = new LangfuseExporter({
  publicKey: env.LANGFUSE_PUBLIC_KEY,
  secretKey: env.LANGFUSE_SECRET_KEY,
  baseUrl: env.LANGFUSE_BASEURL,
});

registerOTel({
  serviceName: "ai",
  traceExporter: exporter,
});
