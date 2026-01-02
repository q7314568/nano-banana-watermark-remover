use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
/// 浮水印移除引擎的核心結構
/// 負責儲存不同尺寸的 Alpha Mask 並執行移除運算
#[wasm_bindgen]
pub struct WatermarkEngine {
    /// 小尺寸浮水印的 Alpha 通道資料
    alpha_map_small: Option<Vec<f32>>,
    /// 大尺寸浮水印的 Alpha 通道資料
    alpha_map_large: Option<Vec<f32>>,
    /// 浮水印圖案的亮度值 (假設為白色，即 255.0)
    logo_value: f32,

    small_width: u32,
    small_height: u32,
    large_width: u32,
    large_height: u32,
}

#[wasm_bindgen]
impl WatermarkEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> WatermarkEngine {
        // 設定 panic hook 以便在瀏覽器控制台顯示 Rust 的錯誤訊息
        console_error_panic_hook::set_once();
        WatermarkEngine {
            alpha_map_small: None,
            alpha_map_large: None,
            logo_value: 255.0,
            small_width: 0,
            small_height: 0,
            large_width: 0,
            large_height: 0,
        }
    }

    /// 設定小尺寸浮水印的 Alpha Map
    /// 接收 RGBA 像素資料，計算並儲存 Alpha 版型
    pub fn set_alpha_map_small(&mut self, data: &[u8], width: u32, height: u32) {
        self.alpha_map_small = Some(calculate_alpha_map(data, width, height));
        self.small_width = width;
        self.small_height = height;
    }

    pub fn set_alpha_map_large(&mut self, data: &[u8], width: u32, height: u32) {
        self.alpha_map_large = Some(calculate_alpha_map(data, width, height));
        self.large_width = width;
        self.large_height = height;
    }

    /// 執行浮水印移除
    ///
    /// # 參數
    /// * `image_data`: 原始圖片的 RGBA 像素數據 (唯讀)
    /// * `width`: 圖片寬度
    /// * `height`: 圖片高度
    ///
    /// # 回傳
    /// * `Vec<u8>`: 處理後的圖片 RGBA 數據
    pub fn remove_watermark(
        &self,
        image_data: &[u8],
        width: u32,
        height: u32,
    ) -> Result<Vec<u8>, JsValue> {
        let size_large = width > 1024 && height > 1024;

        let (alpha_map, map_w, map_h) = if size_large {
            match &self.alpha_map_large {
                Some(map) => (map, self.large_width, self.large_height),
                None => return Err(JsValue::from_str("Large alpha map not initialized")),
            }
        } else {
            match &self.alpha_map_small {
                Some(map) => (map, self.small_width, self.small_height),
                None => return Err(JsValue::from_str("Small alpha map not initialized")),
            }
        };

        let margin_right = if size_large { 64 } else { 32 };
        let margin_bottom = if size_large { 64 } else { 32 };

        // Calculate position
        let x = if width > margin_right + map_w {
            width - margin_right - map_w
        } else {
            0
        };
        let y = if height > margin_bottom + map_h {
            height - margin_bottom - map_h
        } else {
            0
        };

        let mut data = image_data.to_vec();
        apply_removal(
            &mut data,
            width,
            height,
            alpha_map,
            map_w,
            map_h,
            x,
            y,
            self.logo_value,
        );

        Ok(data)
    }
}

/// 計算 Alpha Map
///
/// 根據輸入的浮水印圖像數據，計算每個像素的 Alpha 值。
/// 公式：Alpha = max(R, G, B) / 255.0
/// 假設浮水印為白色，則越亮的像素 Alpha 值越高。
fn calculate_alpha_map(data: &[u8], width: u32, height: u32) -> Vec<f32> {
    let mut alpha_data = Vec::with_capacity((width * height) as usize);
    for i in 0..(width * height) as usize {
        let idx = i * 4;
        let r = data[idx];
        let g = data[idx + 1];
        let b = data[idx + 2];

        // 取 RGB 中最大值作為亮度/Alpha 估計
        let max_val = r.max(g).max(b) as f32;
        alpha_data.push(max_val / 255.0);
    }
    alpha_data
}

fn apply_removal(
    image: &mut [u8],
    img_w: u32,
    img_h: u32,
    alpha_map: &[f32],
    map_w: u32,
    map_h: u32,
    start_x: u32,
    start_y: u32,
    logo_value: f32,
) {
    let x_end = (start_x + map_w).min(img_w);
    let y_end = (start_y + map_h).min(img_h);
    let alpha_threshold = 0.002;
    let max_alpha = 0.99;

    for curr_y in start_y..y_end {
        let map_y = curr_y - start_y;
        for curr_x in start_x..x_end {
            let map_x = curr_x - start_x;

            let alpha_idx = (map_y * map_w + map_x) as usize;
            if alpha_idx >= alpha_map.len() {
                continue;
            }

            let alpha = alpha_map[alpha_idx];

            if alpha < alpha_threshold {
                continue;
            }

            let effective_alpha = alpha.min(max_alpha);
            let one_minus_alpha = 1.0 - effective_alpha;

            let idx = ((curr_y * img_w + curr_x) * 4) as usize;

            for c in 0..3 {
                let val = image[idx + c] as f32;

                // 逆向 Alpha Blending 公式：
                // Original = (Composite - Alpha * LogoColor) / (1 - Alpha)
                // 這裡 Composite 是目前像素值 (val)
                // LogoColor 是 255.0 (白色)
                let mut original = (val - effective_alpha * logo_value) / one_minus_alpha;

                if original < 0.0 {
                    original = 0.0;
                }
                if original > 255.0 {
                    original = 255.0;
                }

                image[idx + c] = original as u8;
            }
        }
    }
}
