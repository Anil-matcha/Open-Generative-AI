# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2026-04-17

### Fixed
- **Netlify Deployment Build Errors**: Resolved critical build failures preventing deployment
  - Removed duplicate 'heygen-video-translate' key in MODEL_ADVANCED_FEATURES configuration
  - Added missing `initializeEnhancedMuAPI` export function to prevent import errors
  - Build now completes successfully and is ready for production deployment

### Changed
- **MuAPI Configuration**: Cleaned up duplicate entries in model feature mappings
- **Enhanced MuAPI**: Added stub implementation for enhanced features initialization

## [1.0.0] - 2026-04-XX

### Added
- Initial release with AI video generation capabilities
- Timeline editor with advanced features
- Multiple AI agent integrations
- Netlify functions for backend processing

### Deployment
- Deployed to https://videoagencyai.netlify.app
- Functions available at `/.netlify/functions/director-backend`