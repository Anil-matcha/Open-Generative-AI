import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['studio', 'ai-agent', 'design-agent'],
  experimental: {
    serverBodySizeLimit: '50mb',
  },
  generateBuildId: async () => 'build-remove-runall-v6',
  webpack(config) {
    // Use the local (patched) workflow-builder (prebuilt dist). The Generate Image
    // model list is additionally trimmed in studio's WorkflowStudio so it applies
    // regardless of whether this prebuilt bundle is rebuilt.
    config.resolve.alias['workflow-builder'] = path.resolve(__dirname, 'packages/workflow-builder-local/dist/index.js');
    return config;
  },
};

export default nextConfig;
