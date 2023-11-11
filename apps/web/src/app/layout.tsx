import type { Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { GeistSans, GeistMono } from "geist/font";
import { AxiomWebVitals } from "next-axiom";

import "@sicap/ui/src/styles/styles.css";
import "@/app/globals.css";

import { siteConfig } from "@/config/site";
import { Navbar, Footer, ThemeProvider } from "@/components";
import FormbricksProvider from "./formbricks";
import { env } from "@/lib/env.client";

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

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
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
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <div className="flex flex-col flex-1">{children}</div>
              <Footer />
            </div>
            <FormbricksProvider />
          </ThemeProvider>
        </SessionProvider>
      </body>
      <AxiomWebVitals />
    </html>
  );
}
