import gemini from './gemini';
import ollama from './ollama';
import comfyui from './comfyui';

const providers = [gemini, ollama, comfyui];

export function getProvider(id) {
  const provider = providers.find((item) => item.id === id);
  if (!provider) throw new Error(`Unknown AI provider: ${id}`);
  return provider;
}

export function listProviders() {
  return providers.map(({ id, label }) => ({ id, label }));
}

export function selectProvider(request) {
  if (request.provider) {
    const provider = getProvider(request.provider);
    if (!provider.supports(request)) {
      throw new Error(`${provider.label} does not support the ${request.task} task`);
    }
    return provider;
  }

  const provider = providers.find((item) => item.supports(request));
  if (!provider) {
    throw new Error(`No configured provider supports the ${request.task} task`);
  }
  return provider;
}

export async function generate(request) {
  const provider = selectProvider(request);
  return provider.generate(request);
}

export async function providerHealth() {
  return Promise.all(
    providers.map(async (provider) => ({
      id: provider.id,
      label: provider.label,
      ...(await provider.health()),
    })),
  );
}
