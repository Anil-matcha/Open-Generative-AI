import http from 'http';
import https from 'https';
import { performance } from 'perf_hooks';

// Load testing configuration
const CONFIG = {
    baseUrl: process.env.BASE_URL || 'https://api.muapi.ai',
    initialUsers: parseInt(process.env.INITIAL_VUS) || 10,
    peakUsers: parseInt(process.env.PEAK_VUS) || 100,
    stages: [
        { duration: 2 * 60 * 1000, target: 20 },    // 2 minutes to 20 users
        { duration: 5 * 60 * 1000, target: 100 },   // 5 minutes to 100 users
        { duration: 10 * 60 * 1000, target: 100 },  // 10 minutes at 100 users
        { duration: 2 * 60 * 1000, target: 50 },    // 2 minutes down to 50 users
        { duration: 1 * 60 * 1000, target: 0 }      // 1 minute cooldown
    ]
};

// Test data
const TEST_DATA = {
    timelinePrompts: [
        'A hero walking through a dystopian city at sunset',
        'Two characters having an intense conversation in a coffee shop',
        'Action sequence with car chase through busy streets',
        'Romantic scene on a beach at golden hour',
        'Sci-fi laboratory with futuristic equipment'
    ],
    scriptCharacters: [
        ['John', 'Sarah', 'Detective'],
        ['Emma', 'Mike', 'Boss'],
        ['Alex', 'Jordan', 'Mentor'],
        ['Sam', 'Riley', 'Antagonist']
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

// HTTP request utility
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const startTime = performance.now();
        const protocol = url.startsWith('https') ? https : http;

        const req = protocol.request(url, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'LoadTest/1.0',
                ...options.headers
            },
            timeout: 30000 // 30 second timeout
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const duration = performance.now() - startTime;
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: data,
                    duration: duration
                });
            });
        });

        req.on('error', (err) => {
            const duration = performance.now() - startTime;
            reject({ error: err.message, duration });
        });

        req.on('timeout', () => {
            req.destroy();
            reject({ error: 'timeout', duration: 30000 });
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

// Simulate AI agent operations
async function simulateAgentOperation(agent, userId, metrics) {
    const operations = {
        director: async () => {
            try {
                const prompt = TEST_DATA.timelinePrompts[Math.floor(Math.random() * TEST_DATA.timelinePrompts.length)];
                const response = await makeRequest(`${CONFIG.baseUrl}/api/director/generate`, {
                    method: 'POST',
                    body: {
                        prompt,
                        elements: ['character', 'background', 'lighting'],
                        userId
                    }
                });

                if (response.status === 200) {
                    metrics.recordResponseTime('director', response.duration);
                    metrics.recordOperation('director');
                } else {
                    metrics.recordError('api');
                }
            } catch (error) {
                metrics.recordError(error.error === 'timeout' ? 'timeout' : 'api');
            }
        },

        screenwriter: async () => {
            try {
                const characters = TEST_DATA.scriptCharacters[Math.floor(Math.random() * TEST_DATA.scriptCharacters.length)];
                const response = await makeRequest(`${CONFIG.baseUrl}/api/screenwriter/dialogue`, {
                    method: 'POST',
                    body: { characters, userId }
                });

                if (response.status === 200) {
                    metrics.recordResponseTime('screenwriter', response.duration);
                    metrics.recordOperation('screenwriter');
                } else {
                    metrics.recordError('api');
                }
            } catch (error) {
                metrics.recordError(error.error === 'timeout' ? 'timeout' : 'api');
            }
        },

        characterExtractor: async () => {
            try {
                const response = await makeRequest(`${CONFIG.baseUrl}/api/character-extractor/extract`, {
                    method: 'POST',
                    body: {
                        mediaUrl: `https://example.com/test-${Math.floor(Math.random() * 100)}.jpg`,
                        userId
                    }
                });

                if (response.status === 200) {
                    metrics.recordResponseTime('characterExtractor', response.duration);
                    metrics.recordOperation('characterExtractor');
                } else {
                    metrics.recordError('api');
                }
            } catch (error) {
                metrics.recordError(error.error === 'timeout' ? 'timeout' : 'api');
            }
        },

        cameraOperator: async () => {
            try {
                const response = await makeRequest(`${CONFIG.baseUrl}/api/camera-operator/movement`, {
                    method: 'POST',
                    body: { userId, scene: 'test-scene' }
                });

                if (response.status === 200) {
                    metrics.recordResponseTime('cameraOperator', response.duration);
                    metrics.recordOperation('cameraOperator');
                } else {
                    metrics.recordError('api');
                }
            } catch (error) {
                metrics.recordError(error.error === 'timeout' ? 'timeout' : 'api');
            }
        },

        editor: async () => {
            try {
                const clips = Array.from({length: Math.floor(Math.random() * 3) + 1}, () => ({
                    id: `clip_${Math.floor(Math.random() * 1000)}`,
                    duration: Math.floor(Math.random() * 20) + 5
                }));

                const response = await makeRequest(`${CONFIG.baseUrl}/api/editor/timeline`, {
                    method: 'POST',
                    body: { clips, userId }
                });

                if (response.status === 200) {
                    metrics.recordResponseTime('editor', response.duration);
                    metrics.recordOperation('editor');
                } else {
                    metrics.recordError('api');
                }
            } catch (error) {
                metrics.recordError(error.error === 'timeout' ? 'timeout' : 'api');
            }
        }
    };

    if (operations[agent]) {
        await operations[agent]();
    }
}

// Simulate user session
async function simulateUserSession(userId, targetConcurrency, metrics) {
    const sessionStart = Date.now();
    const operations = Math.floor(Math.random() * 15) + 5; // 5-20 operations
    const agents = ['director', 'screenwriter', 'characterExtractor', 'cameraOperator', 'editor'];

    for (let i = 0; i < operations; i++) {
        const agent = agents[Math.floor(Math.random() * agents.length)];
        await simulateAgentOperation(agent, userId, metrics);

        // Random delay between operations (0.5-3 seconds)
        const delay = Math.random() * 2500 + 500;
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

    console.log('🚀 Starting AI Agent Load Testing...');
    console.log(`📊 Target: ${CONFIG.peakUsers} concurrent users`);
    console.log(`🌐 Base URL: ${CONFIG.baseUrl}`);
    console.log(`⏱️  Stages: ${CONFIG.stages.length}`);

    // Warmup
    console.log('🔥 Warming up...');
    try {
        await makeRequest(`${CONFIG.baseUrl}/health`);
        console.log('✅ Warmup successful');
    } catch (error) {
        console.log('⚠️  Warmup failed, continuing...');
    }

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
                const userId = `user_${stageUsers + 1}`;
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
            await new Promise(resolve => setTimeout(resolve, 100));

            // Log progress
            if (elapsed % 10000 === 0) { // Every 10 seconds
                console.log(`   ${stageUsers} active users, ${metrics.metrics.operations.total} total operations`);
            }
        }

        currentConcurrency = stageUsers;
        console.log(`✅ Stage ${stageIndex + 1} complete: ${stageUsers} concurrent users`);
    }

    // Wait for remaining sessions to complete
    console.log('⏳ Waiting for remaining sessions to complete...');
    while (activeUsers.size > 0) {
        console.log(`   Waiting for ${activeUsers.size} users...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
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