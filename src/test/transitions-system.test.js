/**
 * Test file for the comprehensive transitions system
 */

import { TransitionsLibrary } from '../lib/editor/transitionsLibrary.js';
import { TransitionEditor } from '../lib/editor/transitionEditor.js';
import { TimelineTransitions } from '../lib/editor/timelineTransitions.js';

// Test the transitions library
console.log('Testing TransitionsLibrary...');
const library = new TransitionsLibrary();
console.log('Available transitions:', Object.keys(library.transitions).length);
console.log('Available presets:', Object.keys(library.presets).length);

// Test getting a transition
const dissolveTransition = library.getTransition('dissolve');
console.log('Dissolve transition:', dissolveTransition?.name);

// Test transition categories
const fadeTransitions = library.getTransitionsByCategory('fade');
console.log('Fade transitions:', fadeTransitions.length);

// Test presets
const cinematicPresets = library.getPresets('cinematic');
console.log('Cinematic presets:', cinematicPresets.length);

console.log('Transitions system test completed successfully!');