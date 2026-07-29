import { MIDJOURNEY_PARAMETER_CONTRACT } from '../lib/engine/midjourneyParameterContract.js';
import {
  applyMidjourneyParameterPreset,
  updateMidjourneyParameterDraft,
} from '../features/page1/midjourneyParameterUi.js';

function OptionButtons({ ariaLabel, control, value, onChange }) {
  return (
    <div className="mj-parameter-option-row" role="group" aria-label={ariaLabel}>
      {control.options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`secondary mj-parameter-option ${value === option.id ? 'mj-parameter-option-active' : ''}`}
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
function NumericParameterField({ label, hint, control, value, onChange }) {
  return (
    <label className="mj-parameter-numeric-field">
      <span className="mj-parameter-field-heading">
        <span>
          <strong>{label}</strong>
          <small>{hint}</small>
        </span>
        <input
          className="text-input mj-parameter-number-input"
          type="number"
          min={control.min}
          max={control.max}
          step="1"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
      <input
        className="mj-parameter-range"
        type="range"
        min={control.min}
        max={control.max}
        step="1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="mj-parameter-range-bounds" aria-hidden="true">
        <span>{control.min}</span>
        <span>{control.max}</span>
      </span>
    </label>
  );
}

export default function MidjourneyParameterControls({ settings, onChange }) {
  const { controls, presets } = MIDJOURNEY_PARAMETER_CONTRACT;
  const updateSetting = (selectionKey, value) => {
    onChange((previous) => updateMidjourneyParameterDraft(previous, selectionKey, value));
  };

  return (
    <div className="control-section mj-parameter-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Midjourney V8 Controls</div>
          <p className="workspace-panel-copy">
            集中設定 AI Prompt 專用參數；不會改動 Gpt、Grok／Z-Image 或三組固定構圖 Prompt。
          </p>
        </div>
      </div>

      <div className="context-note">
        設定會保存在 PAGE1、隨生成 selection 進入 Saved Cards 並可回填；目前仍不附加到 Prompt，也不參與「全部隨機」或「清空」。
      </div>

      <div className="mj-parameter-block">
        <div className="mj-parameter-block-heading">
          <strong>快速預設</strong>
          <span>只調整 Raw、Stylize、Chaos 與 Weirdness</span>
        </div>
        <div className="mj-parameter-preset-grid" role="group" aria-label="Midjourney 快速預設">
          {Object.entries(presets).map(([presetId, preset]) => (
            <button
              key={presetId}
              type="button"
              className="secondary mj-parameter-preset"
              onClick={() => onChange((previous) => applyMidjourneyParameterPreset(previous, presetId))}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mj-parameter-grid">
        <div className="mj-parameter-block">
          <div className="mj-parameter-block-heading">
            <strong>模型版本</strong>
            <span>指定 Midjourney V8 子版本</span>
          </div>
          <OptionButtons
            ariaLabel="Midjourney 模型版本"
            control={controls.version}
            value={settings.mjVersionId}
            onChange={(value) => updateSetting('mjVersionId', value)}
          />
        </div>

        <div className="mj-parameter-block">
          <div className="mj-parameter-block-heading">
            <strong>解讀模式</strong>
            <span>Raw 會降低預設美化介入</span>
          </div>
          <OptionButtons
            ariaLabel="Midjourney 解讀模式"
            control={controls.rawMode}
            value={settings.mjRawMode}
            onChange={(value) => updateSetting('mjRawMode', value)}
          />
        </div>

        <div className="mj-parameter-block">
          <div className="mj-parameter-block-heading">
            <strong>輸出解析度</strong>
            <span>SD／HD 只作用於 AI Prompt</span>
          </div>
          <OptionButtons
            ariaLabel="Midjourney 輸出解析度"
            control={controls.resolution}
            value={settings.mjResolution}
            onChange={(value) => updateSetting('mjResolution', value)}
          />
        </div>
      </div>

      <div className="mj-parameter-slider-grid">
        <NumericParameterField
          label="Stylize"
          hint="風格化強度"
          control={controls.stylize}
          value={settings.mjStylize}
          onChange={(value) => updateSetting('mjStylize', value)}
        />
        <NumericParameterField
          label="Chaos"
          hint="結果差異幅度"
          control={controls.chaos}
          value={settings.mjChaos}
          onChange={(value) => updateSetting('mjChaos', value)}
        />
        <NumericParameterField
          label="Weirdness"
          hint="非常規視覺程度"
          control={controls.weirdness}
          value={settings.mjWeirdness}
          onChange={(value) => updateSetting('mjWeirdness', value)}
        />
      </div>

      <div className="mj-parameter-aspect-note">
        <strong>畫面比例</strong>
        <span>不重複新增控制；後續由目前 AI 輸出的既有比例自動帶入。</span>
      </div>
    </div>
  );
}
