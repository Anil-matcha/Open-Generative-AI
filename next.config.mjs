/** @type {import('next').NextConfig} */
const nextConfig = {
  // workflow-builder is consumed as its prebuilt dist (main = dist/index.js).
  // Transpiling it from source via transpilePackages did NOT reach the deploy
  // (Vercel kept serving a stale compiled copy), so the render-loop fixes are
  // shipped in the committed dist instead.
  transpilePackages: ['studio', 'ai-agent', 'design-agent'],
  experimental: {
    serverBodySizeLimit: '50mb',
  },
  generateBuildId: async () => 'build-textnode-char-tag-v27',
};

export default nextConfig;
