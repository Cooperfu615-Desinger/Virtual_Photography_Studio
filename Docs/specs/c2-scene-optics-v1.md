# C2 場景／光學三筆精簡與29筆審閱 v1

2026-10-30；可信main `dabef0172ddf35c569632956c5bd7fed3e8c2c8b`。只改三筆完整來源，追加舊英文alias。其餘必要視覺細節、ID、排序、meta.semantic、現行可見性、隨機池與舊收藏原文保持。未commit／push。

## 三筆來源差異

### 重散景光斑（19→16詞）

- ID：`camera:光學效果-optical-effects:重散景光斑:1`
- 前：`heavy bokeh rendering, large out-of-focus highlight discs, aperture-shaped blur circles, pronounced background or foreground defocus highlights, optical blur balls`
- 後：`heavy bokeh rendering, large out-of-focus highlight discs, aperture-shaped blur circles, pronounced background or foreground defocus highlights`

### 鏡頭光斑 Lens Flare（19→18詞）

- ID：`camera:光學效果-optical-effects:鏡頭光斑-lens-flare:9`
- 前：`lens flare artifacts, internal lens reflections, veiling flare, ghosting shapes, streaking flare artifacts from a strong off-axis light source`
- 後：`lens flare artifacts, internal lens reflections, veiling flare, ghosting shapes, streaking flare from a strong off-axis light source`

### 戶外：大阪道頓堀心齋橋河道（31→28詞）

- ID：`locations:城市與社群感-urban-social-snapshots:戶外-大阪道頓堀心齋橋河道:15`
- 前：`Dotonbori Shinsaibashi riverside edge in Osaka, iconic billboard signage, Shinsaibashi bridge railing in the foreground, canal water visible below, dense commercial facade layers, famous advertisement boards, sidewalk edge near the bridge`
- 後：`Dotonbori Shinsaibashi riverside edge in Osaka, iconic billboard signage, Shinsaibashi bridge railing in the foreground, canal water visible below, dense commercial facade layers, sidewalk edge near the bridge`

兩筆光學只刪重複泛稱，保留高光形狀、前後景與強離軸光源；道頓堀刪除重複看板名稱，保留地標、橋欄、河水、立面及人行道。三筆semantic原樣保留，因為沒有移除任何光學種類、環境分類或物件責任。不修改renderer、低機位優先來源、投影條件或輸出契約。

## 29筆長來源的保留理由

這是修改前診斷的29筆，不是29筆全部保持原文：道頓堀微調並保留必要細節，其餘28筆整筆不變。另兩筆光學微調原本位於一般範圍。總審閱聯集31筆。

