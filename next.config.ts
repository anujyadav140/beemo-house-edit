import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Set the turbopack root to the current directory
  turbopack: {
    root: path.resolve(__dirname),
  } as any,
  // Enable static export for Firebase Hosting
  output: 'export',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
}

export default nextConfig
