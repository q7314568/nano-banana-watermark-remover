use crate::embedded_assets;
use image::{DynamicImage, GenericImage, GenericImageView, Pixel, Rgba};

#[derive(Clone, Copy, PartialEq)]
pub enum WatermarkSize {
    Small,
    Large,
}

struct WatermarkPosition {
    margin_right: u32,
    margin_bottom: u32,
}

impl WatermarkPosition {
    fn get_position(&self, width: u32, height: u32, logo_w: u32, logo_h: u32) -> (u32, u32) {
        let x = width
            .saturating_sub(self.margin_right)
            .saturating_sub(logo_w);
        let y = height
            .saturating_sub(self.margin_bottom)
            .saturating_sub(logo_h);
        (x, y)
    }
}

pub struct AlphaMap {
    pub width: u32,
    pub height: u32,
    pub data: Vec<f32>,
}

pub struct WatermarkEngine {
    alpha_map_small: AlphaMap,
    alpha_map_large: AlphaMap,
    logo_value: f32,
}

impl WatermarkEngine {
    pub fn new() -> Self {
        // Load potentially resizing if needed, but we assume assets are correct size as per C++
        let bg_small =
            image::load_from_memory(embedded_assets::BG_48_PNG).expect("Failed to load BG_48");
        let bg_large =
            image::load_from_memory(embedded_assets::BG_96_PNG).expect("Failed to load BG_96");

        // Resize if strictly matching C++ paranoia, but assets are static.

        Self {
            alpha_map_small: calculate_alpha_map(&bg_small),
            alpha_map_large: calculate_alpha_map(&bg_large),
            logo_value: 255.0,
        }
    }

    pub fn remove_watermark(&self, image: &mut DynamicImage) {
        let (w, h) = image.dimensions();

        // Determine size
        let size = if w > 1024 && h > 1024 {
            WatermarkSize::Large
        } else {
            WatermarkSize::Small
        };

        let (config, alpha_map) = match size {
            WatermarkSize::Small => (
                WatermarkPosition {
                    margin_right: 32,
                    margin_bottom: 32,
                },
                &self.alpha_map_small,
            ),
            WatermarkSize::Large => (
                WatermarkPosition {
                    margin_right: 64,
                    margin_bottom: 64,
                },
                &self.alpha_map_large,
            ),
        };

        let (pos_x, pos_y) = config.get_position(w, h, alpha_map.width, alpha_map.height);

        self.apply_removal(image, alpha_map, pos_x, pos_y);
    }

    fn apply_removal(&self, image: &mut DynamicImage, alpha_map: &AlphaMap, x: u32, y: u32) {
        let (img_w, img_h) = image.dimensions();
        let map_w = alpha_map.width;
        let map_h = alpha_map.height;

        let x_end = (x + map_w).min(img_w);
        let y_end = (y + map_h).min(img_h);

        let alpha_threshold = 0.002;
        let max_alpha = 0.99;

        for curr_y in y..y_end {
            let map_y = curr_y - y;
            for curr_x in x..x_end {
                let map_x = curr_x - x;

                let alpha = alpha_map.data[(map_y * map_w + map_x) as usize];

                if alpha < alpha_threshold {
                    continue;
                }

                let alpha = alpha.min(max_alpha);
                let one_minus_alpha = 1.0 - alpha;

                let mut pixel = image.get_pixel(curr_x, curr_y);
                // process RGB channels (0, 1, 2)
                for c in 0..3 {
                    let val = pixel[c] as f32;
                    let original = (val - alpha * self.logo_value) / one_minus_alpha;
                    pixel[c] = original.clamp(0.0, 255.0) as u8;
                }
                image.put_pixel(curr_x, curr_y, pixel);
            }
        }
    }
}

fn calculate_alpha_map(img: &DynamicImage) -> AlphaMap {
    let (w, h) = img.dimensions();
    let mut data = Vec::with_capacity((w * h) as usize);

    for y in 0..h {
        for x in 0..w {
            let p = img.get_pixel(x, y);
            // RGB max
            let max_val = p[0].max(p[1]).max(p[2]);
            data.push(max_val as f32 / 255.0);
        }
    }

    AlphaMap {
        width: w,
        height: h,
        data,
    }
}
