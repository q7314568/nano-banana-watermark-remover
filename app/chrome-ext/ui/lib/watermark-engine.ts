import init, { WatermarkEngine as WasmEngine } from "../../pkg/nano_banana_watermark_remover_ext";



/**
 * 浮水印移除引擎 (TypeScript Wrapper)
 * 
 * 這個類別負責初始化 WebAssembly 模組，載入必要的資源 (浮水印圖案)，
 * 並提供給前端一個簡單的介面來處理圖片。
 */
export class WatermarkEngine {
    private wasmEngine: WasmEngine | null = null;

    constructor() { }

    /**
     * 初始化引擎
     * 1. 載入 Wasm 模組
     * 2. 讀取預設的浮水印圖案 (assets/bg_*.png)
     * 3. 將圖案資料傳送給 Rust Wasm 端進行 Alpha Map 計算
     */
    public async init() {
        await init(); // Initialize Wasm
        this.wasmEngine = new WasmEngine();

        // Load assets
        const bgSmall = await this.loadImage('assets/bg_48.png');
        const bgLarge = await this.loadImage('assets/bg_96.png');

        const smallData = this.getImageData(bgSmall);
        this.wasmEngine.set_alpha_map_small(new Uint8Array(smallData.data.buffer), smallData.width, smallData.height);

        const largeData = this.getImageData(bgLarge);
        this.wasmEngine.set_alpha_map_large(new Uint8Array(largeData.data.buffer), largeData.width, largeData.height);
    }

    private loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            // Adjust path for dev/prod: in dev, assets are at root or /assets. 
            // In extension, relative path might be tricky.
            // Using absolute path relative to extension root if possible, or relative to current file?
            // "assets/" works if base is root.
            img.src = src;
        });
    }

    private getImageData(img: HTMLImageElement): ImageData {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get canvas context");
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, img.width, img.height);
    }

    /**
     * 移除圖片中的浮水印
     * 
     * @param imageSource 圖片來源，可以是 Blob URL 字串或 File 物件
     * @returns 處理後的圖片 Data URL (Base64 PNG)
     */
    public async removeWatermark(imageSource: string | File): Promise<string> {
        if (!this.wasmEngine) throw new Error("Engine not initialized");

        let img: HTMLImageElement;
        if (imageSource instanceof File) {
            const url = URL.createObjectURL(imageSource);
            img = await this.loadImage(url);
            URL.revokeObjectURL(url);
        } else {
            img = await this.loadImage(imageSource);
        }

        const width = img.width;
        const height = img.height;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas context missing");

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height);

        // 傳遞資料給 Wasm
        // 注意：我們必須將 Uint8ClampedArray 轉換為 Uint8Array，
        // 因為 Rust 的 wasm-bindgen 預期標準的 &[u8] slice。
        const dataBuffer = new Uint8Array(imageData.data.buffer);

        let resultData: Uint8Array;
        try {
            resultData = this.wasmEngine.remove_watermark(dataBuffer, width, height);
        } catch (e) {
            console.error("Wasm error:", e);
            throw e;
        }

        const newImageData = new ImageData(new Uint8ClampedArray(resultData.buffer as ArrayBuffer), width, height);
        ctx.putImageData(newImageData, 0, 0);

        return canvas.toDataURL('image/png');
    }
}
