# Nano Banana Watermark Remover

A powerful desktop application built with **Tauri** (Rust + Vue 3) to strictly remove specific "Nano Banana" watermarks from images.

> **Note:** A lightweight [Chrome Extension](#chrome-extension) version is also available as a byproduct of this project.

## Features

- **High Performance:** Powered by a Rust backend for efficient image processing.
- **Privacy First:** runs entirely offline on your machine.
- **Precision:** Uses a custom "Reverse Alpha Blending" algorithm to specifically target and subtract known watermark patterns without damaging the image.
- **Cross-Platform:** Windows, macOS, and Linux support via Tauri.

## Project Structure

- **`src-tauri/`**: The core application logic written in Rust. Handles file I/O and heavy image processing.
- **`src/`**: The main desktop UI (Vue 3 + TypeScript).
- **`chrome-ext/`**: A port of the application packaged as a Chrome Extension (Pure TypeScript implementation).

## Getting Started (Desktop App)

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/)

### Development

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run in development mode:**
    ```bash
    npm run tauri dev
    ```

### Build

To create a release bundle for your OS:
```bash
npm run tauri build
```

---

## Chrome Extension

This project accepts the trade-off of rewriting the core logic in TypeScript to run natively in the browser.

### Installation

1.  **Build the extension:**
    ```bash
    cd chrome-ext
    npm install
    npm run build
    ```
2.  **Load in Chrome:**
    - Go to `chrome://extensions`.
    - Enable **Developer mode**.
    - Click **Load unpacked** and select `app/chrome-ext/dist`.

## License

[MIT](LICENSE)
