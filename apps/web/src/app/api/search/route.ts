import { withAxiom, AxiomRequest } from "next-axiom";

import { auth } from "@/lib/auth";
import { dbIds } from "@/utils";
import { saveSearch } from "@sicap/api";

export const POST = withAxiom(async (request: AxiomRequest) => {
  const session = await auth();
  const userId = session?.user?.id;
  const data = await request.json();
  const db = data?.db?.split(",") || dbIds;
  const remoteAddress = request.headers.get("x-forwarded-for");
  const userAgent = request.headers.get("user-agent");

  await saveSearch({
    ...data,
    db,
    userId,
    remoteAddress,
    userAgent,
  });

  return Response.json(data);
});
