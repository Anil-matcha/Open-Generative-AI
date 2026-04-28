# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2026-04-17

- **Browser Compatibility**: Fixed environment validation for browser runtime
  - Replaced process.env with import.meta.env for Vite compatibility
  - Resolved "process is not defined" ReferenceError in browser console
  - Environment configuration now works correctly in production builds

- **Code Hardening Complete**: Comprehensive security and performance improvements
  - Implemented HTTPS enforcement and secure protocol handling
  - Added Content Security Policy (CSP) with violation reporting
  - Enhanced input sanitization and validation across all components
  - Strengthened error handling with structured logging and categorization
  - Implemented performance hardening with lazy loading and bundle optimization
  - Added environment configuration validation and security
  - Improved authentication token handling with secure storage
  - Integrated comprehensive error boundaries and recovery mechanisms

- **Postinstall Script Conflict**: Removed npm/pnpm workspace conflicts
  - Removed problematic postinstall script from apps/vimax/package.json
  - Fixed "Cannot read properties of null (reading 'matches'" npm error
  - PNPM workspace install now handles all dependencies cleanly

- **Lockfile Synchronization**: Fixed pnpm workspace dependency conflicts
  - Regenerated pnpm-lock.yaml to include CineGen submodule dependencies
  - Resolved ERR_PNPM_OUTDATED_LOCKFILE error with 26 missing specifiers
  - Ensured compatibility with Netlify CI frozen-lockfile mode

- **Netlify Configuration**: Fixed invalid TOML syntax preventing deployment
  - Corrected malformed build command in netlify.toml
  - Resolved "Failed to parse configuration" error
  - Ensures proper TOML formatting for Netlify CI

### Fixed
- **Netlify Deployment**: Resolved pnpm lockfile conflicts causing build failures
  - Updated build command to use `pnpm install --ignore-scripts` to avoid npm postinstall issues
  - Fixed ERR_PNPM_OUTDATED_LOCKFILE error with 26 missing specifiers
  - Ensures consistent dependency resolution across different environments


## [Unreleased]

### Added
- **VFX Navigation**: Added dedicated VFX menu item in sidebar
  - VFX effects now accessible via dedicated menu option
  - Added VFX routing and page loader configuration
- **Build Compatibility**: Fixed timeline playback module exports
  - Resolved panState export issue preventing successful builds
  - Improved module compatibility across the application
### Fixed
- **Development Console Errors**: Resolved critical runtime errors preventing app startup
  - Fixed "process is not defined" ReferenceError in browser environment validation
  - Added development mode check to MonitoringService to prevent WebSocket connection failures
  - Eliminated repeated WebSocket timeout errors and reconnection attempts in development

## [1.0.2] - 2026-04-17

### Added
- **Project Management**: Complete project save/load system for timeline editor
  - Project browser modal with multiple project support
  - Timestamp tracking and project metadata
  - Automatic project persistence with chat history integration
  - Load recent projects functionality

### Changed
- **Netlify Configuration**: Updated functions directory to 'dist' for proper deployment
- **Functions Package**: Added videodb dependency and build script for Netlify functions
- **Timeline Editor**: Enhanced with project management UI and improved save functionality

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