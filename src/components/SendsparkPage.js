export function SendsparkPage() {
  // For now, we'll create a simple wrapper. In the future, this could connect to
  // a proper state management system for workflows
  const element = document.createElement('div');
  element.className = 'w-full h-full p-6 bg-gray-900 overflow-y-auto';

  element.innerHTML = `
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">Sendspark Workflow Studio</h1>
        <p class="text-gray-400">Automated video creation and publishing workflows</p>
      </div>

      <div class="bg-gray-800 rounded-lg p-8 text-center">
        <div class="text-yellow-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-4">Sendspark Integration Coming Soon</h3>
        <p class="text-gray-400 mb-6 max-w-md mx-auto">
          The Sendspark workflow automation features are currently being integrated.
          This will provide automated video creation, editing, and publishing workflows.
        </p>
        <div class="space-y-3">
          <div class="bg-gray-700 rounded-lg p-4 text-left">
            <h4 class="font-medium text-white mb-2">Planned Features:</h4>
            <ul class="text-sm text-gray-400 space-y-1">
              <li>• Video Creation Pipelines</li>
              <li>• Batch Processing Workflows</li>
              <li>• Personalization Hub</li>
              <li>• Social Media Automation</li>
              <li>• Analytics Integration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

  return element;
}