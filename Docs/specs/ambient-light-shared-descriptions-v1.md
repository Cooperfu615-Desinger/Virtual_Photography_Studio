# 環境光共同描述第一版：一般單人 GPT／Z-Image

Last updated: 2026-09-14

## 範圍與責任

使用者核准先整理 36 組「環境光條件」，並將共同描述同步到一般 PAGE1 單人主 GPT 與 Z-Image；25 組「光線表現」維持原樣。這是描述來源的明確改寫，不是把 GPT 改成壓縮器。GPT 保留新版有效來源全文與原本分段格式，Z 使用同一份新版來源做限定細節投影。

不改 catalog Markdown／database.json、選項名稱、ID、metadata、相容性、摘要、UI、儲存／匯入格式、renderer 公開欄位。欄位單項 Copy 仍是 catalog 原文，不代表最終 renderer 成品；主 Prompt 的 Copy／Saved Cards／Markdown 保存實際輸出。

只有一般單人主 GPT/Z 套用。Midjourney、胸上特寫、全身角色照、雙人、固定構圖、專用角色、角色卡／身份匯入、仰躺表面主導路徑不變。後續若需要擴大範圍，需另行核准與回歸。

## 共同規則

1. 每組由「環境光核心」加可選細節組成：時間、明暗、色調、空氣與光感優先，不新增人物動作／人群／服裝／場景設備。
2. 天空／雲層是條件性可見細節；室內外亮度不等於天空。保留「藍天白雲」與「夏日深藍積雲」的差異。
3. 雪反射的冷光可保留，不等於要求生成雪地；雨後低機位保留牆面反光，不強制石質地面入鏡。
4. 攝影棚／舞台選項描述照明效果，不生成第二個場地，移除 no background structure／without generating 等控制語。
5. 不使用前三詞／前兩片語等固定截斷，亦不更改人物受光的責任。

## Renderer 規則

- GPT：核心與全部已撰寫細節，保持句尾分隔與 Lighting 區段；不跟隨 Z 的相機高度刪除天空。
- Z：核心必保留。有效高位俯視／鳥瞰／正上方時省略 sky 細節；有效腰部／膝蓋／地面／蟲眼時 surface 細節只保留明確的 lowText。其餘條件性細節保留。
- 原有場景地面／天空、上方場景、自拍、canonical pose、人物與服裝投影不變。
- ID、中文名與原始英文需全數吻合才取用新版來源；未知／自訂／來源漂移返回原本 renderer 行為，不猜測。
- 源碼：`webapp/src/lib/engine/ambientLightDescriptions.js` v1.0.0。Z 契約 v1.12.0；四輸出契約 v1.11.0。

## 36 組正式英文

details 中的 kind／low 是內部結構標記，不輸出到 Prompt。

