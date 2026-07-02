export const PAGE1_POSE_SUBPANELS = [
  {
    id: 'single',
    label: '單人設置',
    description: '設定單人神情眼神，並用 Pose Composer 組合姿勢基底、肢體變化、手部 / 道具動作、頭部方向與接觸支撐。',
    keys: [
      'expressionId',
      'poseBaseId',
      'poseArrangementId',
      'poseHandId',
      'poseHeadId',
      'poseAnchorId',
    ],
  },
  {
    id: 'duo',
    label: '雙人設置',
    description: '設定雙人動作情境、雙人姿態基底與共享神情眼神；雙人模式不使用單人 Pose Composer。',
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
