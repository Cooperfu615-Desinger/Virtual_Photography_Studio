export function resolvePage1ActiveSubpanel(activeSection, activeSubpanel, { isSpecialSubjectMode = false } = {}) {
  if (!activeSubpanel) return activeSubpanel;

  if (activeSection === 'pose' && isSpecialSubjectMode && activeSubpanel.id === 'composer') {
    return {
      ...activeSubpanel,
      description: '特殊角色模式下，這裡提供特殊動作設定，可指定抽煙、自拍、道具互動或完整身體動作。',
      keys: ['specialActionId'],
    };
  }

  return activeSubpanel;
}
