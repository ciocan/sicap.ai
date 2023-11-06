import { ImageResponse } from "next/og";

import { baseUrl } from "@/config/site";

export const runtime = "edge";

const OG_SECRET = process.env.OG_SECRET;

const key = crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(OG_SECRET),
  { name: "HMAC", hash: { name: "SHA-256" } },
  false,
  ["sign"],
);

const toHex = (arrayBuffer: ArrayBuffer) => {
  return Array.prototype.map
    .call(new Uint8Array(arrayBuffer), (n) => n.toString(16).padStart(2, "0"))
    .join("");
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams(request.url);
  const [first, second] = params.getAll("params");
  const title = searchParams.get("title");

  const id = second ? first : first?.split("/")[0];
  const token = second ? second : first?.split("/")[1];

  const verifyToken = toHex(
    await crypto.subtle.sign("HMAC", await key, new TextEncoder().encode(JSON.stringify({ id }))),
  );

  if (token !== verifyToken) {
    return new Response("Invalid token.", { status: 401 });
  }

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "white",
      }}
    >
      <div tw="flex flex-col bg-gray-50 p-16">
        <img
          width="96"
          height="96"
          src={`${baseUrl}/windows11/Square44x44Logo.altform-unplated_targetsize-96.png`}
          alt="logo"
        />
        <div tw="flex flex-col w-full">
          <h1 tw="text-xl sm:text-2xl font-bold text-left">{title}</h1>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
