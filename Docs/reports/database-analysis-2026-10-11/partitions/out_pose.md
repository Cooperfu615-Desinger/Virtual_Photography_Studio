## Pose Composer 各層條目數
| 層 | 總數 | none/random | 實際選項 | uiHidden | deprecated | randomEligible=false | 有 legacyPromptAliases | 有 projectionByBucket | en 字數 min/中位/max |
|---|---|---|---|---|---|---|---|---|---|
| base | 7 | 2 | 5 | 0 | 0 | 0 | 0 | 0 | 2/2/2 |
| orientation | 5 | 2 | 3 | 0 | 0 | 0 | 0 | 3 | 5/5/7 |
| arrangement | 82 | 2 | 80 | 37 | 37 | 37 | 6 | 61 | 3/14/40 |
| hand | 72 | 2 | 70 | 22 | 22 | 30 | 6 | 5 | 5/17/59 |
| prop | 13 | 2 | 11 | 0 | 0 | 1 | 2 | 0 | 13/20/42 |
| head | 26 | 2 | 24 | 3 | 3 | 3 | 0 | 0 | 3/10/19 |
| anchor | 80 | 2 | 78 | 52 | 52 | 52 | 0 | 15 | 3/6/28 |

## 各姿勢基底的公開可選數 (排除 uiHidden、none/random；仿 Page1Workspace 過濾邏輯；anchor 未計場景類型限制)
| 基底 / 躺姿方向 | 肢體變化 | 手部 | 道具 | 頭部 | 接觸/支撐 | 理論組合數 (各層 +1 為「不選」) | 隨機可用 肢體/手/頭 |
|---|---|---|---|---|---|---|---|
| standing | 10 | 26 | 11 | 11 | 0 | 5,016 | 10/18/11 |
| sitting | 11 | 27 | 11 | 11 | 9 | 56,160 | 11/19/11 |
| kneeling | 8 | 29 | 11 | 14 | 0 | 5,535 | 8/21/14 |
| squatting | 8 | 13 | 11 | 14 | 0 | 3,375 | 8/7/14 |
| lying / lying-supine | 9 | 15 | 11 | 3 | 11 | 12,960 | 9/6/3 |
| lying / lying-side | 5 | 14 | 11 | 4 | 10 | 8,580 | 5/5/4 |
| lying / lying-prone | 5 | 14 | 11 | 3 | 10 | 6,864 | 5/5/3 |

理論組合總數(未扣除景別/視角相容限制) ≈ 98,490；各家族占比: standing 5.1%，sitting 57.0%，kneeling 5.6%，squatting 3.4%，lying/lying-supine 13.2%，lying/lying-side 8.7%，lying/lying-prone 7.0%

