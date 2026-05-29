import { useMemo, useState } from 'react';
import {
  DLL_PIC_ASPECT_RATIOS,
  DLL_PIC_MODEL_CONFIG,
  DLL_PIC_STORAGE_KEYS,
  generateDllPicImages,
  getDllPicModelConfig,
} from '../lib/dllPicProClient.js';

function loadStoredValue(key, fallback = '') {
  if (typeof window === 'undefined') return fallback;
  return window.localStorage.getItem(key) || fallback;
}

function saveImage(src, index) {
  const link = document.createElement('a');
  link.href = src;
  link.download = `dll_pic_pro_${Date.now()}_${index + 1}.png`;
  link.click();
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
  const [apiKey, setApiKey] = useState(() => loadStoredValue(DLL_PIC_STORAGE_KEYS.apiKey));
  const [modelKey, setModelKey] = useState(() => loadStoredValue(DLL_PIC_STORAGE_KEYS.model, 'google'));
  const [selectedSourceId, setSelectedSourceId] = useState(initialSourceId);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [count, setCount] = useState(1);
  const [images, setImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const activeModel = getDllPicModelConfig(modelKey);
  const selectedSource = useMemo(() => (
    promptSources.find((source) => source.id === selectedSourceId) || availableSources[0] || promptSources[0] || null
  ), [availableSources, promptSources, selectedSourceId]);
  const selectedPrompt = selectedSource?.value?.trim() || '';
  const canGenerate = Boolean(apiKey.trim() && selectedPrompt && activeModel.generationModel && !isGenerating);

  const saveSettings = () => {
    window.localStorage.setItem(DLL_PIC_STORAGE_KEYS.apiKey, apiKey.trim());
    window.localStorage.setItem(DLL_PIC_STORAGE_KEYS.model, modelKey);
    setMessage('DLL_PIC Pro 設定已保存');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessage('');
    setImages([]);
    setSelectedImageIndex(0);

    try {
      window.localStorage.setItem(DLL_PIC_STORAGE_KEYS.apiKey, apiKey.trim());
      window.localStorage.setItem(DLL_PIC_STORAGE_KEYS.model, modelKey);
      const result = await generateDllPicImages({
        apiKey: apiKey.trim(),
        modelKey,
        prompt: selectedPrompt,
        aspectRatio,
        count,
      });
      setImages(result.images);
      setMessage(result.errors.length > 0 ? result.errors[0] : `已生成 ${result.images.length} 張圖像`);
    } catch (error) {
      setMessage(error.message || '生成失敗');
    } finally {
      setIsGenerating(false);
    }
  };

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
            {Object.entries(DLL_PIC_MODEL_CONFIG).map(([key, model]) => (
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
            placeholder="貼上 Google Gemini API Key"
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
        <span className="dll-pic-model-note">{activeModel.generationModel || '此 provider 尚未接入生圖'}</span>
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
                <button type="button" className="dll-pic-image-select" onClick={() => setSelectedImageIndex(index)}>
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
    </section>
  );
}
