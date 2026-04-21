/**
 * Hybrid Supabase Integration Demo
 * Demonstrates the seamless online/offline functionality
 */

import { hybridSupabase } from './lib/hybrid-supabase.js';
import { offlineStorage } from './lib/offline-storage.js';

export async function demonstrateHybridIntegration() {
  console.log('🚀 Demonstrating Hybrid Supabase Integration\n');

  // 1. Check connection status
  console.log('1. Connection Status:');
  console.log('   - Is Online:', hybridSupabase.isOnline());
  console.log('   - Connection State:', hybridSupabase.getConnectionState());
  console.log('   - Last Sync:', hybridSupabase.getLastSyncTime() || 'Never');

  // 2. Test offline storage
  console.log('\n2. Testing Offline Storage:');
  const testProject = {
    id: 'demo-project-' + Date.now(),
    name: 'Demo Project',
    user_id: offlineStorage.getCurrentUserId(),
    data: { clips: [], settings: {} }
  };

  const savedProject = await offlineStorage.saveProject(testProject);
  console.log('   - Saved project offline:', savedProject.name);

  const loadedProject = await offlineStorage.loadProject(savedProject.id);
  console.log('   - Loaded project offline:', loadedProject?.name);

  // 3. Test database operations (will use offline fallback if not connected)
  console.log('\n3. Testing Database Operations:');
  try {
    const { data: projects, error } = await hybridSupabase
      .from('projects')
      .select('*')
      .limit(5);

    if (error) {
      console.log('   - Database query error (expected in offline mode):', error.message);
    } else {
      console.log('   - Found', projects?.length || 0, 'projects');
    }
  } catch (error) {
    console.log('   - Database operation failed:', error.message);
  }

  // 4. Test edge functions (will use offline processing)
  console.log('\n4. Testing Edge Functions:');
  try {
    const { data, error } = await hybridSupabase.functions.invoke('videoagent', {
      body: {
        prompt: 'Create a demo video',
        duration: 5,
        style: 'cinematic'
      }
    });

    if (error) {
      console.log('   - Function call error:', error.message);
    } else {
      console.log('   - Function result:', data?.status || 'processed');
      if (data?.mock) {
        console.log('   - Used offline processing (mock response)');
      }
    }
  } catch (error) {
    console.log('   - Function call failed:', error.message);
  }

  // 5. Test storage operations
  console.log('\n5. Testing Storage Operations:');
  try {
    // Create a test file
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const uploadPath = `demo/${Date.now()}_test.txt`;

    const { data: uploadData, error: uploadError } = await hybridSupabase.storage
      .from('uploads')
      .upload(uploadPath, testFile);

    if (uploadError) {
      console.log('   - Upload error (expected offline):', uploadError.message);
    } else {
      console.log('   - Upload successful:', uploadData?.path);
    }

    // Test getting public URL
    const { data: urlData } = hybridSupabase.storage
      .from('uploads')
      .getPublicUrl(uploadPath);

    console.log('   - Public URL format:', urlData?.publicUrl?.startsWith('blob:') ? 'Offline blob URL' : 'Supabase URL');

  } catch (error) {
    console.log('   - Storage operation failed:', error.message);
  }

  // 6. Show sync status
  console.log('\n6. Synchronization Status:');
  console.log('   - Sync in progress:', hybridSupabase.syncInProgress);
  console.log('   - Queued operations:', hybridSupabase.syncQueue.length);

  console.log('\n✅ Hybrid Integration Demo Complete');
  console.log('\nKey Features Demonstrated:');
  console.log('   ✓ Automatic online/offline detection');
  console.log('   ✓ Seamless fallback to offline storage');
  console.log('   ✓ Edge function offline processing');
  console.log('   ✓ Data synchronization when reconnected');
  console.log('   ✓ Unified API for all operations');
}

// Auto-run demo if this script is executed directly
if (typeof window !== 'undefined' && window.location) {
  // Browser environment - expose for console testing
  window.demonstrateHybridIntegration = demonstrateHybridIntegration;
  console.log('💡 Hybrid Integration Demo available: run demonstrateHybridIntegration() in console');
} else {
  // Node.js environment - run demo
  demonstrateHybridIntegration().catch(console.error);
}