import type { Viewport } from "next";
import { GeistSans, GeistMono } from "geist/font";

import "@sicap/ui/src/styles/styles.css";
import "@/app/globals.css";

import { ThemeProvider } from "@/components";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export const metadata = {
  title: "SICAP.ai Widget",
  description: "Widget pentru afișarea achizițiilor publice",
  robots: {
    index: false,
    follow: false,
  },
};

interface EmbedLayoutProps {
  children: React.ReactNode;
}

export default function EmbedLayout({ children }: EmbedLayoutProps) {
  return (
    <html
      lang="ro"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="p-3">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}

