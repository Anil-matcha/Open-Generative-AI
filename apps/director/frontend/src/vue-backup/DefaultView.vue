<script setup>
import { ref, onMounted, onUnmounted, reactive } from "vue";
import { ChatInterface } from "@videodb/chat-vue";
import "@videodb/chat-vue/dist/style.css";

const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;
const chatInterfaceRef = ref(null);

// CineGen Spaces Workflow State
const workflowState = reactive({
  activeWorkflow: null,
  workflowSteps: [],
  currentStep: 0,
  isWorkflowActive: false,
  showWorkflowPanel: false,
  workflowHistory: [],
  workflowStats: {}
});

// Workflow Template Selection
const selectedTemplate = ref('quick');

// Comprehensive CineGen Spaces Workflows - Enhanced with 15+ workflow types
const AVAILABLE_WORKFLOWS = [
  {
    id: 'story-development',
    name: 'Story Development',
    description: 'Complete story creation from idea to screenplay',
    icon: '📚',
    category: 'writing',
    complexity: 'advanced',
    steps: [
      { name: 'Idea Expansion', description: 'Expand initial concept into detailed story world' },
      { name: 'Character Development', description: 'Create detailed character profiles and arcs' },
      { name: 'Story Structure', description: 'Design narrative structure and plot points' },
      { name: 'Scene Planning', description: 'Break down story into cinematic scenes' },
      { name: 'Script Writing', description: 'Write complete screenplay with dialogue' }
    ]
  },
  {
    id: 'video-production',
    name: 'Video Production',
    description: 'End-to-end video creation workflow',
    icon: '🎬',
    category: 'production',
    complexity: 'expert',
    steps: [
      { name: 'Concept Development', description: 'Define video concept and target audience' },
      { name: 'Storyboard Creation', description: 'Visualize scenes and camera angles' },
      { name: 'Script Writing', description: 'Write video script and dialogue' },
      { name: 'Asset Gathering', description: 'Collect reference materials and assets' },
      { name: 'Video Generation', description: 'Generate video content' },
      { name: 'Post-Production', description: 'Edit, enhance, and finalize video' }
    ]
  },
  {
    id: 'character-arc',
    name: 'Character Arc Development',
    description: 'Create compelling character journeys',
    icon: '👤',
    category: 'character',
    complexity: 'intermediate',
    steps: [
      { name: 'Character Foundation', description: 'Establish basic character traits and background' },
      { name: 'Motivation Analysis', description: 'Define character goals and motivations' },
      { name: 'Conflict Design', description: 'Create internal and external conflicts' },
      { name: 'Arc Planning', description: 'Design character growth and change' },
      { name: 'Scene Integration', description: 'Integrate character arc into story scenes' }
    ]
  },
  {
    id: 'cinematic-direction',
    name: 'Cinematic Direction',
    description: 'Professional film direction and cinematography planning',
    icon: '🎭',
    category: 'direction',
    complexity: 'expert',
    steps: [
      { name: 'Visual Style Definition', description: 'Establish cinematography style and aesthetic' },
      { name: 'Shot Composition Planning', description: 'Design camera angles and framing' },
      { name: 'Lighting Design', description: 'Plan lighting schemes and mood' },
      { name: 'Performance Direction', description: 'Guide actor performances and delivery' },
      { name: 'Technical Specifications', description: 'Define camera, lens, and equipment needs' }
    ]
  },
  {
    id: 'documentary-production',
    name: 'Documentary Production',
    description: 'Structured approach to documentary filmmaking',
    icon: '📹',
    category: 'documentary',
    complexity: 'advanced',
    steps: [
      { name: 'Research & Preparation', description: 'Gather background information and plan approach' },
      { name: 'Interview Planning', description: 'Design interview questions and participant selection' },
      { name: 'B-Roll Strategy', description: 'Plan supporting footage and visual elements' },
      { name: 'Narrative Structure', description: 'Organize documentary flow and pacing' },
      { name: 'Post-Production Editing', description: 'Compile and edit final documentary' }
    ]
  },
  {
    id: 'commercial-advertising',
    name: 'Commercial Advertising',
    description: 'Create compelling advertising content',
    icon: '📢',
    category: 'advertising',
    complexity: 'intermediate',
    steps: [
      { name: 'Brand Analysis', description: 'Understand brand identity and target audience' },
      { name: 'Creative Concept', description: 'Develop compelling advertising concept' },
      { name: 'Script Development', description: 'Write engaging commercial script' },
      { name: 'Visual Storytelling', description: 'Design visual elements and branding' },
      { name: 'Call-to-Action Integration', description: 'Incorporate compelling CTAs' }
    ]
  },
  {
    id: 'educational-content',
    name: 'Educational Content Creation',
    description: 'Develop engaging educational materials',
    icon: '📚',
    category: 'education',
    complexity: 'intermediate',
    steps: [
      { name: 'Learning Objectives', description: 'Define what students should learn' },
      { name: 'Content Structure', description: 'Organize information logically' },
      { name: 'Visual Aids Design', description: 'Create supporting diagrams and illustrations' },
      { name: 'Assessment Planning', description: 'Design quizzes and comprehension checks' },
      { name: 'Accessibility Features', description: 'Ensure content is accessible to all learners' }
    ]
  },
  {
    id: 'social-media-series',
    name: 'Social Media Series',
    description: 'Create engaging multi-part social content',
    icon: '📱',
    category: 'social',
    complexity: 'intermediate',
    steps: [
      { name: 'Series Concept', description: 'Develop overarching series theme and hook' },
      { name: 'Episode Planning', description: 'Design individual episode content and flow' },
      { name: 'Platform Optimization', description: 'Tailor content for specific social platforms' },
      { name: 'Engagement Strategy', description: 'Plan audience interaction and community building' },
      { name: 'Series Promotion', description: 'Develop teaser content and launch strategy' }
    ]
  },
  {
    id: 'music-video-production',
    name: 'Music Video Production',
    description: 'Create visually stunning music video content',
    icon: '🎵',
    category: 'music',
    complexity: 'advanced',
    steps: [
      { name: 'Song Analysis', description: 'Understand musical structure and emotional arc' },
      { name: 'Visual Metaphor Development', description: 'Create visual concepts that match music' },
      { name: 'Performance Planning', description: 'Design artist performance and staging' },
      { name: 'Editing Sync', description: 'Align visuals perfectly with musical beats' },
      { name: 'Color Grading', description: 'Apply mood-appropriate color treatments' }
    ]
  },
  {
    id: 'animation-production',
    name: 'Animation Production',
    description: 'Complete animated content creation workflow',
    icon: '🎨',
    category: 'animation',
    complexity: 'expert',
    steps: [
      { name: 'Style Definition', description: 'Establish visual style and aesthetic' },
      { name: 'Storyboard Creation', description: 'Design shot-by-shot visual narrative' },
      { name: 'Character Design', description: 'Create detailed character designs and models' },
      { name: 'Animation Planning', description: 'Plan movement, timing, and camera work' },
      { name: 'Sound Integration', description: 'Add voice, music, and sound effects' }
    ]
  },
  {
    id: 'corporate-training',
    name: 'Corporate Training Videos',
    description: 'Create effective employee training content',
    icon: '🏢',
    category: 'corporate',
    complexity: 'intermediate',
    steps: [
      { name: 'Learning Needs Analysis', description: 'Identify specific training requirements' },
      { name: 'Content Simplification', description: 'Break down complex topics into digestible segments' },
      { name: 'Visual Demonstration', description: 'Show processes and procedures visually' },
      { name: 'Assessment Integration', description: 'Include knowledge checks and quizzes' },
      { name: 'Company Branding', description: 'Apply corporate identity and messaging' }
    ]
  },
  {
    id: 'product-demonstration',
    name: 'Product Demonstration',
    description: 'Showcase products with clear, compelling demonstrations',
    icon: '📦',
    category: 'product',
    complexity: 'beginner',
    steps: [
      { name: 'Product Understanding', description: 'Deeply understand product features and benefits' },
      { name: 'Key Feature Identification', description: 'Highlight most important product capabilities' },
      { name: 'Demonstration Scripting', description: 'Write clear, step-by-step demonstration script' },
      { name: 'Visual Enhancement', description: 'Add graphics, animations, and visual aids' },
      { name: 'Benefit Communication', description: 'Clearly communicate value proposition' }
    ]
  },
  {
    id: 'interview-production',
    name: 'Interview Production',
    description: 'Professional interview content creation',
    icon: '🎙️',
    category: 'interview',
    complexity: 'intermediate',
    steps: [
      { name: 'Interview Planning', description: 'Develop comprehensive interview questions' },
      { name: 'Guest Preparation', description: 'Prepare interviewees and set expectations' },
      { name: 'Technical Setup', description: 'Configure audio, lighting, and camera equipment' },
      { name: 'Interview Execution', description: 'Conduct engaging, professional interviews' },
      { name: 'Content Editing', description: 'Edit for clarity, pacing, and engagement' }
    ]
  },
  {
    id: 'event-coverage',
    name: 'Event Coverage',
    description: 'Document and promote events effectively',
    icon: '🎪',
    category: 'event',
    complexity: 'intermediate',
    steps: [
      { name: 'Event Planning Coordination', description: 'Align with event organizers and stakeholders' },
      { name: 'Coverage Strategy', description: 'Plan what aspects of the event to cover' },
      { name: 'Equipment Preparation', description: 'Set up cameras, lighting, and audio equipment' },
      { name: 'Live Coverage', description: 'Capture key moments and activities' },
      { name: 'Highlight Compilation', description: 'Create engaging recap and promotional content' }
    ]
  },
  {
    id: 'testimonial-production',
    name: 'Testimonial Production',
    description: 'Create authentic customer testimonial content',
    icon: '💬',
    category: 'testimonial',
    complexity: 'beginner',
    steps: [
      { name: 'Customer Selection', description: 'Choose satisfied customers with compelling stories' },
      { name: 'Story Development', description: 'Help customers articulate their experiences' },
      { name: 'Script Refinement', description: 'Polish testimonials for clarity and impact' },
      { name: 'Visual Enhancement', description: 'Add relevant visuals and graphics' },
      { name: 'Authenticity Preservation', description: 'Maintain genuine customer voice and emotion' }
    ]
  },
  {
    id: 'tutorial-creation',
    name: 'Tutorial & How-To Videos',
    description: 'Create clear, instructional video content',
    icon: '📖',
    category: 'tutorial',
    complexity: 'intermediate',
    steps: [
      { name: 'Skill Assessment', description: 'Evaluate learner skill level and knowledge gaps' },
      { name: 'Step-by-Step Breakdown', description: 'Divide complex processes into clear steps' },
      { name: 'Visual Demonstration', description: 'Show processes with clear visuals and annotations' },
      { name: 'Practice Exercises', description: 'Include hands-on practice opportunities' },
      { name: 'Progress Tracking', description: 'Provide clear indicators of learning progress' }
    ]
  }
];
      { name: 'Motivation Analysis', description: 'Define character goals and motivations' },
      { name: 'Conflict Design', description: 'Create internal and external conflicts' },
      { name: 'Arc Planning', description: 'Design character growth and change' },
      { name: 'Scene Integration', description: 'Integrate character arc into story scenes' }
    ]
  }
];

