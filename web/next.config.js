/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /@metamask\/sdk/ },
      { module: /@walletconnect/ },
      { file: /pino/ },
      { message: /Can't resolve '@react-native-async-storage\/async-storage'/ },
      { message: /Can't resolve 'pino-pretty'/ }
    ];
    return config;
  },
};

export default nextConfig;
