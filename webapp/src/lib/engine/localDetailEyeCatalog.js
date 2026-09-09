// Exact reviewed catalog sources, not keyword classifiers. Null local hair
// means this baseline has no authored eye-area hair feature to render.
export const eyeHairSources = {
  '帥氣濕亮油頭': ['slicked-back short hair, hair combed away from the forehead, sharp compact fashion silhouette', null],
  '乾淨短鮑伯': ['clean short bob haircut, softly blunt ends, polished face-framing line, neat modern shape', null],
  '齊瀏海圓弧鮑伯': ['rounded short bob with full straight bangs, smooth curved ends, cute Japanese bob silhouette', 'full straight bangs'],
  '不對稱濕感短鮑伯': ['asymmetrical short bob, one side falling near the eye, sharp uneven silhouette', 'one side falling near the eye'],
  '復古外翹短髮': ['short flipped-out hair, retro outward ends, polished playful movement around the jawline', null],
  '自然層次鎖骨髮': ['collarbone-length layered hair, defined face-framing layers, clean tapered ends', null],
  '韓系柔順中長髮': ['smooth Korean medium-length hair, gentle inward curve, clean soft modern silhouette', null],
  '側分柔波中長髮': ['side-parted medium soft waves, collarbone-length shape, defined face-framing layers', null],
  '半濕感中長髮': ['medium-length hair with softly tapered ends, clean natural face-framing shape', null],
  '直髮：中分': ['long straight hair with a center part, sleek clean vertical flow', null],
  '直髮：旁分': ['long straight hair with a side part, smooth polished length, elegant face-framing line', null],
  '直髮：日式瀏海': ['long straight hair with full Japanese bangs, smooth clean silhouette', 'full Japanese bangs'],
  '直髮：濕感': ['straight medium-to-long hair with clean vertical lengths, softly tapered ends, compact natural silhouette', null],
  '自然微彎：中分': ['medium-to-long hair with a center part, subtle natural bends, softly curved ends, clean face-framing shape', null],
  '自然微彎：深側分': ['medium-to-long hair with a deep side part, subtle natural bends, asymmetric face-framing shape', null],
  '自然微彎：瀏海': ['medium-to-long hair with soft bangs, subtle natural bends, lightly curved ends, clean face-framing shape', 'soft bangs'],
  '自然微彎：濕感': ['medium-to-long hair with subtle natural bends, softly curved ends, clean natural silhouette', null],
  '柔波：中分': ['long soft waves with a center part, defined wave shape, clean tapered ends', null],
  '柔波：深側分': ['deep side-parted long soft waves, defined face-framing layers, polished wave shape', null],
  '柔波：瀏海': ['long soft waves with see-through bangs, defined romantic wave shape, clean face-framing ends', 'see-through bangs'],
  '濕潤感長波浪': ['long soft waves with defined wave shape, clean tapered ends, natural face-framing silhouette', null],
  '高位雙馬尾': ['high double pigtails, youthful twin-tail shape, clean lifted volume', null],
  '蓬鬆高馬尾': ['high ponytail with a defined tied-up silhouette, clean crown shape, tapered ponytail ends', null],
  '低馬尾': ['minimal low ponytail, fine face-framing strands, clean understated elegance', null],
  '低包頭盤髮': ['low bun or low chignon, soft wispy face-framing strands, elegant tied-up silhouette', null],
  '半綁公主頭': ['half-up long hair, defined crown structure, clean lower lengths, clear face-framing shape', null],
  '柔和編髮造型': ['soft braided hairstyle, clean woven structure, defined tied-up silhouette', null],
  '輕透齊瀏海內彎鮑伯': ['chin-length inward-curved bob, airy straight bangs, smooth face-framing rounded ends, clean salon shape', 'airy straight bangs'],
  '韓系蓬鬆鎖骨柔波髮': ['Korean collarbone-length soft waves, defined layered shape, clean face-framing ends', null],
  '輕透瀏海自然微彎長髮': ['long naturally slightly wavy hair with airy see-through bangs, soft side-draped face-framing strands', 'airy see-through bangs'],
  '雙包子頭': ['Chinese-inspired twin buns, two rounded high buns, two red fabric ribbons, one tied around each bun, center part', null],
};

// Same selected item's canonical structure. Keep eye and brow fragments
// separate so a covering cannot expose one merely to show the other.
export const eyeFaceSources = {
  韓系偶像臉: ['small refined oval face, clear almond eyes with straight brows, slender nose bridge and softly shaped lips', 'clear almond eyes', 'straight brows'],
  日系清透臉: ['soft natural oval face, gentle almond eyes with natural brows, small nose and softly defined lips', 'gentle almond eyes', 'natural brows'],
  甜美可愛臉: ['soft natural oval face, bright round eyes with curved brows, small rounded nose and softly shaped lips', 'bright round eyes', 'curved brows'],
  冷感高級臉: ['refined elongated oval face, upturned eyes with straight brows, defined nose bridge and sculpted lips', 'upturned eyes', 'straight brows'],
  成熟性感臉: ['softly defined oval face, upturned eyes with arched brows, clear nose bridge and full shaped lips', 'upturned eyes', 'arched brows'],
  混血立體臉: ['dimensional elongated oval face, deep-set round eyes with defined brows, high nose bridge and sculpted lips', 'deep-set round eyes', 'defined brows'],
};
export const eyeGlassesSources = {
  粗框眼鏡: 'bold thick-frame glasses', 細框眼鏡: 'thin-frame glasses',
  復古圓框眼鏡: 'retro round-frame glasses', 窄版橢圓眼鏡: 'narrow oval glasses',
  太陽眼鏡: 'sunglasses with tinted lenses', 矩形眼鏡: 'rectangular-frame glasses',
  飛行員眼鏡: 'aviator-frame glasses', 貓眼眼鏡: 'cat-eye glasses', 無框眼鏡: 'rimless glasses',
};
export const eyeFrameColors = {
  黑色: 'black frame', 白色: 'white frame', 玳瑁色: 'tortoiseshell frame',
  金屬銀: 'silver metal frame', 金屬金: 'gold metal frame', 透明框: 'clear transparent frame',
  棕色: 'brown frame', 琥珀色: 'amber translucent frame', 藍色: 'blue frame',
  紅色: 'red frame', 紫色: 'purple frame', 粉色: 'pink frame',
};
export const eyeHairColors = {
  自然黑: 'natural black hair', 柔霧黑茶: 'soft black-tea brown hair', 深咖啡棕: 'deep coffee-brown hair',
  栗子棕: 'chestnut-brown hair', 奶茶棕: 'milk-tea brown hair', 亞麻米棕: 'ashy beige-brown hair',
  蜂蜜焦糖棕: 'honey caramel-brown hair', 玫瑰可可棕: 'rose cocoa-brown hair', 淺金髮: 'light blonde hair',
  銀灰白: 'silver-gray white hair', 亮桃粉: 'hot-pink fashion hair color',
  寶石藍: 'jewel cobalt-blue fashion hair color', 深森林綠: 'deep forest-green fashion hair color',
};
