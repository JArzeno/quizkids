/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    viewTransition: true,
  },
  images: {
    remotePatterns: [],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // pdf-parse's index.js loads test fixtures at import time, breaking Next.js bundling.
      // Point directly to the library file to skip that.
      config.resolve.alias['pdf-parse'] = new URL(
        'pdf-parse/lib/pdf-parse.js',
        import.meta.url,
      ).pathname;
    }
    return config;
  },
};

export default nextConfig;
