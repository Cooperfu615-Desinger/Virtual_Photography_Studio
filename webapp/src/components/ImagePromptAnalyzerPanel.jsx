import { useEffect, useState } from 'react';
import {
  DLL_PIC_STORAGE_KEYS,
  analyzeImageToPrompt,
  getDllPicApiKeyStorageKeys,
  getDllPicModelConfig,
  getDllPicSelectableModelEntries,
  normalizeDllPicModelKey,
} from '../lib/dllPicProClient.js';

function loadStoredValue(key, fallback = '') {
  if (typeof window === 'undefined') return fallback;
  return window.localStorage.getItem(key) || fallback;
}

function loadStoredAnalyzerModelKey() {
  const modelKey = normalizeDllPicModelKey(loadStoredValue(DLL_PIC_STORAGE_KEYS.model, 'google31FlashLiteImage'));
  return getDllPicModelConfig(modelKey).analysisModel ? modelKey : 'google31FlashLiteImage';
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

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImagePromptAnalyzerPanel({ onCopyText }) {
  const [modelKey, setModelKey] = useState(loadStoredAnalyzerModelKey);
  const [apiKey, setApiKey] = useState(() => loadStoredApiKey(loadStoredAnalyzerModelKey()));
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [instruction, setInstruction] = useState('');
  const [result, setResult] = useState({ shortPrompt: '', detailedPrompt: '', structuredPrompt: '' });
  const [activeMode, setActiveMode] = useState('detailed');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [message, setMessage] = useState('');
  const activeModel = getDllPicModelConfig(modelKey);

  const activeText = activeMode === 'short'
    ? result.shortPrompt
    : activeMode === 'structured'
      ? result.structuredPrompt
      : result.detailedPrompt;

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('請上傳圖片檔');
      return;
    }
    setImageDataUrl(await readImageFile(file));
    setResult({ shortPrompt: '', detailedPrompt: '', structuredPrompt: '' });
    setMessage('');
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setMessage('');

    try {
      saveStoredApiKey(modelKey, apiKey);
      window.localStorage.setItem(DLL_PIC_STORAGE_KEYS.model, modelKey);
      const nextResult = await analyzeImageToPrompt({
        apiKey: apiKey.trim(),
        modelKey,
        imageDataUrl,
        instruction,
      });
      setResult(nextResult);
      setActiveMode(nextResult.detailedPrompt ? 'detailed' : 'short');
      setMessage('圖片反推完成');
    } catch (error) {
      setMessage(error.message || '圖片反推失敗');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    setApiKey(loadStoredApiKey(modelKey));
  }, [modelKey]);

  const handleCopy = () => {
    if (!activeText?.trim()) {
      setMessage('目前沒有可複製的內容');
      return;
    }
    onCopyText?.('Image analysis prompt copied', activeText);
    setMessage('已複製目前反推結果');
  };

  const setActiveText = (value) => {
    if (activeMode === 'short') {
      setResult((prev) => ({ ...prev, shortPrompt: value }));
    } else if (activeMode === 'detailed') {
      setResult((prev) => ({ ...prev, detailedPrompt: value }));
    }
  };

  return (
    <section className="image-analyzer-panel">
      <div className="reference-output-header">
        <div>
          <div className="control-section-title">Image Analyzer</div>
          <p className="workspace-panel-copy">把任意圖片反推成 GPT image prompt 格式，方便回到工作台拆解。</p>
        </div>
      </div>

      <div className="dll-pic-settings-grid">
        <label className="field dll-pic-field">
          <span>模型</span>
          <select value={modelKey} onChange={(event) => setModelKey(event.target.value)}>
            {getDllPicSelectableModelEntries({ includeAnalysisOnly: true }).map(([key, model]) => (
              <option key={key} value={key}>
                {model.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field dll-pic-field">
          <span>API Key</span>
          <input
            className="text-input"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={activeModel.apiKeyPlaceholder || 'API Key'}
          />
        </label>
      </div>

      <label className="image-analyzer-upload">
        <input className="hidden-input" type="file" accept="image/*" onChange={handleFileChange} />
        {imageDataUrl ? (
          <img src={imageDataUrl} alt="Uploaded reference" />
        ) : (
          <span>點擊上傳圖片</span>
        )}
      </label>

      <label className="field">
        <span>補充指令</span>
        <textarea
          className="text-area image-analyzer-instruction"
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder="可選填，例如：偏重拆解服裝、鏡頭與光影。"
        />
      </label>

      <div className="dll-pic-actions">
        <button
          type="button"
          className="primary-copy-btn dll-pic-generate-btn"
          onClick={handleAnalyze}
          disabled={!apiKey.trim() || !imageDataUrl || !activeModel.analysisModel || isAnalyzing}
        >
          {isAnalyzing ? '分析中...' : '分析圖片'}
        </button>
        <span className="dll-pic-model-note">{activeModel.analysisModel || '此 provider 尚未接入反推'}</span>
      </div>

      <div className="image-analyzer-tabs">
        {[
          ['short', '短版'],
          ['detailed', '完整'],
          ['structured', '結構'],
        ].map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            className={activeMode === mode ? 'segmented-control-active' : 'secondary'}
            onClick={() => setActiveMode(mode)}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="field">
        <span>反推結果</span>
        <textarea
          className="text-area image-analyzer-result"
          value={activeText || ''}
          readOnly={activeMode === 'structured'}
          onChange={(event) => setActiveText(event.target.value)}
          placeholder="分析完成後會顯示 prompt。"
        />
      </label>

      <div className="dll-pic-actions">
        <button type="button" className="secondary" onClick={handleCopy} disabled={!activeText?.trim()}>
          複製結果
        </button>
        {message ? <span className="dll-pic-message-inline">{message}</span> : null}
      </div>
    </section>
  );
}
