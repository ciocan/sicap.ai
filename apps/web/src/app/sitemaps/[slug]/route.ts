import { getServerSideSitemap } from "next-sitemap";
import type { NextRequest } from "next/server";

import {
  getCachedSitemapAchizitii,
  getCachedSitemapAchizitiiAutoritati,
  getCachedSitemapAchizitiiCpv,
  getCachedSitemapAchizitiiFirme,
  getCachedSitemapAchizitiiOffline,
  getCachedSitemapLicitatii,
  getCachedSitemapLicitatiiCpv,
} from "@/lib/cached-queries";
import { env } from "@/lib/env";

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.replace(/\.xml$/, "") as (typeof allowedSlugs)[number];

  if (!allowedSlugs.includes(slug)) {
    return new Response("Not found", { status: 404 });
  }

  let data: Array<{ id?: string; date: string }> = [];

  switch (slug) {
    case "licitatii":
      data = await getCachedSitemapLicitatii(size);
      break;
    case "achizitii":
      data = await getCachedSitemapAchizitii(size);
      break;
    case "licitatii.cpv":
      data = await getCachedSitemapLicitatiiCpv(size);
      break;
    case "achizitii.cpv":
      data = await getCachedSitemapAchizitiiCpv(size);
      break;
    case "achizitii.firme":
      data = await getCachedSitemapAchizitiiFirme(size);
      break;
    case "achizitii.autoritati":
      data = await getCachedSitemapAchizitiiAutoritati(size);
      break;
    case "achizitii-offline":
      data = await getCachedSitemapAchizitiiOffline(size);
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
