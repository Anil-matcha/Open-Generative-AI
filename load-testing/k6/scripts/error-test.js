import http from 'k6/http';
import { check, sleep } from 'k6';
import { authManager, USER_TYPES } from './auth.js';
import { aiPatterns } from './ai-patterns.js';
import { MonitoringUtils } from '../utils/monitoring.js';

// Error testing configuration
export let options = {
    scenarios: {
        error_injection: {
            executor: 'ramping-vus',
            stages: [
                { duration: '1m', target: 5 },
                { duration: '2m', target: 20 },
                { duration: '3m', target: 20 },
                { duration: '1m', target: 0 },
            ],
            tags: { test_type: 'error' },
        },
    },
    thresholds: {
        // Relaxed thresholds for error testing
        http_req_failed: ['rate<0.80'], // Allow higher failure rate for error testing
        api_errors_total: ['rate<0.90'],
        timeout_errors_total: ['rate<0.50']
    },
};

// Error injection patterns
const ERROR_PATTERNS = {
    NETWORK_FAILURE: 'network_failure',
    API_TIMEOUT: 'api_timeout',
    AUTH_FAILURE: 'auth_failure',
    RATE_LIMIT: 'rate_limit',
    SERVER_ERROR: 'server_error'
};

// Simulate different error conditions
function simulateErrorCondition(pattern, probability = 0.3) {
    if (Math.random() < probability) {
        switch (pattern) {
            case ERROR_PATTERNS.NETWORK_FAILURE:
                // Simulate network failure
                throw new Error('Network connection failed');
            case ERROR_PATTERNS.API_TIMEOUT:
                // Simulate timeout
                sleep(30); // Force timeout
                break;
            case ERROR_PATTERNS.AUTH_FAILURE:
                // Simulate auth failure
                throw new Error('Authentication failed');
            case ERROR_PATTERNS.RATE_LIMIT:
                // Simulate rate limiting
                const response = http.get('https://httpbin.org/status/429');
                check(response, {
                    'rate limited': (r) => r.status === 429
                });
                return;
            case ERROR_PATTERNS.SERVER_ERROR:
                // Simulate server error
                const errorResponse = http.get('https://httpbin.org/status/500');
                check(errorResponse, {
                    'server error': (r) => r.status === 500
                });
                return;
        }
    }
}

// Main error test function
export default function () {
    const userId = __VU;
    const userType = USER_TYPES.CASUAL; // Use casual for error testing

    try {
        // Test authentication with potential failures
        simulateErrorCondition(ERROR_PATTERNS.AUTH_FAILURE, 0.1);
        const authSession = await authenticateWithRetry(userId, userType);
        if (!authSession) {
            MonitoringUtils.recordError('auth');
            return;
        }

        // Execute operations with various error conditions
        await executeOperationsWithErrors(userId, authSession);

    } catch (error) {
        console.error(`Error test failed for user ${userId}: ${error.message}`);
        MonitoringUtils.recordError('api');
    }
}

// Authentication with retry logic
async function authenticateWithRetry(userId, userType, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            simulateErrorCondition(ERROR_PATTERNS.NETWORK_FAILURE, 0.2);
            const session = await authManager.login(userType);
            return session;
        } catch (error) {
            console.warn(`Auth attempt ${attempt} failed for user ${userId}: ${error.message}`);

            if (attempt < maxRetries) {
                sleep(Math.pow(2, attempt)); // Exponential backoff
            } else {
                MonitoringUtils.recordError('auth');
                return null;
            }
        }
    }
}

// Execute operations with error injection
async function executeOperationsWithErrors(userId, authSession) {
    const operations = ['director', 'screenwriter', 'characterExtractor', 'cameraOperator', 'editor'];
    const operationCount = Math.floor(Math.random() * 5) + 3; // 3-8 operations

    for (let i = 0; i < operationCount; i++) {
        const operation = operations[Math.floor(Math.random() * operations.length)];

        // Inject random errors
        const errorPattern = Object.values(ERROR_PATTERNS)[Math.floor(Math.random() * Object.values(ERROR_PATTERNS).length)];
        simulateErrorCondition(errorPattern, 0.25); // 25% chance of error

        try {
            await executeOperationWithTimeout(userId, operation, authSession);
        } catch (error) {
            console.error(`Operation ${operation} failed for user ${userId}: ${error.message}`);
            MonitoringUtils.recordError('api');

            // Test recovery mechanisms
            await testRecovery(userId, operation, authSession);
        }

        // Variable pause between operations
        sleep(Math.random() * 3 + 1);
    }
}

