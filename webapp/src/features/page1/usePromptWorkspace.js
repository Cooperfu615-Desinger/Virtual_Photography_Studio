import { prepareCaptureEntry } from '../../lib/observationCaptureImport.js';
import { rerollCapture, CAPTURE_GROUPS } from '../../lib/observationCaptureMode.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  createEmptyLocks,
  generatePrompts,
  getCloseupAllowedKeys,
  getLockControls,
  getSceneDependentOptions,
  isCloseupModeFramingId,
  isWormEyeAngleId,
  normalizeLocks,
  sanitizeLocksForCloseupMode,
} from '../../lib/engine.js';
import { loadJsonStorage, saveJsonStorage } from '../storage/browserStorage.js';
import { transitionPage1Locks } from './lockTransitions.js';
import { reconcilePage1SingleWardrobeLocks } from './page1WardrobeExclusivity.js';
import {
  isSupinePoseSelection,
  SUPINE_SCENE_RESTORE_KEYS,
} from '../../lib/engine/poseScenePolicy.js';
import {
  attachMidjourneySettingsToPrompt,
  createPromptGenerationLocks,
} from './midjourneyParameterState.js';
import { buildPage1ControlGroups } from './page1Selectors.js';
import { getSpecifiedAction } from '../../lib/engine/specifiedActions.js';

export const LOCKS_STORAGE_KEY = 'vps.locks';
const EMPTY_LIBRARY = Object.freeze([]);

