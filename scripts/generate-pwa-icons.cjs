const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size, filePath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background - Navy blue
  ctx.fillStyle = '#101B2D';
  ctx.fillRect(0, 0, size, size);
  
  // Draw "GK" text in marigold color
  ctx.fillStyle = '#E8A33D';
  ctx.font = `bold ${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GK', size / 2, size / 2);
  
  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated ${filePath}`);
}

const publicDir = path.join(__dirname, '..', 'public');
generateIcon(192, path.join(publicDir, 'pwa-192x192.png'));
generateIcon(512, path.join(publicDir, 'pwa-512x512.png'));
console.log('PWA icons generated successfully!');