const startWorkflow = (workflowId) => {
  const workflow = AVAILABLE_WORKFLOWS.find(w => w.id === workflowId);
  if (!workflow) return;

  workflowState.activeWorkflow = workflow;
  workflowState.workflowSteps = workflow.steps.map((step, index) => ({
    ...step,
    id: `step-${index}`,
    status: index === 0 ? 'active' : 'pending',
    completed: false,
    outputs: [],
    startedAt: null,
    completedAt: null
  }));
  workflowState.currentStep = 0;
  workflowState.isWorkflowActive = true;
  workflowState.showWorkflowPanel = true;
  workflowState.workflowHistory = [];
  workflowState.workflowStats = {
    startedAt: Date.now(),
    totalSteps: workflow.steps.length,
    completedSteps: 0,
    estimatedTimeRemaining: workflow.steps.length * 5 // 5 minutes per step estimate
  };

  // Initialize workflow with enhanced context
  const workflowContext = {
    name: workflow.name,
    category: workflow.category,
    complexity: workflow.complexity,
    totalSteps: workflow.steps.length,
    estimatedDuration: `${workflow.steps.length * 5}-${workflow.steps.length * 8} minutes`,
    objectives: workflow.steps.map(step => step.name)
  };

  // Send comprehensive workflow initialization prompt
  const initialPrompt = `🎭 **CineGen Spaces Workflow: ${workflow.name}**

**Category:** ${workflow.category} | **Complexity:** ${workflow.complexity}
**Duration Estimate:** ${workflowContext.estimatedDuration}

**Workflow Overview:**
${workflow.description}

**Objectives:**
${workflow.steps.map((step, i) => `${i + 1}. ${step.name} - ${step.description}`).join('\n')}

---

Let's begin with **Step 1: ${workflow.steps[0].name}**
${workflow.steps[0].description}

Please guide me through this first step. What information or decisions do you need to proceed?`;

  chatInterfaceRef.value.sendMessage(initialPrompt);
};

