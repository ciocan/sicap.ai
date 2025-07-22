import { getServerSideSitemap } from "next-sitemap";
import type { NextRequest } from "next/server";

import {
  getSitemapAchizitii,
  getSitemapAchizitiiAutoritati,
  getSitemapAchizitiiCpv,
  getSitemapAchizitiiFirme,
  getSitemapAchizitiiOffline,
  getSitemapLicitatii,
  getSitemapLicitatiiCpv,
} from "@sicap/api";
import { env } from "@/lib/env";

export const revalidate = 0;

const siteUrl = env.BASE_URL;
const allowedSlugs = [
  "licitatii",
  "achizitii",
  "achizitii.firme",
  "achizitii.autoritati",
  "licitatii.cpv",
  "achizitii.cpv",
  "achizitii-offline",
] as const;

const size = 50_000;

export async function GET(request: NextRequest, { params }: any) {
  const slug = params.slug.replace(/\.xml$/, "") as (typeof allowedSlugs)[number];

  if (!allowedSlugs.includes(slug)) {
    return new Response("Not found", { status: 404 });
  }

  let data: Array<{ id?: string; date: string }> = [];

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
    case "achizitii.firme":
      data = await getSitemapAchizitiiFirme(size);
      break;
    case "achizitii.autoritati":
      data = await getSitemapAchizitiiAutoritati(size);
      break;
    case "achizitii-offline":
      data = await getSitemapAchizitiiOffline(size);
  }

  const sitemap = data
    .map(({ id, date }) => {
      switch (slug) {
        case "licitatii":
        case "achizitii":
        case "achizitii-offline":
          return {
            loc: `${siteUrl}/${slug}/contract/${id}`,
            lastmod: date,
          };
        case "licitatii.cpv":
        case "achizitii.cpv":
          return {
            loc: `${siteUrl}/${slug.replace(".cpv", "")}/cpv/${id}`,
            lastmod: date,
          };
        case "achizitii.firme":
          return {
            loc: `${siteUrl}/${slug.replace(".firme", "")}/firma/${id}`,
            lastmod: date,
          };
        case "achizitii.autoritati":
          return {
            loc: `${siteUrl}/${slug.replace(".autoritati", "")}/autoritate/${id}`,
            lastmod: date,
          };
      }
    })
    .filter(Boolean);

  return getServerSideSitemap(sitemap);
}
