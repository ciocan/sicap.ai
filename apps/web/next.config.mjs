import remarkGfm from 'remark-gfm'
import createMDX from '@next/mdx'
import nextPWA from "next-pwa";
import { withAxiom } from "next-axiom"

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  async redirects() {
    return [
      {
        source: '/achizitii/firma/:id/:page(\\d{1,})',
        destination: '/achizitii/firma/:id?p=:page',
        permanent: true,
      },
      {
        source: '/achizitii/autoritate/:id/:page(\\d{1,})',
        destination: '/achizitii/autoritate/:id?p=:page',
        permanent: true,
      },
      {
        source: '/licitatii/firma/:id/:page(\\d{1,})',
        destination: '/achizitii/firma/:id?p=:page',
        permanent: true,
      },
      {
        source: '/licitatii/autoritate/:id/:page(\\d{1,})',
        destination: '/achizitii/autoritate/:id?p=:page',
        permanent: true,
      },
      {
        source: '/achizitii/:cpvId',
        destination: '/achizitii/cpv/:cpvId',
        permanent: true,
      },
      {
        source: '/licitatii/:cpvId',
        destination: '/licitatii/cpv/:cpvId',
        permanent: true,
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


const withPWA = nextPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

export default withAxiom(withPWA(withMDX(nextConfig)))
