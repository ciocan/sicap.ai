module.exports = {
  reactStrictMode: true,
  transpilePackages: ['@sicap/ui', '@sicap/api'],
  async redirects() {
    return [
      {
        source: '/search-redirect',
        destination: '/cauta',
        permanent: true,
      },
      // 
      {
        source: '/confidentialitate',
        destination: 'https://sicap.ai/confidentialitate',
        permanent: true,
      },
      {
        source: '/licitatii/contract/:slug',
        destination: 'https://sicap.ai/licitatii/contract/:slug',
        permanent: false
      },
      {
        source: '/licitatii/autoritate/:slug',
        destination: 'https://sicap.ai/licitatii/autoritate/:slug',
        permanent: false
      },
      {
        source: '/licitatii/firma/:slug',
        destination: 'https://sicap.ai/licitatii/firma/:slug',
        permanent: false
      },
      {
        source: '/achizitii/contract/:slug',
        destination: 'https://sicap.ai/achizitii/contract/:slug',
        permanent: false
      },
      {
        source: '/achizitii/autoritate/:slug',
        destination: 'https://sicap.ai/achizitii/autoritate/:slug',
        permanent: false
      },
      {
        source: '/achizitii/firma/:slug',
        destination: 'https://sicap.ai/achizitii/firma/:slug',
        permanent: false
      },
    ]
  },
};
