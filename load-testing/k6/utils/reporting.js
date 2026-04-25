const fs = require('fs');
const path = require('path');

// Reporting utilities for load test results
export class ReportingUtils {

    static generateSummaryReport(metrics, config) {
        const report = {
            test_summary: {
                timestamp: new Date().toISOString(),
                duration: config.duration || 'N/A',
                total_users: config.peakVus || 'N/A',
                total_requests: metrics.operationsTotal || 0
            },
            performance_metrics: {
                response_times: {
                    average: this.calculateAverage(metrics.responseTimes || []),
                    p95: this.calculatePercentile(metrics.responseTimes || [], 95),
                    p99: this.calculatePercentile(metrics.responseTimes || [], 99)
                },
                throughput: {
                    requests_per_second: this.calculateThroughput(metrics.operationsTotal, config.duration),
                    operations_breakdown: {
                        director: metrics.directorOps || 0,
                        screenwriter: metrics.screenwriterOps || 0,
                        characterExtractor: metrics.characterExtractorOps || 0,
                        cameraOperator: metrics.cameraOperatorOps || 0,
                        editor: metrics.editorOps || 0
                    }
                }
            },
            error_analysis: {
                total_errors: (metrics.apiErrors || 0) + (metrics.authErrors || 0) + (metrics.timeoutErrors || 0),
                error_rate: this.calculateErrorRate(metrics),
                error_breakdown: {
                    api_errors: metrics.apiErrors || 0,
                    auth_errors: metrics.authErrors || 0,
                    timeout_errors: metrics.timeoutErrors || 0
                }
            },
            business_metrics: {
                content_created: {
                    videos_generated: metrics.videosGenerated || 0,
                    scripts_created: metrics.scriptsCreated || 0,
                    characters_analyzed: metrics.charactersAnalyzed || 0,
                    shots_optimized: metrics.shotsOptimized || 0,
                    timelines_edited: metrics.timelinesEdited || 0
                }
            },
            system_resources: {
                memory_usage_mb: {
                    average: this.calculateAverage(metrics.memoryUsage || []),
                    peak: Math.max(...(metrics.memoryUsage || [0]))
                },
                cpu_usage_percent: {
                    average: this.calculateAverage(metrics.cpuUsage || []),
                    peak: Math.max(...(metrics.cpuUsage || [0]))
                }
            }
        };

        // Performance assessment
        report.assessment = this.assessPerformance(report);

        return report;
    }

