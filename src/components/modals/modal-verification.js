// Simple modal verification script
// Run with: node modal-verification.js

import { testModalIntegration } from './modal-integration-test.test.js';

console.log('Starting modal verification...');
const success = testModalIntegration();

if (success) {
  console.log('✅ All modal verification passed!');
  process.exit(0);
} else {
  console.log('❌ Modal verification failed!');
  process.exit(1);
}