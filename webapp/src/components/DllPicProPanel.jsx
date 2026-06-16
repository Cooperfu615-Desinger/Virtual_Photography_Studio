import { useEffect, useMemo, useState } from 'react';
import {
  DLL_PIC_ASPECT_RATIOS,
  DLL_PIC_RESOLUTIONS,
  DLL_PIC_STORAGE_KEYS,
  generateDllPicImages,
  getDllPicApiKeyStorageKeys,
  getDllPicModelConfig,
  getDllPicResolutionOption,
  getDllPicSelectableModelEntries,
  normalizeDllPicModelKey,
} from '../lib/dllPicProClient.js';

function loadStoredValue(key, fallback = '') {
  if (typeof window === 'undefined') return fallback;
  return window.localStorage.getItem(key) || fallback;
}

function loadStoredModelKey(fallback = 'google') {
  return normalizeDllPicModelKey(loadStoredValue(DLL_PIC_STORAGE_KEYS.model, fallback), fallback);
}

function loadStoredApiKey(modelKey) {
  if (typeof window === 'undefined') return '';
  for (const key of getDllPicApiKeyStorageKeys(modelKey)) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }
  return '';
}

function saveStoredApiKey(modelKey, apiKey) {
  getDllPicApiKeyStorageKeys(modelKey).forEach((key) => {
    window.localStorage.setItem(key, apiKey.trim());
  });
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
  const [apiKey, setApiKey] = useState(() => loadStoredApiKey(loadStoredModelKey()));
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
  const canGenerate = Boolean(apiKey.trim() && selectedPrompt && activeModel.generationModel && !isGenerating);

  const saveSettings = () => {
    saveStoredApiKey(modelKey, apiKey);
    window.localStorage.setItem(DLL_PIC_STORAGE_KEYS.model, modelKey);
    if (activeModel.supportsResolution) {
      window.localStorage.setItem(DLL_PIC_STORAGE_KEYS.resolution, resolution);
    }
    setMessage('DLL_PIC Pro 設定已保存');
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
    setIsGenerating(true);
    setMessage('');
    setImages([]);
    setSelectedImageIndex(0);
    setPreviewImageIndex(null);
    setPreviewImageSize(null);

    try {
      saveStoredApiKey(modelKey, apiKey);
      window.localStorage.setItem(DLL_PIC_STORAGE_KEYS.model, modelKey);
      if (activeModel.supportsResolution) {
        window.localStorage.setItem(DLL_PIC_STORAGE_KEYS.resolution, resolution);
      }
      const result = await generateDllPicImages({
        apiKey: apiKey.trim(),
        modelKey,
        prompt: selectedPrompt,
        aspectRatio,
        count,
        resolution,
      });
      setImages(result.images);
      setMessage(result.errors.length > 0 ? result.errors[0] : `已生成 ${result.images.length} 張圖像`);
    } catch (error) {
      setMessage(error.message || '生成失敗');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    setApiKey(loadStoredApiKey(modelKey));
  }, [modelKey]);

  useEffect(() => {
    if (!previewImage) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setPreviewImageIndex(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage]);

  return (
    <section className={`dll-pic-panel ${compact ? 'dll-pic-panel-compact' : ''}`}>
      <div className="dll-pic-header">
        <div>
          <div className="control-section-title">{title}</div>
          <p className="workspace-panel-copy">{description}</p>
        </div>
        <span className="dll-pic-status">{apiKey ? 'Key 已設定' : '未設定 Key'}</span>
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
          <select value={modelKey} onChange={(event) => setModelKey(event.target.value)}>
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
            <select value={resolution} onChange={(event) => setResolution(event.target.value)}>
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

      <label className="field dll-pic-api-field">
        <span>API Key</span>
        <div className="dll-pic-key-row">
          <input
            className="text-input dll-pic-key-input"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={activeModel.apiKeyPlaceholder || '貼上 API Key'}
          />
          <button className="secondary dll-pic-save-key-btn" type="button" onClick={saveSettings}>
            保存
          </button>
        </div>
      </label>

      <div className="dll-pic-actions">
        <button className="primary-copy-btn dll-pic-generate-btn" type="button" onClick={handleGenerate} disabled={!canGenerate}>
          {isGenerating ? '生成中...' : '生成圖像'}
        </button>
        <span className="dll-pic-model-note">{activeModelNote || '此 provider 尚未接入生圖'}</span>
      </div>

      {message ? <div className="dll-pic-message">{message}</div> : null}

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