    static calculateAverage(values) {
        if (!values || values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    static calculatePercentile(values, percentile) {
        if (!values || values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    static calculateThroughput(totalOps, durationSeconds) {
        if (!durationSeconds || durationSeconds === 0) return 0;
        return totalOps / durationSeconds;
    }

    static calculateErrorRate(metrics) {
        const totalOps = metrics.operationsTotal || 1; // Avoid division by zero
        const totalErrors = (metrics.apiErrors || 0) + (metrics.authErrors || 0) + (metrics.timeoutErrors || 0);
        return totalErrors / totalOps;
    }

    static assessPerformance(report) {
        const assessment = {
            overall_rating: 'unknown',
            bottlenecks: [],
            recommendations: []
        };

        // Response time assessment
        const avgResponseTime = report.performance_metrics.response_times.average;
        if (avgResponseTime < 1000) {
            assessment.overall_rating = 'excellent';
        } else if (avgResponseTime < 3000) {
            assessment.overall_rating = 'good';
        } else if (avgResponseTime < 5000) {
            assessment.overall_rating = 'acceptable';
        } else {
            assessment.overall_rating = 'poor';
            assessment.bottlenecks.push('High response times');
        }

        // Error rate assessment
        const errorRate = report.error_analysis.error_rate;
        if (errorRate > 0.1) {
            assessment.bottlenecks.push('High error rate');
            assessment.recommendations.push('Investigate error causes and implement better error handling');
        }

        // Throughput assessment
        const throughput = report.performance_metrics.throughput.requests_per_second;
        if (throughput < 10) {
            assessment.bottlenecks.push('Low throughput');
            assessment.recommendations.push('Consider optimizing API endpoints and database queries');
        }

        // Resource usage assessment
        const avgCpu = report.system_resources.cpu_usage_percent.average;
        const avgMemory = report.system_resources.memory_usage_mb.average;

        if (avgCpu > 80) {
            assessment.bottlenecks.push('High CPU usage');
            assessment.recommendations.push('Monitor CPU-intensive operations and consider scaling');
        }

        if (avgMemory > 1000) { // 1GB
            assessment.bottlenecks.push('High memory usage');
            assessment.recommendations.push('Check for memory leaks and optimize memory usage');
        }

        // Agent-specific recommendations
        const ops = report.performance_metrics.throughput.operations_breakdown;
        if (ops.director > ops.screenwriter * 2) {
            assessment.recommendations.push('Video generation is heavily used - consider dedicated video processing infrastructure');
        }

        if (assessment.bottlenecks.length === 0) {
            assessment.recommendations.push('System is performing well under load');
        }

        return assessment;
    }

    static saveReport(report, filename = null) {
        if (!filename) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            filename = `load-test-report-${timestamp}.json`;
        }

        const reportPath = path.join(__dirname, '../../results', filename);

        try {
            // Ensure results directory exists
            const resultsDir = path.dirname(reportPath);
            if (!fs.existsSync(resultsDir)) {
                fs.mkdirSync(resultsDir, { recursive: true });
            }

            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            console.log(`Report saved to: ${reportPath}`);
            return reportPath;
        } catch (error) {
            console.error(`Failed to save report: ${error.message}`);
            return null;
        }
    }

    static generateHtmlReport(jsonReport) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Agent Load Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .metric { background: #f9f9f9; padding: 10px; margin: 5px 0; border-radius: 3px; }
        .rating { padding: 5px 10px; border-radius: 3px; color: white; }
        .excellent { background: #28a745; }
        .good { background: #17a2b8; }
        .acceptable { background: #ffc107; color: black; }
        .poor { background: #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI Agent Load Test Report</h1>
        <p><strong>Test Date:</strong> ${jsonReport.test_summary.timestamp}</p>
        <p><strong>Duration:</strong> ${jsonReport.test_summary.duration}</p>
        <p><strong>Peak Users:</strong> ${jsonReport.test_summary.total_users}</p>
        <p><strong>Overall Rating:</strong>
            <span class="rating ${jsonReport.assessment.overall_rating}">
                ${jsonReport.assessment.overall_rating.toUpperCase()}
            </span>
        </p>
    </div>

    <div class="section">
        <h2>Performance Metrics</h2>
        <div class="metric">
            <strong>Average Response Time:</strong> ${jsonReport.performance_metrics.response_times.average.toFixed(2)}ms
        </div>
        <div class="metric">
            <strong>95th Percentile Response Time:</strong> ${jsonReport.performance_metrics.response_times.p95.toFixed(2)}ms
        </div>
        <div class="metric">
            <strong>Requests per Second:</strong> ${jsonReport.performance_metrics.throughput.requests_per_second.toFixed(2)}
        </div>
    </div>

    <div class="section">
        <h2>Error Analysis</h2>
        <div class="metric">
            <strong>Total Errors:</strong> ${jsonReport.error_analysis.total_errors}
        </div>
        <div class="metric">
            <strong>Error Rate:</strong> ${(jsonReport.error_analysis.error_rate * 100).toFixed(2)}%
        </div>
        <table>
            <tr><th>Error Type</th><th>Count</th></tr>
            <tr><td>API Errors</td><td>${jsonReport.error_analysis.error_breakdown.api_errors}</td></tr>
            <tr><td>Auth Errors</td><td>${jsonReport.error_analysis.error_breakdown.auth_errors}</td></tr>
            <tr><td>Timeout Errors</td><td>${jsonReport.error_analysis.error_breakdown.timeout_errors}</td></tr>
        </table>
    </div>

    <div class="section">
        <h2>Operations Breakdown</h2>
        <table>
            <tr><th>Agent</th><th>Operations</th></tr>
            <tr><td>Director</td><td>${jsonReport.performance_metrics.throughput.operations_breakdown.director}</td></tr>
            <tr><td>Screenwriter</td><td>${jsonReport.performance_metrics.throughput.operations_breakdown.screenwriter}</td></tr>
            <tr><td>Character Extractor</td><td>${jsonReport.performance_metrics.throughput.operations_breakdown.characterExtractor}</td></tr>
            <tr><td>Camera Operator</td><td>${jsonReport.performance_metrics.throughput.operations_breakdown.cameraOperator}</td></tr>
            <tr><td>Editor</td><td>${jsonReport.performance_metrics.throughput.operations_breakdown.editor}</td></tr>
        </table>
    </div>

    <div class="section">
        <h2>Assessment & Recommendations</h2>
        <h3>Bottlenecks Identified:</h3>
        <ul>
            ${jsonReport.assessment.bottlenecks.map(b => `<li>${b}</li>`).join('')}
        </ul>
        <h3>Recommendations:</h3>
        <ul>
            ${jsonReport.assessment.recommendations.map(r => `<li>${r}</li>`).join('')}
        </ul>
    </div>
</body>
</html>`;

        return html;
    }

    static saveHtmlReport(jsonReport, filename = null) {
        if (!filename) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            filename = `load-test-report-${timestamp}.html`;
        }

        const htmlContent = this.generateHtmlReport(jsonReport);
        const reportPath = path.join(__dirname, '../../results', filename);

        try {
            const resultsDir = path.dirname(reportPath);
            if (!fs.existsSync(resultsDir)) {
                fs.mkdirSync(resultsDir, { recursive: true });
            }

            fs.writeFileSync(reportPath, htmlContent);
            console.log(`HTML report saved to: ${reportPath}`);
            return reportPath;
        } catch (error) {
            console.error(`Failed to save HTML report: ${error.message}`);
            return null;
        }
    }
}

// Export for use in other scripts
export default ReportingUtils;