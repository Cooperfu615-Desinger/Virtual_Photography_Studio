# 神情姿態原始草稿歸檔（2026-10-24）

這是使用者授權的原稿保存與文件整理，不是新的產品規格或實作授權。原稿逐位元組複製，不加入註記或格式修正；來源檔仍留在原位置。

## 來源與用途

- 來源目錄：`/Users/cooperfu/Projects/Virtual_Photography_Studio`。當時分支為 `codex/shirt-black-bottom`，HEAD 為 `d469a329c34f8f325f0af065639acaac2c55e2da`；下列原稿是未追蹤檔，不是該 commit 內的檔案。
- 對照 main：`8854670bb55a2be54c053a5c21a9a22a973819db`。完整比對未發現需要補回 main 的獨有功能規格或決策。
- 在當時本機可見 Git 歷史中，這 3 份沒有找到逐位元組相同版本，故保留原始草稿快照；不宣稱所有外部分支或備份都沒有副本。
- 原稿內的相對連結與「目前／尚未實作」文字維持原貌。連結需按原 `Docs/decisions/` 或 `Docs/specs/` 位置解讀；本歸檔不複製其報告或圖片依賴。請從下方 main 文件入口閱讀目前狀態，不將原稿覆蓋回 main。

## 原樣保存清單

| 原始檔案／歸檔 | 位元組 | SHA-256 |
| --- | ---: | --- |
| [2026-10-17-expression-pose-direction.md](originals/Docs/decisions/2026-10-17-expression-pose-direction.md) | 4802 | `f45c250edd7916934cc8a1cbed0d01b7e038e8215462ea280534ea01cf4ece03` |
| [expression-pose-v2-implementation-plan.md](originals/Docs/specs/expression-pose-v2-implementation-plan.md) | 4131 | `bda29854caf1a98ca305acbe1636874eec45aeeedae7fa6ab20da27b9edddddc` |
| [expression-pose-v2.md](originals/Docs/specs/expression-pose-v2.md) | 11837 | `bbc301a618aac492641ef52d5434a287d460d562187677e20bc244bfb1930082` |

## 躺姿原稿：已有 Git 歷史，不重複保存

- 檔案：`Docs/specs/pose-library-lying-v1.md`。原專案未追蹤副本與 commit `6d07242c8f65c740dec292fdd10428f6f0597344` 中此檔逐位元組相同。
- 位元組：7339；SHA-256：`6f43a4041d88c47c7a5d9c6a2dfb91178816c12172a6224571f5abdd377aa92d`。
- 唯讀查看原文：

```sh
git show 6d07242c8f65c740dec292fdd10428f6f0597344:Docs/specs/pose-library-lying-v1.md
```

- 本次保留原專案副本，未刪除或搬走；恢復指標不代表已授權清理副本。

## 目前文件入口

- [方向決策](../../decisions/2026-10-17-expression-pose-direction.md)
- [實作計畫](../../specs/expression-pose-v2-implementation-plan.md)
- [神情姿態 v2](../../specs/expression-pose-v2.md)
- [躺姿 v1](../../specs/pose-library-lying-v1.md)

## 本次範圍與驗證

- 只修改上述 4 份 main 文件的狀態與歷史標示、現況摘要及本歸檔。保留章節編號、決策與實作證據、英文範例；不改產品行為。
- 核對原稿 SHA-256 與複本位元組、躺姿 Git blob、文件連結與 whitespace。原稿內部連結按原始文件位置核對。
- 本次不改 executable contract，不需要程式測試、建置或瀏覽器驗收。未開始目錄資料架構 B 或 P5b。歸檔整理階段未 stage、commit、push；後續 Cooper 已驗收，並授權與姿勢去向文件修訂一併提交及推送，原稿內容維持不變。
