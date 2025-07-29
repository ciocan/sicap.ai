import remarkGfm from "remark-gfm";
import createMDX from "@next/mdx";
import { withAxiom } from "next-axiom";
import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@sicap/ui"],
  serverExternalPackages: ["@mastra/*"],
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@": path.resolve(__dirname, "./src"),
    };
    return config;
  },
  reactStrictMode: false,
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  async rewrites() {
    return [
      {
        source: "/ingest/:path*",
        destination: "https://eu.posthog.com/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/achizitii/firma/:id/:page(\\d{1,})",
        destination: "/achizitii/firma/:id?p=:page",
        permanent: true,
      },
      {
        source: "/achizitii/autoritate/:id/:page(\\d{1,})",
        destination: "/achizitii/autoritate/:id?p=:page",
        permanent: true,
      },
      {
        source: "/licitatii/firma/:id/:page(\\d{1,})",
        destination: "/achizitii/firma/:id?p=:page",
        permanent: true,
      },
      {
        source: "/licitatii/autoritate/:id/:page(\\d{1,})",
        destination: "/achizitii/autoritate/:id?p=:page",
        permanent: true,
      },
      {
        source: "/achizitii/:cpvId",
        destination: "/achizitii/cpv/:cpvId",
        permanent: true,
      },
      {
        source: "/licitatii/:cpvId",
        destination: "/licitatii/cpv/:cpvId",
        permanent: true,
      },
    ];
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
});

export default withAxiom(withMDX(withBotId(nextConfig)));
