#!/usr/bin/env node

// Performance Testing Runner
// Run comprehensive performance analysis
import { performanceBudget } from '../src/lib/performance-budget.js';
import { bundleAnalyzer } from '../src/lib/bundle-analyzer.js';
import { enhancedPerfMonitor } from '../src/lib/enhanced-performance-monitor.js';

async function runPerformanceAnalysis() {
  console.log('🚀 Starting comprehensive performance analysis...');
  console.log('='.repeat(60));

  try {
    // 1. Bundle Analysis
    console.log('📦 Analyzing bundle sizes...');
    const bundleReport = await bundleAnalyzer.analyzeFromFileSizes();
    console.log('Bundle report result:', bundleReport); // Debug
    if (bundleReport) {
      console.log('Bundle Report:');
      console.log(`  Total size: ${(bundleReport.bundles.total.gzipped / 1024).toFixed(1)} KB gzipped`);
      console.log(`  Main bundle: ${(bundleReport.bundles.js.find(b => b.name.includes('index-'))?.gzipped / 1024 || 0).toFixed(1)} KB`);
      console.log(`  CSS bundle: ${(bundleReport.bundles.css[0]?.gzipped / 1024 || 0).toFixed(1)} KB`);

      if (bundleReport.violations.length > 0) {
        console.log('  ❌ Violations:');
        bundleReport.violations.forEach(v => console.log(`    - ${v.message}`));
      } else {
        console.log('  ✅ All bundles within budget');
      }
    }
    console.log('');

    // 2. Performance Budget Check
    console.log('📊 Checking performance budgets...');
    const budgetResults = await performanceBudget.checkBudgets();

    if (budgetResults.passed) {
      console.log('✅ All performance budgets passed!');
    } else {
      console.log('❌ Performance budget violations:');
      budgetResults.violations.forEach(v => {
        const icon = v.severity === 'high' ? '🔴' : v.severity === 'medium' ? '🟡' : '🟢';
        console.log(`${icon} ${v.message}`);
      });
    }
    console.log('');

    // 3. Runtime Performance Summary
    console.log('⚡ Runtime performance summary...');
    const perfSummary = enhancedPerfMonitor.getPerformanceSummary();

    if (perfSummary.memory) {
      console.log('Memory Usage:');
      console.log(`  Average: ${perfSummary.memory.averageUsedMB} MB`);
      console.log(`  Peak: ${perfSummary.memory.peakUsageMB} MB`);
      console.log(`  Trend: ${perfSummary.memory.usageTrend}`);
    }

    if (perfSummary.components && Object.keys(perfSummary.components).length > 0) {
      console.log('Component Performance:');
      Object.entries(perfSummary.components).forEach(([name, stats]) => {
        console.log(`  ${name}: ${stats.avgRenderTime}ms avg (${stats.slowRenders} slow renders)`);
      });
    }

    if (perfSummary.network) {
      console.log('Network Performance:');
      console.log(`  Requests: ${perfSummary.network.totalRequests}`);
      console.log(`  Slow requests: ${perfSummary.network.slowRequests}`);
      console.log(`  Total size: ${(perfSummary.network.totalSizeKB / 1024).toFixed(1)} MB`);
    }
    console.log('');

    // 4. Recommendations
    console.log('💡 Recommendations:');
    const allRecommendations = [
      ...(bundleReport?.recommendations || []),
      ...budgetResults.recommendations
    ];

    if (allRecommendations.length > 0) {
      allRecommendations.forEach(rec => console.log(`  • ${rec}`));
    } else {
      console.log('  ✅ No recommendations - great performance!');
    }

    console.log('');
    console.log('📈 Performance analysis complete!');
    console.log('Run "npm run test:e2e" to execute full test suite');

    return {
      bundleReport,
      budgetResults,
      perfSummary,
      recommendations: allRecommendations
    };

  } catch (error) {
    console.error('❌ Performance analysis failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceAnalysis().catch(console.error);
}

export { runPerformanceAnalysis };