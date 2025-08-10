const fs = require('fs');
const path = require('path');

// Create a simple SVG icon generator
function generateSVGIcon(size, text = 'M') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0369a1;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="12"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="white"/>
  <text x="${size/2}" y="${size/2 + size/12}" font-family="Arial, sans-serif" font-size="${size/3}" font-weight="bold" text-anchor="middle" fill="#0ea5e9">${text}</text>
</svg>`;
}

// Icon sizes needed
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate SVG icons
iconSizes.forEach(size => {
  const svgContent = generateSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(publicDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated ${filename}`);
});

// Also create the PNG versions mentioned in the manifest
const pngSizes = [192, 512];
pngSizes.forEach(size => {
  const svgContent = generateSVGIcon(size);
  const filename = `icon-${size}.png`;
  const filepath = path.join(publicDir, filename);
  
  // For now, we'll create SVG files with .png extension
  // In a real scenario, you'd use a library like sharp or canvas to convert SVG to PNG
  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated ${filename} (SVG format for now)`);
});

console.log('\nIcon generation complete!');
console.log('Note: PNG files are actually SVG files with .png extension.');
console.log('For production, use a proper image conversion library like sharp or canvas.'); 