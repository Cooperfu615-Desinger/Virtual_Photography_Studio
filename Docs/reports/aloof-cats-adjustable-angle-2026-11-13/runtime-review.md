唯讀 runtime/spec 核對：未發現不一致。

- 新ID、名稱與插入原cat之後的順序吻合；原legacyCardId/原source未改。
- full/upper/face只保留情緒，ownsExpression true、ownsHead false；createAction只對新項追加meta.cameraOrbit，既有資料形狀未新增空欄位。
- frontal orbit predicate在ownsHead early return之前獨立判斷。既有動作無cameraOrbit值，原分支語意保持。
- pending確實排除accepted random/lying pools；handsMode沿用fixed預設，因此不開放phone/gesture。
- ground whitelist只追加新ID，室內/戶外表面替換與床場景提示沿既有分支，不新增椅/床坐具。
- 收藏/Markdown/ZIP/storage及輸出pipeline本批無修改，採現有ID選項與既有投影契約；功能回歸驗證由主agent/feature agent執行。
- 新精確inverse的兩個runtime afterHash均吻合此次核對bytes；原歷史seals未改。

此次未重跑完整suite、build或瀏覽器。外部模型成圖品質仍待使用者驗收。

Final runtime SHA256:
{
  "webapp/src/lib/engine/specifiedActions.js": "d7c386e1bfa70d4d2e74d3be0e1ab8b4051926442882d5555e3384ad586d98f0",
  "webapp/src/lib/engine/indoorSeating.js": "1fbcf6c993d8c551cfb7f1108e20b95e24f003e6f03860a050e8d5d5a7594581"
}
