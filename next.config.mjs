import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['studio', 'ai-agent', 'design-agent', 'workflow-builder'],
  experimental: {
    serverBodySizeLimit: '50mb',
  },
  generateBuildId: async () => 'build-remove-runall-v5',
  webpack(config) {
    // Use the local (patched) workflow-builder, transpiled straight from source
    // so edits in src land in the deploy (the prebuilt dist was being cached).
    config.resolve.alias['workflow-builder'] = path.resolve(__dirname, 'packages/workflow-builder-local/src/index.js');
    return config;
  },
};

export default nextConfig;