const nextWorkflowStep = () => {
  if (workflowState.currentStep < workflowState.workflowSteps.length - 1) {
    // Mark current step as completed
    workflowState.workflowSteps[workflowState.currentStep].status = 'completed';
    workflowState.workflowSteps[workflowState.currentStep].completed = true;
    workflowState.workflowSteps[workflowState.currentStep].completedAt = Date.now();
    workflowState.workflowStats.completedSteps++;

    // Move to next step
    workflowState.currentStep++;
    workflowState.workflowSteps[workflowState.currentStep].status = 'active';
    workflowState.workflowSteps[workflowState.currentStep].startedAt = Date.now();

    const currentStepData = workflowState.workflowSteps[workflowState.currentStep];
    const progressPercent = Math.round((workflowState.currentStep / workflowState.workflowSteps.length) * 100);

    // Add to workflow history
    workflowState.workflowHistory.push({
      action: 'step_completed',
      step: workflowState.currentStep - 1,
      timestamp: Date.now()
    });

    const stepPrompt = `✅ **Step ${workflowState.currentStep} Completed!**

**Progress:** ${progressPercent}% (${workflowState.workflowStats.completedSteps}/${workflowState.workflowStats.totalSteps} steps)

---

🎯 **Now proceeding to Step ${workflowState.currentStep + 1}: ${currentStepData.name}**

${currentStepData.description}

**Context from previous steps:**
${workflowState.workflowSteps.slice(0, workflowState.currentStep).map((step, i) =>
  `• Step ${i + 1}: ${step.name} ✓`
).join('\n')}

Please guide me through this next phase. What specific aspects should we focus on?`;

    chatInterfaceRef.value.sendMessage(stepPrompt);
  } else {
    // Workflow complete - comprehensive completion summary
    workflowState.workflowSteps[workflowState.currentStep].status = 'completed';
    workflowState.workflowSteps[workflowState.currentStep].completed = true;
    workflowState.workflowSteps[workflowState.currentStep].completedAt = Date.now();
    workflowState.workflowStats.completedSteps++;
    workflowState.workflowStats.completedAt = Date.now();

    const completionTime = Math.round((workflowState.workflowStats.completedAt - workflowState.workflowStats.startedAt) / 1000 / 60); // minutes

    const completionPrompt = `🎉 **WORKFLOW COMPLETED SUCCESSFULLY!**

**${workflowState.activeWorkflow.name}** - 100% Complete

📊 **Completion Summary:**
• **Total Steps:** ${workflowState.workflowStats.totalSteps}
• **Time Taken:** ${completionTime} minutes
• **Completion Rate:** 100%
• **Category:** ${workflowState.activeWorkflow.category}
• **Complexity:** ${workflowState.activeWorkflow.complexity}

🏆 **Achievement Unlocked:** ${workflowState.activeWorkflow.name} Master

**What we accomplished:**
${workflowState.workflowSteps.map((step, i) =>
  `✅ **Step ${i + 1}: ${step.name}** - ${step.description}`
).join('\n')}

---

**Next Steps:**
1. **Review & Refine** - Would you like to review any completed steps?
2. **Export Results** - Save workflow outputs for future reference
3. **Start New Workflow** - Begin another creative project
4. **Template Creation** - Save this workflow as a reusable template

What would you like to do next? 🎬✨`;

    workflowState.isWorkflowActive = false;
    chatInterfaceRef.value.sendMessage(completionPrompt);
  }
};

