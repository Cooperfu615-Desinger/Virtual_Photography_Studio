import contract from '../../../functions/shared/imageProviderContract.json' with { type: 'json' };

export const IMAGE_PROVIDER_CONTRACT = contract;

export function getProviderContract(providerKey) {
  const provider = contract.providers[providerKey];
  if (!provider) throw new Error(`Unsupported provider: ${providerKey}`);
  return provider;
}

export function normalizeProviderGenerationRequest(providerKey, payload = {}) {
  const provider = getProviderContract(providerKey);
  const modelKey = String(payload.modelKey || provider.defaultModelKey);
  const model = provider.models[modelKey];
  if (!model) throw new Error(`Unsupported ${providerKey} model: ${modelKey}`);

  const prompt = String(payload.prompt || '').trim();
  const promptRules = contract.request.prompt;
  if (prompt.length < promptRules.minLength) throw new Error('請先提供至少 3 個字元的 Prompt');
  if (prompt.length > promptRules.maxLength) throw new Error(`Prompt 不可超過 ${promptRules.maxLength} 個字元`);

  const numericCount = Number(payload.count);
  const count = Number.isFinite(numericCount)
    ? Math.max(contract.request.count.min, Math.min(contract.request.count.max, Math.trunc(numericCount)))
    : contract.request.count.default;
  const aspectRatio = contract.request.aspectRatios.includes(payload.aspectRatio)
    ? payload.aspectRatio
    : contract.request.defaultAspectRatio;
  const requestedResolution = String(payload.resolution || model.defaultResolution).toLowerCase();
  const resolution = model.resolutions.includes(requestedResolution)
    ? requestedResolution
    : model.defaultResolution;

  return { ...payload, modelKey, prompt, count, aspectRatio, resolution };
}

export function normalizeProviderGenerationResponse(payload = {}) {
  const images = Array.isArray(payload.images)
    ? payload.images.filter((image) => image?.src && image?.mimeType).map((image) => ({ ...image }))
    : [];
  const errors = Array.isArray(payload.errors) ? payload.errors.map(String) : [];
  return { images, errors, meta: payload.meta ?? null };
}
