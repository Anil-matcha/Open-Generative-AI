// Backend Integration Test
// Run this to verify all services are working

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testBackend() {
  console.log('🧪 Testing V-Editor Backend Services...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);

    // Test 2: AI Agent Service
    console.log('\n2. Testing AI Agent Service...');
    const aiResponse = await axios.post(`${BASE_URL}/api/ai-agent/process`, {
      command: 'add a title'
    });
    console.log('✅ AI Agent responded:', aiResponse.data.result.action);

    // Test 3: Scene Detection Service
    console.log('\n3. Testing Scene Detection Service...');
    const sceneResponse = await axios.get(`${BASE_URL}/api/scene-detection/presets`);
    console.log('✅ Scene Detection presets:', Object.keys(sceneResponse.data.presets));

    // Test 4: Semantic Search Service
    console.log('\n4. Testing Semantic Search Service...');
    const searchResponse = await axios.get(`${BASE_URL}/api/semantic-search/stats`);
    console.log('✅ Semantic Search stats retrieved');

    // Test 5: Speech Transcription Service
    console.log('\n5. Testing Speech Transcription Service...');
    const langResponse = await axios.get(`${BASE_URL}/api/speech-transcription/languages`);
    console.log('✅ Speech Transcription languages:', langResponse.data.languages.length);

    console.log('\n🎉 All backend services are operational!');
    console.log('✅ Ready for frontend integration');

  } catch (error) {
    console.error('❌ Backend test failed:', error.response?.data || error.message);
    console.log('💡 Make sure the backend server is running: npm start');
  }
}

// Export for use in other tests
module.exports = { testBackend };

// Run if called directly
if (require.main === module) {
  testBackend();
}</content>
<parameter name="filePath">backend/test-backend.js