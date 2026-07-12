import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { normalizeLocks } from './lib/engine';
import {
  PAGE3_WORLD_SCENE_FIELD_CONFIG,
  PAGE3_WORLD_SCENE_FIELD_OPTIONS,
  buildPage3WorldSceneAnchor,
  buildPage3WorldSceneCinematicPrompt,
  buildPage1WorldSceneArchitecture,
  buildPage3WorldScenePrompt,
  buildPage3WorldSceneSummary,
  buildPage3WorldSceneWorldPrompt,
  createEmptyPage3WorldSceneProfile,
} from './lib/page3WorldScene';
import {
  buildCharacterCardPromptBundle,
  buildCharacterCardSavedCard,
  buildPage1LocksFromCharacterCardVariant,
  createEmptyCharacterCardVariant,
  getCharacterCardOptions,
  normalizeCharacterCardVariant,
} from './lib/characterCardLab';
import {
  buildActionPosePromptBundle,
  buildActionPoseSavedCard,
  buildPage1LocksFromActionPoseCard,
  createEmptyActionPoseProfile,
  getActionPoseCardById,
  normalizeActionPoseProfile,
} from './lib/actionPoseLab';
import { copyTextToClipboard } from './lib/clipboard';
import {
  buildRestoreLocks,
  createLineage,
  parseLocksFromStandardPrompt,
} from './features/saved-cards/cardCodec.js';
import { useFavoritesWorkspace } from './features/saved-cards/useFavoritesWorkspace.js';
import { usePromptWorkspace } from './features/page1/usePromptWorkspace.js';
import { buildPage3SavedCard } from './features/page3/page3SavedCard.js';
import { loadJsonStorage, loadStringStorage, saveJsonStorage } from './features/storage/browserStorage.js';
import './index.css';

const Page1Workspace = lazy(() => import('./components/Page1Workspace.jsx'));
const Page2Workspace = lazy(() => import('./components/Page2Workspace.jsx'));
const Page3Workspace = lazy(() => import('./components/Page3Workspace.jsx'));
const ActionPoseWorkspace = lazy(() => import('./components/ActionPoseWorkspace.jsx'));
const SavedCardsWorkspace = lazy(() => import('./components/SavedCardsWorkspace.jsx'));

const PAGE_MODE_KEY = 'vps.pageMode';
const PAGE2_PROFILE_KEY = 'vps.page2Profile';
const PAGE3_PROFILE_KEY = 'vps.page3Profile';
const ACTION_POSE_PROFILE_KEY = 'vps.actionPoseProfile';
const PAGE_MODE_COPY = {
  page1: {
    title: 'Prompt Control Deck',
    subtitle: '一個為個人創作流程設計的虛擬攝影 Prompt 生成工具，支援快速組合、批次生成與風格探索。',
  },
  page2: {
    title: 'Character Card Lab',
    subtitle: '選擇內建角色卡，整理髮型變化、預設服裝 layer 與可複製的角色 reference prompt。',
  },
  actionPose: {
    title: 'Action Pose Lab',
    subtitle: '建立可保存、可回填的動作姿勢卡，讓 PAGE1 的神情姿態輸出由完整 action prompt 接管。',
  },
  page3: {
    title: 'World Street Scene Builder',
    subtitle: '建立全球經典街景、城市空景與高視角地景 prompt，專注真實地點錨點與攝影語言。',
  },
  page4: {
    title: 'Saved Cards',
    subtitle: '集中查看已加入最愛的 Prompt 版本，保留三種輸出內容與一鍵複製流程。',
  },
};

function createEmptyPage3Profile() {
  return createEmptyPage3WorldSceneProfile();
}

function WorkspaceFallback() {
  return <div className="workspace-loading" role="status">載入工作區…</div>;
}

