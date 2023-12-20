const siteUrl = process.env.BASE_URL;

const config = {
  siteUrl,
  changefreq: "daily",
  generateRobotsTxt: true,
  additionalPaths: () => {
    return [{ loc: `${siteUrl}/despre` }, { loc: `${siteUrl}/confidentialitate` }];
  },
  sitemapSize: 50_000,
  robotsTxtOptions: {
    additionalSitemaps: [
      `${siteUrl}/sitemaps/achizitii.xml`,
      `${siteUrl}/sitemaps/achizitii.firme.xml`,
      `${siteUrl}/sitemaps/achizitii.autoritati.xml`,
      `${siteUrl}/sitemaps/licitatii.xml`,
      `${siteUrl}/sitemaps/licitatii.cpv.xml`,
      `${siteUrl}/sitemaps/achizitii.cpv.xml`,
      `${siteUrl}/sitemaps/achizitii-offline.xml`,
    ],
  },
};

module.exports = config;
