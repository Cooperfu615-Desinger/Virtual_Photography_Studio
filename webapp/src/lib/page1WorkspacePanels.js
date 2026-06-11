export function resolvePage1ActiveSubpanel(activeSection, activeSubpanel, { isSpecialSubjectMode = false } = {}) {
  if (!activeSubpanel) return activeSubpanel;

  if (activeSection === 'pose' && isSpecialSubjectMode && activeSubpanel.id === 'composer') {
    return activeSubpanel;
  }

  return activeSubpanel;
}
