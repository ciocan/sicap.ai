import { Suspense } from "react";
import type { Viewport } from "next";
import { GeistSans, GeistMono } from "geist/font";
import { AxiomWebVitals } from "next-axiom";
import OpenStatusProvider from "@/components/openstatus-provider";
import { BotIdClient } from "botid/client";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import "@sicap/ui/globals.css";

import { siteConfig } from "@/config/site";
import { ThemeProvider } from "@/components";
import { QueryProvider } from "@/components/providers/query-provider";
import { env } from "@/lib/env";
import { Toaster } from "@sicap/ui";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export const metadata = {
  manifest: "/manifest.json",
  metadataBase: new URL(siteConfig.url.base),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [
    {
      name: siteConfig.author,
      url: siteConfig.url.author,
    },
  ],
  creator: siteConfig.author,
  openGraph: {
    type: "website",
    locale: "en_RO",
    url: siteConfig.url.base,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

const protectedRoutes = [
  {
    path: "/",
    method: "GET",
  },
  {
    path: "/licitatii/*",
    method: "GET",
  },
  {
    path: "/achizitii/*",
    method: "GET",
  },
  {
    path: "/achizitii-offline/*",
    method: "GET",
  },
  {
    path: "/cauta",
    method: "GET",
  },
];

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <script
          defer
          data-domain={env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
          src={env.NEXT_PUBLIC_PLAUSIBLE_URL}
        />
        <script
          defer
          src={env.NEXT_PUBLIC_CLOUDFLARE_HOST}
          data-cf-beacon={`{"token": "${env.NEXT_PUBLIC_CLOUDFLARE_TOKEN}"}`}
        />
        <BotIdClient protect={protectedRoutes} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <Suspense fallback={null}>
              <NuqsAdapter>{children}</NuqsAdapter>
            </Suspense>
            <Toaster className="pointer-events-auto" position="top-center" richColors closeButton />
          </QueryProvider>
        </ThemeProvider>
        <OpenStatusProvider dsn={env.NEXT_PUBLIC_OPENSTATUS_RUM_DSN} />
      </body>
      <AxiomWebVitals />
    </html>
  );
}
