# Meowdoku 貓咪拼圖 🐱

**Meowdoku** 係一個 Queens / Star Battle 風格嘅邏輯拼圖遊戲。

喺 N×N 棋盤上，棋盤被分成 N 個彩色區域。你要喺**每個區域、每一行、每一列各放一隻貓**，而且**貓與貓唔可以相鄰（包括斜角）**。

## 玩法

- 點格 = 標 ✕（空 ↔ ✕ 循環）
- 開「🐱 放貓模式」先可以放貓
- 非法放貓 = 自動拒絕 + 紅色 shake + 扣 1 心（3 心用晒 = 遊戲結束）
- 每關有 1–3 隻 🔒 鎖定開局貓（唔可以移除）
- 贏 = 每個區域都有貓 + 全部限制成立

## 功能

- 唯一解關卡生成器（回溯 + MRV + 前向檢查）
- 關卡由 4×4 逐步升到 12×12
- 💡 提示（highlight 強制格）、↩️ 復原、🔄 重設
- 計時、3 心生命值
- 自訂貓圖（見 [CHARACTER_SPEC.md](CHARACTER_SPEC.md)）

## 本地玩

直接用 browser 開 `index.html` 就得，零依賴、零 build step。

## 自訂貓圖

畫好你嘅貓，改名做 `cat.png` 放喺根目錄，遊戲會自動套用。詳見 [CHARACTER_SPEC.md](CHARACTER_SPEC.md)。

## 支持

鍾意就 [Buy Me a Coffee](https://buymeacoffee.com/aidonthurtpoor) 請我飲杯咖啡 ☕