## uiHidden / legacy 累積 (依層)
- arrangement: 37 個 uiHidden → standing-deep-forward-lean, standing-back-lean, standing-turn-back, standing-contrapposto, standing-raised-foot, standing-soft-bent-knees, standing-back-facing-turn, standing-forward-toe-point, sitting-hands-behind-support, sitting-one-leg-relaxed, sitting-grounded-forward-lean, kneeling-puppy-crossed-hands-chin, kneeling-one-knee, kneeling-side, kneeling-elbow-support, kneeling-back-arched, squatting-hands-knees, squatting-compact, squatting-hug-knees, squatting-one-hand-ground, squatting-side-low, squatting-raised-heels, squatting-compact-hug-knees-variant, lying-natural, lying-on-back, lying-side, lying-prone, lying-natural-half-recline, lying-half-reclined, lying-languid, lying-side-knees-bent, lying-on-back-one-arm-overhead, lying-prone-elbow-prop, lying-diagonal-recline, lying-legs-bent-up, lying-wall-raised-legs, lying-prone-pillow-lookback
- hand: 22 個 uiHidden → selfie-mirror-phone-visible, hand-adjust-lower-body-garment, hands-grip-waistband, hands-on-waist, one-hand-chin, one-hand-forehead, one-hand-hair, hands-on-thighs, hands-on-cheeks, one-hand-chin-other-down, one-hand-adjust-glasses, one-hand-half-face-cover, both-hands-arrange-hair, one-hand-nape-hair-lift, one-hand-collarbone, one-hand-ground-one-leg, one-hand-knee-one-down, hands-clasped-front, one-hand-shoulder, both-hands-overhead, one-hand-ankle, hands-gathered-lower-abdomen
- head: 3 個 uiHidden → head-turned-away, head-over-shoulder, chin-tucked-shoulder-line
- anchor: 52 個 uiHidden → sitting-scene-seat, sitting-scene-raised-edge, shared-mirrored-steel-cube, shared-clear-acrylic-cube, standing-wall, standing-doorway, standing-table-edge, standing-railing, standing-chair-side, standing-window, standing-column, standing-vending-machine, standing-lean-railing, standing-lean-table-edge, standing-lean-doorway-shoulder, standing-lean-window-frame, standing-lean-column-side, standing-lean-chair-back, standing-lean-vending-machine, standing-lean-scene-object, sitting-floor, sitting-scene-appropriate-chair, sitting-chair-edge, sitting-wall-floor, sitting-bed-edge, sitting-table-edge, sitting-stairs, sitting-bar-stool, sitting-sofa-seat, sitting-window-sill, sitting-high-back-chair, kneeling-floor, kneeling-bed, kneeling-sofa-seat, kneeling-chair-front, kneeling-high-back-lean, kneeling-hands-ground, kneeling-high-back-front, kneeling-low-table-front, kneeling-bed-edge-lean, squatting-ground, squatting-wall, squatting-chair-front, squatting-low-step, squatting-railing, squatting-vending-machine, squatting-column, lying-bed, lying-sofa, lying-floor, lying-rug, lying-bed-edge
- prop: 0 個 uiHidden →

## poseComposerCompatibility.js 硬編碼 ID: 24 個；不存在於任何選項的 ID: 無
- 其中指向 uiHidden 選項: standing-turn-back, standing-back-facing-turn, kneeling-side, squatting-side-low, lying-side-knees-bent, lying-prone-pillow-lookback, hands-on-thighs, one-hand-ground-one-leg, one-hand-knee-one-down, one-hand-ankle, hands-gathered-lower-abdomen
- engine.js 以字串常數直接引用的姿勢選項 ID: 78/263 個 (共 110 次)；依層: {"arrangement":24,"hand":40,"prop":6,"anchor":8}；Page1Workspace.jsx 直接引用: 0 個

## zh 名稱重複 (同層)
- hand: |單手托下巴 → one-hand-support-chin, one-hand-chin-other-down

## 肢體變化依基底 (公開/含隱藏)
- standing: 公開 10 / 全部 18
- sitting: 公開 11 / 全部 14
- kneeling: 公開 8 / 全部 13
- squatting: 公開 8 / 全部 15
- lying: 公開 10 / 全部 24

- 公開肢體變化具 projectionByBucket: 42/42；缺少者:
- 公開手部具 visibleBuckets: 47/48；具 projectionByBucket: 5

## 雙人 (duoOptions.js) 與動作姿勢卡 (actionPoseCards.js)
- DUO_EXPRESSION_OPTIONS: 17 (實際 16)；uiHidden 8；en 字數 14/16/19
- DUO_INTERACTION_OPTIONS: 6 (實際 5)；uiHidden 0；en 字數 15/16/16
- DUO_POSE_BASE_OPTIONS: 9 (實際 8)；uiHidden 0；en 字數 7/8/12
- DUO_POSE_OPTIONS: 12 (實際 11)；uiHidden 0；en 字數 19/22/43
- ACTION_POSE_CARDS: 3；modes: single,duo；各 mode 數: single:3, duo:0