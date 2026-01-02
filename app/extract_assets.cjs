const fs = require('fs');
const path = require('path');

const rustFile = path.resolve('src-tauri/src/embedded_assets.rs');
const outputDir = path.resolve('chrome-ext/public/assets');

console.log(`Reading from: ${rustFile}`);
console.log(`Output to: ${outputDir}`);

if (!fs.existsSync(outputDir)){
    console.log('Creating output directory...');
    fs.mkdirSync(outputDir, { recursive: true });
}

try {
    const content = fs.readFileSync(rustFile, 'utf8');

    // Regex to find variable name and byte array content
    // pattern: pub const NAME: &[u8] = &[ 0x00, 0x01 ... ];
    const regex = /pub const ([A-Z0-9_]+): &\[u8\] = &\[([\s\S]*?)\];/g;

    let match;
    let count = 0;
    while ((match = regex.exec(content)) !== null) {
        const name = match[1]; // e.g., BG_48_PNG
        const bytesStr = match[2];
        
        // Clean up bytes string: remove comments, newlines, spaces
        const bytes = bytesStr
            .replace(/\/\/.*$/gm, '') // remove comments
            .replace(/\s+/g, '') // remove whitespace
            .split(',')
            .filter(b => b) // remove empty strings
            .map(b => parseInt(b, 16));

        const buffer = Buffer.from(bytes);
        const filename = name.toLowerCase().replace('_png', '.png');
        const outputPath = path.join(outputDir, filename);

        fs.writeFileSync(outputPath, buffer);
        console.log(`Extracted ${filename} (${buffer.length} bytes)`);
        count++;
    }
    
    if (count === 0) {
        console.log('No assets found matching regex.');
    } else {
        console.log(`Extraction complete. ${count} files written.`);
    }

} catch (e) {
    console.error('Error extract_assets:', e);
}
