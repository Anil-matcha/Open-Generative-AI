import http from 'k6/http';
import { check, sleep } from 'k6';
import { authManager, USER_TYPES } from './auth.js';
import { aiPatterns, USER_BEHAVIORS } from './ai-patterns.js';
import { MonitoringUtils, thresholds } from '../utils/monitoring.js';

// Test configuration
export let options = {
    scenarios: {
        ramping_users: {
            executor: 'ramping-vus',
            stages: [
                { duration: '2m', target: __ENV.INITIAL_VUS || 10 },   // Ramp up to initial users
                { duration: '5m', target: __ENV.PEAK_VUS || 100 },     // Ramp up to peak
                { duration: '10m', target: __ENV.PEAK_VUS || 100 },    // Stay at peak
                { duration: '2m', target: __ENV.FINAL_VUS || 50 },     // Ramp down
            ],
            tags: { test_type: 'load' },
        },
    },
    thresholds: thresholds,
};

// Global test data
const testData = {
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
    ],
    mediaUrls: [
        'https://example.com/video1.mp4',
        'https://example.com/video2.mp4',
        'https://example.com/frame1.jpg',
        'https://example.com/clip1.mp4'
    ]
};

// Main test function
export default function () {
    const userId = __VU; // Virtual user ID from k6
    const userType = selectUserType();
    const sessionStart = Date.now();

    try {
        // Authenticate user
        const authSession = await authenticateUser(userType);
        if (!authSession) {
            MonitoringUtils.recordError('auth');
            return;
        }

        // Simulate user session
        await simulateUserSession(userId, authSession, userType);

        // Record session metrics
        const sessionDuration = (Date.now() - sessionStart) / 1000;
        MonitoringUtils.recordSession({
            duration: sessionDuration,
            operations: Math.floor(Math.random() * 20) + 5,
            userType: userType
        });

    } catch (error) {
        console.error(`User ${userId} session failed: ${error.message}`);
        MonitoringUtils.recordError('api');
    }
}

// Helper functions
function selectUserType() {
    const rand = Math.random();
    if (rand < 0.4) return USER_TYPES.CREATOR;
    if (rand < 0.7) return USER_TYPES.COLLABORATOR;
    if (rand < 0.9) return USER_TYPES.REVIEWER;
    return USER_TYPES.CASUAL;
}

async function authenticateUser(userType) {
    try {
        return await authManager.login(userType);
    } catch (error) {
        console.error(`Authentication failed for ${userType}: ${error.message}`);
        return null;
    }
}

async function simulateUserSession(userId, authSession, userType) {
    const behavior = USER_BEHAVIORS[userType];
    const sessionLength = behavior.sessionLength;
    const operations = Math.floor(Math.random() * 15) + 5; // 5-20 operations per session
    const operationInterval = sessionLength / operations;

    let operationCount = 0;

    while (operationCount < operations) {
        // Select operation based on user behavior weights
        const operation = selectWeightedOperation(behavior);

        try {
            await executeOperation(userId, operation, authSession);
        } catch (error) {
            console.error(`Operation ${operation} failed for user ${userId}: ${error.message}`);
            MonitoringUtils.recordError('api');
        }

        // Random pause between operations
        sleep(Math.random() * operationInterval + 0.5);

        operationCount++;

        // Periodic token refresh (simulate)
        if (operationCount % 5 === 0) {
            try {
                await authManager.refreshToken(userId);
            } catch (error) {
                console.warn(`Token refresh failed for user ${userId}`);
            }
        }
    }
}

function selectWeightedOperation(behavior) {
    const rand = Math.random();
    let cumulative = 0;

    for (const [operation, weight] of Object.entries(behavior)) {
        if (operation === 'sessionLength') continue;
        cumulative += weight;
        if (rand <= cumulative) {
            return operation;
        }
    }

    return 'director'; // fallback
}

async function executeOperation(userId, operation, authSession) {
    const testDataSample = getRandomTestData();

    switch (operation) {
        case 'director':
            const directorResult = await aiPatterns.directorOperations(userId, {
                prompt: testDataSample.prompt,
                elements: ['character', 'background', 'lighting']
            });
            MonitoringUtils.recordAgentResponse('director', directorResult.generate, 'generate');
            MonitoringUtils.recordAgentResponse('director', directorResult.compose, 'compose');
            break;

        case 'screenwriter':
            const screenwriterResult = await aiPatterns.screenwriterOperations(userId, {
                characters: testDataSample.characters
            });
            MonitoringUtils.recordAgentResponse('screenwriter', screenwriterResult.dialogue, 'dialogue');
            MonitoringUtils.recordAgentResponse('screenwriter', screenwriterResult.revision, 'revision');
            break;

        case 'characterExtractor':
            const characterResult = await aiPatterns.characterExtractorOperations(userId, {
                url: testDataSample.mediaUrl
            });
            MonitoringUtils.recordAgentResponse('characterExtractor', characterResult.extract, 'extract');
            MonitoringUtils.recordAgentResponse('characterExtractor', characterResult.analyze, 'analyze');
            break;

        case 'cameraOperator':
            const cameraResult = await aiPatterns.cameraOperatorOperations(userId, {});
            MonitoringUtils.recordAgentResponse('cameraOperator', cameraResult.movement, 'movement');
            MonitoringUtils.recordAgentResponse('cameraOperator', cameraResult.framing, 'framing');
            break;

        case 'editor':
            const editorResult = await aiPatterns.editorOperations(userId, {
                clips: Array.from({length: Math.floor(Math.random() * 3) + 1}, () => ({
                    id: 'clip_' + Math.floor(Math.random() * 1000),
                    duration: Math.floor(Math.random() * 20) + 5
                }))
            });
            MonitoringUtils.recordAgentResponse('editor', editorResult.timeline, 'timeline');
            MonitoringUtils.recordAgentResponse('editor', editorResult.effects, 'effects');
            break;
    }
}

function getRandomTestData() {
    return {
        prompt: testData.timelinePrompts[Math.floor(Math.random() * testData.timelinePrompts.length)],
        characters: testData.scriptCharacters[Math.floor(Math.random() * testData.scriptCharacters.length)],
        mediaUrl: testData.mediaUrls[Math.floor(Math.random() * testData.mediaUrls.length)]
    };
}

// Setup function (runs before test)
export function setup() {
    console.log('Starting AI Agent Load Test Setup...');

    // Pre-warm connections or setup test data
    const warmupResponse = http.get(__ENV.BASE_URL || 'https://api.muapi.ai/health');
    check(warmupResponse, {
        'warmup successful': (r) => r.status === 200
    });

    return {
        timestamp: new Date().toISOString(),
        config: {
            baseUrl: __ENV.BASE_URL || 'https://api.muapi.ai',
            initialVus: __ENV.INITIAL_VUS || 10,
            peakVus: __ENV.PEAK_VUS || 100
        }
    };
}

// Teardown function (runs after test)
export function teardown(data) {
    console.log('Load test completed. Generating final report...');

    // Generate and save final health report
    const report = MonitoringUtils.generateHealthReport();
    report.testConfig = data;

    // In a real implementation, you might save this to a file or send to monitoring system
    console.log('Final Report:', JSON.stringify(report, null, 2));

    // Cleanup
    authManager.cleanup();
}