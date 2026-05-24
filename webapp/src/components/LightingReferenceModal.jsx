const POSITIONING_ROWS = [
  {
    topic: '主要回答的問題',
    environmentMood: '整個場景現在是什麼天空、時段、天氣、空氣與全場明暗。',
    lightStyle: '光怎麼打在人物身上，包含方向、硬度、反差、色溫、投影與反射。',
  },
  {
    topic: '描述重點',
    environmentMood: '天空、窗外狀態、室內亮度、陰雨、深夜、霓虹環境光。',
    lightStyle: '順光、側光、逆光、硬光、柔光、條紋投影、人物受光色溫。',
  },
  {
    topic: '適合放的語意',
    environmentMood: '白天窗光、陰雨天光、深夜冷暗微光、夏日深藍積雲。',
    lightStyle: '冷白日光色溫、室內暖白燈色溫、冷調窗邊輪廓光、深夜邊緣微光。',
  },
  {
    topic: '盡量不要放的內容',
    environmentMood: '不要寫人物受光方向或局部投影效果。',
    lightStyle: '不要寫天空狀態、時段、整體場景天氣。',
  },
];

const ENVIRONMENT_GROUPS = [
  {
    title: '白天與窗光',
    description: '適合描述空間本身是清晨、白天、午後或陰影中的室內日光條件。',
    items: ['室內窗邊日光', '室內清晨冷白日光', '室內午後柔亮日光', '室內陰影日光'],
  },
  {
    title: '陰天與灰暗氣氛',
    description: '用來定義整個畫面的天氣、雲層與空氣能見度，而不是人物受光方向。',
    items: ['陰天漫射', '室內陰雨昏暗天光', '雨前灰黑天空', '陰雨將至'],
  },
  {
    title: '傍晚到深夜室內',
    description: '當你想控制房間、旅館、車廂或室內空間本身的亮度與夜晚感時使用。',
    items: ['室內黃昏微暖餘光', '室內暖光夜景', '室內夜晚低照度暖光', '室內深夜冷暗微光'],
  },
  {
    title: '外部滲光與特殊室內氣氛',
    description: '適合強調室內幾乎沒開燈，只靠外面或特殊光源維持全場亮度。',
    items: ['室內外光滲入微暗空間', '室內冷白螢光日常', '室內霓虹夜色'],
  },
  {
    title: '戶外天空與空氣狀態',
    description: '屬於戶外整體環境光控制，優先決定畫面的大環境。',
    items: ['晴朗白日', '藍天白雲', '夏日深藍積雲', '月光夜色'],
  },
];

const LIGHT_STYLE_GROUPS = [
  {
    title: '受光方向',
    description: '用來決定人物怎麼被照亮，是最核心的受光控制。',
    items: ['柔和順光', '側向柔光', '側向硬光', '側逆光', '逆光輪廓光', '頂部照明'],
  },
  {
    title: '光質與反差',
    description: '控制畫面是乾淨、柔和、霧化，還是暗部更重、反差更高。',
    items: ['均勻平光', '漫射霧光', '硬質晴光', '高調亮光', '低光高反差'],
  },
  {
    title: '色溫控制',
    description: '只改變人物受光的冷暖與色偏，不主動規定天空、時段或場景內容。',
    items: ['暖金黃昏色溫', '冷白日光色溫', '室內暖白燈色溫', '冷藍夜色光', '混合色溫光', '霓虹染色光'],
  },
  {
    title: '投影與反射',
    description: '適合補強更具畫面感的局部效果與紋理。',
    items: ['窗格投影光', '百葉窗條紋投影光', '冷調窗邊輪廓光', '斑駁樹影光', '潮濕反射光', '局部暖光', '深夜邊緣微光'],
  },
];

