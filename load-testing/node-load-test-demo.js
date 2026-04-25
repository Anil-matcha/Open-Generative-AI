import { performance } from 'perf_hooks';

// Load testing configuration - shortened for demo
const CONFIG = {
    baseUrl: process.env.BASE_URL || 'https://api.muapi.ai',
    stages: [
        { duration: 10 * 1000, target: 5 },     // 10 seconds to 5 users
        { duration: 15 * 1000, target: 20 },    // 15 seconds to 20 users
        { duration: 10 * 1000, target: 20 },    // 10 seconds at 20 users
        { duration: 5 * 1000, target: 10 },     // 5 seconds down to 10 users
        { duration: 5 * 1000, target: 0 }       // 5 seconds cooldown
    ]
};

// Test data
const TEST_DATA = {
    timelinePrompts: [
        'A hero walking through a dystopian city at sunset',
        'Two characters having an intense conversation in a coffee shop',
        'Action sequence with car chase through busy streets'
    ],
    scriptCharacters: [
        ['John', 'Sarah', 'Detective'],
        ['Emma', 'Mike', 'Boss'],
        ['Alex', 'Jordan', 'Mentor']
    ]
};

// Metrics tracking
class MetricsTracker {
    constructor() {
        this.metrics = {
            responseTimes: {
                director: [],
                screenwriter: [],
                characterExtractor: [],
                cameraOperator: [],
                editor: []
            },
            errors: {
                api: 0,
                auth: 0,
                timeout: 0,
                total: 0
            },
            operations: {
                director: 0,
                screenwriter: 0,
                characterExtractor: 0,
                cameraOperator: 0,
                editor: 0,
                total: 0
            },
            sessions: [],
            startTime: Date.now()
        };
    }

    recordResponseTime(agent, duration) {
        if (this.metrics.responseTimes[agent]) {
            this.metrics.responseTimes[agent].push(duration);
        }
    }

    recordError(type) {
        if (this.metrics.errors[type] !== undefined) {
            this.metrics.errors[type]++;
            this.metrics.errors.total++;
        }
    }

    recordOperation(agent) {
        if (this.metrics.operations[agent] !== undefined) {
            this.metrics.operations[agent]++;
            this.metrics.operations.total++;
        }
    }

    recordSession(duration, operations) {
        this.metrics.sessions.push({ duration, operations, timestamp: Date.now() });
    }

    getReport() {
        const endTime = Date.now();
        const totalDuration = (endTime - this.metrics.startTime) / 1000;

        const calculatePercentile = (arr, percentile) => {
            if (arr.length === 0) return 0;
            const sorted = [...arr].sort((a, b) => a - b);
            const index = Math.ceil((percentile / 100) * sorted.length) - 1;
            return sorted[Math.max(0, index)];
        };

        return {
            testDuration: totalDuration,
            totalOperations: this.metrics.operations.total,
            operationsPerSecond: this.metrics.operations.total / totalDuration,
            errorRate: this.metrics.errors.total / Math.max(this.metrics.operations.total, 1),
            responseTimePercentiles: {
                director: {
                    p50: calculatePercentile(this.metrics.responseTimes.director, 50),
                    p95: calculatePercentile(this.metrics.responseTimes.director, 95),
                    p99: calculatePercentile(this.metrics.responseTimes.director, 99)
                },
                screenwriter: {
                    p50: calculatePercentile(this.metrics.responseTimes.screenwriter, 50),
                    p95: calculatePercentile(this.metrics.responseTimes.screenwriter, 95),
                    p99: calculatePercentile(this.metrics.responseTimes.screenwriter, 99)
                },
                characterExtractor: {
                    p50: calculatePercentile(this.metrics.responseTimes.characterExtractor, 50),
                    p95: calculatePercentile(this.metrics.responseTimes.characterExtractor, 95),
                    p99: calculatePercentile(this.metrics.responseTimes.characterExtractor, 99)
                },
                cameraOperator: {
                    p50: calculatePercentile(this.metrics.responseTimes.cameraOperator, 50),
                    p95: calculatePercentile(this.metrics.responseTimes.cameraOperator, 95),
                    p99: calculatePercentile(this.metrics.responseTimes.cameraOperator, 99)
                },
                editor: {
                    p50: calculatePercentile(this.metrics.responseTimes.editor, 50),
                    p95: calculatePercentile(this.metrics.responseTimes.editor, 95),
                    p99: calculatePercentile(this.metrics.responseTimes.editor, 99)
                }
            },
            errors: this.metrics.errors,
            operations: this.metrics.operations,
            sessionStats: {
                totalSessions: this.metrics.sessions.length,
                avgSessionDuration: this.metrics.sessions.reduce((sum, s) => sum + s.duration, 0) / Math.max(this.metrics.sessions.length, 1),
                avgOperationsPerSession: this.metrics.sessions.reduce((sum, s) => sum + s.operations, 0) / Math.max(this.metrics.sessions.length, 1)
            }
        };
    }
}

