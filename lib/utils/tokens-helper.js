// Tokens helper utility
export const wrapTokens = (text) => {
  // Simple token wrapping - can be enhanced later
  return text.replace(/\{\{(\w+)\}\}/g, '<span class="token">$1</span>');
};