export function usePromptWorkspace() {
  const activeLibrary = EMPTY_LIBRARY;
  const lockControls = useMemo(() => getLockControls(activeLibrary), [activeLibrary]);
  const [locks, setLocks] = useState(() => {
    const emptyLocks = createEmptyLocks();
    const normalizedLocks = sanitizeLocksForCloseupMode(
      normalizeLocks(loadJsonStorage(LOCKS_STORAGE_KEY, emptyLocks)),
      lockControls,
    );
    return reconcilePage1SingleWardrobeLocks({
      previousLocks: emptyLocks,
      candidateLocks: normalizedLocks,
      lockControls,
    });
  });
  const [previewGenerationNonce, setPreviewGenerationNonce] = useState(0);
  const [previewRerollExclusion, setPreviewRerollExclusion] = useState(null);
  const supineSceneRestoreRef = useRef(null);

  const sceneDependentOptions = useMemo(
    () => getSceneDependentOptions(activeLibrary, locks),
    [activeLibrary, locks],
  );
  const isCloseupMode = useMemo(
    () => isCloseupModeFramingId(locks.framingId, lockControls),
    [lockControls, locks.framingId],
  );
  const isWormEyeAngle = useMemo(
    () => isWormEyeAngleId(locks.angleId, lockControls),
    [lockControls, locks.angleId],
  );
  const closeupAllowedKeys = useMemo(
    () => getCloseupAllowedKeys(locks.framingId, lockControls),
    [lockControls, locks.framingId],
  );
  const controlGroups = useMemo(
    () => buildPage1ControlGroups({ lockControls, locks, sceneDependentOptions }),
    [lockControls, locks, sceneDependentOptions],
  );
  const promptGenerationLockSignature = useMemo(
    () => JSON.stringify(createPromptGenerationLocks(locks)),
    [locks],
  );
  const previewPromptBase = useMemo(() => {
    const promptGenerationLocks = JSON.parse(promptGenerationLockSignature);
    const [prompt] = generatePrompts(1, promptGenerationLocks, activeLibrary, {
      excludePreviousSelection: previewRerollExclusion,
      previewGenerationNonce,
    });
    return prompt || null;
  }, [activeLibrary, promptGenerationLockSignature, previewGenerationNonce, previewRerollExclusion]);
  const previewPrompt = useMemo(
    () => attachMidjourneySettingsToPrompt(previewPromptBase, locks),
    [locks, previewPromptBase],
  );

  useEffect(() => {
    saveJsonStorage(LOCKS_STORAGE_KEY, locks);
  }, [locks]);

  const updateLocks = useCallback((updater, { restoringSelection = false, discardSupineSceneRestore = false } = {}) => {
    setPreviewRerollExclusion(null);
    setLocks((previousLocks) => {
      let candidateLocks = typeof updater === 'function'
        ? updater(previousLocks)
        : { ...previousLocks, ...updater };

      if (!restoringSelection && previousLocks.captureMode !== 'observation' && candidateLocks.captureMode === 'observation') {
        candidateLocks = { ...candidateLocks, observationCapture: prepareCaptureEntry(candidateLocks.observationCapture, previewPromptBase) };
      }

      // An explicit global clear must not recover the scene it just removed.
      if (discardSupineSceneRestore) supineSceneRestoreRef.current = null;

      const enteringSupine = !isSupinePoseSelection(previousLocks) && isSupinePoseSelection(candidateLocks);
      const leavingSupine = isSupinePoseSelection(previousLocks) && !isSupinePoseSelection(candidateLocks);
      const previousSpecifiedAction = getSpecifiedAction(previousLocks, { ignoreOwners: true });
      const candidateSpecifiedAction = getSpecifiedAction(candidateLocks, { ignoreOwners: true });
      const hasStoredSpecifiedAction = Boolean(previousSpecifiedAction || candidateSpecifiedAction);

      if (!restoringSelection && !previousSpecifiedAction && candidateSpecifiedAction
        && isSupinePoseSelection(previousLocks) && supineSceneRestoreRef.current) {
        candidateLocks = candidateSpecifiedAction.meta.supineGroundOnly
          ? { ...candidateLocks, specifiedActionSceneRestore: supineSceneRestoreRef.current }
          : { ...candidateLocks, ...supineSceneRestoreRef.current };
        supineSceneRestoreRef.current = null;
      }

      if (enteringSupine && !hasStoredSpecifiedAction) {
        supineSceneRestoreRef.current = Object.fromEntries(
          SUPINE_SCENE_RESTORE_KEYS.map((key) => [key, previousLocks[key]]),
        );
      }

      if (leavingSupine && supineSceneRestoreRef.current && !hasStoredSpecifiedAction) {
        candidateLocks = {
          ...candidateLocks,
          ...supineSceneRestoreRef.current,
        };
        supineSceneRestoreRef.current = null;
      }
      if (previousSpecifiedAction && !candidateSpecifiedAction
        && isSupinePoseSelection(candidateLocks)) {
        supineSceneRestoreRef.current = previousLocks.specifiedActionSceneRestore
          || Object.fromEntries(SUPINE_SCENE_RESTORE_KEYS.map(key => [key, previousLocks[key]]));
      }

      return transitionPage1Locks({
        previousLocks,
        candidateLocks,
        lockControls,
        activeLibrary,
        restoringSelection,
      });
    });
  }, [activeLibrary, lockControls, previewPromptBase]);

  const rerollPreview = useCallback(() => {
    if (locks.captureMode === 'observation') {
      if (!CAPTURE_GROUPS.every(g => locks.observationCapture?.fixed?.[g.key])) updateLocks({ observationCapture: rerollCapture(locks.observationCapture).profile });
      return;
    }
    setPreviewRerollExclusion(previewPrompt?.selection || null);
    setPreviewGenerationNonce((current) => current + 1);
  }, [previewPrompt, locks, updateLocks]);

  return {
    activeLibrary,
    locks,
    lockControls,
    coreLockControls: controlGroups.coreLockControls,
    characterLockControls: controlGroups.characterLockControls,
    wardrobeLockControls: controlGroups.wardrobeLockControls,
    isOutfitPresetActive: controlGroups.isOutfitPresetActive,
    isCloseupMode,
    isWormEyeAngle,
    closeupAllowedKeys,
    previewPrompt,
    updateLocks,
    rerollPreview,
  };
}