// Mock API call simulation
async function simulateApiCall(agent, userId) {
    const startTime = performance.now();

    // Simulate network latency and processing time
    const baseLatency = 50 + Math.random() * 200; // 50-250ms base latency
    const processingTime = {
        director: 500 + Math.random() * 1500,        // 500-2000ms
        screenwriter: 300 + Math.random() * 900,     // 300-1200ms
        characterExtractor: 400 + Math.random() * 1200, // 400-1600ms
        cameraOperator: 200 + Math.random() * 600,   // 200-800ms
        editor: 300 + Math.random() * 900            // 300-1200ms
    }[agent] || 500;

    const totalTime = baseLatency + processingTime;

    // Simulate occasional errors (5% error rate)
    const hasError = Math.random() < 0.05;

    await new Promise(resolve => setTimeout(resolve, totalTime));

    const duration = performance.now() - startTime;

    if (hasError) {
        throw new Error('Simulated API error');
    }

    return {
        status: 200,
        duration: duration,
        data: { success: true, agent, userId }
    };
}

// Simulate AI agent operations
async function simulateAgentOperation(agent, userId, metrics) {
    try {
        const response = await simulateApiCall(agent, userId);

        if (response.status === 200) {
            metrics.recordResponseTime(agent, response.duration);
            metrics.recordOperation(agent);
        } else {
            metrics.recordError('api');
        }
    } catch (error) {
        metrics.recordError('api');
    }
}

