import { createHmac } from "crypto";

import { baseUrl } from "@/config/site";

const OG_SECRET = process.env.OG_SECRET as string;

export const getToken = (id: string): string => {
  const hmac = createHmac("sha256", OG_SECRET);
  hmac.update(JSON.stringify({ id }));
  const token = hmac.digest("hex");
  return token;
};

interface OpenGraphProps {
  id: string;
  title: string;
  description: string;
  path: string;
}

export function generateOpenGraph({ id, title, description, path }: OpenGraphProps) {
  const token = getToken(id);
  return {
    openGraph: {
      title,
      description,
      url: `${baseUrl}${path}`,
      images: [
        {
          url: `${baseUrl}/og/${id}/${token}/?title=${title}`,
          width: 1200,
          height: 630,
        },
      ],
      locale: "en_RO",
      type: "website",
    },
  };
}
