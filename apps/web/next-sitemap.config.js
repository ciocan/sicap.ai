const siteUrl = process.env.BASE_URL;

const config = {
  siteUrl,
  changefreq: "daily",
  generateRobotsTxt: true,
  additionalPaths: () => {
    return [{ loc: `${siteUrl}/despre` }, { loc: `${siteUrl}/confidentialitate` }];
  },
  sitemapSize: 10000,
  robotsTxtOptions: {
    additionalSitemaps: [
      `${siteUrl}/sitemaps/achizitii.xml`,
      `${siteUrl}/sitemaps/licitatii.xml`,
      `${siteUrl}/sitemaps/licitatii.cpv.xml`,
      `${siteUrl}/sitemaps/achizitii.cpv.xml`,
    ],
  },
};

module.exports = config;
