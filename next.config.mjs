/** @type {import('next').NextConfig} */
const nextConfig = {
  // workflow-builder is transpiled from source (package main = src/index.js) so
  // fixes inside its components actually reach the deploy.
  transpilePackages: ['studio', 'ai-agent', 'design-agent', 'workflow-builder'],
  experimental: {
    serverBodySizeLimit: '50mb',
  },
  generateBuildId: async () => 'build-remove-runall-v8',
};

export default nextConfig;