const PAIRING_EXAMPLES = [
  {
    goal: '生活感白天室內',
    environmentMood: '室內午後柔亮日光',
    lightStyle: '冷白日光色溫 / 側向柔光',
    result: '空間是白天柔亮，人物受光乾淨自然。',
  },
  {
    goal: '陰雨安靜房間',
    environmentMood: '室內陰雨昏暗天光',
    lightStyle: '漫射霧光 / 冷調窗邊輪廓光',
    result: '房間本身偏灰暗，人物受光柔、冷、安靜。',
  },
  {
    goal: '深夜低照度室內',
    environmentMood: '室內深夜冷暗微光',
    lightStyle: '深夜邊緣微光 / 冷藍夜色光',
    result: '空間很暗，主體只留下少量深夜輪廓光。',
  },
  {
    goal: '暖燈生活感夜景',
    environmentMood: '室內夜晚低照度暖光',
    lightStyle: '室內暖白燈色溫 / 局部暖光',
    result: '房間本身偏暖暗，人物受光更像檯燈或床頭燈。',
  },
  {
    goal: '戶外夏日明亮感',
    environmentMood: '夏日深藍積雲',
    lightStyle: '硬質晴光 / 高調亮光',
    result: '大環境是強烈夏天空氣感，人物受光更有日照存在感。',
  },
];

function ChipList({ items }) {
  return (
    <div className="reference-chip-list">
      {items.map((item) => (
        <span key={item} className="reference-chip">{item}</span>
      ))}
    </div>
  );
}

export default function LightingReferenceModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel reference-modal" onClick={(event) => event.stopPropagation()}>
      <div className="reference-modal-body">
          <div className="modal-header">
            <div>
              <div className="lock-title">環境光條件 / 光線表現定位對照</div>
              <p className="lock-subtitle">用來快速判斷某個描述該放在哪一欄，避免語意重疊。</p>
            </div>
            <button className="reference-close-btn" type="button" aria-label="關閉定位對照" onClick={onClose}>
              ×
            </button>
          </div>

          <section className="reference-section">
            <div className="reference-section-title">差別是什麼</div>
            <div className="reference-table-shell">
              <table className="reference-table">
                <thead>
                  <tr>
                    <th>面向</th>
                    <th>環境光條件</th>
                    <th>光線表現</th>
                  </tr>
                </thead>
                <tbody>
                  {POSITIONING_ROWS.map((row) => (
                    <tr key={row.topic}>
                      <th>{row.topic}</th>
                      <td>{row.environmentMood}</td>
                      <td>{row.lightStyle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="reference-section">
            <div className="reference-section-title">建議放在哪裡</div>
            <div className="reference-dual-grid">
              <div className="reference-card">
                <div className="reference-card-title">環境光條件</div>
                <div className="reference-card-copy">描述整個空間的亮度、時段、天空、窗外狀態與空氣條件。</div>
                <div className="reference-group-list">
                  {ENVIRONMENT_GROUPS.map((group) => (
                    <article key={group.title} className="reference-group-card">
                      <h4>{group.title}</h4>
                      <p>{group.description}</p>
                      <ChipList items={group.items} />
                    </article>
                  ))}
                </div>
              </div>

              <div className="reference-card">
                <div className="reference-card-title">光線表現</div>
                <div className="reference-card-copy">描述光打在人物身上的方式，包括方向、硬度、反差、色溫、投影與反射。</div>
                <div className="reference-group-list">
                  {LIGHT_STYLE_GROUPS.map((group) => (
                    <article key={group.title} className="reference-group-card">
                      <h4>{group.title}</h4>
                      <p>{group.description}</p>
                      <ChipList items={group.items} />
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="reference-section">
            <div className="reference-section-title">推薦搭配範例</div>
            <div className="reference-examples">
              {PAIRING_EXAMPLES.map((example) => (
                <article key={example.goal} className="reference-example-card">
                  <h4>{example.goal}</h4>
                  <div className="reference-example-row">
                    <span>環境光條件</span>
                    <strong>{example.environmentMood}</strong>
                  </div>
                  <div className="reference-example-row">
                    <span>光線表現</span>
                    <strong>{example.lightStyle}</strong>
                  </div>
                  <p>{example.result}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
