import database from '../data/database.json';

// Helper: Get random item from array
const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper: Safely extract and append
const extractCat = (dataDict, category, targetList, prob = 1.0) => {
    if (dataDict && dataDict[category] && Math.random() <= prob) {
        const choice = sample(dataDict[category]);
        targetList.push(choice);
        return choice;
    }
    return null;
};

// Helper: Weighted extraction for hair
const extractWeighted = (dataDict, category, targetList, naturalIndices, naturalWeight = 0.8) => {
    if (!dataDict || !dataDict[category]) return null;

    const items = dataDict[category];
    if (!items || items.length === 0) return null;

    const naturalItems = naturalIndices.map(i => items[i - 1]).filter(Boolean);
    const specialItems = items.filter((_, idx) => !naturalIndices.includes(idx + 1));

    let choice;
    if (Math.random() < naturalWeight && naturalItems.length > 0) {
        choice = sample(naturalItems);
    } else if (specialItems.length > 0) {
        choice = sample(specialItems);
    } else {
        choice = sample(items);
    }

    targetList.push(choice);
    return choice;
};

export const generatePrompts = (count = 1) => {
    const results = [];

    for (let i = 0; i < count; i++) {
        // Safe access
        const regionalData = database.Regional || {};
        const wardrobeData = database.Wardrobe || {};
        const cameraData = database.CameraLighting || {};
        const locationsData = database.Locations || {};
        const characterData = database.Character || {};
        const negativeData = database.Negative || {};

        const structured = {
            "Character": [],
            "Pose & Expression": [],
            "Wardrobe": [],
            "Location": [],
            "Lighting": [],
            "Framing": [],
            "Camera & Film": [],
            "Negative Prompts": []
        };

        let themeStyleObj = null;
        if (regionalData['區域攝影風格']) {
            themeStyleObj = sample(regionalData['區域攝影風格']);
        }

        const summary = {
            style: themeStyleObj ? themeStyleObj.zh : "",
            character: "一名女性",
            wardrobe: "",
            location: "",
            lighting: ""
        };

        // Character Assembly
        structured["Character"].push({ en: "1girl", zh: "一名女性" });
        extractCat(characterData, '臉型輪廓 (Face Shape)', structured["Character"]);
        extractCat(characterData, '五官特徵 (Facial Features)', structured["Character"]);
        extractCat(characterData, '膚色與膚質 (Skin Tone & Texture)', structured["Character"]);

        extractWeighted(characterData, '髮型 (Hairstyle)', structured["Character"], [1, 2, 3, 5, 15, 16, 17, 18, 19, 20], 0.85);
        extractWeighted(characterData, '髮色 (Hair Color)', structured["Character"], [1, 2, 3, 12, 13, 15, 16, 17, 18, 19, 20], 0.9);

        extractCat(characterData, '年齡氣質 (Age & Aura)', structured["Character"]);

        extractCat(characterData, '神情與眼神 (Expression & Gaze)', structured["Pose & Expression"]);
        extractCat(characterData, '姿勢與肢體語言 (Pose & Body Language)', structured["Pose & Expression"]);

        // Wardrobe Assembly
        let topChoice = null;
        if (Math.random() > 0.5) {
            topChoice = extractCat(wardrobeData, '風格基調 (Vibe)', structured["Wardrobe"]);
        } else {
            topChoice = extractCat(wardrobeData, '上身 (Tops)', structured["Wardrobe"]);
        }
        if (topChoice) summary.wardrobe = topChoice.zh;

        extractCat(wardrobeData, '下身 (Bottoms)', structured["Wardrobe"]);
        extractCat(wardrobeData, '外套 (Outerwear)', structured["Wardrobe"], 0.4);
        extractCat(wardrobeData, '鞋款 (Shoes)', structured["Wardrobe"]);
        extractCat(wardrobeData, '配件 (Accessories)', structured["Wardrobe"]);
        extractCat(wardrobeData, '材質與細節 (Textures & Details)', structured["Wardrobe"]);

        // Location
        const locCategories = Object.keys(locationsData);
        if (locCategories.length > 0) {
            const chosenLocCat = sample(locCategories);
            const locItem = extractCat(locationsData, chosenLocCat, structured["Location"]);
            if (locItem) summary.location = locItem.zh;
        }

        // Camera & Lighting
        const lightItem1 = extractCat(cameraData, '光線類型 (Lighting Type)', structured["Lighting"]);
        if (lightItem1) summary.lighting = lightItem1.zh;
        const lightItem2 = extractCat(cameraData, '光線方向與質感 (Light Direction & Quality)', structured["Lighting"]);
        if (!lightItem1 && lightItem2) summary.lighting = lightItem2.zh;

        extractCat(cameraData, '景別構圖 (Framing)', structured["Framing"]);
        extractCat(cameraData, '相機視角 (Angle)', structured["Framing"]);

        if (themeStyleObj) structured["Camera & Film"].push(themeStyleObj);
        extractCat(cameraData, '鏡頭焦段 (Focal Length)', structured["Camera & Film"]);
        extractCat(cameraData, '底片與相機模擬 (Camera & Film Simulation)', structured["Camera & Film"], 0.7);
        extractCat(cameraData, '特殊效果 (Special Effects)', structured["Camera & Film"], 0.3);

        // Negative Prompts
        extractCat(negativeData, '通用人體防護', structured["Negative Prompts"]);
        extractCat(negativeData, '畫質與渲染防護', structured["Negative Prompts"]);
        extractCat(negativeData, '風格與寫實度防護', structured["Negative Prompts"]);
        extractCat(negativeData, '場景與物理防護', structured["Negative Prompts"]);
        extractCat(negativeData, '服裝與材質防護', structured["Negative Prompts"]);
        extractCat(negativeData, '特定主題防護 (依需求加入)', structured["Negative Prompts"]);

        // Create Natural Language (Midjourney optimized, max ~800 chars)
        const buildEnStr = (catList) => catList.filter(item => item && item.en).map(item => item.en).join(', ');

        // Build prompt segments in priority order
        const promptSegments = [
            "(masterpiece, best quality, ultra-detailed:1.2), highres, raw photo",
            themeStyleObj && themeStyleObj.en ? themeStyleObj.en : null,
            "1girl",
            buildEnStr(structured["Character"].slice(1)),
            "wearing",
            buildEnStr(structured["Wardrobe"]),
            "in",
            buildEnStr(structured["Location"]),
            buildEnStr(structured["Pose & Expression"]),
            "shot by",
            buildEnStr(structured["Framing"]),
            buildEnStr(structured["Camera & Film"].slice(1)),
            buildEnStr(structured["Lighting"]),
        ].filter(Boolean);

        // Assemble with 800-char cap for Midjourney compatibility
        const MAX_POSITIVE_CHARS = 800;
        let positivePrompt = "";
        for (const seg of promptSegments) {
            const next = positivePrompt ? `${positivePrompt}, ${seg}` : seg;
            if (next.length > MAX_POSITIVE_CHARS) break;
            positivePrompt = next;
        }

        const negativePrompt = buildEnStr(structured["Negative Prompts"]);

        // Character Summary Extraction
        let charSummaryPieces = [];
        if (structured["Character"].length > 1) {
            const face = structured["Character"].find(item => item.zh !== '一名女性' && item.zh.includes('臉'));
            const hairColor = structured["Character"].find(item => item.zh !== '一名女性' && (item.zh.includes('色') || item.zh.includes('金') || item.zh.includes('黑') || item.zh.includes('棕')));
            if (face) charSummaryPieces.push(face.zh);
            if (hairColor && charSummaryPieces.length < 2) charSummaryPieces.push(hairColor.zh.replace(/^\d+\.\s*/, ''));
        }
        if (charSummaryPieces.length > 0) {
            summary.character = `一名女性, ${charSummaryPieces.join(', ')}`;
        }

        results.push({
            id: Date.now() + i,
            date: new Date().toISOString(),
            summary: `風格：**${summary.style}** | 人物：${summary.character} | 服裝：${summary.wardrobe} | 場景：${summary.location} | 光影：${summary.lighting}`,
            positivePrompt,
            negativePrompt,
            structured
        });
    }

    return results;
};