// Simulate user session
async function simulateUserSession(userId, targetConcurrency, metrics) {
    const sessionStart = Date.now();
    const operations = Math.floor(Math.random() * 8) + 3; // 3-10 operations per session
    const agents = ['director', 'screenwriter', 'characterExtractor', 'cameraOperator', 'editor'];

    for (let i = 0; i < operations; i++) {
        const agent = agents[Math.floor(Math.random() * agents.length)];
        await simulateAgentOperation(agent, userId, metrics);

        // Random delay between operations (0.2-1 second)
        const delay = Math.random() * 800 + 200;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    const sessionDuration = (Date.now() - sessionStart) / 1000;
    metrics.recordSession(sessionDuration, operations);
}

// Main load testing function
async function runLoadTest() {
    const metrics = new MetricsTracker();
    let currentConcurrency = 0;
    const activeUsers = new Set();

    console.log('🚀 Starting AI Agent Load Testing (Demo Mode)...');
    console.log(`📊 Target: ${CONFIG.stages.reduce((max, stage) => Math.max(max, stage.target), 0)} concurrent users`);
    console.log(`🌐 Base URL: ${CONFIG.baseUrl} (simulated)`);
    console.log(`⏱️  Stages: ${CONFIG.stages.length}`);

    // Execute test stages
    for (let stageIndex = 0; stageIndex < CONFIG.stages.length; stageIndex++) {
        const stage = CONFIG.stages[stageIndex];
        const stageStart = Date.now();

        console.log(`\n📈 Stage ${stageIndex + 1}: Targeting ${stage.target} users over ${stage.duration / 1000}s`);

        // Calculate ramp rate
        const rampDuration = stage.duration;
        const targetUsers = stage.target;
        const rampRate = (targetUsers - currentConcurrency) / (rampDuration / 1000);

        let stageUsers = 0;

        while (Date.now() - stageStart < rampDuration) {
            const elapsed = Date.now() - stageStart;
            const targetForThisMoment = Math.round(currentConcurrency + (rampRate * (elapsed / 1000)));
            const usersNeeded = Math.max(0, targetForThisMoment - stageUsers);

            // Start new users
            for (let i = 0; i < usersNeeded && stageUsers < targetUsers; i++) {
                const userId = `user_${Date.now()}_${stageUsers + 1}`;
                activeUsers.add(userId);
                stageUsers++;

                // Start user session asynchronously
                simulateUserSession(userId, targetUsers, metrics).then(() => {
                    activeUsers.delete(userId);
                }).catch(error => {
                    console.error(`User ${userId} failed:`, error.message);
                    activeUsers.delete(userId);
                });
            }

            // Small delay to prevent overwhelming the event loop
            await new Promise(resolve => setTimeout(resolve, 50));

            // Log progress every 2 seconds
            if (elapsed % 2000 === 0 && elapsed > 0) {
                console.log(`   ${stageUsers} active users, ${metrics.metrics.operations.total} total operations`);
            }
        }

        currentConcurrency = stageUsers;
        console.log(`✅ Stage ${stageIndex + 1} complete: ${stageUsers} concurrent users`);
    }

    // Wait for remaining sessions to complete
    console.log('\n⏳ Waiting for remaining sessions to complete...');
    let waitCount = 0;
    while (activeUsers.size > 0 && waitCount < 20) { // Max 20 seconds wait
        console.log(`   Waiting for ${activeUsers.size} users...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        waitCount++;
    }

    // Generate final report
    const report = metrics.getReport();
    console.log('\n📊 LOAD TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Duration: ${report.testDuration.toFixed(2)}s`);
    console.log(`Total Operations: ${report.totalOperations}`);
    console.log(`Operations/Second: ${report.operationsPerSecond.toFixed(2)}`);
    console.log(`Error Rate: ${(report.errorRate * 100).toFixed(2)}%`);

    console.log('\n📈 Response Time Percentiles (ms):');
    Object.entries(report.responseTimePercentiles).forEach(([agent, percentiles]) => {
        console.log(`  ${agent}: p50=${percentiles.p50.toFixed(0)}, p95=${percentiles.p95.toFixed(0)}, p99=${percentiles.p99.toFixed(0)}`);
    });

    console.log('\n❌ Error Breakdown:');
    Object.entries(report.errors).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });

    console.log('\n🔧 Operations by Agent:');
    Object.entries(report.operations).forEach(([agent, count]) => {
        if (agent !== 'total') {
            console.log(`  ${agent}: ${count}`);
        }
    });

    console.log('\n👥 Session Statistics:');
    console.log(`  Total Sessions: ${report.sessionStats.totalSessions}`);
    console.log(`  Avg Session Duration: ${report.sessionStats.avgSessionDuration.toFixed(2)}s`);
    console.log(`  Avg Operations/Session: ${report.sessionStats.avgOperationsPerSession.toFixed(2)}`);

    // Performance assessment
    const p95Thresholds = {
        director: 5000,
        screenwriter: 3000,
        characterExtractor: 4000,
        cameraOperator: 2000,
        editor: 3000
    };

    let allPassed = true;
    console.log('\n🎯 Performance Threshold Check (p95):');
    Object.entries(report.responseTimePercentiles).forEach(([agent, percentiles]) => {
        const threshold = p95Thresholds[agent];
        const passed = percentiles.p95 <= threshold;
        console.log(`  ${agent}: ${percentiles.p95.toFixed(0)}ms ${passed ? '✅' : '❌'} (threshold: ${threshold}ms)`);
        if (!passed) allPassed = false;
    });

    const errorRateThreshold = 0.05;
    const errorRatePassed = report.errorRate <= errorRateThreshold;
    console.log(`  Error Rate: ${(report.errorRate * 100).toFixed(2)}% ${errorRatePassed ? '✅' : '❌'} (threshold: ${(errorRateThreshold * 100).toFixed(0)}%)`);
    if (!errorRatePassed) allPassed = false;

    console.log(`\n🏆 Overall Result: ${allPassed ? 'PASSED ✅' : 'FAILED ❌'}`);

    return report;
}

// Run the test
runLoadTest().catch(error => {
    console.error('Load test failed:', error);
    process.exit(1);
});