| 名稱 | 修改前詞數 | 決策與保留理由 |
| --- | --- | --- |
| 頭部主導近景 | 41 | 保留：保留頭頂至下巴占畫面高度50–60%、完整下巴、少量留白、上身手臂及周邊場景；這些是獨立構圖要求，不是同義重述。 |
| 前景遮擋散景 | 27 | 保留：保留近鏡頭離焦、跨一或多個邊緣、實質局部覆蓋、厚近場散景與主體可見開口；不為少一詞破壞可讀性。 |
| 室內：純潔白幕 | 50 | 保留：保留本色的horizonless seamless、連續地面背景、滿版純色、接觸陰影，以及牆角、地縫、天花板與棚內設備排除；多個限制各自阻止不同可見物件。 |
| 室內：深邃黑幕 | 50 | 保留：保留本色的horizonless seamless、連續地面背景、滿版純色、接觸陰影，以及牆角、地縫、天花板與棚內設備排除；多個限制各自阻止不同可見物件。 |
| 室內：莫蘭迪灰背景 | 51 | 保留：保留本色的horizonless seamless、連續地面背景、滿版純色、接觸陰影，以及牆角、地縫、天花板與棚內設備排除；多個限制各自阻止不同可見物件。 |
| 室內：純藍背景 | 53 | 保留：保留本色的horizonless seamless、連續地面背景、滿版純色、接觸陰影，以及牆角、地縫、天花板與棚內設備排除；多個限制各自阻止不同可見物件。 |
| 室內：純橘背景 | 53 | 保留：保留本色的horizonless seamless、連續地面背景、滿版純色、接觸陰影，以及牆角、地縫、天花板與棚內設備排除；多個限制各自阻止不同可見物件。 |
| 室內：純紅背景 | 53 | 保留：保留本色的horizonless seamless、連續地面背景、滿版純色、接觸陰影，以及牆角、地縫、天花板與棚內設備排除；多個限制各自阻止不同可見物件。 |
| 室內：純黃背景 | 53 | 保留：保留本色的horizonless seamless、連續地面背景、滿版純色、接觸陰影，以及牆角、地縫、天花板與棚內設備排除；多個限制各自阻止不同可見物件。 |
| 室內：純紫背景 | 53 | 保留：保留本色的horizonless seamless、連續地面背景、滿版純色、接觸陰影，以及牆角、地縫、天花板與棚內設備排除；多個限制各自阻止不同可見物件。 |
| 室內：純綠背景 | 53 | 保留：保留本色的horizonless seamless、連續地面背景、滿版純色、接觸陰影，以及牆角、地縫、天花板與棚內設備排除；多個限制各自阻止不同可見物件。 |
| 室內：鮮豔撞色背景 | 54 | 保留：保留本色的horizonless seamless、連續地面背景、滿版純色、接觸陰影，以及牆角、地縫、天花板與棚內設備排除；多個限制各自阻止不同可見物件。 |
| 室內：漸層打光背景 | 48 | 保留：保留連續漸層、無邊界地面背景、滿版色調變化、接觸陰影與設備排除；不是單色背景，不套用單色語意。 |
| 室內：CRT 電視牆攝影棚 | 54 | 保留：保留CRT與電腦螢幕的異高間隙、屏幕內容、錄影帶及線材設備、藍灰地面背景與獨立主體；54詞各有物件或空間責任。 |
| 室內：多色塊撞色背景 | 72 | 保留：保留2–4色塊、可變色相、不等寬高、清楚邊界、非對稱滿版、連續地面及接觸陰影與設備排除；72詞為必要結構，不宣稱已有通用72詞上限。 |
| 室內：精品飯店房間 | 30 | 保留：床鋪白床單、床頭櫃、作為實體物件的燈具、軟包床頭、窗簾與地板分別定義房間；保留緊湊角落，不把燈具改成人物光源。 |
| 室內：日本住宅使用感廚房 | 29 | 保留：木窗、磁磚、金屬水槽、餐具與瀝水架、炊具和調味罐共同表達使用感；保留冰箱邊界與生活堆放，不縮成空泛廚房。 |
| 戶外：社區自動販賣機旁 | 30 | 保留：保留2–3台機器、靠牆位置、電線桿與架空線、路緣瀝青、公寓及獨棟住宅片段；街區尺度與近處地面責任不同。 |
| 室內：地下狂歡俱樂部 / 金庫 | 29 | 保留：雷射設備及煙霧機是可見物件，並非自動指定發光或煙霧；保留桁架、金屬牆、厚門、地面及單側走線。 |
| 室內：電車車廂正面長椅視角 | 39 | 保留：保留偏置藍色長椅、身後窗門、不鏽鋼牆、吊環、路線圖海報與窗外片段；這是一般來源，不改成固定構圖或刪交通細節。 |
| 室內：電車車廂側面走道視角 | 31 | 保留：保留近主體扶桿、頂部吊環、側長椅、門窗、路線圖與背景乘客；各自建立走道層次。 |
| 室內：電車車廂坐滿與站滿乘客 | 38 | 保留：保留坐與站兩種乘客、扶桿吊環的使用、人體後方門窗與壓縮密度；密度尾句承擔整體空間關係。 |
| 戶外：澀谷站前廣場人潮邊緣 | 92 | 保留：保留地標、人流前後左右關係、共享空間透視光線、距離尺度、路人服裝差異與邊緣重疊裁切；92詞是核准人潮契約。 |
| 戶外：八公銅像旁行人區 | 35 | 保留：小型銅像、低石座、欄杆、人群、車站立面與真實地標尺度各有責任，防止把銅像放大成主景。 |
| 戶外：澀谷站前大型看板下穿越口 | 30 | 保留：保留站側入口、大型看板、路口邊緣斑馬線、等待人群、招牌立面與路緣號誌；不是兩次描述同一看板。 |
| 戶外：目黑川旁的櫻花隧道 | 36 | 保留：保留橋視點與前景欄杆、偏單側河道、單側櫻花冠層、建築深度與小花瓣；非對稱配置是刻意要求。 |
| 戶外：大阪道頓堀心齋橋河道 | 31 | 微調：刪除已由iconic billboard signage承接的famous advertisement boards；保留地點、前景橋欄、下方河水、商業立面層次與橋旁人行道。 |
| 戶外：新宿歌舞伎町招牌下 | 29 | 保留：紅色跨街拱門、鋼支撐、夜生活店面與層疊招牌、濕亮地面及門緣分別描述地標結構與局部空間。 |
| 戶外：城市遊艇碼頭欄杆旁 | 32 | 保留：細不鏽鋼圓管欄杆、風化木板與碼頭鋪面、帆船桅杆、港水及山城遠景分別承擔材質與層次；兩地面片語也是投影匹配來源。 |