const previousWorkflowStep = () => {
  if (workflowState.currentStep > 0) {
    // Mark current step as pending again
    workflowState.workflowSteps[workflowState.currentStep].status = 'pending';

    // Move to previous step
    workflowState.currentStep--;
    workflowState.workflowSteps[workflowState.currentStep].status = 'active';

    // Add to workflow history
    workflowState.workflowHistory.push({
      action: 'step_rollback',
      step: workflowState.currentStep,
      timestamp: Date.now()
    });

    const currentStepData = workflowState.workflowSteps[workflowState.currentStep];
    const progressPercent = Math.round((workflowState.workflowStats.completedSteps / workflowState.workflowStats.totalSteps) * 100);

    const rollbackPrompt = `↩️ **Rolled back to Step ${workflowState.currentStep + 1}: ${currentStepData.name}**

**Current Progress:** ${progressPercent}% (${workflowState.workflowStats.completedSteps}/${workflowState.workflowStats.totalSteps} steps completed)

${currentStepData.description}

**Previous work completed:**
${workflowState.workflowSteps.slice(0, workflowState.currentStep).filter(step => step.completed).map((step, i) =>
  `✅ Step ${i + 1}: ${step.name}`
).join('\n')}

Let's continue refining this step. What adjustments would you like to make?`;

    chatInterfaceRef.value.sendMessage(rollbackPrompt);
  }
};