export default function App() {
  const importSavedCardsInputRef = useRef(null);
  const [copiedLabel, setCopiedLabel] = useState('');
  const [isImportPromptOpen, setIsImportPromptOpen] = useState(false);
  const [importPromptText, setImportPromptText] = useState('');
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);

  const showToast = useCallback((label) => {
    setCopiedLabel(label);
    window.setTimeout(() => setCopiedLabel(''), 1800);
  }, []);

  const {
    locks,
    lockControls,
    coreLockControls,
    characterLockControls,
    wardrobeLockControls,
    isOutfitPresetActive,
    isCloseupMode,
    isWormEyeAngle,
    closeupAllowedKeys,
    previewPrompt,
    updateLocks,
    rerollPreview,
  } = usePromptWorkspace();
  const {
    favoritePrompts,
    cloudAuth: favoriteCloudAuth,
    cloudSyncStatus: favoriteCloudSyncStatus,
    cloudLabel: favoriteCloudLabel,
    addFavoritePrompt,
    addFavoritePrompts,
    deleteFavoritePrompt,
    clearFavoritePrompts,
    signInFavorites,
    signOutFavorites,
  } = useFavoritesWorkspace({ showToast });
  const [pageMode, setPageMode] = useState(() => {
    const stored = loadStringStorage(PAGE_MODE_KEY, 'page1');
    return stored === 'page5' ? 'page1' : stored;
  });
  const characterCards = useMemo(() => getCharacterCardOptions(lockControls), [lockControls]);
  const [page2Profile, setPage2Profile] = useState(() => (
    normalizeCharacterCardVariant(loadJsonStorage(PAGE2_PROFILE_KEY, createEmptyCharacterCardVariant(characterCards)), characterCards)
  ));
  const normalizedPage2Profile = useMemo(() => normalizeCharacterCardVariant(page2Profile, characterCards), [page2Profile, characterCards]);
  const page2PromptBundle = useMemo(() => buildCharacterCardPromptBundle(characterCards, normalizedPage2Profile), [characterCards, normalizedPage2Profile]);
  const [page3Profile, setPage3Profile] = useState(() => loadJsonStorage(PAGE3_PROFILE_KEY, createEmptyPage3Profile()));
  const [actionPoseProfile, setActionPoseProfile] = useState(() => (
    normalizeActionPoseProfile(loadJsonStorage(ACTION_POSE_PROFILE_KEY, createEmptyActionPoseProfile()))
  ));
  const normalizedActionPoseProfile = useMemo(() => normalizeActionPoseProfile(actionPoseProfile), [actionPoseProfile]);
  const actionPosePromptBundle = useMemo(() => buildActionPosePromptBundle(normalizedActionPoseProfile), [normalizedActionPoseProfile]);

  useEffect(() => {
    window.localStorage.setItem(PAGE_MODE_KEY, pageMode);
  }, [pageMode]);

  useEffect(() => {
    saveJsonStorage(PAGE2_PROFILE_KEY, page2Profile);
  }, [page2Profile]);

  useEffect(() => {
    saveJsonStorage(PAGE3_PROFILE_KEY, page3Profile);
  }, [page3Profile]);

  useEffect(() => {
    saveJsonStorage(ACTION_POSE_PROFILE_KEY, actionPoseProfile);
  }, [actionPoseProfile]);

  const displayPrompts = favoritePrompts;
  const page3FieldOptions = PAGE3_WORLD_SCENE_FIELD_OPTIONS;
  const page3Summary = useMemo(() => buildPage3WorldSceneSummary(page3Profile), [page3Profile]);
  const page3Anchor = useMemo(() => buildPage3WorldSceneAnchor(page3Profile), [page3Profile]);
  const page3Prompt = useMemo(() => buildPage3WorldScenePrompt(page3Profile), [page3Profile]);
  const page3CinematicPrompt = useMemo(() => buildPage3WorldSceneCinematicPrompt(page3Profile), [page3Profile]);
  const page3WorldPrompt = useMemo(() => buildPage3WorldSceneWorldPrompt(page3Profile), [page3Profile]);

  const handleGenerate = useCallback(() => {
    if (!previewPrompt) return;
    const nextPrompt = {
      ...previewPrompt,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
    };
    nextPrompt.lineage = createLineage(nextPrompt);
    addFavoritePrompt(nextPrompt);
    showToast('目前 Prompt 已加入我的最愛');
  }, [addFavoritePrompt, previewPrompt, showToast]);

  const handleRerollPreview = useCallback(() => {
    rerollPreview();
    showToast('已依目前設定重新隨機生成');
  }, [rerollPreview, showToast]);

  const handleApplyPage3WorldSceneArchitecture = useCallback(() => {
    const architecture = buildPage1WorldSceneArchitecture(page3Profile);
    if (!architecture.text) {
      showToast('PAGE3 目前沒有可匯入的世界場景');
      return;
    }

    updateLocks((prev) => ({
      ...prev,
      locationId: '',
      fixedCompositionSetId: 'none',
      fixedSetPositionId: 'none',
      fixedSetCaptureModeId: 'photographer-shot',
      fixedSetPerformanceStateId: 'model-natural',
      importedWorldSceneMode: 'architecture',
      importedWorldSceneLabel: architecture.label,
      importedWorldSceneArchitectureText: architecture.text,
    }));
    showToast(`已套用 PAGE3 空景架構：${architecture.label}`);
  }, [page3Profile, showToast, updateLocks]);

  const handleApplyPreviewSelection = useCallback(() => {
    if (!previewPrompt?.selection) {
      showToast('目前沒有可回填的預覽選項');
      return;
    }
    const restoredLocks = buildRestoreLocks(previewPrompt.selection, lockControls);
    updateLocks(() => normalizeLocks(restoredLocks));
    showToast('已將目前預覽回填到所有選項');
  }, [lockControls, previewPrompt, showToast, updateLocks]);

  const handleApplyActionPoseCardToPage1 = useCallback((cardId, successLabel = '') => {
    const card = getActionPoseCardById(cardId);
    if (!card || card.mode !== 'single') {
      showToast('目前沒有可套用的單人動作卡');
      return false;
    }
    if (locks.subjectCount === '2') {
      showToast('單人動作卡暫不支援 PAGE1 雙人模式');
      return false;
    }
    const selectedSpecialSubject = lockControls
      .find((control) => control.key === 'specialSubjectId')
      ?.options?.find((option) => option.id === locks.specialSubjectId);
    if (selectedSpecialSubject?.specialSubject) {
      showToast('專用特殊角色暫不套用動作姿勢卡');
      return false;
    }

    updateLocks((prevLocks) => normalizeLocks(buildPage1LocksFromActionPoseCard(prevLocks, card.id)));
    setPageMode('page1');
    showToast(successLabel || `動作姿勢已套用到 PAGE1：${card.title}`);
    return true;
  }, [lockControls, locks.specialSubjectId, locks.subjectCount, showToast, updateLocks]);

  const handleApplySavedCardSelection = useCallback((prompt) => {
    if (!prompt?.selection) {
      showToast('這張卡片沒有可回填的選項設定');
      return;
    }

    if (prompt.source === 'actionPose') {
      handleApplyActionPoseCardToPage1(prompt.selection.actionPoseCardId, '已套用收藏動作卡到 PAGE1');
      return;
    }

    const restoredLocks = buildRestoreLocks(prompt.selection, lockControls);
    updateLocks(() => normalizeLocks(restoredLocks));
    setPageMode('page1');
    showToast('已套用收藏卡片的預覽選項');
  }, [handleApplyActionPoseCardToPage1, lockControls, showToast, updateLocks]);

  const handleDeletePrompt = useCallback((prompt) => {
    deleteFavoritePrompt(prompt.id);
  }, [deleteFavoritePrompt]);

  const handleDownloadAll = async (items = displayPrompts) => {
    if (items.length === 0) return;
    const { downloadSavedCardsArchive } = await import('./features/saved-cards/savedCardArchive.js');
    await downloadSavedCardsArchive(items);
  };

  const handleClearFavorites = () => {
    clearFavoritePrompts();
    showToast('Favorites 已清空');
  };

  const handleSignInFavorites = useCallback(async () => {
    if (await signInFavorites()) setIsSettingsMenuOpen(false);
  }, [signInFavorites]);

  const handleSignOutFavorites = useCallback(async () => {
    if (await signOutFavorites()) setIsSettingsMenuOpen(false);
  }, [signOutFavorites]);

  const handleOpenImportSavedCards = () => {
    importSavedCardsInputRef.current?.click();
  };

  const handleImportSavedCards = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const { parseSavedCardsArchive } = await import('./features/saved-cards/savedCardArchive.js');
      const importedPrompts = await parseSavedCardsArchive(file, lockControls);
      addFavoritePrompts(importedPrompts);
      showToast(`已匯入 ${importedPrompts.length} 張最愛卡片`);
    } catch {
      showToast('ZIP 格式錯誤，無法匯入 Favorites');
    }
  };

  const handleCopyText = async (label, text) => {
    if (!text) return;
    try {
      await copyTextToClipboard(text);
      setCopiedLabel(label);
      window.setTimeout(() => setCopiedLabel(''), 1800);
    } catch {
      setCopiedLabel('Copy failed');
      window.setTimeout(() => setCopiedLabel(''), 1800);
    }
  };

  const applyLocksToConsole = useCallback((nextLocks, successLabel) => {
    const restoredLocks = buildRestoreLocks(nextLocks, lockControls);
    updateLocks(() => normalizeLocks(restoredLocks));
    setPageMode('page1');
    showToast(successLabel);
  }, [lockControls, showToast, updateLocks]);

  const handleApplyImportedPrompt = () => {
    const { locks: parsedLocks, matchedControls } = parseLocksFromStandardPrompt(importPromptText, lockControls);
    if (matchedControls.length === 0) {
      showToast('沒有解析到可回填的標準欄位');
      return;
    }
    applyLocksToConsole(parsedLocks, `已回填 ${matchedControls.length} 個欄位到主控台`);
    setIsImportPromptOpen(false);
    setImportPromptText('');
  };

  const handleApplyPage2CharacterCard = useCallback(() => {
    updateLocks((prevLocks) => normalizeLocks(
      buildPage1LocksFromCharacterCardVariant(prevLocks, normalizedPage2Profile, characterCards)
    ));
    setPageMode('page1');
    showToast('角色卡設定已匯回 PAGE1');
  }, [characterCards, normalizedPage2Profile, showToast, updateLocks]);

  const handleApplyActionPoseToPage1 = useCallback(() => {
    handleApplyActionPoseCardToPage1(actionPosePromptBundle.card?.id);
  }, [actionPosePromptBundle.card?.id, handleApplyActionPoseCardToPage1]);

  const handleSavePage2Card = useCallback(() => {
    if (!page2PromptBundle.outputs.length) {
      showToast('請先選擇角色卡再加入 Saved Cards');
      return;
    }

    const nextCard = buildCharacterCardSavedCard(characterCards, normalizedPage2Profile, page2PromptBundle);
    addFavoritePrompt(nextCard);
    setPageMode('page4');
    showToast('角色卡 Prompt 已加入 Saved Cards');
  }, [addFavoritePrompt, characterCards, normalizedPage2Profile, page2PromptBundle, showToast]);

  const handleSaveActionPoseCard = useCallback(() => {
    if (!actionPosePromptBundle.card) {
      showToast('請先選擇動作卡再加入 Saved Cards');
      return;
    }

    const nextCard = buildActionPoseSavedCard(normalizedActionPoseProfile);
    if (!nextCard) {
      showToast('目前沒有可保存的動作姿勢卡');
      return;
    }
    addFavoritePrompt(nextCard);
    setPageMode('page4');
    showToast('動作姿勢卡已加入 Saved Cards');
  }, [actionPosePromptBundle.card, addFavoritePrompt, normalizedActionPoseProfile, showToast]);

  const handleSavePage3Card = useCallback(() => {
    if (!page3Prompt) {
      showToast('請先完成場景設定再加入 Saved Cards');
      return;
    }

    const nextCard = buildPage3SavedCard(
      page3Profile,
      page3Summary,
      page3Anchor,
      page3Prompt,
      page3CinematicPrompt,
      page3WorldPrompt
    );
    addFavoritePrompt(nextCard);
    setPageMode('page4');
    showToast('場景建模 Prompt 已加入 Saved Cards');
  }, [addFavoritePrompt, page3Anchor, page3CinematicPrompt, page3Profile, page3Prompt, page3Summary, page3WorldPrompt, showToast]);

  const pageHeaderCopy = PAGE_MODE_COPY[pageMode] || PAGE_MODE_COPY.page1;

  return (
    <div className="container">
      <header className="page-header">
        <div className="page-header-content">
          <p className="eyebrow">Virtual Photography Studio</p>
          <h1>{pageHeaderCopy.title}</h1>
          <p className="subtitle">{pageHeaderCopy.subtitle}</p>
          <div className="page-header-toolbar">
            <div className="page-mode-switch" role="tablist" aria-label="Page mode switch">
              <button
                type="button"
                className={pageMode === 'page1' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
                onClick={() => setPageMode('page1')}
              >
                Prompt 工作台
              </button>
              <button
                type="button"
                className={pageMode === 'page2' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
                onClick={() => setPageMode('page2')}
              >
                角色建模
              </button>
              <button
                type="button"
                className={pageMode === 'actionPose' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
                onClick={() => setPageMode('actionPose')}
              >
                動作姿勢
              </button>
              <button
                type="button"
                className={pageMode === 'page3' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
                onClick={() => setPageMode('page3')}
              >
                場景建模
              </button>
              <button
                type="button"
                className={pageMode === 'page4' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
                onClick={() => setPageMode('page4')}
              >
                Saved Cards
              </button>
            </div>

            <div className="site-settings">
              <button
                type="button"
                className="settings-trigger"
                aria-label="Open settings"
                aria-expanded={isSettingsMenuOpen}
                onClick={() => setIsSettingsMenuOpen((prev) => !prev)}
              >
                設置
              </button>
              {isSettingsMenuOpen ? (
                <div className="settings-menu">
                  <div className="settings-menu-title">Settings</div>
                  <div className={`settings-menu-status sync-status-${favoriteCloudSyncStatus}`}>
                    {favoriteCloudLabel}
                  </div>
                  {favoriteCloudAuth?.status === 'signed-in' ? (
                    <button className="secondary" onClick={handleSignOutFavorites}>
                      Sign Out Firebase
                    </button>
                  ) : (
                    <button className="secondary" onClick={handleSignInFavorites} disabled={favoriteCloudAuth?.status === 'disabled'}>
                      Sign In Firebase
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <Suspense fallback={<WorkspaceFallback />}>
        {pageMode === 'page1' ? (
          <Page1Workspace
            workspace={{
              coreLockControls,
              characterLockControls,
              wardrobeLockControls,
              locks,
              isCloseupMode,
              isWormEyeAngle,
              closeupAllowedKeys,
              isOutfitPresetActive,
              lockControls,
              previewPrompt,
            }}
            actions={{
              updateLocks,
              handleCopyText,
              handleGenerate,
              handleRerollPreview,
              handleApplyPreviewSelection,
              onApplyPage3WorldSceneArchitecture: handleApplyPage3WorldSceneArchitecture,
              showToast,
            }}
            importDialog={{
              isOpen: isImportPromptOpen,
              setIsOpen: setIsImportPromptOpen,
              text: importPromptText,
              setText: setImportPromptText,
              handleApply: handleApplyImportedPrompt,
            }}
          />
        ) : pageMode === 'page2' ? (
        <Page2Workspace
          characterCards={characterCards}
          profile={normalizedPage2Profile}
          setProfile={setPage2Profile}
          promptBundle={page2PromptBundle}
          onCopyText={handleCopyText}
          onSaveCard={handleSavePage2Card}
          onApplyToPage1={handleApplyPage2CharacterCard}
        />
      ) : pageMode === 'actionPose' ? (
        <ActionPoseWorkspace
          profile={normalizedActionPoseProfile}
          setProfile={setActionPoseProfile}
          promptBundle={actionPosePromptBundle}
          onCopyText={handleCopyText}
          onSaveCard={handleSaveActionPoseCard}
          onApplyToPage1={handleApplyActionPoseToPage1}
          canApplyToPage1={locks.subjectCount !== '2'}
        />
      ) : pageMode === 'page3' ? (
        <Page3Workspace
          fieldConfig={PAGE3_WORLD_SCENE_FIELD_CONFIG}
          fieldOptions={page3FieldOptions}
          profile={page3Profile}
          setProfile={setPage3Profile}
          summary={page3Summary}
          anchor={page3Anchor}
          prompt={page3Prompt}
          cinematicPrompt={page3CinematicPrompt}
          worldPrompt={page3WorldPrompt}
          onCopyText={handleCopyText}
          onSaveCard={handleSavePage3Card}
          createEmptyProfile={createEmptyPage3Profile}
        />
      ) : (
        <SavedCardsWorkspace
          favoritePrompts={favoritePrompts}
          displayPrompts={displayPrompts}
          handleDownloadAll={handleDownloadAll}
          handleClearFavorites={handleClearFavorites}
          importSavedCardsInputRef={importSavedCardsInputRef}
          handleOpenImportSavedCards={handleOpenImportSavedCards}
          handleImportSavedCards={handleImportSavedCards}
          handleDeletePrompt={handleDeletePrompt}
          handleApplySavedCardSelection={handleApplySavedCardSelection}
        />
        )}
      </Suspense>

      {copiedLabel ? (
        <div className="toast" role="status" aria-live="polite" aria-atomic="true">
          {copiedLabel}
        </div>
      ) : null}
    </div>
  );
}