| UI 名稱 | 光線核心 | 條件性細節 |
| --- | --- | --- |
| 晴朗白日 | clear bright daylight with clean visibility | bright daytime sky where visible (sky) |
| 藍天白雲 | clear bright daylight with an airy atmosphere | saturated azure sky and brilliant white clouds where visible (sky) |
| 夏日深藍積雲 | bright summer daylight with a clear atmosphere | deep azure sky and towering luminous white cumulus clouds where visible (sky) |
| 雨前灰黑天空 | dim charcoal-grey pre-rain ambience | layered dark storm clouds where visible (sky) |
| 正午烈日 | harsh midday brightness with dry summer air | high summer sun and glaring sky where visible (sky) |
| 陰天漫射 | overcast daylight with soft diffused ambient light and muted contrast | grey-white cloud cover where visible (sky) |
| 清晨薄霧 | cool misty morning ambience with soft haze and low contrast | pale morning sky where visible (sky) |
| 晨光日出 | sunrise ambience with warm low-angle dawn light and fresh morning air | golden morning sky and a soft horizon glow where visible (sky) |
| 黃昏夕陽 | golden sunset ambience with warm amber evening light | orange-pink sky and low sun near the horizon where visible (sky) |
| 藍調傍晚 | blue-hour ambience with fading daylight and a cool evening tone | deep blue dusk sky where visible (sky) |
| 城市夜間混合光 | urban night ambience with mixed warm and cool city glow | dark blue-black sky where visible (sky) |
| 月光夜色 | moonlit night ambience with cool silvery darkness and low visibility | blue-black night sky where visible (sky) |
| 城市高彩度夜色 | urban night ambience with vivid colored city glow and high-chroma reflections | dark night sky where visible (sky) |
| 陰雨將至 | dim storm-brewing ambience with humid pre-rain air | heavy low cloud cover where visible (sky) |
| 雨天陰濕 | rainy overcast ambience with damp air and cold muted daylight | grey-blue rain sky where visible (sky) |
| 雨後反光 | post-rain ambience with fresh humid air | freshly damp surfaces and reflective stone and wall textures where visible (surface; low: reflective wall textures where visible) |
| 雪地冷光 | cold winter ambience with cool ambient brightness from snow | pale sky where visible (sky) |
| 冬季灰冷 | cold grey winter ambience with subdued daylight and dry freezing air | pale grey sky where visible (sky) |
| 室內窗邊日光 | indoor daylight ambience with natural window-lit room brightness | daytime exterior brightness where visible (exterior) |
| 室內清晨冷白日光 | indoor early-morning ambience with cool pale daylight and crisp air | faint cool exterior brightness where visible (exterior) |
| 室內午後柔亮日光 | indoor late-afternoon ambience with bright softened illumination and warm-neutral daylight | mellow exterior brightness where visible (exterior) |
| 室內陰影日光 | shaded indoor daylight with subdued room brightness | daytime exterior brightness where visible (exterior) |
| 室內陰雨昏暗天光 | indoor rainy-day ambience with dim grey daylight | muted overcast sky where visible (sky) |
| 室內黃昏微暖餘光 | indoor dusk ambience with faint warm residual daylight and dimming room brightness | fading exterior light where visible (exterior) |
| 室內暖色夜景 | indoor warm night ambience with amber room brightness and a gentle low-contrast glow | dark exterior where visible (exterior) |
| 室內低照度暖色夜景 | indoor low-light warm night ambience with dim amber brightness and soft shadows | dark exterior where visible (exterior) |
| 室內社交暖色夜景 | warm low-light social ambience with dim amber room brightness and dark background depth | — |
| 室內極暖低照度 | very warm low-light indoor ambience with soft amber darkness and deep shadows | — |
| 室內冷白環境光 | indoor artificial-light ambience with a cool-white cast and clean neutral room brightness | — |
| 室內冷白高亮日常 | everyday indoor ambience with bright cool-white illumination | — |
| 室內高彩度色光夜景 | indoor night ambience with vivid colored ambient spill and low-light depth | dark exterior where visible (exterior) |
| 室內外光滲入微暗空間 | dim indoor ambience with exterior light spilling into a mostly dark room | — |
| 室內深夜冷暗微光 | very dark late-night indoor ambience with faint cool residual light | — |
| 高調純白攝影棚 | high-key white illumination with bright even commercial light and very pale shadows | — |
| 柔霧美妝攝影棚 | soft diffused beauty lighting with creamy light quality and very gentle shadows | — |
| 舞台演出燈光 | stage-inspired illumination with controlled colored light beams | — |

## 驗證

- 起點 main / 426f63f；此次不含已提交的 regular-length hoodie 工作。
- 凍結修改前 720 組：36 環境 × 10 有效角度 × 2 景別；只允許 GPT 環境全文與 Z 環境片語變動。其他六輸出內容、selection 與 RNG 比對一致。
- 10 排除路徑逐字一致；36 組 Saved Cards 與 Markdown 主輸出文字往返通過。
- 既有 snapshot 保留，測試只將核准環境片語正規化後與原 hash 比對，不覆寫歷史 baseline。
- npm test 923/923；Prompt Quality 254/254；lint/build 通過。既有 Vite chunk-size warning 保留。
- 同一 seed `prompt-quality-baseline`、count 200 strict audit：前後皆零 blocker、23 diagnostic；只有 GPT/Z 字數統計改變，AI／衍生統計與 findings 不變。
- 外部生成品質仍需使用者實測；自動測試不代表影像結果通過。

## 瀏覽器紀錄

- 本機 127.0.0.1:5175，桌面 1440×1000／手機 390×900；Prompt 工作台、角色建模、動作姿勢、場景建模、Saved Cards 都有切換與畫面檢查。
- 藍調傍晚低／高機位：GPT 全文不變，Z 高位省略天空但保留核心。夏日積雲特色、雨後低位牆面反光、與高調人物光並存的句尾分隔均確認。全無回復與 DLL Gpt/Z-Image 來源切換確認。
- 沒有觀察到 warning/error console 紀錄；角色圖初次載入後確認零未載入／破圖。原有六張卡片未新增或刪除，測試前選项與 viewport 已恢复。
- 瀏覽器驗收仍為 PARTIAL：既有手機 PAGE1 375 client／411 scroll 溢出與極窄輸出欄仍在，未改 UI；剪貼簿與下載檔案 bytes 本輪未重驗。程式層 Saved Cards／Markdown 主文字回歸通過，不等於 browser 檔案交付驗證。
