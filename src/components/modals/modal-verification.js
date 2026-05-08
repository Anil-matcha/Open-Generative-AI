// Simple modal verification script
// Run with: node modal-verification.js

import { testModalIntegration } from './modal-integration-test.test.js';

const success = testModalIntegration();

if (success) {
  process.exit(0);
} else {
  process.exit(1);
}