export function validateApiKey(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return { error: 'Please enter your API key' };
  }

  try {
    new Headers({ 'x-api-key': trimmed });
  } catch {
    return { error: 'API key contains characters that cannot be sent in an HTTP header' };
  }

  return { value: trimmed };
}
