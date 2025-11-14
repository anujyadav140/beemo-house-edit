import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Set the turbopack root to the current directory
  turbopack: {
    root: path.resolve(__dirname),
  } as any,
}

export default nextConfig
