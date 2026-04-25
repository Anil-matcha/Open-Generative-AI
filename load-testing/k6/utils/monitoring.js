import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for AI agent load testing
export const customMetrics = {
    // Response time trends for each agent
    directorResponseTime: new Trend('director_response_time'),
    screenwriterResponseTime: new Trend('screenwriter_response_time'),
    characterExtractorResponseTime: new Trend('character_extractor_response_time'),
    cameraOperatorResponseTime: new Trend('camera_operator_response_time'),
    editorResponseTime: new Trend('editor_response_time'),

    // Error rates
    apiErrors: new Rate('api_errors_total'),
    authErrors: new Rate('auth_errors_total'),
    timeoutErrors: new Rate('timeout_errors_total'),

    // Operation counters
    operationsTotal: new Counter('operations_total'),
    directorOps: new Counter('director_operations'),
    screenwriterOps: new Counter('screenwriter_operations'),
    characterExtractorOps: new Counter('character_extractor_operations'),
    cameraOperatorOps: new Counter('camera_operator_operations'),
    editorOps: new Counter('editor_operations'),

    // User session metrics
    activeUsers: new Counter('active_users'),
    sessionDuration: new Trend('session_duration'),

    // Resource usage simulation
    memoryUsage: new Trend('memory_usage_mb'),
    cpuUsage: new Trend('cpu_usage_percent'),

    // Business metrics
    videosGenerated: new Counter('videos_generated'),
    scriptsCreated: new Counter('scripts_created'),
    charactersAnalyzed: new Counter('characters_analyzed'),
    shotsOptimized: new Counter('shots_optimized'),
    timelinesEdited: new Counter('timelines_edited')
};

// Monitoring utilities
export class MonitoringUtils {
    static recordAgentResponse(agent, response, operation) {
        const duration = response.timings.duration;

        switch (agent) {
            case 'director':
                customMetrics.directorResponseTime.add(duration);
                customMetrics.directorOps.add(1);
                if (operation === 'generate') customMetrics.videosGenerated.add(1);
                break;
            case 'screenwriter':
                customMetrics.screenwriterResponseTime.add(duration);
                customMetrics.screenwriterOps.add(1);
                if (operation === 'dialogue') customMetrics.scriptsCreated.add(1);
                break;
            case 'characterExtractor':
                customMetrics.characterExtractorResponseTime.add(duration);
                customMetrics.characterExtractorOps.add(1);
                if (operation === 'extract') customMetrics.charactersAnalyzed.add(1);
                break;
            case 'cameraOperator':
                customMetrics.cameraOperatorResponseTime.add(duration);
                customMetrics.cameraOperatorOps.add(1);
                if (operation === 'movement') customMetrics.shotsOptimized.add(1);
                break;
            case 'editor':
                customMetrics.editorResponseTime.add(duration);
                customMetrics.editorOps.add(1);
                if (operation === 'timeline') customMetrics.timelinesEdited.add(1);
                break;
        }

        customMetrics.operationsTotal.add(1);
    }

    static recordError(type, response = null) {
        switch (type) {
            case 'api':
                customMetrics.apiErrors.add(1);
                break;
            case 'auth':
                customMetrics.authErrors.add(1);
                break;
            case 'timeout':
                customMetrics.timeoutErrors.add(1);
                break;
        }

        if (response) {
            console.log(`Error recorded: ${type} - Status: ${response.status} - Duration: ${response.timings.duration}ms`);
        }
    }

    static recordSession(sessionData) {
        customMetrics.activeUsers.add(1);
        customMetrics.sessionDuration.add(sessionData.duration);

        // Simulate resource usage based on session intensity
        const memoryUsage = 50 + (sessionData.operations * 10) + (Math.random() * 50);
        const cpuUsage = 10 + (sessionData.operations * 2) + (Math.random() * 20);

        customMetrics.memoryUsage.add(memoryUsage);
        customMetrics.cpuUsage.add(cpuUsage);
    }

    static generateHealthReport() {
        return {
            timestamp: new Date().toISOString(),
            metrics: {
                total_operations: customMetrics.operationsTotal.value,
                error_rate: {
                    api: customMetrics.apiErrors.rate,
                    auth: customMetrics.authErrors.rate,
                    timeout: customMetrics.timeoutErrors.rate
                },
                response_times: {
                    director: customMetrics.directorResponseTime.values,
                    screenwriter: customMetrics.screenwriterResponseTime.values,
                    characterExtractor: customMetrics.characterExtractorResponseTime.values,
                    cameraOperator: customMetrics.cameraOperatorResponseTime.values,
                    editor: customMetrics.editorResponseTime.values
                },
                operations_by_agent: {
                    director: customMetrics.directorOps.value,
                    screenwriter: customMetrics.screenwriterOps.value,
                    characterExtractor: customMetrics.characterExtractorOps.value,
                    cameraOperator: customMetrics.cameraOperatorOps.value,
                    editor: customMetrics.editorOps.value
                },
                business_metrics: {
                    videos_generated: customMetrics.videosGenerated.value,
                    scripts_created: customMetrics.scriptsCreated.value,
                    characters_analyzed: customMetrics.charactersAnalyzed.value,
                    shots_optimized: customMetrics.shotsOptimized.value,
                    timelines_edited: customMetrics.timelinesEdited.value
                },
                resource_usage: {
                    avg_memory_mb: customMetrics.memoryUsage.values.avg || 0,
                    avg_cpu_percent: customMetrics.cpuUsage.values.avg || 0
                }
            }
        };
    }
}

// Threshold definitions for pass/fail criteria
export const thresholds = {
    // Response time thresholds (95th percentile)
    director_response_time: ['p(95)<5000'],
    screenwriter_response_time: ['p(95)<3000'],
    character_extractor_response_time: ['p(95)<4000'],
    camera_operator_response_time: ['p(95)<2000'],
    editor_response_time: ['p(95)<3000'],

    // Error rate thresholds
    api_errors_total: ['rate<0.05'], // Less than 5% error rate
    auth_errors_total: ['rate<0.01'], // Less than 1% auth failures
    timeout_errors_total: ['rate<0.03'], // Less than 3% timeouts

    // HTTP request duration (built-in k6 metric)
    http_req_duration: ['p(95)<3000'],

    // HTTP request failed rate
    http_req_failed: ['rate<0.05']
};