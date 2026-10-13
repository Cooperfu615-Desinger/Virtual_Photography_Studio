export const PAGE1_POSE_SUBPANELS = [
  {
    id: 'single',
    label: '單人設置',
    description: '設定單人表情與姿勢基底，可選指定動作或自由組合肢體、手部、道具及接觸支撐。指定動作保留表情與頭部方向，取消後恢復原選值；道具不會跟著這一區的全部隨機啟用。',
    keys: [
      'expressionId',
      'poseBaseId',
      'specifiedActionId',
      'poseOrientationId',
      'poseArrangementId',
      'poseHandId',
      'posePropId',
      'poseHeadId',
      'poseAnchorId',
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
