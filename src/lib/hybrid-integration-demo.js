/**
 * Hybrid Supabase Integration Demo
 * Demonstrates the seamless online/offline functionality
 */

import { hybridSupabase } from './lib/hybrid-supabase.js';
import { offlineStorage } from './lib/offline-storage.js';

export async function demonstrateHybridIntegration() {

  // 1. Check connection status

  // 2. Test offline storage
  const testProject = {
    id: 'demo-project-' + Date.now(),
    name: 'Demo Project',
    user_id: offlineStorage.getCurrentUserId(),
    data: { clips: [], settings: {} }
  };

  const savedProject = await offlineStorage.saveProject(testProject);

  const loadedProject = await offlineStorage.loadProject(savedProject.id);

  // 3. Test database operations (will use offline fallback if not connected)
  try {
    const { data: projects, error } = await hybridSupabase
      .from('projects')
      .select('*')
      .limit(5);

    if (error) {
    } else {
    }
  } catch (error) {
  }

  // 4. Test edge functions (will use offline processing)
  try {
    const { data, error } = await hybridSupabase.functions.invoke('videoagent', {
      body: {
        prompt: 'Create a demo video',
        duration: 5,
        style: 'cinematic'
      }
    });

    if (error) {
    } else {
      if (data?.mock) {
      }
    }
  } catch (error) {
  }

  // 5. Test storage operations
  try {
    // Create a test file
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const uploadPath = `demo/${Date.now()}_test.txt`;

    const { data: uploadData, error: uploadError } = await hybridSupabase.storage
      .from('uploads')
      .upload(uploadPath, testFile);

    if (uploadError) {
    } else {
    }

    // Test getting public URL
    const { data: urlData } = hybridSupabase.storage
      .from('uploads')
      .getPublicUrl(uploadPath);


  } catch (error) {
  }

  // 6. Show sync status

}

// Auto-run demo if this script is executed directly
if (typeof window !== 'undefined' && window.location) {
  // Browser environment - expose for console testing
  window.demonstrateHybridIntegration = demonstrateHybridIntegration;
} else {
  // Node.js environment - run demo
  demonstrateHybridIntegration().catch(console.error);
}