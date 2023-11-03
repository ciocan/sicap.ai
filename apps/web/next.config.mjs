import remarkGfm from 'remark-gfm'
import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  async redirects() {
    return [
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
