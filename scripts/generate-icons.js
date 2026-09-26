// Simple icon generator for PWA
// In production, replace with actual designed icons

const fs = require('fs')
const path = require('path')

const sizes = [192, 512]
const publicDir = path.join(__dirname, '../public')

// Create simple SVG icons
sizes.forEach((size) => {
  const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#f97316" rx="${size * 0.2}"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".35em" fill="white" font-size="${size * 0.6}" font-weight="bold" font-family="system-ui, sans-serif">R</text>
</svg>
  `.trim()

  fs.writeFileSync(path.join(publicDir, `icon-${size}x${size}.svg`), svg)
  console.log(`Generated icon-${size}x${size}.svg`)
})

// Create placeholder screenshots info
const screenshotsInfo = `
# PWA Screenshots

For production, replace these placeholder files with actual app screenshots:

- screenshot-wide.png (1280x720) - Desktop/tablet view
- screenshot-narrow.png (750x1334) - Mobile view

These improve the PWA install experience on supporting devices.
`

fs.writeFileSync(path.join(publicDir, 'SCREENSHOTS.md'), screenshotsInfo.trim())
console.log('Generated SCREENSHOTS.md')