const endWorkflow = () => {
  const confirmEnd = confirm(`Are you sure you want to end the "${workflowState.activeWorkflow?.name}" workflow? All progress will be lost.`);
  if (!confirmEnd) return;

  // Log workflow abandonment
  workflowState.workflowHistory.push({
    action: 'workflow_abandoned',
    step: workflowState.currentStep,
    timestamp: Date.now(),
    reason: 'user_cancelled'
  });

  const endMessage = `🛑 **Workflow Ended: ${workflowState.activeWorkflow?.name}**

**Progress Summary:**
• **Steps Completed:** ${workflowState.workflowStats.completedSteps}/${workflowState.workflowStats.totalSteps}
• **Current Step:** ${workflowState.currentStep + 1} (${workflowState.workflowSteps[workflowState.currentStep]?.name})
• **Time Elapsed:** ${Math.round((Date.now() - workflowState.workflowStats.startedAt) / 1000 / 60)} minutes

**Unfinished Steps:**
${workflowState.workflowSteps.filter(step => !step.completed).map((step, i) =>
  `• Step ${workflowState.workflowSteps.indexOf(step) + 1}: ${step.name}`
).join('\n')}

You can restart this workflow anytime or begin a new creative project. What would you like to do next? 🎭`;

  workflowState.activeWorkflow = null;
  workflowState.workflowSteps = [];
  workflowState.currentStep = 0;
  workflowState.isWorkflowActive = false;
  workflowState.showWorkflowPanel = false;
  workflowState.workflowHistory = [];
  workflowState.workflowStats = {};

  chatInterfaceRef.value.sendMessage(endMessage);
};

// Get filtered workflows based on selected template
const getFilteredWorkflows = () => {
  return WORKFLOW_TEMPLATES[selectedTemplate.value]?.workflows || AVAILABLE_WORKFLOWS;
};

// Advanced workflow features
const validateWorkflowStep = () => {
  const currentStep = workflowState.workflowSteps[workflowState.currentStep];
  if (!currentStep) return false;

  // Basic validation - can be enhanced with AI-powered validation
  const hasContent = currentStep.outputs && currentStep.outputs.length > 0;
  const timeSpent = currentStep.startedAt ? Date.now() - currentStep.startedAt : 0;
  const minimumTime = 30000; // 30 seconds minimum per step

  if (!hasContent && timeSpent < minimumTime) {
    showValidationWarning('Please spend more time on this step or add some content before proceeding.');
    return false;
  }

  return true;
};

const showValidationWarning = (message) => {
  // Create temporary warning overlay
  const warning = document.createElement('div');
  warning.className = 'fixed top-4 right-4 bg-yellow-500 text-black px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm';
  warning.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="text-lg">⚠️</div>
      <div>
        <div class="font-semibold">Step Validation</div>
        <div class="text-sm mt-1">${message}</div>
      </div>
      <button class="ml-auto text-black hover:text-gray-800" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;

  document.body.appendChild(warning);
  setTimeout(() => warning.remove(), 5000);
};

