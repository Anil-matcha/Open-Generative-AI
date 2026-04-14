/**
 * Chat System Module
 * Handles AI chat interactions, command processing, and conversation flow
 */

export function renderChat(chatHistory, container) {
  if (!container) return;

  container.innerHTML = '';
  chatHistory.forEach(entry => {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + entry.role;
    bubble.textContent = entry.text;
    container.appendChild(bubble);
  });
}

export function renderQuickCommands(commands, container, onCommandSelect) {
  if (!container) return;

  container.innerHTML = '';
  commands.forEach(command => {
    const btn = document.createElement('button');
    btn.className = 'command-btn';
    btn.textContent = command;
    btn.addEventListener('click', () => onCommandSelect(command));
    container.appendChild(btn);
  });
}

export function handleChatSubmit(chatHistory, inputElement, showToast, onChatUpdate) {
  const text = inputElement.value.trim();
  if (!text) return;

  // Add user message
  chatHistory.push({ role: 'user', text });
  inputElement.value = '';

  // Generate AI response based on command
  let reply = 'Command processed.';
  if (/generate/i.test(text)) reply = 'Generate command staged. Use the Generate panel to create the clip.';
  if (/retake/i.test(text)) reply = 'Retake command staged for the selected clip.';
  if (/extend/i.test(text)) reply = 'Extend command queued for the selected clip.';
  if (/b-roll|broll/i.test(text)) reply = 'B-Roll suggestion added to the sequence.';
  if (/add caption/i.test(text)) reply = 'Caption added to timeline.';

  // Add AI response
  chatHistory.push({ role: 'ai', text: reply });

  // Update UI
  onChatUpdate();
  showToast('AI command processed');
}

export function processAICommand(command, state, showToast) {
  const cmd = command.toLowerCase().trim();

  if (cmd.includes('generate')) {
    return { action: 'generate', type: extractTypeFromCommand(cmd) };
  }

  if (cmd.includes('retake')) {
    return { action: 'retake', clipId: state.selectedClipId };
  }

  if (cmd.includes('extend')) {
    return { action: 'extend', clipId: state.selectedClipId };
  }

  if (cmd.includes('b-roll') || cmd.includes('broll')) {
    return { action: 'add_broll' };
  }

  if (cmd.includes('caption')) {
    return { action: 'add_caption' };
  }

  if (cmd.includes('split')) {
    return { action: 'split', clipId: state.selectedClipId };
  }

  return { action: 'unknown' };
}

function extractTypeFromCommand(command) {
  if (command.includes('video')) return 'video';
  if (command.includes('image')) return 'image';
  if (command.includes('audio') || command.includes('speech')) return 'audio';
  if (command.includes('text')) return 'text';
  return 'video'; // default
}

export function generateAIResponse(userInput, context) {
  // Simple response generation based on context
  const input = userInput.toLowerCase();

  if (input.includes('help')) {
    return 'I can help you generate videos, images, edit content, and manage your timeline. Try commands like "generate a cinematic shot" or "add b-roll footage".';
  }

  if (input.includes('generate') || input.includes('create')) {
    if (input.includes('video')) {
      return 'Video generation ready. Configure your prompt in the Generate panel and select "Video" mode.';
    }
    if (input.includes('image')) {
      return 'Image generation ready. Use the AI Tools sidebar to create images from text prompts.';
    }
    return 'Generation command acknowledged. Use the appropriate tool from the sidebar.';
  }

  if (input.includes('edit') || input.includes('modify')) {
    return 'Editing tools are available in the AI Tools sidebar. Select an image and choose your editing option.';
  }

  if (input.includes('timeline') || input.includes('clip')) {
    return 'Timeline management: Use the toolbar to add tracks, drag clips, and adjust timing. AI tools can generate new content to add.';
  }

  return 'I understand. How can I help you with your video project?';
}