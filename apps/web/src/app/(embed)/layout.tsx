import type { Viewport } from "next";
import { Suspense } from "react";
import { GeistSans, GeistMono } from "geist/font";

import "@sicap/ui/src/styles/styles.css";
import "@/app/globals.css";

import { EmbedThemeProvider } from "@/components";

// Inline script to set theme from URL before hydration (prevents flash)
const themeScript = `
(function() {
  try {
    var url = new URL(window.location.href);
    var theme = url.searchParams.get('theme');
    var resolvedTheme;
    
    if (theme === 'light' || theme === 'dark') {
      resolvedTheme = theme;
    } else {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
  } catch (e) {}
})();
`;

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
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Suspense fallback={null}>
          <EmbedThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="p-3">{children}</div>
          </EmbedThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}

