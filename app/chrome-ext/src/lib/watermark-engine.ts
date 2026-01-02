
export enum WatermarkSize {
    Small,
    Large,
}

interface WatermarkPosition {
    marginRight: number;
    marginBottom: number;
}

interface AlphaMap {
    width: number;
    height: number;
    data: Float32Array;
}

export class WatermarkEngine {
    private alphaMapSmall: AlphaMap | null = null;
    private alphaMapLarge: AlphaMap | null = null;
    private logoValue: number = 255.0;

    constructor() { }

    public async init() {
        // Load assets from public/assets folder
        const bgSmall = await this.loadImage('assets/bg_48.png');
        const bgLarge = await this.loadImage('assets/bg_96.png');

        this.alphaMapSmall = this.calculateAlphaMap(bgSmall);
        this.alphaMapLarge = this.calculateAlphaMap(bgLarge);
    }

    private loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    private calculateAlphaMap(img: HTMLImageElement): AlphaMap {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get canvas context");

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data; // RGBA

        const alphaData = new Float32Array(img.width * img.height);

        for (let i = 0; i < alphaData.length; i++) {
            const r = data[i * 4];
            const g = data[i * 4 + 1];
            const b = data[i * 4 + 2];

            // max(r, g, b) / 255.0
            const maxVal = Math.max(r, Math.max(g, b));
            alphaData[i] = maxVal / 255.0;
        }

        return {
            width: img.width,
            height: img.height,
            data: alphaData
        };
    }

    public async removeWatermark(imageSource: string | File): Promise<string> {
        // Load target image
        let img: HTMLImageElement;
        if (imageSource instanceof File) {
            const url = URL.createObjectURL(imageSource);
            img = await this.loadImage(url);
            URL.revokeObjectURL(url); // Clean up
        } else {
            img = await this.loadImage(imageSource);
        }

        const width = img.width;
        const height = img.height;

        // Determine size
        let size = WatermarkSize.Small;
        if (width > 1024 && height > 1024) {
            size = WatermarkSize.Large;
        }

        let config: WatermarkPosition;
        let alphaMap: AlphaMap | null;

        if (size === WatermarkSize.Small) {
            config = { marginRight: 32, marginBottom: 32 };
            alphaMap = this.alphaMapSmall;
        } else {
            config = { marginRight: 64, marginBottom: 64 };
            alphaMap = this.alphaMapLarge;
        }

        if (!alphaMap) throw new Error("Assets not initialized");

        // Calculate position
        const logoW = alphaMap.width;
        const logoH = alphaMap.height;

        let x = width - config.marginRight - logoW;
        let y = height - config.marginBottom - logoH;

        // Saturating sub equivalent
        if (x < 0) x = 0;
        if (y < 0) y = 0;

        // Process
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas context missing");

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height);

        this.applyRemoval(imageData, alphaMap, x, y);

        ctx.putImageData(imageData, 0, 0);

        return canvas.toDataURL('image/png');
    }

    private applyRemoval(image: ImageData, alphaMap: AlphaMap, x: number, y: number) {
        const imgW = image.width;
        const imgH = image.height;
        const mapW = alphaMap.width;
        const mapH = alphaMap.height;

        const xEnd = Math.min(x + mapW, imgW);
        const yEnd = Math.min(y + mapH, imgH);

        const alphaThreshold = 0.002;
        const maxAlpha = 0.99;

        const data = image.data;

        for (let currY = y; currY < yEnd; currY++) {
            const mapY = currY - y;
            for (let currX = x; currX < xEnd; currX++) {
                const mapX = currX - x;

                const alpha = alphaMap.data[mapY * mapW + mapX];

                if (alpha < alphaThreshold) continue;

                const effectiveAlpha = Math.min(alpha, maxAlpha);
                const oneMinusAlpha = 1.0 - effectiveAlpha;

                const idx = (currY * imgW + currX) * 4;

                // RGB channels
                for (let c = 0; c < 3; c++) {
                    const val = data[idx + c];
                    // original = (val - alpha * logo_value) / one_minus_alpha
                    let original = (val - effectiveAlpha * this.logoValue) / oneMinusAlpha;

                    // clamp
                    if (original < 0) original = 0;
                    if (original > 255) original = 255;

                    data[idx + c] = original;
                }
                // Alpha channel (idx+3) remains 255 usually, or whatever it was
            }
        }
    }
}
