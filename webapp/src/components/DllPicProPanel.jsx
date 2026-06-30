import { useEffect, useMemo, useState } from 'react';
import {
  DLL_PIC_ASPECT_RATIOS,
  DLL_PIC_RESOLUTIONS,
  DLL_PIC_STORAGE_KEYS,
  getDllPicApiKeyForModel,
  generateDllPicImages,
  getDllPicApiKeyStorageKeys,
  getDllPicModelConfig,
  getDllPicResolutionOption,
  getDllPicSelectableModelEntries,
  normalizeDllPicModelKey,
} from '../lib/dllPicProClient.js';
import { generateMagnificClassicViaFirebase } from '../lib/magnificProxyClient.js';

function loadStoredValue(key, fallback = '') {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function loadStoredModelKey(fallback = 'google') {
  return normalizeDllPicModelKey(loadStoredValue(DLL_PIC_STORAGE_KEYS.model, fallback), fallback);
}

function loadStoredApiKey(modelKey) {
  if (typeof window === 'undefined') return '';
  for (const key of getDllPicApiKeyStorageKeys(modelKey)) {
    const value = loadStoredValue(key);
    if (value) return value;
  }
  return '';
}

function saveStoredApiKey(modelKey, apiKey) {
  if (typeof window === 'undefined') return;
  const normalizedApiKey = apiKey.trim();
  getDllPicApiKeyStorageKeys(modelKey).forEach((key) => {
    try {
      if (normalizedApiKey) {
        window.localStorage.setItem(key, normalizedApiKey);
      } else {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore unavailable storage; generation still uses in-memory keys.
    }
  });
}

const DLL_PIC_API_KEY_FIELDS = [
  {
    provider: 'google',
    modelKey: 'google',
    label: 'Gemini API Key',
    placeholder: '貼上 Google Gemini API Key',
  },
  {
    provider: 'xai',
    modelKey: 'xaiGrokImagineQuality',
    label: 'xAI API Key',
    placeholder: '貼上 xAI API Key',
  },
];

const DLL_PIC_PROXY_FIELDS = [
  {
    provider: 'magnific',
    label: 'Magnific API Key',
    status: 'Firebase Secret',
    description: '由 Firebase Functions proxy 使用伺服端 MAGNIFIC_API_KEY，不會儲存在瀏覽器。',
  },
];

function loadStoredProviderApiKeys() {
  return DLL_PIC_API_KEY_FIELDS.reduce((keys, field) => ({
    ...keys,
    [field.provider]: loadStoredApiKey(field.modelKey),
  }), {});
}

function saveStoredGenerationSettings(modelKey, resolution) {
  if (typeof window === 'undefined') return;
  const modelConfig = getDllPicModelConfig(modelKey);

  try {
    window.localStorage.setItem(DLL_PIC_STORAGE_KEYS.model, modelKey);
    if (modelConfig.supportsResolution) {
      window.localStorage.setItem(DLL_PIC_STORAGE_KEYS.resolution, resolution);
    }
  } catch {
    // Ignore unavailable storage; current session state remains usable.
  }
}

function getGenerationErrorMessage(error) {
  if (typeof error === 'string') return error;
  return error?.message || error?.details || error?.code || '生成失敗';
}

function saveImage(src, index) {
  const extension = src.match(/^data:image\/([a-zA-Z0-9.+-]+);/)?.[1]
    || src.split('?')[0].split('.').pop()
    || 'png';
  const link = document.createElement('a');
  link.href = src;
  link.download = `dll_pic_pro_${Date.now()}_${index + 1}.${extension.replace('jpeg', 'jpg')}`;
  link.click();
}

function loadDevPreviewImages() {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return [];
  const demoImageUrl = new URLSearchParams(window.location.search).get('dllPicDemoImage');
  return demoImageUrl ? [{ src: demoImageUrl, mimeType: 'image/jpeg' }] : [];
}

export default function DllPicProPanel({
  title = 'DLL_PIC Pro',
  description = '用目前 prompt 直接生成圖像並預覽結果。',
  promptSources = [],
  defaultSourceId = '',
  compact = false,
}) {
  const availableSources = promptSources.filter((source) => source?.value?.trim());
  const initialSourceId = defaultSourceId || availableSources[0]?.id || promptSources[0]?.id || '';
  const [modelKey, setModelKey] = useState(loadStoredModelKey);
  const [apiKeys, setApiKeys] = useState(loadStoredProviderApiKeys);
  const [apiKeyDrafts, setApiKeyDrafts] = useState(loadStoredProviderApiKeys);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState(initialSourceId);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [resolution, setResolution] = useState(() => (
    getDllPicResolutionOption(loadStoredValue(DLL_PIC_STORAGE_KEYS.resolution, '1k')).value
  ));
  const [count, setCount] = useState(1);
  const [images, setImages] = useState(loadDevPreviewImages);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [previewImageIndex, setPreviewImageIndex] = useState(null);
  const [previewImageSize, setPreviewImageSize] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState(() => (loadDevPreviewImages().length ? '已套用本地預覽圖' : ''));

  const activeModel = getDllPicModelConfig(modelKey);
  const activeModelNote = activeModel.supportsResolution
    ? `${activeModel.generationModel} / ${resolution.toUpperCase()}`
    : activeModel.generationModel;
  const previewImage = previewImageIndex === null ? null : images[previewImageIndex] || null;
  const previewDisplaySize = previewImageSize ? {
    width: previewImageSize.width / 2,
    height: previewImageSize.height / 2,
  } : null;
  const selectedSource = useMemo(() => (
    promptSources.find((source) => source.id === selectedSourceId) || availableSources[0] || promptSources[0] || null
  ), [availableSources, promptSources, selectedSourceId]);
  const selectedPrompt = selectedSource?.value?.trim() || '';
  const activeApiKey = getDllPicApiKeyForModel(modelKey, apiKeys);
  const activeProviderLabel = activeModel.provider === 'magnific'
    ? 'Magnific'
    : activeModel.provider === 'xai'
      ? 'xAI'
      : 'Gemini';
  const activeKeyStatus = activeModel.usesServerProxy
    ? `${activeProviderLabel} Proxy 已連接`
    : activeApiKey
      ? `${activeProviderLabel} Key 已設定`
      : `${activeProviderLabel} Key 未設定`;
  const canGenerate = Boolean(
    (activeModel.usesServerProxy || activeApiKey)
    && selectedPrompt
    && activeModel.generationModel
    && !isGenerating
  );

  const openApiKeyModal = () => {
    setApiKeyDrafts(apiKeys);
    setIsApiKeyModalOpen(true);
  };

  const closeApiKeyModal = () => {
    setIsApiKeyModalOpen(false);
    setApiKeyDrafts(apiKeys);
  };

  const saveApiKeys = () => {
    const nextApiKeys = DLL_PIC_API_KEY_FIELDS.reduce((keys, field) => {
      const normalizedApiKey = (apiKeyDrafts[field.provider] || '').trim();
      saveStoredApiKey(field.modelKey, normalizedApiKey);
      return {
        ...keys,
        [field.provider]: normalizedApiKey,
      };
    }, {});

    setApiKeys(nextApiKeys);
    setApiKeyDrafts(nextApiKeys);
    setIsApiKeyModalOpen(false);
    setMessage('DLL_PIC Pro API Keys 已保存');
  };

  const openImagePreview = (index) => {
    setSelectedImageIndex(index);
    setPreviewImageSize(null);
    setPreviewImageIndex(index);
  };

  const closeImagePreview = () => {
    setPreviewImageIndex(null);
    setPreviewImageSize(null);
  };

  const handleGenerate = async () => {
    const apiKey = getDllPicApiKeyForModel(modelKey, apiKeys);

    setIsGenerating(true);
    setMessage('');
    setImages([]);
    setSelectedImageIndex(0);
    setPreviewImageIndex(null);
    setPreviewImageSize(null);

    try {
      saveStoredGenerationSettings(modelKey, resolution);
      const result = await generateDllPicImages({
        apiKey,
        modelKey,
        prompt: selectedPrompt,
        aspectRatio,
        count,
        resolution,
        magnificGenerate: generateMagnificClassicViaFirebase,
      });
      setImages(result.images);
      setMessage(result.errors.length > 0 ? result.errors[0] : `已生成 ${result.images.length} 張圖像`);
    } catch (error) {
      setMessage(getGenerationErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!previewImage) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setPreviewImageIndex(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage]);

  useEffect(() => {
    if (!isApiKeyModalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsApiKeyModalOpen(false);
        setApiKeyDrafts(apiKeys);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [apiKeys, isApiKeyModalOpen]);

  return (
    <section className={`dll-pic-panel ${compact ? 'dll-pic-panel-compact' : ''}`}>
      <div className="dll-pic-header">
        <div>
          <div className="control-section-title">{title}</div>
          <p className="workspace-panel-copy">{description}</p>
        </div>
        <div className="dll-pic-header-actions">
          <span className="dll-pic-status">{activeKeyStatus}</span>
          <button className="secondary dll-pic-api-settings-btn" type="button" onClick={openApiKeyModal}>
            API Keys
          </button>
        </div>
      </div>

      <div className="dll-pic-settings-grid">
        <label className="field dll-pic-field">
          <span>Prompt 來源</span>
          <select
            className={!selectedPrompt ? 'select-muted' : ''}
            value={selectedSource?.id || ''}
            onChange={(event) => setSelectedSourceId(event.target.value)}
          >
            {promptSources.map((source) => (
              <option key={source.id} value={source.id} disabled={!source.value?.trim()}>
                {source.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field dll-pic-field">
          <span>模型</span>
          <select
            value={modelKey}
            onChange={(event) => {
              const nextModelKey = event.target.value;
              setModelKey(nextModelKey);
              saveStoredGenerationSettings(nextModelKey, resolution);
            }}
          >
            {getDllPicSelectableModelEntries().map(([key, model]) => (
              <option key={key} value={key}>
                {model.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field dll-pic-field">
          <span>比例</span>
          <select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}>
            {DLL_PIC_ASPECT_RATIOS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {activeModel.supportsResolution ? (
          <label className="field dll-pic-field">
            <span>解析度</span>
            <select
              value={resolution}
              onChange={(event) => {
                const nextResolution = event.target.value;
                setResolution(nextResolution);
                saveStoredGenerationSettings(modelKey, nextResolution);
              }}
            >
              {DLL_PIC_RESOLUTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="field dll-pic-field">
          <span>張數</span>
          <select value={count} onChange={(event) => setCount(Number(event.target.value))}>
            {[1, 2, 3, 4].map((amount) => (
              <option key={amount} value={amount}>
                {amount} 張
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="dll-pic-actions">
        <button className="primary-copy-btn dll-pic-generate-btn" type="button" onClick={handleGenerate} disabled={!canGenerate}>
          {isGenerating ? '生成中...' : '生成圖像'}
        </button>
        <span className="dll-pic-model-note">{activeModelNote || '此 provider 尚未接入生圖'}</span>
      </div>

      {message ? <div className="dll-pic-message">{message}</div> : null}

      {isApiKeyModalOpen ? (
        <div className="modal-backdrop dll-pic-api-modal-backdrop" onClick={closeApiKeyModal}>
          <div
            className="modal-panel dll-pic-api-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dll-pic-api-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header dll-pic-api-modal-header">
              <div>
                <div className="control-section-title" id="dll-pic-api-modal-title">DLL_PIC Pro API Keys</div>
              </div>
              <button type="button" className="secondary dll-pic-lightbox-close" onClick={closeApiKeyModal}>
                關閉
              </button>
            </div>

            <div className="dll-pic-api-key-list">
              {DLL_PIC_API_KEY_FIELDS.map((field) => (
                <label className="field dll-pic-api-key-field" key={field.provider}>
                  <span className="dll-pic-api-key-label">
                    <span>{field.label}</span>
                    <span className="dll-pic-provider-pill">
                      {apiKeys[field.provider] ? '已設定' : '未設定'}
                    </span>
                  </span>
                  <input
                    className="text-input dll-pic-key-input"
                    type="password"
                    value={apiKeyDrafts[field.provider] || ''}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setApiKeyDrafts((currentDrafts) => ({
                        ...currentDrafts,
                        [field.provider]: nextValue,
                      }));
                    }}
                    placeholder={field.placeholder}
                  />
                </label>
              ))}
              {DLL_PIC_PROXY_FIELDS.map((field) => (
                <div className="field dll-pic-api-key-field" key={field.provider}>
                  <span className="dll-pic-api-key-label">
                    <span>{field.label}</span>
                    <span className="dll-pic-provider-pill">{field.status}</span>
                  </span>
                  <p className="dll-pic-proxy-note">{field.description}</p>
                </div>
              ))}
            </div>

            <div className="modal-actions dll-pic-api-modal-actions">
              <button type="button" className="secondary dll-pic-lightbox-close" onClick={closeApiKeyModal}>
                取消
              </button>
              <button type="button" className="primary-copy-btn dll-pic-save-key-btn" onClick={saveApiKeys}>
                更新並儲存
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="dll-pic-preview-zone" style={{ '--dll-pic-preview-ratio': aspectRatio.replace(':', ' / ') }}>
        {images.length === 0 ? (
          <div className="dll-pic-empty-preview">
            <span>{isGenerating ? '正在等待模型回圖' : '尚未生成預覽圖'}</span>
          </div>
        ) : (
          <div className="dll-pic-image-grid">
            {images.map((image, index) => (
              <figure
                key={`${image.src.slice(0, 48)}-${index}`}
                className={`dll-pic-image-card ${selectedImageIndex === index ? 'dll-pic-image-card-active' : ''}`}
              >
                <button
                  type="button"
                  className="dll-pic-image-select"
                  onClick={() => openImagePreview(index)}
                  aria-label={`開啟 DLL_PIC Pro 圖像 ${index + 1} 原尺寸預覽`}
                >
                  <img src={image.src} alt={`DLL_PIC Pro generated ${index + 1}`} />
                </button>
                <figcaption>
                  <span>#{index + 1}</span>
                  <button type="button" className="secondary dll-pic-download-btn" onClick={() => saveImage(image.src, index)}>
                    下載
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>

      {previewImage ? (
        <div className="modal-backdrop dll-pic-lightbox-backdrop" onClick={closeImagePreview}>
          <div
            className="modal-panel dll-pic-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`DLL_PIC Pro 圖像 ${previewImageIndex + 1} 原尺寸預覽`}
            style={previewDisplaySize ? {
              '--dll-pic-lightbox-width': `${previewDisplaySize.width}px`,
              '--dll-pic-lightbox-height': `${previewDisplaySize.height}px`,
            } : undefined}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header dll-pic-lightbox-header">
              <div>
                <div className="control-section-title">DLL_PIC Pro 預覽圖 #{previewImageIndex + 1}</div>
              </div>
              <div className="dll-pic-lightbox-actions">
                <button
                  type="button"
                  className="secondary dll-pic-download-btn"
                  onClick={() => saveImage(previewImage.src, previewImageIndex)}
                >
                  下載
                </button>
                <button type="button" className="secondary dll-pic-lightbox-close" onClick={closeImagePreview}>
                  關閉
                </button>
              </div>
            </div>
            <div className="dll-pic-lightbox-image-frame">
              <img
                src={previewImage.src}
                alt={`DLL_PIC Pro generated half size ${previewImageIndex + 1}`}
                onLoad={(event) => {
                  setPreviewImageSize({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                  });
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
