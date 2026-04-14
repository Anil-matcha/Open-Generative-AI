/**
 * Professional Timeline Editor System Index
 * Main entry point for the comprehensive timeline editing system
 */

// Core Animation System
export { KeyframeSystem, ANIMATION_PROPERTIES, INTERPOLATION_MODES, EASING_PRESETS, MotionBlur, SpeedRamping, LayerParenting } from './keyframeSystem.js';
export { KeyframeEditor } from './keyframeEditor.js';
export { AnimationControls, EasingCurveEditor } from './animationControls.jsx';
export { MotionGraphicsTools } from './motionGraphicsTools.js';
export { TimelineAnimationIntegration } from './timelineAnimationIntegration.js';

// Advanced Color Correction
export { ColorCorrectionSystem } from './colorCorrectionSystem.js';

// Professional Audio Mixing
export { AudioMixer } from './audioMixer.js';

// Advanced Export Pipeline
export { ExportPipeline } from './exportPipeline.js';

// Real-time Performance Features
export { PerformanceManager } from './performanceManager.js';

/**
 * Quick Start Usage Example:
 *
 * import { TimelineAnimationIntegration } from './lib/editor/timelineAnimationIntegration.js';
 *
 * // In your timeline component
 * const timelineContainer = document.querySelector('.timeline-container');
 * const animationSystem = new TimelineAnimationIntegration(timelineContainer, timelineState);
 *
 * // The system automatically integrates with your existing timeline
 * // Keyframe indicators appear on clips
 * // Property panel shows when clips are selected
 * // Animation toolbar provides access to advanced tools
 */

/**
 * Complete Integration Example for TimelineEditorPage.js:
 *
 * // Add this import at the top:
 * import { TimelineAnimationIntegration } from '../lib/editor/timelineAnimationIntegration.js';
 *
 * // In the TimelineEditorPage function, after creating the timeline:
 * const timelineContainer = root.querySelector('.timeline-card');
 * const animationIntegration = new TimelineAnimationIntegration(timelineContainer, state);
 *
 * // Add event listeners for clip selection:
 * // (Assuming you have clip click handlers)
 * clipElement.addEventListener('click', () => {
 *   animationIntegration.selectedClipId = clip.id;
 *   animationIntegration.updatePropertyPanel();
 * });
 *
 * // That's it! The animation system is now fully integrated.
 */</content>
<parameter name="filePath">/workspaces/Open-Higgsfield-AI/src/lib/editor/index.js