import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { dllWorkspace, openDllWorkspace, DLL_LOCAL_ACCEPTANCE } from '../lib/dllWorkspaceRuntime.js';
import '../styles/generation.css';
import ComfyQuotaPanel from './ComfyQuotaPanel.jsx';
import { openVideoWorkspace } from '../lib/comfyVideoClient.js';
import {
  DLL_PIC_ASPECT_RATIOS,
  DLL_PIC_STORAGE_KEYS,
  getDllPicApiKeyForModel,
  getDllPicApiKeyStorageKeys,
  getDllPicModelConfig,
  getDllPicLoraSelection,
  getDllPicLoraModelKey,
  getDllPicResolutionOption,
  getDllPicResolutionOptions,
  getDllPicSelectableModelEntries,
  isDllPicAspectRatioSupported,
  normalizeDllPicModelKey,
} from '../lib/dllPicProClient.js';
import { readComfyPending, clearComfyPending } from '../lib/comfyCloudProxyClient.js';
import { getComfyGenerationNote } from '../lib/dllPicGenerationPresentation.js';
import { downloadImageFile } from '../lib/imageDownload.js';
import { downloadMagnificImageViaFirebase } from '../lib/magnificProxyClient.js';

function loadStoredValue(key, fallback = '') {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function loadStoredModelKey(fallback = 'google31FlashLiteImage') {
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
    modelKey: 'google31FlashLiteImage',
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
    provider: 'comfyCloud', label: 'Comfy Cloud API Key', status: 'Firebase Secret',
    description: '由伺服端 COMFY_CLOUD_API_KEY 提供；請先登入 Firebase。',
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
  workspaceId = 'Prompt 工作台',
  full = false,
  initialSettings = {},
}) {
  const availableSources = promptSources.filter((source) => source?.value?.trim());
  const initialSourceId = defaultSourceId || availableSources[0]?.id || promptSources[0]?.id || '';
  const shared = useSyncExternalStore(dllWorkspace.subscribe, dllWorkspace.getSnapshot);
  const sharedTask = [...shared.tasks].reverse().find(task => full ? task.id === shared.selected : task.snapshot.workspace === workspaceId);
  const [modelKey, setModelKey] = useState(() => initialSettings.modelKey || loadStoredModelKey());
  const [custom, setCustom] = useState(Boolean(initialSettings.custom));
  const [customPrompt, setCustomPrompt] = useState(initialSettings.customPrompt || '');
  const [seed, setSeed] = useState(initialSettings.seed ?? '');
  const [apiKeys, setApiKeys] = useState(loadStoredProviderApiKeys);
  const [apiKeyDrafts, setApiKeyDrafts] = useState(loadStoredProviderApiKeys);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState(initialSettings.selectedSourceId || initialSourceId);
  const [aspectRatio, setAspectRatio] = useState(initialSettings.aspectRatio || '9:16');
  const [resolution, setResolution] = useState(() => (
    getDllPicResolutionOption(loadStoredModelKey(), initialSettings.resolution || loadStoredValue(DLL_PIC_STORAGE_KEYS.resolution, '1k')).value
  ));
  const [count, setCount] = useState(initialSettings.count || 1);
  const comfyPending = DLL_LOCAL_ACCEPTANCE ? null : readComfyPending();
  const images = sharedTask?.images || loadDevPreviewImages();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [previewImageIndex, setPreviewImageIndex] = useState(null);
  const [previewImageSize, setPreviewImageSize] = useState(null);
  const isGenerating = shared.busy;
  const [downloadingImageIndex, setDownloadingImageIndex] = useState(null);
  const [message, setMessage] = useState(() => (loadDevPreviewImages().length ? '已套用本地預覽圖' : ''));

  const activeModel = getDllPicModelConfig(modelKey);
  const loraSelection = getDllPicLoraSelection(modelKey);
  const activeResolution = getDllPicResolutionOption(modelKey, resolution).value;
  const activeResolutionOptions = getDllPicResolutionOptions(modelKey);
  const activeModelNote = activeModel.supportsResolution
    ? `${activeModel.generationModel} / ${activeResolution.toUpperCase()}`
    : activeModel.imageSize
      ? `${activeModel.generationModel} / ${activeModel.imageSize}`
      : activeModel.generationModel;
  const previewImage = previewImageIndex === null ? null : images[previewImageIndex] || null;
  const previewDisplaySize = previewImageSize ? {
    width: previewImageSize.width / 2,
    height: previewImageSize.height / 2,
  } : null;
  const selectedSource = useMemo(() => (
    promptSources.find((source) => source.id === selectedSourceId) || availableSources[0] || promptSources[0] || null
  ), [availableSources, promptSources, selectedSourceId]);
  const selectedPrompt = full && custom ? customPrompt : selectedSource?.value || '';
  const snapshot = () => ({ modelKey, prompt: selectedPrompt, aspectRatio, resolution: activeResolution, count,
    seed: full && activeModel.provider === 'comfyCloud' ? seed : '', sourceId: custom ? 'custom' : selectedSource?.id,
    sourceLabel: custom ? '自訂' : selectedSource?.label, workspace: workspaceId, lockAspectRatio: Boolean(selectedSource?.lockAspectRatio) });
  const draftSignature = JSON.stringify({ sources: promptSources, modelKey, selectedSourceId, aspectRatio, resolution: activeResolution, count, custom, customPrompt, seed, workspaceId });
  useEffect(() => { if (full && shared.ready) dllWorkspace.draft(JSON.parse(draftSignature)); }, [full, shared.ready, draftSignature]);
  const isAspectRatioLocked = Boolean(selectedSource?.lockAspectRatio && selectedSource?.aspectRatio);
  const isAspectRatioSupported = isDllPicAspectRatioSupported(modelKey, aspectRatio);
  const activeApiKey = getDllPicApiKeyForModel(modelKey, apiKeys);
  const canGenerate = Boolean(
    (DLL_LOCAL_ACCEPTANCE || activeModel.usesServerProxy || activeApiKey)
    && selectedPrompt
    && activeModel.generationModel
    && isAspectRatioSupported
    && shared.ready
    && !isGenerating
    && !(activeModel.provider === 'comfyCloud' && comfyPending)
  );
  const modelCompatibilityNote = isAspectRatioSupported
    ? ''
    : `目前模型不支援固定 ${aspectRatio}，請改用 Google Gemini Nano Banana 2 Lite`;

  useEffect(() => {
    if (selectedSource?.aspectRatio) setAspectRatio(selectedSource.aspectRatio);
  }, [selectedSource?.aspectRatio, selectedSource?.id]);

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
    setMessage('');
    try {
      saveStoredGenerationSettings(modelKey, activeResolution);
      await dllWorkspace.enqueue(snapshot(), true);
    } catch (error) { setMessage(getGenerationErrorMessage(error)); }
  };
  const handleResumeComfy = async () => {
    try { await dllWorkspace.recoverLegacy(comfyPending); }
    catch (error) { setMessage(getGenerationErrorMessage(error)); }
  };

  const handleDownloadImage = async (src, index) => {
    setDownloadingImageIndex(index);
    try {
      await downloadImageFile({
        src,
        index,
        remoteDownload: downloadMagnificImageViaFirebase,
      });
    } catch (error) {
      setMessage(getGenerationErrorMessage(error));
    } finally {
      setDownloadingImageIndex(null);
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
    <section className={`dll-pic-panel ${full ? 'dll-full-settings' : ''} ${compact ? 'dll-pic-panel-compact' : ''}`} aria-label={title} aria-description={description}>
      <div className="dll-pic-header">
        <div>
          <div className="control-section-title">{title}</div>
        </div>
        <div className="dll-pic-header-actions">
          {!full && <button type="button" className="secondary" onClick={() => openDllWorkspace({ sources: promptSources, settings: { modelKey, selectedSourceId, aspectRatio, resolution: activeResolution, count }, workspaceId, taskId: sharedTask?.id })}>開啟完整版</button>}
          <button className="secondary dll-pic-api-settings-btn" type="button" onClick={openApiKeyModal}>
            API Keys
          </button>
        </div>
      </div>

      {full && <div className="dll-source-choices">{promptSources.map(source => <button type="button" key={source.id} className={selectedSource?.id === source.id && !custom ? 'tab-primary-active' : 'secondary'} disabled={!source.value?.trim()} onClick={() => { setSelectedSourceId(source.id); setCustom(false); }}>{source.label}</button>)}</div>}
      <div className="dll-pic-settings-grid">
        <label className="field dll-pic-field">
          {full && <span>Prompt 來源</span>}
          <select
            aria-label="Prompt 來源"
            className={!selectedPrompt ? 'select-muted' : ''}
            value={selectedSource?.id || ''}
            disabled={!full && isGenerating}
            onChange={(event) => { setSelectedSourceId(event.target.value); setCustom(false); }}
          >
            {promptSources.map((source) => (
              <option key={source.id} value={source.id} disabled={!source.value?.trim()}>
                {source.label}
              </option>
            ))}
          </select>
        </label>

        {full && <div className="dll-prompt-editor">
          <label htmlFor="dll-full-prompt">{custom ? '自訂本次 Prompt' : '目前使用的 Prompt'}</label>
          <textarea id="dll-full-prompt" value={selectedPrompt} readOnly={!custom} onChange={event => setCustomPrompt(event.target.value)} placeholder="帶入工作區來源，或編輯本次 Prompt" />
          <button type="button" className="dll-text-button" onClick={() => { setCustomPrompt(selectedPrompt); setCustom(true); }}>編輯本次 Prompt</button>
          {custom && <button type="button" className="dll-text-button" onClick={() => setCustom(false)}>還原來源文字</button>}
        </div>}

        <label className="field dll-pic-field">
          {full && <span>模型</span>}
          <select
            aria-label="模型"
            value={loraSelection.modelKey}
            disabled={!full && isGenerating}
            onChange={(event) => {
              const nextModelKey = event.target.value;
              const nextResolution = getDllPicResolutionOption(nextModelKey, resolution).value;
              setModelKey(nextModelKey);
              setCount(1);
              setSeed('');
              setResolution(nextResolution);
              saveStoredGenerationSettings(nextModelKey, nextResolution);
            }}
          >
            {getDllPicSelectableModelEntries().map(([key, model]) => (
              <option key={key} value={key}>
                {model.label}
              </option>
            ))}
          </select>
        </label>

        {loraSelection.supported && <label className="dll-pic-lora-control">
          <input type="checkbox" aria-label="套用 MOSS LoRA" checked={loraSelection.enabled} disabled={!full && isGenerating}
            onChange={event => {
              const nextModelKey = getDllPicLoraModelKey(modelKey, event.target.checked);
              setModelKey(nextModelKey);
              saveStoredGenerationSettings(nextModelKey, activeResolution);
            }} />
          <span>套用 MOSS LoRA<small>強度 {loraSelection.strength}</small></span>
        </label>}

        <label className="field dll-pic-field">
          {full && <span>比例</span>}
          <select
            aria-label="比例"
            value={aspectRatio}
            onChange={(event) => setAspectRatio(event.target.value)}
            disabled={isAspectRatioLocked || (!full && isGenerating)}
          >
            {DLL_PIC_ASPECT_RATIOS.map((option) => (
              <option key={option.value} value={option.value} disabled={!isDllPicAspectRatioSupported(modelKey, option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {activeModel.supportsResolution ? (
          <label className="field dll-pic-field">
            <span>解析度</span>
            <select
              value={activeResolution}
              disabled={!full && isGenerating}
              onChange={(event) => {
                const nextResolution = event.target.value;
                setResolution(nextResolution);
                saveStoredGenerationSettings(modelKey, nextResolution);
              }}
            >
              {activeResolutionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="field dll-pic-field">
          {full && <span>張數</span>}
          <select aria-label="張數" value={count} disabled={!full && isGenerating} onChange={(event) => setCount(Number(event.target.value))}>
            {[1, 2].map((amount) => (
              <option key={amount} value={amount}>
                {amount} 張
              </option>
            ))}
          </select>
        </label>
      </div>

      {full && activeModel.provider === 'comfyCloud' && <label className="field"><span>Seed（留空為隨機；2 張時第二張使用 Seed + 1）</span><input aria-label="Seed" type="number" min="0" step="1" value={seed} onChange={event => setSeed(event.target.value)} placeholder="隨機" /></label>}

      {activeModel.provider === 'comfyCloud' ? <div className="dll-pic-model-note">{full ? '依序取得每張圖片後才送下一張。成果保存於此瀏覽器，請下載重要圖片。' : getComfyGenerationNote(activeModel)}</div> : null}
      {comfyPending ? <div className="dll-pic-actions">
        <button type="button" className="secondary" disabled={isGenerating} onClick={handleResumeComfy}>查詢上次任務</button>
        <button type="button" className="secondary" disabled={isGenerating} onClick={async () => {
          if (!window.confirm('結束追蹤不會取消雲端任務，也不會退還額度。請先確認 Comfy Cloud 作業佇列，避免重複生成。確定結束追蹤？')) return;
          try {
            await clearComfyPending(undefined, { expectedRequestId: comfyPending?.requestId || null });
            setMessage('已結束追蹤；雲端任務可能仍在執行');
          } catch (error) {
            setMessage(getGenerationErrorMessage(error));
          } finally {
            setMessage('已更新追蹤狀態');
          }
        }}>結束追蹤</button>
      </div> : null}

      <div className="dll-pic-actions dll-pic-generate-actions">
        <span className="dll-pic-model-note">
          {modelCompatibilityNote || (!full && (activeModelNote || '此 provider 尚未接入生圖'))}
        </span>
        {activeModel.provider === 'comfyCloud' && !DLL_LOCAL_ACCEPTANCE && <ComfyQuotaPanel modelKey={activeModel.comfyModel} resolution={activeResolution} aspectRatio={aspectRatio} refreshToken={images} />}
        <button className="primary-copy-btn dll-pic-generate-btn" type="button" onClick={handleGenerate} disabled={!canGenerate}>
          {isGenerating ? '生成中...' : '生成圖像'}
        </button>
      </div>

      {full && <button type="button" className="secondary" disabled={!selectedPrompt.trim() || !shared.ready || !isAspectRatioSupported} onClick={async () => { try { await dllWorkspace.enqueue(snapshot()); setMessage('已加入待生成清單'); } catch (error) { setMessage(error.message); } }}>加入待生成</button>}
      {(shared.error || sharedTask?.message) && <p role="status" className="dll-pic-message">{shared.error || sharedTask.message}</p>}
      {message ? <div className="dll-pic-message" role="status" aria-live="polite">{message}</div> : null}

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

      {!full && <div className="dll-pic-preview-zone" style={{ '--dll-pic-preview-ratio': aspectRatio.replace(':', ' / ') }}>
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
                  <button type="button" className="secondary dll-pic-download-btn" disabled={DLL_LOCAL_ACCEPTANCE} onClick={() => openVideoWorkspace(image, index)}>製作影片</button>
                  <button
                    type="button"
                    className="secondary dll-pic-download-btn"
                    onClick={() => handleDownloadImage(image.src, index)}
                    disabled={downloadingImageIndex === index}
                  >
                    {downloadingImageIndex === index ? '下載中...' : '下載'}
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>}

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
                <button type="button" className="secondary dll-pic-download-btn" onClick={() => {
                  const image = previewImage; const index = previewImageIndex;
                  closeImagePreview();
                  openVideoWorkspace(image, index);
                }}>製作影片</button>
                <button
                  type="button"
                  className="secondary dll-pic-download-btn"
                  onClick={() => handleDownloadImage(previewImage.src, previewImageIndex)}
                  disabled={downloadingImageIndex === previewImageIndex}
                >
                  {downloadingImageIndex === previewImageIndex ? '下載中...' : '下載'}
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
