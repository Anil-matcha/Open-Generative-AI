import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['studio', 'ai-agent', 'workflow-builder', 'design-agent'],
  experimental: {
    serverBodySizeLimit: '50mb',
  },
  webpack(config) {
    // Use the local (patched) workflow-builder to avoid submodule issues
    config.resolve.alias['workflow-builder'] = path.resolve(__dirname, 'packages/workflow-builder-local/dist/index.js');
    return config;
  },
};

export default nextConfig;
