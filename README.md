# Nano Banana Watermark Remover (奈米香蕉浮水印移除器)

使用 **Tauri** (Rust + Vue 3) 構建的高效能桌面應用程式，專門用於移除特定的 "Nano Banana" 浮水印。

## ✨ 特色

- **高效能**：基於 Rust 後端，提供快速且穩定的影像處理能力。
- **隱私優先**：所有運算完全在您的本機運行，無需上傳圖片至伺服器。
- **精確移除**：採用自定義的「反向 Alpha 混合 (Reverse Alpha Blending)」演算法，針對性地移除浮水印圖案，最大程度保留原始影像細節。
- **跨平台**：支援 Windows、macOS 和 Linux。

## 🛠️ 技術堆疊

- **Core**: Rust (Tauri Backend)
- **Frontend**: Vue 3 (Composition API) + TypeScript
- **Bundler**: Vite
- **UI Framework/Styles**: Vanilla CSS / Scoped CSS

## 📂 專案結構

- **`app/src-tauri/`**: 核心應用程式邏輯 (Rust)。處理檔案 I/O 與高效能影像運算。
- **`app/src/`**: 主要桌面端 UI (Vue 3 + TypeScript)。

## 🚀 快速開始

### 前置需求

- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/) (建議 v18+)

### 開發環境設置

1.  **進入應用程式目錄並安裝依賴：**
    ```bash
    cd app
    npm install
    ```

2.  **啟動開發模式：**
    ```bash
    npm run tauri dev
    ```
    這將會同時啟動 Vite 前端伺服器與 Tauri 視窗。

### 建置發布 (Build)

為您當前的作業系統建立最佳化的執行檔：
```bash
cd app
npm run tauri build
```
建置完成後的檔案將位於 `app/src-tauri/target/release/bundle` 目錄下。

## 📄 License

[MIT](LICENSE)
