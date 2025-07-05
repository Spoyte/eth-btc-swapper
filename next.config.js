/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: false, // Using pages directory for now
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    return config;
  },
  env: {
    BITCOIN_NETWORK: process.env.NEXT_PUBLIC_BITCOIN_NETWORK,
    ETHEREUM_CHAIN_ID: process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID,
    APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
};

module.exports = nextConfig; 