## 診斷例外與相容

- 保留原10筆例外、全部分類區間及25筆相機／底片unclassified；只追加28筆保留來源的ID、完整英文SHA256、固定審閱commit及理由，合計38筆。道頓堀改後28詞位於一般範圍，不新增超長例外。兩筆光學微調亦不新增例外。
- specific_contract依據既有單色／漸層棚景測試、前景遮擋規範、頭部主導及澀谷人潮專屬契約；其餘necessary_structure只表示本次逐筆結構審閱，不宣稱已核准新的通用數字上限。多色塊72詞不能套用單色55詞規則；漸層不能改標單色。
- 診斷仍顯示原本over；不隱藏數字、不自動增上限。失效指紋、ID、來源依據、重複例外必須失敗。
- 每筆修改前完整en追加至既有legacyPromptAliases末尾。本批只為光學效果與城市／社群場景在schema及field_mapping補上既有alias欄位契約；parser與storage格式不變。新舊全文解析回相同ID；Saved Cards既有公開原文不改寫，結構化選值優先；重新生成才使用新來源。PAGE2舊匯入不擴修。
- 玻璃前景折射與稜鏡折射仍是restore-only隱藏選項：不新增隨機候選、不重新公開，也不刪除舊選值。

## 基準、驗收與歷史

修改前644組：三變更×單雙人×六景別×四角度×三成像組合432；29長來源×單雙人×三角度174；19光學×單雙人38。必須斷言所選目標實際生效，固定seed與呼叫次數。比較四主及適用衍生，僅允許三處精確字串替換；選值、normalize、舊收藏序列化及公開原文一致。不重錄before.json.gz。

另以精確還原的修改前副本補測15種固定構圖／角色卡接管模式×三筆×單雙人，共90組；選值與RNG保持，仍只允許三處核准替換。

補測三筆新舊英文／Markdown／結構化資料優先權、19光學可見與隱藏狀態、道頓堀低機位來源、28例外指紋及未修改目錄。完整Python、前端、Prompt Quality、同seed200筆strict、sync/schema/歷史ID、目錄工具、assets、lint/build與正式bundle初始化。

歷史新增精確反轉層，只在隔離暫存副本還原本批來源、生成物、政策與必要共用回放銜接；Git原文及SHA封存。未知混合來源、checkout、連結來源拒絕。舊套裝／腰鍊及更早歷史入口保持原斷言，原報告與基準不改寫；新證據另存。前批套裝測試透過原樣測試檔在反轉副本執行。

瀏覽器在5175正式build的隔離context執行桌面1440×1000與手機390×900，驗證三選值、六輸出、舊卡與新卡、六工作區。不得操作使用者收藏。若原生選單需程式化選值，明列限制，不宣稱原生popup滑鼠驗收；既有瀏覽器限制紀錄保留。無外部模型或付費生圖，不宣稱影像品質等價。

相機／底片未分類、其他C類、PAGE2舊匯入、J12、P5b排除。完整結果見[驗收報告](../reports/c2-scene-optics-2026-10-30/README.md)。