// Workflow templates and presets
const WORKFLOW_TEMPLATES = {
  quick: {
    name: 'Quick Start',
    workflows: AVAILABLE_WORKFLOWS.filter(w => w.complexity === 'beginner')
  },
  professional: {
    name: 'Professional',
    workflows: AVAILABLE_WORKFLOWS.filter(w => w.complexity === 'expert')
  },
  creative: {
    name: 'Creative',
    workflows: AVAILABLE_WORKFLOWS.filter(w => w.category === 'character' || w.category === 'story')
  },
  business: {
    name: 'Business',
    workflows: AVAILABLE_WORKFLOWS.filter(w => ['corporate', 'advertising', 'product'].includes(w.category))
  }
};

// Enhanced workflow analytics
const getWorkflowAnalytics = () => {
  if (!workflowState.workflowHistory) return {};

  const analytics = {
    totalActions: workflowState.workflowHistory.length,
    averageStepTime: 0,
    rollbackCount: workflowState.workflowHistory.filter(h => h.action === 'step_rollback').length,
    completionRate: workflowState.workflowStats.completedSteps / workflowState.workflowStats.totalSteps,
    estimatedTimeRemaining: workflowState.workflowStats.estimatedTimeRemaining
  };

  // Calculate average step completion time
  const completedSteps = workflowState.workflowSteps.filter(step => step.completed && step.startedAt && step.completedAt);
  if (completedSteps.length > 0) {
    const totalTime = completedSteps.reduce((sum, step) => sum + (step.completedAt - step.startedAt), 0);
    analytics.averageStepTime = Math.round(totalTime / completedSteps.length / 1000 / 60); // minutes
  }

  return analytics;
};

