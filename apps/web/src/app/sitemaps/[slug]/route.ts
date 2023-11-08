import { getServerSideSitemap } from "next-sitemap";

import {
  getSitemapAchizitii,
  getSitemapAchizitiiCpv,
  getSitemapLicitatii,
  getSitemapLicitatiiCpv,
} from "@sicap/api";
import { env } from "@/lib/env.server";

export const revalidate = 0;

const siteUrl = env.BASE_URL;
const allowedSlugs = ["licitatii", "achizitii", "licitatii.cpv", "achizitii.cpv"] as const;
const size = 10_000;

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug.replace(/\.xml$/, "") as typeof allowedSlugs[number];

  if (!allowedSlugs.includes(slug)) {
    return new Response("Not found", { status: 404 });
  }

  let data = [] as { id: string; date: string }[];

  switch (slug) {
    case "licitatii":
      data = await getSitemapLicitatii(size);
      break;
    case "achizitii":
      data = await getSitemapAchizitii(size);
      break;
    case "licitatii.cpv":
      data = await getSitemapLicitatiiCpv(size);
      break;
    case "achizitii.cpv":
      data = await getSitemapAchizitiiCpv(size);
      break;
  }

  const sitemap = data.map(({ id, date }) => {
    const loc = ["licitatii.cpv", "achizitii.cpv"].includes(slug)
      ? `${siteUrl}/${slug.replace(".cpv", "")}/cpv/${id}`
      : `${siteUrl}/${slug}/contract/${id}`;

    return {
      loc,
      lastmod: date,
    };
  });

  return getServerSideSitemap(sitemap);
}
