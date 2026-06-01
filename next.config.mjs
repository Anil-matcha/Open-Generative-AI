/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['studio', 'ai-agent', 'workflow-builder', 'design-agent'],
  experimental: {
    serverBodySizeLimit: '50mb',
  },
};

export default nextConfig;
