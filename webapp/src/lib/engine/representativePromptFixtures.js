/**
 * Deterministic PAGE1 prompt scenarios used by contract and regression audits.
 *
 * A string lock value is a stable raw id. `{ byZh }` resolves through the
 * public control catalog, keeping long generated ids out of these fixtures.
 * Expectations use case-insensitive literal fragments on purpose: they pin
 * important public behavior without snapshotting every punctuation choice.
 */
const FIXED_COMPOSITION_WARDROBE_BASE_LOCKS = Object.freeze({
  subjectCount: '1',
  fixedCompositionSetId: { byZh: '暖灰泥黑絲絨工業沙發棚' },
  fixedSetPositionId: { byZh: '自由場景互動' },
  fixedSetCaptureModeId: { byZh: '攝影師拍攝' },
  fixedSetPerformanceStateId: { byZh: '模型自然發揮' },
});

export const REPRESENTATIVE_PROMPT_FIXTURES = Object.freeze([
  {
    id: 'normal-single',
    title: 'Normal single portrait with separate wardrobe',
    mode: 'single',
    seed: 'prompt-contract-normal-single-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
      angleId: { byZh: '平視高度鏡頭' },
      orbitId: { byZh: '左前 45 度' },
      bodyTypeId: { byZh: '性感曲線身形' },
      hairstyleId: { byZh: '濕潤感長波浪' },
      hairColorId: { byZh: '自然黑' },
      topId: { byZh: '棉質細肩背心' },
      topColorId: { byZh: '白色' },
      pantsId: { byZh: '直筒牛仔褲' },
      bottomColorId: { byZh: '深藍色' },
      poseBaseId: { byZh: '站姿' },
      poseArrangementId: { byZh: '自然站姿' },
      locationId: { byZh: '室內：深邃黑幕' },
      lightingId: { byZh: '晴朗白日' },
      lightDirectionId: { byZh: '側向柔光' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: ['cotton camisole', 'straight-leg jeans', 'horizonless seamless matte deep black'],
      },
      zImagePrompt: {
        includes: ['cotton camisole', 'straight-leg jeans', 'horizonless seamless matte deep black'],
      },
      midjourneyPrompt: {
        includes: ['cotton camisole', 'straight-leg jeans', 'horizonless seamless matte deep black'],
      },
    },
  },
  {
    id: 'normal-single-ai-compression-source-retention',
    title: 'AI compression retains composition, facial expression, and imaging source anchors',
    mode: 'single',
    seed: 'prompt-contract-ai-compression-source-retention-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '中景鏡頭 (Medium Shot)' },
      angleId: { byZh: '高位俯視鏡頭' },
      orbitId: { byZh: '右後 225 度' },
      bodyTypeId: { byZh: '性感曲線身形' },
      facialFeaturesId: { byZh: '成熟性感臉' },
      hairstyleId: { byZh: '直髮：日式瀏海' },
      hairColorId: { byZh: '柔霧黑茶' },
      expressionId: { byZh: '俏皮忍笑' },
      poseBaseId: { byZh: '坐姿' },
      poseArrangementId: { byZh: '開闊自信坐姿' },
      poseHeadId: { byZh: '頭部自然朝向鏡頭' },
      outfitPresetId: { byZh: '套裝：皮革馬甲束腰' },
      locationId: { byZh: '室內：廢棄校舍保健室' },
      lightingId: { byZh: '室內陰影日光' },
      lightDirectionId: { byZh: '百葉窗條紋投影光' },
      styleId: { byZh: '上田義彥｜靜默自然暗調' },
      lensId: { byZh: '微距鏡頭 Macro' },
      opticalEffectId: { byZh: '前景遮擋散景' },
      filmId: { byZh: '跨沖霓虹剪影濾鏡' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: [
          'young seductive alluring beauty face',
          'playful restrained smile, relaxed brows, gently narrowed eyes, pressed lips, subtly lifted mouth corners',
          'macro lens',
          'neon cross-processed rendering',
        ],
      },
      zImagePrompt: {
        includes: [
          'young seductive alluring beauty face',
          'playful restrained smile, relaxed brows, gently narrowed eyes, pressed lips, subtly lifted mouth corners',
          'macro lens',
          'neon cross-processed rendering',
        ],
      },
      midjourneyPrompt: {
        includes: [
          'Waist-up portrait, high angle, looking down, rear-right three-quarter view',
          'A 20s seductive stunning Japanese woman',
          'full bust, narrow defined waist, flat abdomen',
          'softly defined oval face, upturned eyes with arched brows, clear nose bridge and full shaped lips',
          'playful restrained smile',
          'relaxed brows',
          'gently narrowed eyes',
          'pressed lips',
          'subtly lifted mouth corners',
          'straight hair with Japanese bangs',
          'black-tea brown hair',
          'structured opaque leather corset lingerie set',
          'matching low-rise high-cut leather briefs',
          'abandoned school infirmary room',
          'privacy curtain',
          'indoor shaded daylight environment',
          'window-blind stripe light across the subject',
          'Yoshihiko Ueda-inspired',
          'macro lens',
          'blurred foreground occlusion near the lens',
          'neon cross-processed rendering',
        ],
        excludes: [
          '20s Japanese or Korean woman, seductive editorial presence',
          'complete outfit',
          'locked',
          'controlled by',
          'selection control',
        ],
      },
      chestUpMjPortraitPrompt: {
        includes: [
          'Chest-up editorial portrait with the head, both shoulders, upper chest, and neckline clearly visible',
          'A 20s seductive stunning Japanese woman',
          'structured opaque leather corset lingerie set',
          'abandoned school infirmary room',
          'Yoshihiko Ueda-inspired',
          'macro lens',
        ],
        excludes: [
          '20s Japanese or Korean woman, seductive editorial presence',
          'complete outfit',
          'locked',
          'controlled by',
          'selection control',
        ],
      },
    },
  },
  {
    id: 'z-image-turbo-strict-side-real-generation',
    title: 'Z-Image Turbo uses real-generation-tested high-angle strict-side geometry',
    mode: 'single',
    seed: 'z-image-turbo-strict-side-real-generation-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '牛仔中景 (Cowboy Shot)' },
      angleId: { byZh: '高位俯視鏡頭' },
      orbitId: { byZh: '右側 270 度' },
      bodyTypeId: { byZh: '柔和沙漏身形' },
      hairstyleId: { byZh: '蓬鬆高馬尾' },
      hairColorId: { byZh: '玫瑰可可棕' },
      expressionId: { byZh: '俏皮忍笑' },
      poseBaseId: { byZh: '站姿' },
      poseArrangementId: { byZh: '自然站姿' },
      poseHandId: { byZh: '雙手抓住褲腰' },
      poseHeadId: { byZh: '低頭看向手部' },
      specialOutfitId: { byZh: '酒紅格紋吊帶牛仔短裙長靴造型' },
      importedWorldSceneMode: 'architecture',
      importedWorldSceneLabel: '巴黎｜艾菲爾鐵塔 Trocadéro 台階',
      importedWorldSceneArchitectureText: 'world-scene architecture for the portrait: Paris, Trocadero, Trocadero steps facing the Eiffel Tower stays visible around and behind the subject; the portrait subject remains the main subject while the selected district',
      lightingId: { byZh: '夏日深藍積雲' },
      lightDirectionId: { byZh: '硬質晴光' },
      styleId: { byZh: '川內倫子｜輕盈日常微光' },
      apertureId: { byZh: 'f/2.8 淺景深' },
      shutterId: { byZh: '1/60s 背景動態拖影' },
      filmId: { byZh: '富士 Provia 清透明亮' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: [
          'Knee-up cowboy shot, high angle, looking down, right profile view',
          'both hands gripping the front waistband or belt loops, elbows angled outward',
        ],
        excludes: ['The camera sees only the right side of her body'],
      },
      zImagePrompt: {
        includes: [
          'Knee-up cowboy shot.',
          'The camera is positioned clearly above the woman and tilted downward toward her, revealing the top planes of her shoulders and waistband.',
          'She stands completely sideways, facing the left edge of the image.',
          'The camera sees only the right side of her body.',
          'Her right shoulder fully hides her left shoulder, and her right hip fully hides her left hip',
          'This is a strict 90-degree lateral body view.',
          'both hands gripping the front waistband or belt loops, elbows angled outward',
          'both hands meet at the front waistband and overlap in depth from this side view',
        ],
        excludes: ['high angle, looking down', 'right profile view', 'visually overlaps the far left'],
      },
      midjourneyPrompt: {
        includes: [
          'Knee-up cowboy shot, high angle, looking down, right profile view',
          'both hands gripping the front waistband or belt loops, elbows angled outward',
        ],
        excludes: ['The camera sees only the right side of her body'],
      },
    },
  },
  {
    id: 'latex-mirror-catsuit-outfit-preset',
    title: 'Latex outfit preset preserves mirror gloss and uninterrupted second-skin coverage',
    mode: 'single',
    seed: 'prompt-contract-latex-mirror-catsuit-v2',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
      outfitPresetId: { byZh: '套裝：亮面乳膠束帶' },
      outfitPresetPrimaryColorId: { byZh: '黑色' },
      outfitPresetContrastColorId: { byZh: '紅色' },
      locationId: { byZh: '室內：深邃黑幕' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: [
          'opaque mirror-polished latex full-body catsuit',
          'vacuum-tight second-skin fit',
          'continuous unbroken coverage from the fitted collar and long sleeves through the torso and hips to the full-length legs',
          'sharp mirror reflections and bright specular highlights',
          'surface-mounted jewelry-like accents over the uninterrupted latex',
        ],
      },
      zImagePrompt: {
        includes: [
          'mirror-polished latex full-body catsuit',
          'sharp mirror reflections',
          'vacuum-tight second-skin fit',
          'full-length legs',
        ],
      },
      midjourneyPrompt: {
        includes: [
          'mirror-polished latex full-body catsuit',
          'sharp mirror reflections',
          'vacuum-tight second-skin fit',
          'full-length legs',
        ],
      },
    },
  },
  {
    id: 'bdsm-leather-harness-outfit-preset',
    title: 'BDSM outfit preset preserves its leather lingerie base and harness map',
    mode: 'single',
    seed: 'prompt-contract-bdsm-leather-harness-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
      outfitPresetId: { byZh: '套裝：BDSM 束縛' },
      outfitPresetPrimaryColorId: { byZh: '深棕色' },
      outfitPresetContrastColorId: { byZh: '黑色' },
      locationId: { byZh: '室內：深邃黑幕' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: [
          'BDSM-inspired leather lingerie harness set',
          'structured underwire leather bra with a deep demi-cup neckline',
          'matching low-rise high-cut leather briefs',
          'shoulders, underbust, waist, hips and upper thighs',
        ],
      },
      zImagePrompt: {
        includes: ['leather lingerie harness set', 'low-rise high-cut leather briefs'],
      },
      midjourneyPrompt: {
        includes: [
          'structured underwire leather bra with a deep demi-cup neckline',
          'vertical side straps linking the bra to hip and garter bands',
          'matching low-rise high-cut leather briefs',
        ],
      },
    },
  },
  {
    id: 'leather-corset-outfit-preset',
    title: 'Leather corset outfit preset preserves corsetry and matching bottoms',
    mode: 'single',
    seed: 'prompt-contract-leather-corset-outfit-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
      outfitPresetId: { byZh: '套裝：皮革馬甲束腰' },
      outfitPresetPrimaryColorId: { byZh: '紅色' },
      outfitPresetContrastColorId: { byZh: '黑色' },
      locationId: { byZh: '室內：深邃黑幕' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: [
          'structured opaque leather corset lingerie set',
          'sculpted underwire cups and a low sweetheart neckline',
          'sheer lace or mesh side inserts revealing deliberate skin panels',
          'matching low-rise high-cut leather briefs with small lace insets',
        ],
      },
      zImagePrompt: {
        includes: ['leather corset lingerie set', 'low sweetheart neckline', 'low-rise high-cut leather briefs'],
      },
      midjourneyPrompt: {
        includes: ['leather corset lingerie set', 'low sweetheart neckline', 'low-rise high-cut leather briefs'],
      },
    },
  },
  {
    id: 'pose-composer-canonical',
    title: 'Pose Composer canonical grammar shared by all public outputs',
    mode: 'single',
    seed: 'prompt-contract-pose-composer-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
      poseBaseId: { byZh: '坐姿' },
      poseArrangementId: { byZh: '自然坐姿' },
      poseHandId: { byZh: '鏡子自拍' },
      poseHeadId: { byZh: '頭部微微側傾' },
      poseAnchorId: { byZh: '坐在單人雕花絨布椅' },
      locationId: { byZh: '室內：英倫復古窗邊房間' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: ['She has her head slightly tilted, one hand holding a visible phone toward a mirror for a mirror selfie, with the phone overlapping the face or positioned beside it in the reflection, and presents a natural seated pose on an ornate single velvet armchair in a relaxed lounging posture.'],
        excludes: ['She has holding', 'with lounging', 'let the image model choose'],
      },
      zImagePrompt: {
        includes: ['She has her head slightly tilted, one hand holding a visible phone toward a mirror for a mirror selfie, with the phone overlapping the face or positioned beside it in the reflection, and presents a natural seated pose on an ornate single velvet armchair in a relaxed lounging posture.'],
        excludes: ['She has holding', 'with lounging', 'let the image model choose'],
      },
      midjourneyPrompt: {
        includes: ['She has her head slightly tilted, one hand holding a visible phone toward a mirror for a mirror selfie, with the phone overlapping the face or positioned beside it in the reflection, and presents a natural seated pose on an ornate single velvet armchair in a relaxed lounging posture.'],
        excludes: ['She has holding', 'with lounging', 'let the image model choose'],
      },
    },
  },
  {
    id: 'pose-composer-half-reclining-b2',
    title: 'Medium half-reclining pose keeps natural support without naming a support object',
    mode: 'single',
    seed: 'prompt-contract-pose-half-reclining-b2-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '中景鏡頭 (Medium Shot)' },
      poseBaseId: { byZh: '躺姿' },
      poseArrangementId: { byZh: '自然半躺' },
      poseHandId: { byZh: '整理下身' },
      poseHeadId: { byZh: '頭部微微後仰' },
      poseAnchorId: { byZh: '自然受支撐' },
      locationId: { byZh: '戶外：台北西門町街頭' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: ['She has her head tilted slightly backward with the chin softly lifted, one hand adjusting the lower-body garment at the waistband, and presents a relaxed half-reclining pose with the upper body naturally supported.'],
        excludes: ['half-reclined lying pose', 'transparent acrylic cube plinth', 'mirrored stainless-steel cube plinth'],
      },
      zImagePrompt: {
        includes: ['She has her head tilted slightly backward with the chin softly lifted, one hand adjusting the lower-body garment at the waistband, and presents a relaxed half-reclining pose with the upper body naturally supported.'],
        excludes: ['half-reclined lying pose', 'transparent acrylic cube plinth', 'mirrored stainless-steel cube plinth'],
      },
      midjourneyPrompt: {
        includes: ['She has her head tilted slightly backward with the chin softly lifted, one hand adjusting the lower-body garment at the waistband, and presents a relaxed half-reclining pose with the upper body naturally supported.'],
        excludes: ['half-reclined lying pose', 'transparent acrylic cube plinth', 'mirrored stainless-steel cube plinth'],
      },
    },
  },
  {
    id: 'pose-composer-random-selfie-orbit',
    title: 'Random selfie hand clears an incompatible locked rear orbit',
    mode: 'single',
    seed: 'prompt-contract-random-selfie-orbit-p1-22',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
      angleId: { byZh: '平視高度鏡頭' },
      orbitId: { byZh: '背面 180 度' },
      bodyTypeId: { byZh: '一般基本體型' },
      poseBaseId: { byZh: '站姿' },
      poseArrangementId: { byZh: '自然站姿' },
      poseHandId: { byZh: '隨機' },
      poseHeadId: { byZh: '頭部自然朝向鏡頭' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: ['front-camera self-shot with her right arm extended to hold the phone'],
        excludes: ['back view', 'rear view', 'from behind'],
      },
      zImagePrompt: {
        includes: ['front-camera self-shot with her right arm extended to hold the phone'],
        excludes: ['back view', 'rear view', 'from behind'],
      },
      midjourneyPrompt: {
        includes: ['front-camera self-shot with her right arm extended to hold the phone'],
        excludes: ['back view', 'rear view', 'from behind'],
      },
    },
  },
  {
    id: 'character-card',
    title: 'Formal character card identity and wardrobe',
    mode: 'single',
    seed: 'prompt-contract-character-card-v1',
    locks: {
      subjectCount: '1',
      characterProfileId: 'character-rika',
      framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
      locationId: { byZh: '室內：英倫復古窗邊房間' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: ['Character Profile Card:\n11_Rika', 'cropped white short-sleeve baby tee'],
        excludes: ['Identity and body:'],
      },
      zImagePrompt: {
        includes: ['cropped white short-sleeve baby tee', 'low-rise light-wash blue jeans'],
      },
      midjourneyPrompt: {
        includes: ['cropped white short-sleeve baby tee', 'low-rise light-wash blue jeans'],
      },
      fullBodyCharacterPrompt: {
        includes: ['Character Profile Card:\n11_Rika', 'white low-top sneakers'],
      },
    },
  },
  {
    id: 'character-card-new-batch',
    title: 'New-batch formal character card preserves identity anchors and full wardrobe',
    mode: 'single',
    seed: 'prompt-contract-character-card-new-batch-v1',
    locks: {
      subjectCount: '1',
      characterProfileId: 'character-kaori',
      framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
      locationId: { byZh: '室內：深邃黑幕' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: ['Character Profile Card:\n30_Kaori', 'long angular oval face with high cheekbones', 'black leather biker jacket'],
        excludes: ['Identity and body:'],
      },
      zImagePrompt: {
        includes: ['elongated dark-brown sharply lifted almond eyes', 'black leather biker jacket', 'black high-rise leather skinny pants'],
      },
      midjourneyPrompt: {
        includes: ['high narrow straight nose', 'black leather biker jacket', 'black lace-up combat boots'],
      },
      fullBodyCharacterPrompt: {
        includes: ['Character Profile Card:\n30_Kaori', 'complete figure visible from head to toe', 'black lace-up combat boots'],
      },
    },
  },
  {
    id: 'special-outfit',
    title: 'Single subject with a complete special outfit',
    mode: 'single',
    seed: 'prompt-contract-special-outfit-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
      specialOutfitId: { byZh: '白襯衫黑色長裙細領帶造型' },
      locationId: { byZh: '室內：深邃黑幕' },
      poseBaseId: { byZh: '站姿' },
      poseArrangementId: { byZh: '自然站姿' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: ['Full outfit:', 'voluminous black ankle-length skirt', 'slim black scarf tie or lanyard'],
      },
      zImagePrompt: {
        includes: ['voluminous black ankle-length skirt', 'slim black scarf tie or lanyard'],
      },
      midjourneyPrompt: {
        includes: ['voluminous black ankle-length skirt'],
      },
      fullBodyCharacterPrompt: {
        includes: ['black soft shoulder tote', 'black lace-up leather shoes'],
      },
    },
  },
  {
    id: 'duo',
    title: 'Duo with role-bound complete looks',
    mode: 'duo',
    seed: 'prompt-contract-duo-v1',
    locks: {
      subjectCount: '2',
      framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
      specialOutfitAId: { byZh: '藍灰長外套蕾絲胸衣寬褲造型' },
      specialOutfitBId: { byZh: '米色潑染破壞工裝套裝造型' },
      duoExpressionId: { byZh: '曖昧對視｜性感張力' },
      duoPoseId: { byZh: '充滿情慾的時尚寫真' },
      duoPoseBaseId: { byZh: '站姿' },
      locationId: { byZh: '室內：現代高樓公寓客廳' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: ['Woman 1:', 'Woman 2:', 'avant-garde blue-gray tailored street look', 'distressed painter-workwear street look'],
      },
      zImagePrompt: {
        includes: ['Woman 1 has', 'Woman 2 has', 'avant-garde blue-gray tailored street look', 'distressed painter-workwear street look'],
      },
      midjourneyPrompt: {
        includes: ['First woman', 'Second woman', 'blue-gray', 'painter-workwear'],
      },
    },
  },
  {
    id: 'fixed-composition',
    title: 'Fixed composition set preserves separate top and bottom wardrobe across primary outputs',
    mode: 'single',
    seed: 'prompt-contract-fixed-composition-v1',
    locks: {
      subjectCount: '1',
      fixedCompositionSetId: { byZh: '暖灰泥黑絲絨工業沙發棚' },
      fixedSetPositionId: { byZh: '自由場景互動' },
      fixedSetCaptureModeId: { byZh: '自然自拍感' },
      fixedSetPerformanceStateId: { byZh: '慵懶無力感' },
      angleId: { byZh: '肩部高度鏡頭' },
      orbitId: { byZh: '右側 270 度' },
      topId: { byZh: '棉質細肩背心' },
      pantsId: { byZh: '直筒牛仔褲' },
      poseBaseId: { byZh: '站姿' },
      poseArrangementId: { byZh: '自然站姿' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: [
          'cotton camisole top',
          'straight-leg jeans',
          'real-scale compact editorial lounge set',
          'black velvet sofa',
        ],
        excludes: ['fixed-set rule:', 'preserve anchors:'],
      },
      zImagePrompt: {
        includes: [
          'cotton camisole top',
          'straight-leg jeans',
          'She presents a natural relaxed standing pose.',
          'real-scale compact editorial lounge set',
          'black velvet sofa',
        ],
        ordered: [
          'A 20s seductive stunning Japanese or Korean woman',
          'cotton camisole top',
          'She presents a natural relaxed standing pose.',
          'real-scale compact editorial lounge set',
        ],
        excludes: ['fixed-set rule:', 'preserve anchors:'],
      },
      midjourneyPrompt: {
        includes: ['cotton camisole top', 'straight-leg jeans', 'black velvet sofa'],
        excludes: ['fixed-set rule:', 'preserve anchors:'],
      },
    },
  },
  {
    id: 'fixed-composition-special-outfit',
    title: 'Fixed composition set preserves a complete special outfit across primary outputs',
    mode: 'single',
    seed: 'prompt-contract-fixed-composition-special-outfit-v1',
    locks: {
      ...FIXED_COMPOSITION_WARDROBE_BASE_LOCKS,
      specialOutfitId: { byZh: '酒紅格紋吊帶牛仔短裙長靴造型' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: ['burgundy plaid handkerchief camisole', 'low-rise blue denim mini skirt', 'black knee-high leather boots', 'black velvet sofa'],
        excludes: ['fixed-set rule:', 'preserve anchors:'],
      },
      zImagePrompt: {
        includes: ['burgundy plaid handkerchief camisole', 'low-rise blue denim mini skirt', 'black knee-high leather boots', 'black velvet sofa'],
        ordered: [
          'A 20s seductive stunning Japanese or Korean woman',
          'burgundy plaid handkerchief camisole',
          'real-scale compact editorial lounge set',
        ],
        excludes: ['fixed-set rule:', 'preserve anchors:'],
      },
      midjourneyPrompt: {
        includes: ['burgundy plaid handkerchief camisole', 'low-rise blue denim mini skirt', 'black knee-high leather boots', 'black velvet sofa'],
        excludes: ['fixed-set rule:', 'preserve anchors:'],
      },
    },
  },
  {
    id: 'fixed-composition-outfit-preset',
    title: 'Fixed composition set preserves an outfit preset across primary outputs',
    mode: 'single',
    seed: 'prompt-contract-fixed-composition-outfit-preset-v1',
    locks: {
      ...FIXED_COMPOSITION_WARDROBE_BASE_LOCKS,
      outfitPresetId: { byZh: '套裝：春日巴黎亞麻長褲' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: ['Parisian linen trouser outfit', 'silk camisole', 'high-waisted wide-leg trousers', 'black velvet sofa'],
        excludes: ['fixed-set rule:', 'preserve anchors:'],
      },
      zImagePrompt: {
        includes: ['Parisian linen trouser outfit', 'silk camisole', 'high-waisted wide-leg trousers', 'black velvet sofa'],
        ordered: [
          'A 20s seductive stunning Japanese or Korean woman',
          'Parisian linen trouser outfit',
          'real-scale compact editorial lounge set',
        ],
        excludes: ['fixed-set rule:', 'preserve anchors:'],
      },
      midjourneyPrompt: {
        includes: ['Parisian linen trouser', 'silk camisole', 'high-waisted wide-leg trousers', 'black velvet sofa'],
        excludes: ['fixed-set rule:', 'preserve anchors:'],
      },
    },
  },
  {
    id: 'fixed-composition-dress',
    title: 'Fixed composition set preserves a one-piece dress across primary outputs',
    mode: 'single',
    seed: 'prompt-contract-fixed-composition-dress-v1',
    locks: {
      ...FIXED_COMPOSITION_WARDROBE_BASE_LOCKS,
      dressId: { byZh: '連身：短版｜一字領哥德迷你洋裝' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: ['off-shoulder gothic mini dress', 'one-piece fitted silhouette', 'ruffle trim', 'black velvet sofa'],
        excludes: ['fixed-set rule:', 'preserve anchors:'],
      },
      zImagePrompt: {
        includes: ['off-shoulder gothic mini dress', 'fitted silhouette', 'ruffle trim', 'black velvet sofa'],
        ordered: [
          'A 20s seductive stunning Japanese or Korean woman',
          'off-shoulder gothic mini dress',
          'real-scale compact editorial lounge set',
        ],
        excludes: ['fixed-set rule:', 'preserve anchors:'],
      },
      midjourneyPrompt: {
        includes: ['off-shoulder gothic mini dress', 'black velvet sofa'],
        excludes: ['fixed-set rule:', 'preserve anchors:'],
      },
    },
  },
  {
    id: 'close-up',
    title: 'Face-only crop with hidden wardrobe filtered out',
    mode: 'single',
    seed: 'prompt-contract-close-up-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '臉部特寫' },
      orbitId: { byZh: '左前 45 度' },
      locationId: { byZh: '室內：廢棄校舍體育器材室' },
      lightingId: { byZh: '室內窗邊日光' },
      lightDirectionId: { byZh: '側逆光' },
      earringsId: { byZh: '十字垂墜耳環' },
      topId: { byZh: '透膚刺繡襯衫' },
      pantsId: { byZh: '直筒牛仔褲' },
      shoesId: { byZh: '高跟鞋' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: ['Tight face close-up', 'abandoned school equipment room', 'vaulting box', 'stacked gym mats'],
        excludes: [
          'semi-sheer embroidered shirt',
          'straight-leg jeans',
          'stiletto pumps',
          'ball rack',
          'dusty floor',
          'softly blurred',
          'faint spatial shapes',
        ],
      },
      zImagePrompt: {
        includes: ['Tight face close-up', 'abandoned school equipment room', 'vaulting box', 'stacked gym mats'],
        excludes: [
          'semi-sheer embroidered shirt',
          'straight-leg jeans',
          'stiletto pumps',
          'ball rack',
          'dusty floor',
          'softly blurred',
          'faint spatial shapes',
        ],
      },
      midjourneyPrompt: {
        includes: ['Tight face close-up', 'abandoned school equipment room', 'vaulting box', 'stacked gym mats'],
        excludes: [
          'semi-sheer embroidered shirt',
          'straight-leg jeans',
          'stiletto pumps',
          'ball rack',
          'dusty floor',
          'softly blurred',
          'faint spatial shapes',
        ],
      },
    },
  },
  {
    id: 'spider-man-cosplay-outfit-preset',
    title: 'Spider-Man cosplay outfit preset preserves full-body coverage and raised web texture',
    mode: 'single',
    seed: 'prompt-contract-spider-man-cosplay-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
      outfitPresetId: { byZh: '套裝：Spider-Man Cosplay 緊身衣' },
      locationId: { byZh: '室內：深邃黑幕' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: [
          'Spider-Man cosplay bodysuit',
          'full-body skin-tight suit covering the torso, arms, hands, legs, and feet',
          'raised three-dimensional web pattern',
          'sculpted spider emblem on the chest',
          'unmasked face',
        ],
      },
      zImagePrompt: {
        includes: ['Spider-Man cosplay bodysuit', 'hands', 'feet', 'raised three-dimensional web pattern', 'unmasked face'],
      },
      midjourneyPrompt: {
        includes: ['Spider-Man cosplay bodysuit'],
      },
      fullBodyCharacterPrompt: {
        includes: ['Spider-Man cosplay bodysuit', 'hands', 'feet', 'unmasked face'],
      },
    },
  },
  {
    id: 'venom-cosplay-outfit-preset',
    title: 'Venom cosplay outfit preset preserves wet glossy material and full-body coverage',
    mode: 'single',
    seed: 'prompt-contract-venom-cosplay-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
      outfitPresetId: { byZh: '套裝：Venom Cosplay 緊身衣' },
      locationId: { byZh: '室內：深邃黑幕' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: [
          'Venom cosplay bodysuit',
          'full-body skin-tight black suit covering the torso, arms, hands, legs, and feet',
          'wet-look glossy surface with smooth liquid-like highlights',
          'subtle organic symbiote texture',
          'unmasked face',
        ],
      },
      zImagePrompt: {
        includes: ['Venom cosplay bodysuit', 'wet-look glossy surface', 'smooth liquid-like highlights', 'unmasked face'],
      },
      midjourneyPrompt: {
        includes: ['Venom cosplay bodysuit'],
      },
      fullBodyCharacterPrompt: {
        includes: ['Venom cosplay bodysuit', 'wet-look glossy surface', 'unmasked face'],
      },
    },
  },
  {
    id: 'spider-gwen-cosplay-outfit-preset',
    title: 'Spider-Gwen cosplay outfit preset preserves the lowered hood and uncovered face',
    mode: 'single',
    seed: 'prompt-contract-spider-gwen-cosplay-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
      outfitPresetId: { byZh: '套裝：Spider-Gwen Cosplay 緊身衣' },
      locationId: { byZh: '室內：深邃黑幕' },
    },
    expectedOutputs: {
      grokPrompt: {
        includes: [
          'Spider-Gwen cosplay bodysuit',
          'full-body skin-tight white, black, and pink suit covering the torso, arms, hands, legs, and feet',
          'integrated hood resting behind the head',
          'pink web-patterned hood lining',
          'face uncovered',
        ],
      },
      zImagePrompt: {
        includes: ['Spider-Gwen cosplay bodysuit', 'integrated hood resting behind the head', 'face uncovered'],
      },
      midjourneyPrompt: {
        includes: ['Spider-Gwen cosplay bodysuit'],
      },
      fullBodyCharacterPrompt: {
        includes: ['Spider-Gwen cosplay bodysuit', 'integrated hood resting behind the head', 'face uncovered'],
      },
    },
  },
  {
    id: 'full-body-reference',
    title: 'Full-body reference restores wardrobe hidden by a chest-up crop',
    mode: 'single',
    seed: 'prompt-contract-full-body-reference-v1',
    locks: {
      subjectCount: '1',
      framingId: { byZh: '胸上特寫' },
      hairstyleId: { byZh: '半綁公主頭' },
      hairColorId: { byZh: '深咖啡棕' },
      topId: { byZh: '襯衫' },
      topColorId: { byZh: '米白色' },
      skirtId: { byZh: '百褶短裙' },
      bottomColorId: { byZh: '深灰色' },
      outerwearId: { byZh: '丹寧外套' },
      outerwearColorId: { byZh: '深灰色' },
      legwearId: { byZh: '羅紋短襪' },
      legwearColorId: { byZh: '白色' },
      shoesId: { byZh: 'Samba OG' },
      shoesColorId: { byZh: '白色' },
    },
    expectedOutputs: {
      fullBodyCharacterPrompt: {
        includes: [
          'single 9:16 vertical image',
          'complete figure visible from head to toe',
          'pleated mini skirt',
          'denim jacket',
          'ribbed ankle socks',
          'adidas samba og sneakers',
        ],
        excludes: ['Pose and Composition:', 'Scene:', 'multi-cut sequence n=2'],
      },
    },
  },
]);
