# Media Processing Features - Comprehensive Test Suite

This test suite provides comprehensive coverage for media processing features including upscale, video tools, lip sync, and watermark functionality.

## Test Structure

### Unit Tests (`tests/unit/`)
- **media-processing.test.js**: Core unit tests for individual media processing functions
- **media-processing-integration.test.js**: Integration tests for complete processing pipelines

### E2E Tests (`tests/e2e/`)
- **media-processing.e2e.spec.ts**: End-to-end tests for UI workflows and user interactions

### Configuration
- **vitest.config.test.js**: Test configuration with coverage and performance settings

## Features Covered

### 1. Image Upscaling
- ✅ Standard upscale (2x, 4x factors)
- ✅ Creative upscale with AI enhancement
- ✅ Face enhancement modes
- ✅ Different image formats (JPG, PNG, WebP, TIFF)
- ✅ Various aspect ratios (16:9, 1:1, 9:16, 4:3)
- ✅ Large file handling (up to 500MB+)
- ✅ Error handling and validation

### 2. Video Tools
- ✅ Video stabilization
- ✅ Color correction and grading
- ✅ Video denoising
- ✅ Multiple effect sequencing
- ✅ Video compression and optimization
- ✅ Different codecs (H.264, H.265, VP9, AV1)
- ✅ Frame interpolation for higher FPS

### 3. Lip Sync Functionality
- ✅ Audio-to-video synchronization
- ✅ Multiple quality settings (standard, high, professional)
- ✅ Different audio formats (WAV, MP3, AAC, FLAC)
- ✅ Multilingual support (EN, ES, FR, DE, JA)
- ✅ Background music preservation
- ✅ Processing timeout handling
- ✅ Polling and async result management

### 4. Watermark Functionality
- ✅ Text watermarks with custom styling
- ✅ Image watermarks
- ✅ All position options (9 positions)
- ✅ Opacity control (0.1 to 0.9)
- ✅ Video watermarking
- ✅ Batch watermarking
- ✅ Custom fonts, colors, and effects
- ✅ Stroke and shadow effects

### 5. Advanced Effects
- ✅ AI video effects (Wan AI Effects)
- ✅ Motion controls (zoom, spin, shake, bounce, pan, orbit)
- ✅ VFX effects (explosion, lightning, tornado, disintegration)
- ✅ Preset effect collections
- ✅ Batch processing across multiple files

### 6. Production Pipelines
- ✅ Complete image enhancement pipeline
- ✅ Full video production workflow
- ✅ Social media content creation
- ✅ Professional video production
- ✅ Content repurposing for different platforms
- ✅ Multilingual content production

## Running Tests

### All Tests
```bash
npm run test:all
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### E2E Tests Only
```bash
npm run test:e2e
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Test Scenarios

### Happy Path Tests
- Standard processing with default settings
- Custom configuration options
- Multiple file batch processing
- Sequential effect application

### Edge Cases
- Invalid input parameters
- Unsupported file formats
- Large file processing (2GB+)
- Network failures and retries
- Processing timeouts
- API rate limiting

### Error Handling
- Network connectivity issues
- Invalid media URLs
- Unsupported media types
- API authentication failures
- Service unavailability

### Performance Tests
- Large batch processing (50+ files)
- Memory management for large files
- Concurrent processing limits
- Progressive enhancement for slow connections
- Intelligent caching

### Cross-Platform Tests
- Different video codecs and containers
- Various image formats and color spaces
- Audio format conversions
- Platform-specific optimizations

## Test Data

### Mock Files
- Test images: 512x512, 1024x768, 1920x1080, 4K resolutions
- Test videos: 30s, 60s, 2min durations in MP4, WebM, MKV
- Test audio: WAV, MP3, AAC, FLAC formats
- Large files: 100MB, 500MB, 2GB+ sizes

### Mock APIs
- MuAPI endpoints with realistic responses
- Error scenarios with appropriate HTTP status codes
- Async processing with polling mechanisms
- Rate limiting and retry logic

## Coverage Metrics

Target coverage thresholds:
- **Branches**: 70%
- **Functions**: 75%
- **Lines**: 80%
- **Statements**: 80%

## CI Integration

Tests are configured to run in CI with:
- Parallel execution
- Retry logic (2 attempts for flaky tests)
- Coverage reporting
- Performance monitoring
- Cross-browser testing (Chromium, Firefox, WebKit)

## Performance Benchmarks

### Processing Times (Expected)
- Image upscale (2x): < 5 seconds
- Video stabilization: < 30 seconds
- Lip sync (30s video): < 60 seconds
- Watermark application: < 3 seconds
- Batch processing (10 files): < 2 minutes

### Resource Usage
- Memory: < 2GB for standard processing
- CPU: Efficient parallel processing
- Network: Optimized API calls with caching

## Debugging

### Common Issues
1. **Mock API timeouts**: Increase test timeout in config
2. **Memory issues**: Use chunked processing for large files
3. **Network failures**: Implement retry logic with backoff
4. **Async operations**: Ensure proper polling mechanisms

### Debugging Tools
- **Test debugging**: Use `debugger` statements in test code
- **API inspection**: Log API calls and responses
- **Performance profiling**: Monitor memory and CPU usage
- **Visual debugging**: Screenshot comparisons for UI tests

## Contributing

### Adding New Tests
1. Follow existing naming conventions
2. Include both positive and negative test cases
3. Add appropriate mocks for external dependencies
4. Update coverage expectations if needed
5. Document complex test scenarios

### Test Categories
- **Unit tests**: Individual function/component testing
- **Integration tests**: Multi-component workflows
- **E2E tests**: Complete user journey testing
- **Performance tests**: Speed and resource usage
- **Compatibility tests**: Cross-platform functionality

## Maintenance

### Regular Updates
- Update mock data to reflect API changes
- Refresh test files to match current formats
- Review and update performance benchmarks
- Add tests for new features and bug fixes

### Monitoring
- Track test execution times
- Monitor coverage metrics
- Review flaky test reports
- Update dependencies and configurations

## Troubleshooting

### Test Failures
1. Check mock implementations match current API
2. Verify test data formats are still supported
3. Review network and timeout configurations
4. Ensure proper cleanup between tests

### Performance Issues
1. Optimize mock implementations
2. Use selective test running for debugging
3. Implement parallel execution where possible
4. Cache expensive operations

### Coverage Gaps
1. Identify untested code paths
2. Add missing test scenarios
3. Review conditional logic coverage
4. Ensure error paths are tested

This test suite ensures the media processing features are robust, performant, and reliable across all supported scenarios and edge cases.