// Workflow export functionality
const exportWorkflowResults = () => {
  const exportData = {
    workflow: workflowState.activeWorkflow,
    steps: workflowState.workflowSteps,
    history: workflowState.workflowHistory,
    stats: workflowState.workflowStats,
    analytics: getWorkflowAnalytics(),
    exportedAt: Date.now()
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${workflowState.activeWorkflow.name.replace(/\s+/g, '_')}_workflow_export.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Workflow results exported successfully!', 'success');
};

const handleKeyDown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "k") {
    event.preventDefault();
    chatInterfaceRef.value.createNewSession();
    chatInterfaceRef.value.chatInputRef.focus();
  }
  // Add workflow shortcuts
  if (workflowState.isWorkflowActive) {
    if (event.key === 'ArrowRight' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      nextWorkflowStep();
    }
    if (event.key === 'ArrowLeft' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      previousWorkflowStep();
    }
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
  <main class="director-main">
    <!-- Enhanced CineGen Spaces Workflow Panel -->
    <div v-if="workflowState.showWorkflowPanel" class="workflow-panel">
      <div class="workflow-header">
        <div class="workflow-info">
          <h3 class="workflow-title">
            🎭 {{ workflowState.activeWorkflow?.name || 'CineGen Spaces Workflow' }}
          </h3>
          <div class="workflow-meta">
            <span class="meta-item">{{ workflowState.activeWorkflow?.category }}</span>
            <span class="meta-item">{{ workflowState.activeWorkflow?.complexity }}</span>
            <span class="progress-indicator">
              {{ Math.round((workflowState.workflowStats.completedSteps / workflowState.workflowStats.totalSteps) * 100) }}% Complete
            </span>
          </div>
        </div>
        <div class="workflow-controls">
          <button @click="exportWorkflowResults" class="workflow-btn workflow-export" title="Export Workflow Results">
            💾 Export
          </button>
          <button @click="previousWorkflowStep" :disabled="workflowState.currentStep === 0"
                  class="workflow-btn" title="Previous Step (Ctrl+Left)">
            ← Previous
          </button>
          <span class="workflow-progress">
            Step {{ workflowState.currentStep + 1 }} of {{ workflowState.workflowSteps.length }}
          </span>
          <button @click="nextWorkflowStep"
                  :disabled="workflowState.currentStep >= workflowState.workflowSteps.length - 1"
                  class="workflow-btn" title="Next Step (Ctrl+Right)">
            Next →
          </button>
          <button @click="endWorkflow" class="workflow-btn workflow-end" title="End Workflow">
            ✕ End
          </button>
        </div>
      </div>

      <!-- Workflow Analytics Bar -->
      <div class="workflow-analytics">
        <div class="analytics-item">
          <span class="analytics-label">Time Elapsed:</span>
          <span class="analytics-value">{{ Math.round((Date.now() - workflowState.workflowStats.startedAt) / 1000 / 60) }}m</span>
        </div>
        <div class="analytics-item">
          <span class="analytics-label">Steps Done:</span>
          <span class="analytics-value">{{ workflowState.workflowStats.completedSteps }}/{{ workflowState.workflowStats.totalSteps }}</span>
        </div>
        <div class="analytics-item">
          <span class="analytics-label">Rollbacks:</span>
          <span class="analytics-value">{{ workflowState.workflowHistory.filter(h => h.action === 'step_rollback').length }}</span>
        </div>
        <div class="analytics-item">
          <span class="analytics-label">Avg Step Time:</span>
          <span class="analytics-value">{{ getWorkflowAnalytics().averageStepTime || 0 }}m</span>
        </div>
      </div>

      <div class="workflow-steps">
        <div v-for="(step, index) in workflowState.workflowSteps"
             :key="index"
             class="workflow-step"
             :class="{ active: index === workflowState.currentStep, completed: index < workflowState.currentStep }">
          <div class="step-indicator">
            <span v-if="index < workflowState.currentStep">✓</span>
            <span v-else-if="index === workflowState.currentStep">●</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="step-content">
            <h4 class="step-name">{{ step.name }}</h4>
            <p class="step-description">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Workflow Selector (when no workflow is active) -->
    <div v-if="!workflowState.isWorkflowActive" class="workflow-selector">
      <div class="workflow-selector-header">
        <h3>🎭 CineGen Spaces Workflows</h3>
        <p>Choose a structured workflow to guide your creative process</p>

        <!-- Workflow Templates -->
        <div class="workflow-templates">
          <div v-for="(template, key) in WORKFLOW_TEMPLATES"
               :key="key"
               class="template-tab"
               :class="{ active: selectedTemplate === key }"
               @click="selectedTemplate = key">
            {{ template.name }}
          </div>
        </div>
      </div>

      <div class="workflow-grid">
        <div v-for="workflow in getFilteredWorkflows()"
             :key="workflow.id"
             class="workflow-card"
             @click="startWorkflow(workflow.id)">
          <div class="workflow-header">
            <div class="workflow-icon">{{ workflow.icon }}</div>
            <div class="workflow-badges">
              <span class="badge complexity" :class="workflow.complexity">{{ workflow.complexity }}</span>
              <span class="badge category">{{ workflow.category }}</span>
            </div>
          </div>
          <h4 class="workflow-name">{{ workflow.name }}</h4>
          <p class="workflow-description">{{ workflow.description }}</p>
          <div class="workflow-meta">
            <span class="step-count">{{ workflow.steps.length }} steps</span>
            <span class="estimated-time">~{{ workflow.steps.length * 5 }}-{{ workflow.steps.length * 8 }}min</span>
          </div>
        </div>
      </div>
    </div>

    <chat-interface
      ref="chatInterfaceRef"
      :chat-hook-config="{
        socketUrl: `${BACKEND_URL}/chat`,
        httpUrl: `${BACKEND_URL}`,
        debug: true,
      }"
    />
  </main>
</template>

<style>
:root {
  --popper-theme-background-color: #333333;
  --popper-theme-background-color-hover: #333333;
  --popper-theme-text-color: #ffffff;
  --popper-theme-border-width: 0px;
  --popper-theme-border-style: solid;
  --popper-theme-border-radius: 8px;
  --popper-theme-padding: 4px 8px;
  --popper-theme-box-shadow: 0px 6px 6px rgba(0, 0, 0, 0.08);
}

.director-main {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* CineGen Spaces Workflow Styles */
.workflow-panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.workflow-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.workflow-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.workflow-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.workflow-btn {
  padding: 6px 12px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.1);
  color: #ffffff;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.workflow-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.3);
}

.workflow-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.workflow-progress {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  font-weight: 500;
}

.workflow-end {
  background: rgba(239,68,68,0.1);
  border-color: rgba(239,68,68,0.3);
  color: #ef4444;
}

