# Load Testing Environment for AI Agent Integration

This directory contains a complete load testing setup for simulating thousands of concurrent users interacting with the timeline editor's AI agent integration system.

## Overview

The system tests the performance of AI agents (Director, Screenwriter, CharacterExtractor, CameraOperator, Editor) that make API calls to `https://api.muapi.ai` for various operations including video generation, translation, dubbing, and effects.

## Prerequisites

- [k6](https://k6.io/) installed
- Node.js (for any additional scripts)
- Access to the target API endpoints

## Directory Structure

```
load-testing/
├── README.md              # This file
├── package.json           # Dependencies (if any)
├── k6/
│   ├── config/
│   │   ├── base.json      # Base configuration
│   │   ├── scale-100.json # 100 users config
│   │   ├── scale-1000.json# 1000 users config
│   │   └── scale-10000.json# 10000 users config
│   ├── scripts/
│   │   ├── auth.js        # Mock authentication module
│   │   ├── ai-patterns.js # AI query pattern generators
│   │   ├── main-test.js   # Main load test script
│   │   └── error-test.js  # Error handling test
│   └── utils/
│       ├── monitoring.js  # Custom metrics and monitoring
│       └── reporting.js   # Report generation utilities
└── results/               # Output directory for test results
```

## Quick Start

1. Install k6:
   ```bash
   # On macOS
   brew install k6

   # On Ubuntu/Debian
   sudo apt update
   sudo apt install k6

   # Or download from https://k6.io/docs/get-started/installation/
   ```

2. Run the interactive test runner:
   ```bash
   cd load-testing
   ./run.sh
   ```

3. Or run specific tests directly:
   ```bash
   # Base test (50 users)
   ./run.sh base

   # Scale test (1000 users)
   ./run.sh 1000

   # Error handling test
   ./run.sh error

   # Manual k6 execution
   k6 run --config k6/config/scale-1000.json k6/scripts/main-test.js
   ```

4. View results in the `results/` directory

## Test Scenarios

### Agent Operations
- **Director**: Video generation and scene creation
- **Screenwriter**: Script writing and dialogue generation
- **CharacterExtractor**: Character analysis and extraction
- **CameraOperator**: Camera work and cinematography
- **Editor**: Timeline editing and post-production

### User Behavior Patterns
- **Creator**: Heavy video generation and editing
- **Collaborator**: Script writing and character work
- **Reviewer**: Analysis and effects application
- **Casual**: Light usage with occasional operations

## Configuration

Tests can be scaled from 100 to 10,000+ concurrent users using the configuration files in `k6/config/`. Each config defines:

- Virtual users (vus)
- Test duration
- Ramp-up patterns
- Thresholds for pass/fail criteria

## Monitoring

The tests include comprehensive monitoring:

- Response times for each agent operation
- Error rates and failure patterns
- Resource usage (CPU, memory)
- Custom metrics for AI API calls
- Real-time dashboards during execution

## Reporting

After test completion, detailed reports are generated including:

- Performance metrics
- Error analysis
- Recommendations for optimization
- Historical comparison charts

## Error Handling

The suite includes tests for:

- API rate limiting
- Network failures
- Authentication errors
- Graceful degradation
- Recovery mechanisms

## Best Practices

- Start with small user counts (100) and gradually scale up
- Monitor system resources during testing
- Use realistic data patterns
- Run tests during off-peak hours
- Archive results for trend analysis