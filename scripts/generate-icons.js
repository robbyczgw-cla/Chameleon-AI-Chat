const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const sourceIcon = path.join(publicDir, 'apple-icon.png');

async function generateIcons() {
  try {
    console.log('Generating PWA icons...');

    // Copy/rename apple-icon.png to apple-touch-icon.png (180x180)
    await sharp(sourceIcon)
      .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('✓ Created apple-touch-icon.png (180x180)');

    // Create icon-192.png
    await sharp(sourceIcon)
      .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✓ Created icon-192.png (192x192)');

    // Create icon-512.png
    await sharp(sourceIcon)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✓ Created icon-512.png (512x512)');

    console.log('\nAll PWA icons generated successfully! 🎉');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
