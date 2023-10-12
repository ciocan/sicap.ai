import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@sicap/ui/styles.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "sicap.ai",
  description: "Motor de cautare pentru licitatiile publice din Romania",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