.workflow-end:hover {
  background: rgba(239,68,68,0.2);
  border-color: rgba(239,68,68,0.4);
}

.workflow-steps {
  padding: 16px 20px;
  display: flex;
  gap: 16px;
  overflow-x: auto;
}

.workflow-step {
  flex: 0 0 200px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  transition: all 0.2s ease;
}

.workflow-step.active {
  background: rgba(59,130,246,0.1);
  border-color: rgba(59,130,246,0.3);
  box-shadow: 0 0 10px rgba(59,130,246,0.2);
}

.workflow-step.completed {
  background: rgba(34,197,94,0.1);
  border-color: rgba(34,197,94,0.3);
}

.step-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: rgba(255,255,255,0.8);
  flex-shrink: 0;
}

.workflow-step.active .step-indicator {
  background: #3b82f6;
  color: white;
}

.workflow-step.completed .step-indicator {
  background: #22c55e;
  color: white;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 4px 0;
}

.step-description {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  margin: 0;
  line-height: 1.4;
}

/* Workflow Selector */
.workflow-selector {
  position: absolute;
  top: 60px;
  right: 20px;
  width: 320px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  z-index: 50;
  overflow: hidden;
}

.workflow-selector-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.workflow-selector-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 4px 0;
}

.workflow-selector-header p {
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  margin: 0;
}

.workflow-grid {
  padding: 12px;
  display: grid;
  gap: 8px;
}

/* Enhanced Workflow Styles */
.workflow-info {
  flex: 1;
}

.workflow-meta {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.meta-item {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  background: rgba(255,255,255,0.1);
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.progress-indicator {
  font-weight: 600;
  color: #10b981;
}

.workflow-analytics {
  display: flex;
  gap: 16px;
  padding: 12px 20px;
  background: rgba(255,255,255,0.05);
  border-top: 1px solid rgba(255,255,255,0.1);
}

.analytics-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.analytics-label {
  font-size: 10px;
  color: rgba(255,255,255,0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.analytics-value {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.workflow-export {
  background: rgba(59,130,246,0.1);
  border-color: rgba(59,130,246,0.3);
  color: #3b82f6;
}

.workflow-export:hover {
  background: rgba(59,130,246,0.2);
  border-color: rgba(59,130,246,0.4);
}

/* Enhanced Workflow Selector */
.workflow-templates {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.template-tab {
  padding: 6px 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  font-weight: 500;
}

.template-tab:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.2);
}

.template-tab.active {
  background: rgba(59,130,246,0.1);
  border-color: rgba(59,130,246,0.3);
  color: #3b82f6;
}

.workflow-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.workflow-card:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.2);
  transform: translateY(-1px);
}

.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.workflow-icon {
  font-size: 20px;
}

.workflow-badges {
  display: flex;
  gap: 4px;
}

.badge {
  font-size: 9px;
  padding: 2px 4px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.badge.complexity.beginner { background: #10b981; color: white; }
.badge.complexity.intermediate { background: #f59e0b; color: black; }
.badge.complexity.advanced { background: #ef4444; color: white; }
.badge.complexity.expert { background: #8b5cf6; color: white; }

.badge.category { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }

.workflow-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 4px 0;
}

.workflow-description {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.workflow-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-count {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.estimated-time {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  background: rgba(59,130,246,0.1);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(59,130,246,0.2);
}

.template {
  height: 100vh;
  width: 100vw;
}

main {
  overflow: scroll;
  height: 100%;
}
html {
  overflow: hidden;
}

/* For WebKit-based browsers (Chrome, Safari) */
::-webkit-scrollbar {
  width: 12px; /* Width of the scrollbar */
}

::-webkit-scrollbar-track {
  background: #f1f1f1; /* Background of the scrollbar track */
}

::-webkit-scrollbar-thumb {
  background-color: #888; /* Scrollbar thumb color */
  border-radius: 6px; /* Rounded corners */
  border: 3px solid #f1f1f1; /* Space around the thumb */
}

::-webkit-scrollbar-thumb:hover {
  background-color: #555; /* Thumb color on hover */
}

/* For Mozilla Firefox */
* {
  scrollbar-width: thin; /* Makes the scrollbar narrower */
  scrollbar-color: #888 #f1f1f1; /* Thumb and track colors */
}
</style>
