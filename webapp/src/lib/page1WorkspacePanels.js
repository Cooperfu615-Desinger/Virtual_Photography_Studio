export const PAGE1_POSE_SUBPANELS = [
  {
    id: 'basic',
    label: '基礎設置',
    description: '快速設定神情眼神、雙人動作情境、雙人姿態基底與一般姿勢，適合先抓整體人物狀態。',
    keys: [
      'duoPoseId',
      'duoPoseBaseId',
      'duoExpressionId',
      'expressionId',
      'poseId',
    ],
  },
  {
    id: 'composer',
    label: '特殊設置',
    description: '用 Pose Composer 精準組合姿勢基底、肢體變化、手部 / 道具動作、頭部與接觸點；目前僅支援單人。',
    keys: [
      'poseBaseId',
      'poseArrangementId',
      'poseHandId',
      'poseHeadId',
      'poseAnchorId',
    ],
  },
];

export const PAGE1_SECTION_SUBPANELS = {
  pose: PAGE1_POSE_SUBPANELS,
};

export function resolvePage1ActiveSubpanel(activeSection, activeSubpanel, { isSpecialSubjectMode = false } = {}) {
  if (!activeSubpanel) return activeSubpanel;

  if (activeSection === 'pose' && isSpecialSubjectMode && activeSubpanel.id === 'composer') {
    return activeSubpanel;
  }

  return activeSubpanel;
}
