import { useId } from 'react';
import { ChevronDown, ChevronRight, LockKeyhole, Sun } from 'lucide-react';
import '../features/page1/sceneEnvironment.css';

const SOURCE_PANELS = [
  { id: 'space', label: '一般場景' },
  { id: 'fixed', label: '固定構圖' },
  { id: 'imported', label: '場景建模匯入' },
];

export default function SceneEnvironmentControls({
  panelId,
  onPanelChange,
  sourceLabel,
  sourceName,
  isDuoMode,
  supineSurfaceOnly,
  fixedActive,
  onReleaseFixed,
  fixedDetails = [],
  poseStatus,
  cameraStatus,
  renderFields,
  renderActions,
  onShowLightingReference,
  onShowPhotography,
  importedActive,
  importedEffective = importedActive,
  importedLabel,
  onApplyImported,
  onClearImported,
  visibleTextEnabled,
  renderVisibleText,
}) {
  const headingId = useId();
  const activePanel = SOURCE_PANELS.some((panel) => panel.id === panelId) ? panelId : 'space';

  return (
    <div className="scene-editor">
      <div className="scene-editor-source-status" aria-live="polite">
        <div className="scene-editor-source-copy">
          <p>目前使用：<strong>{sourceLabel || '一般場景'}</strong></p>
          {sourceName ? <span className="scene-editor-source-name">{sourceName}</span> : null}
        </div>
        <span className="scene-editor-badge">{isDuoMode ? '雙人共用' : '單人'}</span>
      </div>

      <nav className="scene-editor-source-nav" aria-label="場景設定來源">
        {SOURCE_PANELS.map((panel) => (
          <button
            key={panel.id}
            type="button"
            className={`secondary scene-editor-source-button${activePanel === panel.id ? ' scene-editor-source-button-active' : ''}`}
            aria-pressed={activePanel === panel.id}
            onClick={() => onPanelChange(panel.id)}
          >
            {panel.label}
          </button>
        ))}
      </nav>

      {supineSurfaceOnly ? (
        <section className="scene-editor-notice" aria-label="仰躺場景設定">
          <LockKeyhole size={17} aria-hidden="true" />
          <div>
            <strong>場景由仰躺支撐面決定</strong>
            <p>目前不使用一般場景、固定構圖與場景建模匯入；可在下方調整光線。</p>
          </div>
        </section>
      ) : activePanel === 'space' ? (
        <section className="scene-editor-card scene-editor-card--base" aria-labelledby={`${headingId}-space`}>
          <header className="scene-editor-card-header">
            <h3 id={`${headingId}-space`}>場景設定</h3>
            {renderActions('space')}
          </header>
          {fixedActive ? (
            <div className="scene-editor-release-fixed">
              <p className="scene-editor-switch-note">固定構圖正在使用，解除後可選擇一般場景。</p>
              <button type="button" className="secondary" onClick={onReleaseFixed}>解除固定場景</button>
            </div>
          ) : importedActive ? <p className="scene-editor-switch-note">選擇地點後會切換為一般場景。</p> : null}
          <div className="scene-editor-fields scene-editor-fields--base">
            {renderFields(['sceneAttributeId', 'locationId'])}
          </div>
        </section>
      ) : activePanel === 'fixed' ? (
        isDuoMode ? (
          <section className="scene-editor-notice" aria-label="雙人固定構圖限制">
            <LockKeyhole size={17} aria-hidden="true" />
            <div>
              <strong>固定構圖目前適用於單人模式</strong>
              <p>雙人模式可使用一般場景或場景建模匯入，兩位人物共用同一組場景與光線。</p>
            </div>
          </section>
        ) : (
          <section className="scene-editor-card scene-editor-card--fixed" aria-labelledby={`${headingId}-fixed`}>
            <header className="scene-editor-card-header">
              <h3 id={`${headingId}-fixed`}>固定場景設定</h3>
              {renderActions('fixed')}
            </header>
            {!fixedActive ? <p className="scene-editor-switch-note">選擇固定場景後才會套用。</p> : null}
            <div className="scene-editor-fields scene-editor-fields--single">
              {renderFields(['fixedCompositionSetId'])}
            </div>
            {fixedActive && fixedDetails.length > 0 ? (
              <div className="scene-editor-fields scene-editor-fields--fixed-details">
                {renderFields(fixedDetails)}
              </div>
            ) : null}
            {poseStatus ? <p className="scene-editor-pose-status"><LockKeyhole size={16} aria-hidden="true" /><span>{poseStatus}</span></p> : null}
            {cameraStatus ? (
              <div className="scene-editor-camera-status">
                <p><LockKeyhole size={16} aria-hidden="true" /><span>{cameraStatus}</span></p>
                <button type="button" className="scene-editor-link" onClick={onShowPhotography}>
                  查看攝影設定<ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </section>
        )
      ) : (
        <section className="scene-editor-card scene-editor-card--imported" aria-labelledby={`${headingId}-imported`}>
          <header className="scene-editor-card-header">
            <h3 id={`${headingId}-imported`}>場景建模匯入</h3>
            <span className="scene-editor-badge">{importedActive ? importedEffective ? '已套用' : '已匯入・目前未使用' : '未套用'}</span>
          </header>
          {importedActive ? <p className="scene-editor-import-name">{importedLabel || '未命名世界場景'}</p> : null}
          <p className="scene-editor-card-copy">
            {importedActive
              ? '匯入包含場景與拍攝資訊，下方工作台光線仍可調整。'
              : '將場景建模目前的場景與拍攝資訊套用到工作台；下方光線仍可調整。'}
          </p>
          <div className="scene-editor-import-actions">
            <button type="button" className="secondary" onClick={onApplyImported}>套用 PAGE3 空景架構</button>
            {importedActive ? <button type="button" className="secondary subtle-action" onClick={onClearImported}>清除匯入</button> : null}
          </div>
        </section>
      )}

      <section className="scene-editor-lighting" aria-labelledby={`${headingId}-lighting`}>
        <header className="scene-editor-card-header">
          <h3 id={`${headingId}-lighting`}>光線設定</h3>
          {renderActions('light')}
        </header>
        <div className="scene-editor-light-grid">
          <section className="scene-editor-card" aria-labelledby={`${headingId}-ambient`}>
            <h4 id={`${headingId}-ambient`}>環境光</h4>
            <div className="scene-editor-fields scene-editor-fields--single">{renderFields(['lightingId'])}</div>
          </section>
          <section className="scene-editor-card" aria-labelledby={`${headingId}-subject-light`}>
            <h4 id={`${headingId}-subject-light`}>人物光線</h4>
            <div className="scene-editor-fields scene-editor-fields--single">{renderFields(['lightDirectionId'])}</div>
          </section>
        </div>
        <button type="button" className="secondary scene-editor-light-reference" onClick={onShowLightingReference}>
          <Sun size={18} aria-hidden="true" />查看光線定位對照
        </button>
      </section>

      <details className="scene-editor-visible-text">
        <summary>
          <span className="scene-editor-visible-text-heading">精確畫面文字<span className="scene-editor-badge">Z-Image</span></span>
          <span className="scene-editor-visible-text-state">{supineSurfaceOnly ? '暫不適用' : visibleTextEnabled ? '已啟用' : '未啟用'}</span>
          <ChevronDown size={17} className="scene-editor-details-chevron" aria-hidden="true" />
        </summary>
        <div className="scene-editor-visible-text-content">
          {supineSurfaceOnly
            ? <p className="scene-editor-card-copy">仰躺構圖目前不使用精確畫面文字，原設定保留。</p>
            : renderVisibleText()}
        </div>
      </details>
    </div>
  );
}