// Execute operation with timeout handling
async function executeOperationWithTimeout(userId, operation, authSession, timeoutMs = 10000) {
    const startTime = Date.now();

    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs);
    });

    // Execute the actual operation
    const operationPromise = executeOperation(userId, operation, authSession);

    try {
        await Promise.race([operationPromise, timeoutPromise]);
    } catch (error) {
        if (error.message === 'Operation timeout') {
            MonitoringUtils.recordError('timeout');
        }
        throw error;
    }
}

// Simplified operation execution for error testing
async function executeOperation(userId, operation, authSession) {
    const testData = {
        prompt: 'Test prompt for error simulation',
        characters: ['TestChar1', 'TestChar2'],
        mediaUrl: 'https://example.com/test.mp4',
        clips: [{ id: 'clip_1', duration: 10 }]
    };

    switch (operation) {
        case 'director':
            return await aiPatterns.directorOperations(userId, testData);
        case 'screenwriter':
            return await aiPatterns.screenwriterOperations(userId, testData);
        case 'characterExtractor':
            return await aiPatterns.characterExtractorOperations(userId, testData);
        case 'cameraOperator':
            return await aiPatterns.cameraOperatorOperations(userId, testData);
        case 'editor':
            return await aiPatterns.editorOperations(userId, testData);
        default:
            throw new Error(`Unknown operation: ${operation}`);
    }
}

// Test recovery mechanisms
async function testRecovery(userId, failedOperation, authSession) {
    console.log(`Testing recovery for ${failedOperation} on user ${userId}`);

    // Try alternative operation
    const alternatives = {
        director: 'cameraOperator',
        screenwriter: 'editor',
        characterExtractor: 'editor',
        cameraOperator: 'director',
        editor: 'director'
    };

    const alternativeOp = alternatives[failedOperation];

    try {
        await executeOperationWithTimeout(userId, alternativeOp, authSession, 5000);
        console.log(`Recovery successful: ${alternativeOp} worked as alternative to ${failedOperation}`);
    } catch (error) {
        console.error(`Recovery failed: ${alternativeOp} also failed`);
        MonitoringUtils.recordError('api');
    }
}

// Setup function for error testing
export function setup() {
    console.log('Starting Error Handling and Recovery Test...');

    // Test error endpoints
    const errorEndpoints = [
        'https://httpbin.org/status/429', // Rate limit
        'https://httpbin.org/status/500', // Server error
        'https://httpbin.org/status/502', // Bad gateway
        'https://httpbin.org/delay/5'     // Timeout
    ];

    for (const endpoint of errorEndpoints) {
        const response = http.get(endpoint);
        console.log(`Error endpoint ${endpoint}: Status ${response.status}`);
    }

    return {
        timestamp: new Date().toISOString(),
        testType: 'error_handling'
    };
}

// Teardown with error analysis
export function teardown(data) {
    console.log('Error handling test completed. Analyzing results...');

    const report = MonitoringUtils.generateHealthReport();
    report.testConfig = data;
    report.errorAnalysis = {
        totalErrors: report.metrics.error_rate.api + report.metrics.error_rate.auth + report.metrics.error_rate.timeout,
        errorDistribution: report.metrics.error_rate,
        recommendations: generateErrorRecommendations(report)
    };

    console.log('Error Test Report:', JSON.stringify(report, null, 2));
}

// Generate recommendations based on error patterns
function generateErrorRecommendations(report) {
    const recommendations = [];

    if (report.metrics.error_rate.auth > 0.1) {
        recommendations.push('Implement exponential backoff for authentication retries');
    }

    if (report.metrics.error_rate.timeout > 0.2) {
        recommendations.push('Increase timeout thresholds or implement circuit breaker pattern');
    }

    if (report.metrics.error_rate.api > 0.3) {
        recommendations.push('Add retry logic with jitter for API calls');
        recommendations.push('Implement graceful degradation for non-critical operations');
    }

    if (recommendations.length === 0) {
        recommendations.push('Error handling is performing well');
    }

    return recommendations;
}