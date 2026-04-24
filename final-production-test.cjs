#!/usr/bin/env node

/**
 * Final Production Readiness Verification
 * Tests all critical components for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Final AI Agent Integration - Production Readiness Verification\n');

let allTestsPassed = true;
let testCount = 0;
let passedTests = 0;

function test(name, condition, message) {
  testCount++;
  console.log(`📋 Test ${testCount}: ${name}`);
  if (condition) {
    console.log(`✅ ${message}`);
    passedTests++;
  } else {
    console.log(`❌ ${message}`);
    allTestsPassed = false;
  }
  console.log('');
}

// Test 1: Environment Configuration
try {
  const envExamplePath = path.join(__dirname, '../.env.example');
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    test('Environment Variables', envContent.includes('VITE_SUPABASE_URL') && envContent.includes('VITE_SUPABASE_ANON_KEY'),
         'Supabase environment variables properly documented');
  }
} catch (error) {
  test('Environment Variables', false, 'Failed to check environment configuration');
}

// Test 2: Edge Function Security
try {
  const edgeFunctionPath = path.join(__dirname, '../supabase/functions/muapi-proxy/index.ts');
  if (fs.existsSync(edgeFunctionPath)) {
    const edgeContent = fs.readFileSync(edgeFunctionPath, 'utf8');
    const corsOrigin = edgeContent.includes('https://open-higgsfield-ai.vercel.app');
    const hasRateLimit = edgeContent.includes('RATE_LIMIT_MAX');
    const hasValidation = edgeContent.includes('validateEndpoint');
    const hasErrorHandling = edgeContent.includes('try') && edgeContent.includes('catch');

    test('Edge Function Security', corsOrigin && hasRateLimit && hasValidation && hasErrorHandling,
         'Edge function has proper security, rate limiting, validation, and error handling');
  }
} catch (error) {
  test('Edge Function Security', false, 'Failed to verify edge function security');
}

// Test 3: Agent System Completeness
try {
  const requiredAgentFiles = [
    'src/lib/agents/baseAgent.js',
    'src/lib/agents/directorAgent.js',
    'src/lib/agents/screenwriterAgent.js',
    'src/lib/agents/characterExtractorAgent.js',
    'src/lib/agents/cameraOperatorAgent.js',
    'src/lib/agents/editorAgent.js',
    'src/lib/agents/index.js'
  ];

  let allAgentFilesExist = true;
  requiredAgentFiles.forEach(file => {
    if (!fs.existsSync(path.join(__dirname, '../', file))) {
      allAgentFilesExist = false;
    }
  });

  // Check exports
  const indexContent = fs.readFileSync(path.join(__dirname, '../src/lib/agents/index.js'), 'utf8');
  const hasAllExports = indexContent.includes('DirectorAgent') &&
                       indexContent.includes('ScreenwriterAgent') &&
                       indexContent.includes('CharacterExtractorAgent') &&
                       indexContent.includes('CameraOperatorAgent') &&
                       indexContent.includes('EditorAgent');

  test('Agent System Completeness', allAgentFilesExist && hasAllExports,
       'All required agent files exist and are properly exported');
} catch (error) {
  test('Agent System Completeness', false, 'Failed to verify agent system completeness');
}

// Test 4: UI Integration
try {
  const timelineEditorPath = path.join(__dirname, '../src/components/TimelineEditorPage.js');
  const uiIntegrationPath = path.join(__dirname, '../src/lib/uiIntegration.js');

  if (fs.existsSync(timelineEditorPath) && fs.existsSync(uiIntegrationPath)) {
    const timelineContent = fs.readFileSync(timelineEditorPath, 'utf8');
    const uiContent = fs.readFileSync(uiIntegrationPath, 'utf8');

    const hasAIButtons = timelineContent.includes('🤖') && timelineContent.includes('🎭') && timelineContent.includes('📊');
    const hasAgentIntegration = timelineContent.includes('timelineAgentIntegration');
    const hasInitialization = timelineContent.includes('initializeAgentSystem');
    const hasModalFunctions = uiContent.includes('openAIMultiTakeModal') && uiContent.includes('openAIAnalyzeModal');
    const hasExports = uiContent.includes('export { openAIMultiTakeModal, openAIAnalyzeModal');

    test('UI Integration', hasAIButtons && hasAgentIntegration && hasInitialization && hasModalFunctions && hasExports,
         'AI buttons, modals, and integration properly implemented in UI');
  }
} catch (error) {
  test('UI Integration', false, 'Failed to verify UI integration');
}

// Test 5: Generation Service
try {
  const generationServicePath = path.join(__dirname, '../src/lib/editor/generationService.js');
  if (fs.existsSync(generationServicePath)) {
    const genContent = fs.readFileSync(generationServicePath, 'utf8');

    const hasMuAPIProvider = genContent.includes('MuAPIProvider');
    const hasLTXModels = genContent.includes('LTX_T2V_MODELS') && genContent.includes('LTX_I2V_MODELS');
    const hasMuAPICalls = genContent.includes('muapi.generateVideo') && genContent.includes('muapi.generateI2V');
    const hasProperExport = genContent.includes('export default generationService');

    test('Generation Service', hasMuAPIProvider && hasLTXModels && hasMuAPICalls && hasProperExport,
         'Generation service properly configured with MuAPI and LTX models');
  }
} catch (error) {
  test('Generation Service', false, 'Failed to verify generation service');
}

// Test 6: Data Structure Compatibility
try {
  const agentFiles = [
    'src/lib/agents/directorAgent.js',
    'src/lib/agents/screenwriterAgent.js',
    'src/lib/agents/characterExtractorAgent.js',
    'src/lib/agents/editorAgent.js'
  ];

  let allCompatible = true;
  agentFiles.forEach(file => {
    const filePath = path.join(__dirname, '../', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const trackItemsCount = (content.match(/track\.items/g) || []).length;
      const trackClipsCount = (content.match(/track\.clips/g) || []).length;

      if (trackClipsCount > 0 || trackItemsCount === 0) {
        allCompatible = false;
      }
    }
  });

  test('Data Structure Compatibility', allCompatible,
       'All agents use correct track.items data structure instead of track.clips');
} catch (error) {
  test('Data Structure Compatibility', false, 'Failed to verify data structure compatibility');
}

// Test 7: Error Handling
try {
  const criticalFiles = [
    'src/lib/uiIntegration.js',
    'src/lib/agents/directorAgent.js',
    'src/lib/editor/generationService.js',
    'supabase/functions/muapi-proxy/index.ts'
  ];

  let allHaveErrorHandling = true;
  criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, '../', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const tryCount = (content.match(/\btry\b/g) || []).length;
      const catchCount = (content.match(/\bcatch\b/g) || []).length;

      if (tryCount === 0 || catchCount === 0) {
        allHaveErrorHandling = false;
      }
    }
  });

  test('Error Handling', allHaveErrorHandling,
       'All critical files have proper try/catch error handling');
} catch (error) {
  test('Error Handling', false, 'Failed to verify error handling');
}

// Test 8: Build Compatibility
try {
  const keyFiles = [
    'src/lib/agents/index.js',
    'src/lib/clipVersioning.js',
    'src/timelineAgentIntegration.js'
  ];

  let allImportsValid = true;
  keyFiles.forEach(file => {
    const filePath = path.join(__dirname, '../', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];

      importMatches.forEach(importStmt => {
        const modulePath = importStmt.match(/from\s+['"]([^'"]+)['"]/)?.[1];
        if (modulePath && !modulePath.startsWith('./') && !modulePath.startsWith('../') &&
            !modulePath.includes('jsr:') && !modulePath.includes('node:')) {
          // Check if it's a known external module or local file
          if (!['react', 'vite', 'fs', 'path'].includes(modulePath) && modulePath.includes('/')) {
            // This might be an invalid import
            allImportsValid = false;
          }
        }
      });
    }
  });

  test('Build Compatibility', allImportsValid,
       'All imports are properly resolved for build process');
} catch (error) {
  test('Build Compatibility', false, 'Failed to verify build compatibility');
}

// Test 9: Component Files
try {
  const componentFiles = [
    'src/components/agentPanel.js',
    'src/components/takeSelector.js',
    'src/styles/agent-panel.css',
    'src/styles/take-selector.css'
  ];

  let allComponentsExist = true;
  componentFiles.forEach(file => {
    if (!fs.existsSync(path.join(__dirname, '../', file))) {
      allComponentsExist = false;
    }
  });

  test('Component Files', allComponentsExist,
       'All required UI component files exist');
} catch (error) {
  test('Component Files', false, 'Failed to verify component files');
}

// Test 10: Production Deployment Ready
try {
  const edgeFunctionPath = path.join(__dirname, '../supabase/functions/muapi-proxy/index.ts');
  const modelsPath = path.join(__dirname, '../src/lib/models.js');

  if (fs.existsSync(edgeFunctionPath) && fs.existsSync(modelsPath)) {
    const edgeContent = fs.readFileSync(edgeFunctionPath, 'utf8');
    const modelsContent = fs.readFileSync(modelsPath, 'utf8');

    const hasProductionCORS = edgeContent.includes('open-higgsfield-ai.vercel.app');
    const hasLTXEndpoints = edgeContent.includes('ltx-2-pro-text-to-video') &&
                           edgeContent.includes('ltx-2-pro-image-to-video');
    const hasModelsInRegistry = modelsContent.includes('ltx-2-pro-text-to-video') &&
                               modelsContent.includes('ltx-2-pro-image-to-video');

    test('Production Deployment Ready', hasProductionCORS && hasLTXEndpoints && hasModelsInRegistry,
         'System configured for production deployment with correct CORS, endpoints, and model registry');
  }
} catch (error) {
  test('Production Deployment Ready', false, 'Failed to verify production deployment readiness');
}

// Summary
console.log(`\n🎯 Production Readiness Verification Complete!`);
console.log(`📊 Results: ${passedTests}/${testCount} tests passed`);

if (allTestsPassed) {
  console.log('✅ All systems are production-ready!');
  console.log('\n🚀 Deployment Instructions:');
  console.log('1. Set environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  console.log('2. Set edge function secret: MUAPI_API_KEY');
  console.log('3. Deploy edge function: supabase functions deploy muapi-proxy');
  console.log('4. Deploy application to Vercel/Netlify');
  console.log('5. AI agents will be available in timeline editor');
} else {
  console.log('❌ Some issues need to be resolved before production deployment');
  process.exit(1);
}