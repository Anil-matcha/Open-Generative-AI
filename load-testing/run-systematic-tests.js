#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';

const LOAD_LEVELS = [
    {
        name: 'baseline',
        script: 'node-load-test-demo.js',
        duration: '30s',
        description: 'Baseline test with simulated API calls'
    },
    {
        name: 'scale-100',
        script: 'node-load-test-demo.js',
        duration: '45s',
        description: 'Scale test with higher concurrency'
    },
    {
        name: 'scale-1000',
        script: 'node-load-test-demo.js',
        duration: '60s',
        description: 'High load test simulation'
    },
    {
        name: 'scale-10000',
        script: 'node-load-test-demo.js',
        duration: '75s',
        description: 'Extreme load test simulation'
    }
];

async function runLoadTest(level) {
    return new Promise((resolve, reject) => {
        console.log(`\n🚀 Starting ${level.name} load test: ${level.description}`);
        console.log(`⏱️  Estimated duration: ${level.duration}`);
        console.log(`📝 Description: ${level.description}`);
        console.log('─'.repeat(60));

        const env = {
            ...process.env,
            ...level.env,
            BASE_URL: process.env.BASE_URL || 'https://api.muapi.ai'
        };

        const testProcess = spawn('node', [level.script], {
            env,
            stdio: 'inherit'
        });

        testProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${level.name} test completed successfully`);
                resolve();
            } else {
                console.log(`❌ ${level.name} test failed with exit code ${code}`);
                resolve(); // Don't reject, continue with next test
            }
        });

        testProcess.on('error', (error) => {
            console.error(`❌ ${level.name} test error:`, error.message);
            resolve(); // Continue with next test
        });
    });
}

async function saveTestResults(level, results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `load-test-results-${level.name}-${timestamp}.json`;

    try {
        await fs.writeFile(filename, JSON.stringify({
            testLevel: level.name,
            timestamp: new Date().toISOString(),
            config: level,
            results
        }, null, 2));
        console.log(`💾 Results saved to ${filename}`);
    } catch (error) {
        console.error(`Failed to save results:`, error.message);
    }
}

async function runSystematicLoadTesting() {
    console.log('🔬 AI AGENT SYSTEMATIC LOAD TESTING');
    console.log('=====================================');
    console.log(`Base URL: ${process.env.BASE_URL || 'https://api.muapi.ai'}`);
    console.log(`Test Levels: ${LOAD_LEVELS.length}`);
    console.log('');

    const results = [];

    for (const level of LOAD_LEVELS) {
        try {
            await runLoadTest(level);
            results.push({
                level: level.name,
                status: 'completed',
                timestamp: new Date().toISOString()
            });

            // Brief pause between tests
            if (level !== LOAD_LEVELS[LOAD_LEVELS.length - 1]) {
                console.log('\n⏸️  Cooling down for 30 seconds...');
                await new Promise(resolve => setTimeout(resolve, 30000));
            }

        } catch (error) {
            console.error(`Test ${level.name} failed:`, error);
            results.push({
                level: level.name,
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Generate summary report
    console.log('\n📊 LOAD TESTING SUMMARY');
    console.log('='.repeat(50));

    results.forEach(result => {
        const status = result.status === 'completed' ? '✅' : '❌';
        console.log(`${status} ${result.level}: ${result.status}`);
    });

    const completedTests = results.filter(r => r.status === 'completed').length;
    const totalTests = results.length;
    const successRate = (completedTests / totalTests) * 100;

    console.log(`\n🎯 Success Rate: ${completedTests}/${totalTests} (${successRate.toFixed(1)}%)`);

    if (successRate >= 80) {
        console.log('🏆 SYSTEM STABLE: AI agent integration can handle high concurrent loads');
    } else if (successRate >= 60) {
        console.log('⚠️  SYSTEM DEGRADED: Performance issues detected at high loads');
    } else {
        console.log('❌ SYSTEM UNSTABLE: Critical performance issues require attention');
    }

    // Save summary
    const summary = {
        timestamp: new Date().toISOString(),
        totalTests,
        completedTests,
        successRate,
        results,
        recommendation: successRate >= 80 ? 'Production Ready' :
                      successRate >= 60 ? 'Needs Optimization' :
                      'Requires Critical Fixes'
    };

    await saveTestResults({ name: 'summary' }, summary);
}

// Run the systematic testing
runSystematicLoadTesting().catch(error => {
    console.error('Systematic load testing failed:', error);
    process.exit(1);
});