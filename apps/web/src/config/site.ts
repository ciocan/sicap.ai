export type SiteConfig = {
  name: string;
  author: string;
  description: string;
  keywords: Array<string>;
  url: {
    base: string;
    author: string;
  };
  ogImage: string;
};

export type ContactConfig = {
  email: string;
};

export type Settings = {
  themeToggleEnabled: boolean;
};

export type Layout = {
  heroHeader: string;
  featureCards: string;
  headers: {
    featureCards: string;
    features: string;
  };
};

const baseUrl = "https://sicap.ai";

export const siteConfig: SiteConfig = {
  name: "SICAP.ai - cauta in licitatii publice",
  author: "Radu Ciocan",
  description: "Motor de cautare pentru licitatiile publice din Romania",
  keywords: [
    "achizitii publice",
    "achizitii directe",
    "licitatii publice",
    "motor cautare licitatii",
    "motor cautare achizitii publice",
  ],
  url: {
    base: baseUrl,
    author: "https://ciocan.dev",
  },
  ogImage: `${baseUrl}/og.jpg`,
};

export const contactConfig: ContactConfig = {
  email: "contact@sicap.ai",
};
