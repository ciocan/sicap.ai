import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@sicap/data/auth";

export const { GET, POST } = toNextJsHandler(auth.handler);
