#!/usr/bin/env node

/**
 * Generate PWA icons from the Chameleon logo SVG
 * Creates 192x192, 512x512, and 180x180 (Apple) PNG icons
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/chameleon-icon.svg');
const publicDir = path.join(__dirname, '../public');

// Icon sizes to generate
const iconSizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 180, name: 'apple-icon.png' },
];

async function generateIcons() {
  console.log('🎨 Generating PWA icons from Chameleon logo...\n');

  // Read the SVG file
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate each icon size
  for (const { size, name } of iconSizes) {
    try {
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 10, g: 10, b: 10, alpha: 1 } // #0a0a0a
        })
        .png({
          quality: 100,
          compressionLevel: 9
        })
        .toFile(path.join(publicDir, name));

      console.log(`✅ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n🎉 All PWA icons generated successfully!');
  console.log('📱 Your Chameleon logo is now ready for PWA installation.\n');
}

generateIcons().catch((error) => {
  console.error('❌ Icon generation failed:', error);
  process.exit(1);
});
