const fs = require('fs');
const path = require('path');

const inputFile = path.resolve('../reference_repo/assets/embedded_assets.hpp');
const outputFile = path.resolve('src-tauri/src/embedded_assets.rs');

try {
    let content = fs.readFileSync(inputFile, 'utf8');

    // Remove C++ headers/namespace
    content = content.replace(/#pragma once[\s\S]*?namespace embedded \{/g, '');
    content = content.replace(/\} \/\/ namespace embedded[\s\S]*/g, '');

    // Convert arrays
    // bg_48_png -> BG_48_PNG
    content = content.replace(/inline constexpr unsigned char ([a-z0-9_]+)\[\] = \{/g, (match, name) => {
        return `pub const ${name.toUpperCase()}: &[u8] = &[`;
    });

    // End of array
    content = content.replace(/\};/g, '];');

    // Size constants (optional, Rust slice has len(), but let's keep them if needed, or ignore)
    // inline constexpr size_t bg_48_png_size = 1677;
    // We can just comment them out or convert them.
    content = content.replace(/inline constexpr size_t ([a-z0-9_]+) = (\d+);/g, (match, name, val) => {
        return `pub const ${name.toUpperCase()}: usize = ${val};`;
    });
    
    // Add Rust header
    const finalContent = "// Auto-generated from embedded_assets.hpp\n\n" + content;

    fs.writeFileSync(outputFile, finalContent);
    console.log('Successfully converted assets to ' + outputFile);

} catch (e) {
    console.error('Error converting assets:', e);
    process.exit(1);
}
