export const PAGE1_POSE_SUBPANELS = [
  {
    id: 'single',
    label: '單人設置',
    // expression-pose-v2 P4 (Cooper 2026-10-20): 姿勢、手勢、表情、視線; the free composer is retired.
    description: '先選姿勢，再搭配手勢、表情與視線。手勢只在動作的雙手空著時出現；自拍請到 E 攝影成像的「拍攝方式」。',
    keys: [
      'specifiedActionId',
      'gestureId',
      'expressionId',
      'headPostureId',
      'gazeId',
    ],
  },
  {
    id: 'duo',
    label: '雙人設置',
    description: '設定雙人動作情境、雙人姿態基底與共享互動神情；雙人模式不使用單人 Pose Composer。',
    keys: [
      'duoPoseId',
      'duoPoseBaseId',
      'duoExpressionId',
    ],
  },
];

export const PAGE1_SECTION_SUBPANELS = {
  pose: PAGE1_POSE_SUBPANELS,
};

export function isPage1PoseSubpanelDisabled(panel, subjectCount = '1') {
  if (!panel) return false;
  if (panel.id === 'single') return subjectCount === '2';
  if (panel.id === 'duo') return subjectCount !== '2';
  return false;
}

export function resolvePage1ActiveSubpanel(activeSection, activeSubpanel, { subjectCount = '1' } = {}) {
  if (!activeSubpanel) return activeSubpanel;

  if (activeSection === 'pose' && isPage1PoseSubpanelDisabled(activeSubpanel, subjectCount)) {
    return PAGE1_POSE_SUBPANELS.find((panel) => !isPage1PoseSubpanelDisabled(panel, subjectCount)) || activeSubpanel;
  }

  return activeSubpanel;
}
