import remarkGfm from 'remark-gfm'
import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  async redirects() {
    return [
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
      // {
      //   source: '/achizitii/contract/:slug',
      //   destination: 'https://sicap.ai/achizitii/contract/:slug',
      //   permanent: false
      // },
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
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
})

export default withMDX(nextConfig)
