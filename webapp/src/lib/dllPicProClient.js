export const DLL_PIC_STORAGE_KEYS = {
  apiKey: 'dll_pic_pro_api_key',
  googleApiKey: 'dll_pic_pro_google_api_key',
  xaiApiKey: 'dll_pic_pro_xai_api_key',
  model: 'dll_pic_pro_model',
  resolution: 'dll_pic_pro_resolution',
};

export const DLL_PIC_MODEL_CONFIG = {
  google: {
    label: 'Google Gemini',
    provider: 'google',
    generationModel: 'gemini-2.5-flash-image',
    analysisModel: 'gemini-2.5-flash',
    apiKeyStorageKey: DLL_PIC_STORAGE_KEYS.googleApiKey,
    legacyApiKeyStorageKey: DLL_PIC_STORAGE_KEYS.apiKey,
    apiKeyPlaceholder: '貼上 Google Gemini API Key',
  },
  google31image: {
    label: 'Google Gemini (實驗)',
    provider: 'google',
    generationModel: 'gemini-3.1-flash-image-preview',
    analysisModel: 'gemini-2.5-flash',
    apiKeyStorageKey: DLL_PIC_STORAGE_KEYS.googleApiKey,
    legacyApiKeyStorageKey: DLL_PIC_STORAGE_KEYS.apiKey,
    apiKeyPlaceholder: '貼上 Google Gemini API Key',
  },
  xaiGrokImagine: {
    label: 'xAI Grok',
    provider: 'xai',
    generationModel: 'grok-imagine-image',
    analysisModel: '',
    apiKeyStorageKey: DLL_PIC_STORAGE_KEYS.xaiApiKey,
    apiKeyPlaceholder: '貼上 xAI API Key',
    supportsResolution: true,
    defaultResolution: '1k',
  },
  xaiGrokImagineQuality: {
    label: 'xAI Grok Quality',
    provider: 'xai',
    generationModel: 'grok-imagine-image-quality',
    analysisModel: '',
    apiKeyStorageKey: DLL_PIC_STORAGE_KEYS.xaiApiKey,
    apiKeyPlaceholder: '貼上 xAI API Key',
    supportsResolution: true,
    defaultResolution: '1k',
  },
  magnificClassic: {
    label: 'Magnific Classic',
    provider: 'magnific',
    generationModel: 'text-to-image',
    magnificModel: 'classic',
    analysisModel: '',
    usesServerProxy: true,
    apiKeyPlaceholder: 'Firebase Proxy 會使用伺服端 Magnific Secret',
  },
  magnificZImageTurbo: {
    label: 'Magnific Z-Image Turbo',
    provider: 'magnific',
    generationModel: 'z-image-turbo',
    magnificModel: 'zImageTurbo',
    analysisModel: '',
    usesServerProxy: true,
    apiKeyPlaceholder: 'Firebase Proxy 會使用伺服端 Magnific Secret',
  },
  magnificMystic: {
    label: 'Magnific Mystic',
    provider: 'magnific',
    generationModel: 'mystic',
    magnificModel: 'mystic',
    analysisModel: '',
    usesServerProxy: true,
    supportsResolution: true,
    defaultResolution: '1k',
    apiKeyPlaceholder: 'Firebase Proxy 會使用伺服端 Magnific Secret',
  },
  magnificNanoBananaProFlash: {
    label: 'Magnific Nano Banana Pro Flash',
    provider: 'magnific',
    generationModel: 'nano-banana-pro-flash',
    magnificModel: 'nanoBananaProFlash',
    analysisModel: '',
    usesServerProxy: true,
    supportsResolution: true,
    defaultResolution: '1k',
    apiKeyPlaceholder: 'Firebase Proxy 會使用伺服端 Magnific Secret',
  },
  magnificGemini25FlashImagePreview: {
    label: 'Magnific Gemini 2.5 Flash Image Preview',
    provider: 'magnific',
    generationModel: 'gemini-2.5-flash-image-preview',
    magnificModel: 'gemini25FlashImagePreview',
    analysisModel: '',
    usesServerProxy: true,
    apiKeyPlaceholder: 'Firebase Proxy 會使用伺服端 Magnific Secret',
  },
  magnificSeedreamV5Lite: {
    label: 'Magnific Seedream V5 Lite',
    provider: 'magnific',
    generationModel: 'seedream-v5-lite',
    magnificModel: 'seedreamV5Lite',
    analysisModel: '',
    usesServerProxy: true,
    apiKeyPlaceholder: 'Firebase Proxy 會使用伺服端 Magnific Secret',
  },
  grok: {
    label: 'xAI Grok Quality',
    provider: 'xai',
    generationModel: 'grok-imagine-image-quality',
    analysisModel: '',
    apiKeyStorageKey: DLL_PIC_STORAGE_KEYS.xaiApiKey,
    apiKeyPlaceholder: '貼上 xAI API Key',
    supportsResolution: true,
    defaultResolution: '1k',
    hidden: true,
  },
};

