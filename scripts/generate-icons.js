const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const sourceIcon = path.join(publicDir, 'chameleon-logo.jpg');

async function generateIcons() {
  try {
    console.log('🦎 Generating PWA icons from Chameleon logo...\n');

    // Create apple-touch-icon.png (180x180)
    await sharp(sourceIcon)
      .resize(180, 180, { fit: 'cover' })
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('✓ Created apple-touch-icon.png (180x180)');

    // Create apple-icon.png (180x180)
    await sharp(sourceIcon)
      .resize(180, 180, { fit: 'cover' })
      .png()
      .toFile(path.join(publicDir, 'apple-icon.png'));
    console.log('✓ Created apple-icon.png (180x180)');

    // Create icon-192.png
    await sharp(sourceIcon)
      .resize(192, 192, { fit: 'cover' })
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✓ Created icon-192.png (192x192)');

    // Create icon-512.png
    await sharp(sourceIcon)
      .resize(512, 512, { fit: 'cover' })
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✓ Created icon-512.png (512x512)');

    // Create small icons for browser tabs
    await sharp(sourceIcon)
      .resize(32, 32, { fit: 'cover' })
      .png()
      .toFile(path.join(publicDir, 'icon-light-32x32.png'));
    console.log('✓ Created icon-light-32x32.png (32x32)');

    await sharp(sourceIcon)
      .resize(32, 32, { fit: 'cover' })
      .png()
      .toFile(path.join(publicDir, 'icon-dark-32x32.png'));
    console.log('✓ Created icon-dark-32x32.png (32x32)');

    // Create favicon.ico (using 32x32 size)
    await sharp(sourceIcon)
      .resize(32, 32, { fit: 'cover' })
      .toFile(path.join(publicDir, 'favicon.ico'));
    console.log('✓ Created favicon.ico (32x32)');

    console.log('\n🎉 All PWA icons generated successfully from chameleon-logo.jpg!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
