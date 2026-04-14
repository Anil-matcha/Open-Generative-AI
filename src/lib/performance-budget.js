// Task 7: Performance budgets and CI integration
import { bundleAnalyzer } from './bundle-analyzer.js';
import { enhancedPerfMonitor } from './enhanced-performance-monitor.js';

export class PerformanceBudget {
  constructor() {
    this.budgets = {
      // Bundle sizes (gzipped)
      bundles: {
        main: 100 * 1024,    // 100kB
        vendor: 200 * 1024,  // 200kB
        css: 50 * 1024,      // 50kB
        total: 500 * 1024    // 500kB total
      },

      // Runtime performance
      runtime: {
        firstContentfulPaint: 1800,  // 1.8s
        largestContentfulPaint: 2500, // 2.5s
        firstInputDelay: 100,         // 100ms
        cumulativeLayoutShift: 0.1    // 0.1
      },

      // Memory usage
      memory: {
        heapUsedLimit: 100 * 1024 * 1024, // 100MB
        leakThreshold: 10 * 1024 * 1024   // 10MB growth threshold
      },

      // Network
      network: {
        totalRequests: 100,     // Max requests per page
        slowRequests: 5,        // Max slow requests (>1s)
        totalSize: 2 * 1024 * 1024 // 2MB total size
      }
    };
  }

  async checkBudgets() {
    const results = {
      passed: true,
      violations: [],
      recommendations: []
    };

    // Check bundle sizes
    const bundleReport = await bundleAnalyzer.analyzeFromFileSizes();
    if (bundleReport) {
      bundleReport.violations.forEach(violation => {
        results.violations.push({
          type: 'bundle',
          ...violation
        });
        results.passed = false;
      });
    }

    // Check runtime performance
    const perfSummary = enhancedPerfMonitor.getPerformanceSummary();

    // Core Web Vitals
    if (perfSummary.coreWebVitals.LCP && perfSummary.coreWebVitals.LCP > this.budgets.runtime.largestContentfulPaint) {
      results.violations.push({
        type: 'runtime',
        severity: 'high',
        message: `LCP exceeds budget: ${perfSummary.coreWebVitals.LCP}ms > ${this.budgets.runtime.largestContentfulPaint}ms`
      });
      results.passed = false;
    }

    if (perfSummary.coreWebVitals.FID && perfSummary.coreWebVitals.FID > this.budgets.runtime.firstInputDelay) {
      results.violations.push({
        type: 'runtime',
        severity: 'high',
        message: `FID exceeds budget: ${perfSummary.coreWebVitals.FID}ms > ${this.budgets.runtime.firstInputDelay}ms`
      });
      results.passed = false;
    }

    if (perfSummary.coreWebVitals.CLS && perfSummary.coreWebVitals.CLS > this.budgets.runtime.cumulativeLayoutShift) {
      results.violations.push({
        type: 'runtime',
        severity: 'medium',
        message: `CLS exceeds budget: ${perfSummary.coreWebVitals.CLS} > ${this.budgets.runtime.cumulativeLayoutShift}`
      });
      results.passed = false;
    }

    // Memory usage
    if (perfSummary.memory) {
      if (perfSummary.memory.averageUsedMB * 1024 * 1024 > this.budgets.memory.heapUsedLimit) {
        results.violations.push({
          type: 'memory',
          severity: 'medium',
          message: `Memory usage exceeds budget: ${perfSummary.memory.averageUsedMB}MB > ${this.budgets.memory.heapUsedLimit / (1024 * 1024)}MB`
        });
        results.passed = false;
      }
    }

    // Network requests
    if (perfSummary.network) {
      if (perfSummary.network.totalRequests > this.budgets.network.totalRequests) {
        results.violations.push({
          type: 'network',
          severity: 'medium',
          message: `Too many network requests: ${perfSummary.network.totalRequests} > ${this.budgets.network.totalRequests}`
        });
        results.passed = false;
      }

      if (perfSummary.network.slowRequests > this.budgets.network.slowRequests) {
        results.violations.push({
          type: 'network',
          severity: 'medium',
          message: `Too many slow requests: ${perfSummary.network.slowRequests} > ${this.budgets.network.slowRequests}`
        });
        results.passed = false;
      }
    }

    // Generate recommendations
    this.generateRecommendations(results, bundleReport);

    return results;
  }

  generateRecommendations(results, bundleReport = null) {
    const violationsByType = results.violations.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {});

    // Add bundle-specific recommendations
    if (bundleReport?.recommendations) {
      results.recommendations.push(...bundleReport.recommendations);
    }

    if (violationsByType.bundle) {
      results.recommendations.push('Implement code splitting for large bundles');
      results.recommendations.push('Use lazy loading for heavy components');
      results.recommendations.push('Optimize CSS delivery with critical CSS extraction');
      results.recommendations.push('Use tree shaking to remove unused code');
    }

    if (violationsByType.runtime) {
      results.recommendations.push('Optimize component rendering with React.memo and useMemo');
      results.recommendations.push('Implement virtual scrolling for large lists');
      results.recommendations.push('Use lazy loading for images and heavy components');
      results.recommendations.push('Minimize layout thrashing and forced synchronous layouts');
    }

    if (violationsByType.memory) {
      results.recommendations.push('Check for memory leaks using the MemoryLeakDetector');
      results.recommendations.push('Implement proper cleanup in useEffect hooks');
      results.recommendations.push('Use WeakMap/WeakSet for caching to allow garbage collection');
      results.recommendations.push('Limit the size of internal data structures');
    }

    if (violationsByType.network) {
      results.recommendations.push('Implement caching strategies for API responses');
      results.recommendations.push('Use compression for text-based resources');
      results.recommendations.push('Optimize images and use modern formats (WebP, AVIF)');
      results.recommendations.push('Implement service worker for caching static assets');
    }

    // Remove duplicates
    results.recommendations = [...new Set(results.recommendations)];
  }

  // CI integration method
  async runCIChecks() {
    console.log('🔍 Running performance budget checks...');

    const results = await this.checkBudgets();

    if (results.passed) {
      console.log('✅ All performance budgets passed!');
      return { success: true, results };
    } else {
      console.error('❌ Performance budget violations detected:');
      results.violations.forEach(v => {
        const icon = v.severity === 'high' ? '🔴' : v.severity === 'medium' ? '🟡' : '🟢';
        console.error(`${icon} ${v.message}`);
      });

      console.log('💡 Recommendations:');
      results.recommendations.forEach(r => {
        console.log(`  • ${r}`);
      });

      return { success: false, results };
    }
  }

  // Update budgets based on current performance
  updateBudgets(newBudgets) {
    this.budgets = {
      ...this.budgets,
      ...newBudgets
    };
  }
}

export const performanceBudget = new PerformanceBudget();