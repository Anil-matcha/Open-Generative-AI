import { muapi } from '../lib/muapi.js';
import { textModels } from '../lib/models.js';
import { AuthModal } from './AuthModal.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { createInlineInstructions } from './InlineInstructions.js';

export function ChatStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center bg-app-bg overflow-y-auto p-6 md:p-10 relative';

  let selectedModel = textModels[0];
  const messages = []; // Chat history
  let isGenerating = false;

  // Header with hero banner
  const header = document.createElement('div');
  header.className = 'mb-8 animate-fade-in-up text-center w-full max-w-xl';
  const chatBanner = createHeroSection('chat', 'h-32 md:h-44 mb-4');
  if (chatBanner) {
    const bannerText = document.createElement('div');
    bannerText.className = 'absolute bottom-0 left-0 right-0 p-5 z-10';
    bannerText.innerHTML = '<h1 class="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">Chat Studio</h1><p class="text-white/60 text-sm">AI-powered text generation and conversation</p>';
    chatBanner.appendChild(bannerText);
    header.appendChild(chatBanner);
  }
  container.appendChild(header);

  // Instructions
  const inlineInstructions = createInlineInstructions('chat');
  inlineInstructions.classList.add('max-w-2xl', 'mt-6', 'mb-8');
  container.appendChild(inlineInstructions);

  // Model selector
  const modelRow = document.createElement('div');
  modelRow.className = 'flex gap-3 mb-6 flex-wrap justify-center animate-fade-in-up';
  modelRow.style.animationDelay = '0.1s';

  const modelBtns = {};
  textModels.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'px-5 py-3 rounded-xl text-sm font-bold transition-all border bg-white/5 text-secondary border-white/10 hover:bg-white/10';
    btn.textContent = m.name;
    btn.onclick = () => {
      selectedModel = m;
      updateModelBtns();
    };
    modelBtns[m.id] = btn;
    modelRow.appendChild(btn);
  });
  container.appendChild(modelRow);

  // Chat container
  const chatContainer = document.createElement('div');
  chatContainer.className = 'w-full max-w-2xl flex-1 overflow-y-auto mb-6 space-y-4 animate-fade-in-up';
  chatContainer.style.animationDelay = '0.2s';
  container.appendChild(chatContainer);

  // Empty state
  const emptyState = document.createElement('div');
  emptyState.className = 'text-center py-12 text-white/40';
  emptyState.innerHTML = '<svg class="w-16 h-16 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg><p>Start a conversation</p>';
  chatContainer.appendChild(emptyState);

  // Input area
  const inputArea = document.createElement('div');
  inputArea.className = 'w-full max-w-2xl bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in-up';
  inputArea.style.animationDelay = '0.3s';

  // System prompt (optional)
  const systemRow = document.createElement('div');
  systemRow.className = 'flex gap-2 items-center';
  const systemLabel = document.createElement('label');
  systemLabel.className = 'text-xs text-white/50 whitespace-nowrap';
  systemLabel.textContent = 'System:';
  systemRow.appendChild(systemLabel);
  const systemInput = document.createElement('input');
  systemInput.type = 'text';
  systemInput.className = 'flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none';
  systemInput.placeholder = 'Optional system prompt...';
  systemRow.appendChild(systemInput);
  inputArea.appendChild(systemRow);

  // Main input row
  const inputRow = document.createElement('div');
  inputRow.className = 'flex gap-3';

  const textarea = document.createElement('textarea');
  textarea.className = 'flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-primary focus:outline-none resize-none min-h-[60px]';
  textarea.placeholder = 'Type your message...';
  textarea.rows = 2;
  inputRow.appendChild(textarea);

  const sendBtn = document.createElement('button');
  sendBtn.className = 'px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors self-end';
  sendBtn.innerHTML = '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
  inputRow.appendChild(sendBtn);
  inputArea.appendChild(inputRow);

  // Advanced options toggle
  const optionsToggle = document.createElement('button');
  optionsToggle.className = 'text-xs text-white/50 hover:text-white/80 transition-colors text-left';
  optionsToggle.textContent = '▼ Advanced Options';
  inputArea.appendChild(optionsToggle);

  // Advanced options (hidden by default)
  const advancedOptions = document.createElement('div');
  advancedOptions.className = 'hidden flex gap-4 mt-3 pt-3 border-t border-white/10';
  
  const tempGroup = document.createElement('div');
  tempGroup.className = 'flex flex-col gap-1';
  const tempLabel = document.createElement('label');
  tempLabel.className = 'text-xs text-white/50';
  tempLabel.textContent = 'Temperature';
  tempGroup.appendChild(tempLabel);
  const tempInput = document.createElement('input');
  tempInput.type = 'number';
  tempInput.min = '0';
  tempInput.max = '2';
  tempInput.step = '0.1';
  tempInput.value = '0.7';
  tempInput.className = 'w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white';
  tempGroup.appendChild(tempInput);
  advancedOptions.appendChild(tempGroup);

  const tokensGroup = document.createElement('div');
  tokensGroup.className = 'flex flex-col gap-1';
  const tokensLabel = document.createElement('label');
  tokensLabel.className = 'text-xs text-white/50';
  tokensLabel.textContent = 'Max Tokens';
  tokensGroup.appendChild(tokensLabel);
  const tokensInput = document.createElement('input');
  tokensInput.type = 'number';
  tokensInput.min = '1';
  tokensInput.max = '4096';
  tokensInput.value = '1024';
  tokensInput.className = 'w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white';
  tokensGroup.appendChild(tokensInput);
  advancedOptions.appendChild(tokensGroup);

  inputArea.appendChild(advancedOptions);

  // Toggle advanced options
  optionsToggle.onclick = () => {
    advancedOptions.classList.toggle('hidden');
    optionsToggle.textContent = advancedOptions.classList.contains('hidden') ? '▼ Advanced Options' : '▲ Advanced Options';
  };

  container.appendChild(inputArea);

  // Helper: Update model buttons
  function updateModelBtns() {
    textModels.forEach(m => {
      const btn = modelBtns[m.id];
      if (m.id === selectedModel.id) {
        btn.classList.add('bg-primary', 'text-black', 'border-primary');
        btn.classList.remove('bg-white/5', 'text-secondary', 'border-white/10');
      } else {
        btn.classList.remove('bg-primary', 'text-black', 'border-primary');
        btn.classList.add('bg-white/5', 'text-secondary', 'border-white/10');
      }
    });
  }

  // Helper: Add message to chat
  function addMessage(content, isUser) {
    // Remove empty state if present
    if (emptyState && emptyState.parentNode) {
      emptyState.remove();
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = `flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`;
    
    const avatar = document.createElement('div');
    avatar.className = `w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isUser ? 'bg-primary text-black' : 'bg-white/10 text-white'}`;
    avatar.textContent = isUser ? 'You' : 'AI';
    msgDiv.appendChild(avatar);

    const bubble = document.createElement('div');
    bubble.className = `max-w-[80%] p-4 rounded-2xl ${isUser ? 'bg-primary/20 text-white' : 'bg-white/10 text-white'}`;
    bubble.style.whiteSpace = 'pre-wrap';
    bubble.textContent = content;
    msgDiv.appendChild(bubble);

    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Helper: Add loading indicator
  function showLoading() {
    isGenerating = true;
    sendBtn.disabled = true;
    sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
    
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-msg';
    loadingDiv.className = 'flex gap-3';
    
    const avatar = document.createElement('div');
    avatar.className = 'w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white';
    avatar.textContent = 'AI';
    loadingDiv.appendChild(avatar);
    
    const bubble = document.createElement('div');
    bubble.className = 'bg-white/10 text-white/60 p-4 rounded-2xl';
    bubble.innerHTML = '<span class="inline-block w-2 h-2 bg-white/60 rounded-full animate-bounce" style="animation-delay: 0ms"></span><span class="inline-block w-2 h-2 bg-white/60 rounded-full animate-bounce mx-1" style="animation-delay: 150ms"></span><span class="inline-block w-2 h-2 bg-white/60 rounded-full animate-bounce" style="animation-delay: 300ms"></span>';
    loadingDiv.appendChild(bubble);
    
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function hideLoading() {
    isGenerating = false;
    sendBtn.disabled = false;
    sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    
    const loading = document.getElementById('loading-msg');
    if (loading) loading.remove();
  }

  // Handle send message
  async function handleSend() {
    const userMessage = textarea.value.trim();
    if (!userMessage || isGenerating) return;

    textarea.value = '';
    addMessage(userMessage, true);

    showLoading();

    try {
      const response = await muapi.generateText({
        model: selectedModel.id,
        prompt: userMessage,
        system_prompt: systemInput.value.trim() || undefined,
        temperature: parseFloat(tempInput.value),
        max_tokens: parseInt(tokensInput.value)
      });

      hideLoading();
      addMessage(response.text, false);
    } catch (error) {
      hideLoading();
      
      if (error.message.includes('API Key missing')) {
        AuthModal.show();
      } else {
        addMessage(`Error: ${error.message}`, false);
      }
    }
  }

  sendBtn.onclick = handleSend;
  
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Initialize
  updateModelBtns();

  return container;
}
