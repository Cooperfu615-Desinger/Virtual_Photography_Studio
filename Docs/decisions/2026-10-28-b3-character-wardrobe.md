# B3 第一批：角色穿搭來源集中

Cooper 授權依逐筆比對、確認來源、保留用途差異、補防漏改檢查四點實作。本批 main 基準 `887b149a42047bbc3bc1adbb45aa0f68c9e5487e`，不 commit／push。

- 只集中 profile.outfit/accessories 與 PAGE2 wardrobeLayers；身份已經共用，不再遷移。完整 en、MJ 表與圖片 manifest 保留。
- 118 段同角色原文共用，16 段差異原樣保留；資料不是以其他角色的相似文字背書。舊 122/12 指標包含完整 en 與跨角色命中，保留原報告，只修現行檢查口徑。
- 使用明確圖層引用與原串接片段，不做自然語言自動拆分，不順便改輸出內容。
- 新 strict guard 接入既有 CI；歷史 manifest 與報告不改，新增精確 inverse 承接上一批。
- PAGE2 匯入相容與 J12 依最新指示暫緩；C 類、P5b 未進入。

詳見 [規格](../specs/b3-character-wardrobe-source-v1.md)。本機驗收通過：固定 Git 2,396 PAGE2／815 PAGE1 全等，前端 2,014／品質 852 與完整閘門通過，同 seed audit 不變；strict 破壞測試正確阻擋，原 PAGE2／Phase 4／完整 A2／A1／A5 歷史鏈通過。桌手機 54 操作／26 畫面通過，無外部 POST。2,217 歷史檔與其他 20 工作目錄／140 未提交檔保持；未 stage／commit／push。詳見 [驗收報告](../reports/b3-character-wardrobe-2026-10-28/README.md)。
