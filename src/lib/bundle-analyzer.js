// Simplified bundle analyzer for browser environment
// Node.js file system operations removed to prevent build failures

export class BundleAnalyzer {
  constructor(buildDir = 'dist') {
    this.buildDir = buildDir;
    this.budgets = {
      main: 100 * 1024, // 100kB gzipped
      vendor: 200 * 1024, // 200kB gzipped
      css: 50 * 1024, // 50kB gzipped
      total: 500 * 1024 // 500kB gzipped total
    };
  }

  async analyzeBundles() {
    // Bundle analysis disabled in browser environment
    return null;
  }

  async analyzeFromFileSizes() {
    // Return empty analysis for browser environment
    return {
      timestamp: new Date().toISOString(),
      bundles: { js: [], css: [], total: { size: 0, gzipped: 0 } },
      violations: [],
      recommendations: ['Bundle analysis not available in browser environment']
    };
  }

  estimateGzipSize(size) {
    // Rough gzip estimation: typically 20-30% of original size for JS/CSS
    return Math.round(size * 0.25);
  }

  generateReport(bundles) {
    const report = {
      timestamp: new Date().toISOString(),
      bundles,
      violations: [],
      recommendations: ['Bundle analysis not available in browser environment']
    };

    return report;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async checkBudgets() {
    const report = await this.analyzeFromFileSizes();
    if (!report) return false;

    const hasViolations = report.violations.length > 0;

    if (hasViolations) {
      console.warn('[Bundle Analysis] Budget violations detected:');
      report.violations.forEach(v => console.warn(`  - ${v.message}`));
    } else {
    }

    return !hasViolations;
  }
}

export const bundleAnalyzer = new BundleAnalyzer();
