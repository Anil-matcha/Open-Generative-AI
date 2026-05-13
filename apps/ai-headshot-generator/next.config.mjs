/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias["@higgsfield/api-config"] = require.resolve("../../modules/api-config");
    return config;
  }
};

export default nextConfig;