export const DLL_PIC_RESOLUTIONS = [
  { value: '1k', label: '1K' },
  { value: '2k', label: '2K' },
];

export const DLL_PIC_ASPECT_RATIOS = [
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
];

function buildGoogleApiUrl(modelName, apiKey) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
}

function buildXaiImageGenerationBody({ modelName, prompt, aspectRatio, count, resolution }) {
  return JSON.stringify({
    model: modelName,
    prompt: prompt.trim(),
    n: count,
    aspect_ratio: aspectRatio,
    resolution,
    response_format: 'b64_json',
  });
}

async function fetchWithTimeout(url, options, timeoutMs = 90000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function parseDllPicApiError(response) {
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    // Fall through to status text.
  }

  const apiMessage = payload?.error?.message;
  const promptBlockReason = payload?.promptFeedback?.blockReason;
  const finishReason = payload?.candidates?.[0]?.finishReason;

  if (apiMessage) return `API 錯誤 (${response.status}): ${apiMessage}`;
  if (promptBlockReason) return `請求被模型阻擋：${promptBlockReason}`;
  if (finishReason === 'SAFETY') return '請求被安全機制阻擋，請改寫 Prompt 後重試';
  return `API 請求失敗 (${response.status}${response.statusText ? ` ${response.statusText}` : ''})`;
}

export function getDllPicModelConfig(modelKey) {
  if (modelKey === 'grok') return DLL_PIC_MODEL_CONFIG.xaiGrokImagineQuality;
  return DLL_PIC_MODEL_CONFIG[modelKey] || DLL_PIC_MODEL_CONFIG.google;
}

export function normalizeDllPicModelKey(modelKey, fallback = 'google') {
  if (modelKey === 'grok') return 'xaiGrokImagineQuality';
  const modelConfig = DLL_PIC_MODEL_CONFIG[modelKey];
  return modelConfig && !modelConfig.hidden ? modelKey : fallback;
}

export function getDllPicSelectableModelEntries({ includeAnalysisOnly = false } = {}) {
  return Object.entries(DLL_PIC_MODEL_CONFIG).filter(([, model]) => (
    !model.hidden && (!includeAnalysisOnly || model.analysisModel)
  ));
}

export function getDllPicApiKeyStorageKeys(modelKey) {
  const modelConfig = getDllPicModelConfig(modelKey);
  return [
    modelConfig.apiKeyStorageKey,
    modelConfig.legacyApiKeyStorageKey,
  ].filter(Boolean);
}

export function getDllPicApiKeyForModel(modelKey, providerApiKeys = {}) {
  const modelConfig = getDllPicModelConfig(modelKey);
  return (providerApiKeys[modelConfig.provider] || '').trim();
}

export function getDllPicResolutionOption(resolution) {
  return DLL_PIC_RESOLUTIONS.find((option) => option.value === resolution) || DLL_PIC_RESOLUTIONS[0];
}

