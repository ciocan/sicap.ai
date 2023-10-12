import sharedConfig from "@sicap/tailwind-config/tailwind.config.ts";
// tailwind config is required for editor support
import type { Config } from "tailwindcss";

const config: Pick<Config, "prefix" | "presets"> = {
  prefix: "ui-",
  presets: [sharedConfig],
};

export default config;
