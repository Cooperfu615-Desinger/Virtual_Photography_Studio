# P5b fixture 處理清單（2026-10-20）

P5b（刪引擎舊自由組合程式）前的逐 fixture 調查。結論：P5b 延後，見 [清理範圍 §6](../../specs/expression-pose-v2-p5-cleanup-scope.md)。

- `fixtures.md`：各基準 A／B／C／D 統計、非矩陣來源逐列、矩陣來源分組、AGENTS.md 受影響條文、待決問題。
- `appendix.md`：`report.py` 附加在 fixtures.md 後面的補充段落。
- `tools/`：產生清單的腳本（repo 316cb64 時的版本）。

## 重跑

腳本會把中間檔（約 30 MB 的 stage1.json、stage2.json、fixtures.json）寫在腳本所在目錄，所以先複製到暫存目錄再跑，不要在 repo 內執行：

```bash
mkdir -p /tmp/p5b && cp tools/* appendix.md /tmp/p5b/
cd <repo>/webapp
REPO="$PWD/src/lib/" node /tmp/p5b/stage2.mjs   # 內部會先跑 harness.mjs 產生 stage1.json
python3 /tmp/p5b/report.py
```

產出 `/tmp/p5b/fixtures.md` 與 `fixtures.json`。重啟 P5b 時先重跑一次，因為 fixture 與基準可能已經改變。