async function generateGeminiImages({
  apiKey,
  modelConfig,
  prompt,
  aspectRatio,
  count,
}) {
  const body = JSON.stringify({
    contents: [{
      parts: [{ text: prompt.trim() }],
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio,
      },
    },
  });

  const responses = await Promise.all(Array.from({ length: count }, () => (
    fetchWithTimeout(buildGoogleApiUrl(modelConfig.generationModel, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
  )));

  const images = [];
  const errors = [];

  for (const response of responses) {
    if (!response.ok) {
      errors.push(await parseDllPicApiError(response));
      continue;
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((part) => part.inlineData?.mimeType?.startsWith('image/'));
    const textPart = parts.find((part) => part.text);

    if (imagePart) {
      images.push({
        src: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
        mimeType: imagePart.inlineData.mimeType,
      });
    } else if (textPart?.text) {
      errors.push(`模型回應: ${textPart.text}`);
    } else if (data.promptFeedback?.blockReason) {
      errors.push(`請求被模型阻擋：${data.promptFeedback.blockReason}`);
    }
  }

  return { images, errors };
}

async function generateXaiImages({
  apiKey,
  modelConfig,
  prompt,
  aspectRatio = '9:16',
  count = 1,
  resolution = '1k',
}) {
  const response = await fetchWithTimeout('https://api.x.ai/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: buildXaiImageGenerationBody({
      modelName: modelConfig.generationModel,
      prompt,
      aspectRatio,
      count,
      resolution: getDllPicResolutionOption(resolution).value,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseDllPicApiError(response));
  }

  const data = await response.json();
  const images = (data.data || []).flatMap((image) => {
    if (image.b64_json) {
      return [{
        src: `data:${image.mime_type || 'image/jpeg'};base64,${image.b64_json}`,
        mimeType: image.mime_type || 'image/jpeg',
      }];
    }

    if (image.url) {
      return [{
        src: image.url,
        mimeType: image.mime_type || 'image/jpeg',
      }];
    }

    return [];
  });

  return { images, errors: [] };
}

async function generateMagnificImages({
  magnificGenerate,
  modelConfig,
  prompt,
  aspectRatio = '9:16',
  count = 1,
  resolution = '1k',
}) {
  if (!magnificGenerate) throw new Error('Magnific Firebase Proxy 尚未接入');

  const result = await magnificGenerate({
    modelKey: modelConfig.magnificModel || 'classic',
    prompt: prompt.trim(),
    aspectRatio,
    count,
    resolution: getDllPicResolutionOption(resolution).value,
  });

  return {
    images: result?.images || [],
    errors: result?.errors || [],
    meta: result?.meta || null,
  };
}

export async function generateDllPicImages({
  apiKey,
  modelKey = 'google',
  prompt,
  aspectRatio = '9:16',
  count = 1,
  resolution = '1k',
  magnificGenerate = null,
}) {
  const modelConfig = getDllPicModelConfig(modelKey);
  if (!apiKey && !modelConfig.usesServerProxy) throw new Error('請先設定 DLL_PIC Pro API Key');
  if (!prompt?.trim()) throw new Error('請先選擇或輸入 Prompt');
  if (!modelConfig.generationModel) throw new Error(`${modelConfig.label} 目前尚未接入生圖功能`);

  const result = modelConfig.provider === 'magnific'
    ? await generateMagnificImages({ magnificGenerate, modelConfig, prompt, aspectRatio, count, resolution })
    : modelConfig.provider === 'xai'
      ? await generateXaiImages({ apiKey, modelConfig, prompt, aspectRatio, count, resolution })
      : await generateGeminiImages({ apiKey, modelConfig, prompt, aspectRatio, count });

  if (result.images.length === 0) {
    throw new Error(result.errors[0] || 'API 回應中未包含圖像資料。');
  }

  return result;
}

function normalizeJsonText(text = '') {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fencedMatch ? fencedMatch[1].trim() : trimmed;
}

function formatStructuredAnalysis(structuredAnalysis) {
  if (!structuredAnalysis || typeof structuredAnalysis !== 'object') return '';

  const fieldLabels = {
    subject: 'Subject',
    style: 'Style',
    composition: 'Composition',
    lighting: 'Lighting',
    color: 'Color',
    mood: 'Mood',
    camera: 'Camera',
    wardrobe: 'Wardrobe',
    keyDetails: 'Key Details',
  };

  return Object.entries(fieldLabels)
    .map(([key, label]) => {
      const value = structuredAnalysis[key];
      return value ? `${label}: ${value}` : null;
    })
    .filter(Boolean)
    .join('\n');
}

export function parseDllPicAnalysisResponse(text = '') {
  const normalizedText = normalizeJsonText(text);

  try {
    const parsed = JSON.parse(normalizedText);
    return {
      shortPrompt: parsed.shortPrompt?.trim() || '',
      detailedPrompt: parsed.detailedPrompt?.trim() || '',
      structuredPrompt: formatStructuredAnalysis(parsed.structuredAnalysis) || parsed.structuredPrompt?.trim() || '',
    };
  } catch {
    return {
      shortPrompt: text.trim(),
      detailedPrompt: text.trim(),
      structuredPrompt: '',
    };
  }
}

export async function analyzeImageToPrompt({
  apiKey,
  modelKey = 'google',
  imageDataUrl,
  instruction = '',
}) {
  const modelConfig = getDllPicModelConfig(modelKey);
  if (!apiKey) throw new Error('請先設定 DLL_PIC Pro API Key');
  if (!imageDataUrl) throw new Error('請先上傳圖片');
  if (!modelConfig.analysisModel) throw new Error(`${modelConfig.label} 目前尚未接入圖片分析功能`);

  const base64Data = imageDataUrl.split(',')[1];
  const mimeType = imageDataUrl.split(';')[0].split(':')[1];
  const extraInstruction = instruction.trim() ? ` Additional instruction: ${instruction.trim()}` : '';
  const analysisInstruction = `Analyze this image and return valid JSON only. Generate three outputs in English for AI image generation:
1. shortPrompt: one concise prompt for quick testing
2. detailedPrompt: one richer production-ready prompt in the current GPT image prompt style
3. structuredAnalysis: an object with keys subject, style, composition, lighting, color, mood, camera, wardrobe, keyDetails

Do not include markdown, code fences, or commentary.${extraInstruction}`;

  const response = await fetchWithTimeout(
    buildGoogleApiUrl(modelConfig.analysisModel, apiKey),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            { text: analysisInstruction },
          ],
        }],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await parseDllPicApiError(response));
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) throw new Error('無法解析 API 回應');
  return parseDllPicAnalysisResponse(responseText);
}
