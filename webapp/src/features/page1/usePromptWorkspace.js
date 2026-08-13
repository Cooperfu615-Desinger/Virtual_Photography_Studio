import { useCallback, useEffect, useMemo, useState } from 'react';

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
  attachMidjourneySettingsToPrompt,
  createPromptGenerationLocks,
} from './midjourneyParameterState.js';
import { buildPage1ControlGroups } from './page1Selectors.js';

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

  const updateLocks = useCallback((updater) => {
    setPreviewRerollExclusion(null);
    setLocks((previousLocks) => {
      const candidateLocks = typeof updater === 'function'
        ? updater(previousLocks)
        : { ...previousLocks, ...updater };
      return transitionPage1Locks({
        previousLocks,
        candidateLocks,
        lockControls,
        activeLibrary,
      });
    });
  }, [activeLibrary, lockControls]);

  const rerollPreview = useCallback(() => {
    setPreviewRerollExclusion(previewPrompt?.selection || null);
    setPreviewGenerationNonce((current) => current + 1);
  }, [previewPrompt]);

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
