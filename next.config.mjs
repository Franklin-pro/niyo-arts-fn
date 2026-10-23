import { fileURLToPath } from 'node:url'

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: fileURLToPath(new URL('.', import.meta.url)),
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
  async rewrites() {
    const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
    const apiBaseUrl = configuredApiUrl.replace(/\/+$/, '')
    const apiDestination = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`

    return [
      {
        source: '/api/:path*',
        destination: `${apiDestination}/:path*`,
      },
    ]
  },
}

export default nextConfig
