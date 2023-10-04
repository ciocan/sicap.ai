const config = {
  siteUrl: "https://sicap.ai",
  changefreq: "daily",
  generateRobotsTxt: true,
  sitemapSize: 10000,
  robotsTxtOptions: {
    additionalSitemaps: [
      "https://sicap.ai/sitemaps/achizitii.xml",
      "https://sicap.ai/sitemaps/licitatii.xml",
    ],
  },
}

module.exports = config
