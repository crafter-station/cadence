import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";

// Brand colors extracted from globals.css (oklch converted to hex approximations)
const COLORS = {
  background: "#141211", // oklch(0.085 0.01 20)
  foreground: "#faf9f8", // oklch(0.98 0.005 20)
  accent: "#5b8def", // oklch(0.65 0.15 250)
  muted: "#3d3a38", // oklch(0.2 0.008 20)
  border: "#4a4644", // oklch(0.25 0.008 20)
};

const PUBLIC_DIR = join(process.cwd(), "public");

async function generateOGImage(
  width: number,
  height: number,
  filename: string
) {
  // Create SVG with brand elements
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${COLORS.background};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1918;stop-opacity:1" />
        </linearGradient>
        <!-- Subtle grid pattern -->
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="${COLORS.border}" stroke-width="0.5" opacity="0.3"/>
        </pattern>
      </defs>

      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#grain)"/>

      <!-- Grid overlay -->
      <rect width="100%" height="100%" fill="url(#grid)"/>

      <!-- Accent circle -->
      <circle cx="${width - 200}" cy="${height - 150}" r="300" fill="${COLORS.accent}" opacity="0.08"/>

      <!-- Small decorative elements -->
      <circle cx="80" cy="80" r="6" fill="${COLORS.accent}" opacity="0.6"/>
      <circle cx="${width - 80}" cy="${height - 80}" r="4" fill="${COLORS.foreground}" opacity="0.3"/>

      <!-- Main wordmark -->
      <text
        x="80"
        y="${height / 2 - 20}"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="72"
        font-weight="600"
        fill="${COLORS.foreground}"
        letter-spacing="-0.03em"
      >cadence</text>

      <!-- Tagline -->
      <text
        x="80"
        y="${height / 2 + 40}"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="24"
        fill="${COLORS.foreground}"
        opacity="0.6"
        letter-spacing="0.02em"
      >AI Agent Evaluation Platform</text>

      <!-- Bottom accent line -->
      <rect x="80" y="${height - 60}" width="120" height="3" fill="${COLORS.accent}" rx="1.5"/>
    </svg>
  `;

  const buffer = await sharp(Buffer.from(svg)).png({ quality: 90 }).toBuffer();
  writeFileSync(join(PUBLIC_DIR, filename), buffer);
  console.log(`✓ Generated ${filename}`);
}

async function generateFavicon() {
  // Simple "C" mark favicon
  const createFaviconSvg = (size: number) => `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${COLORS.background}" rx="${size * 0.15}"/>
      <text
        x="50%"
        y="50%"
        dominant-baseline="central"
        text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${size * 0.6}"
        font-weight="700"
        fill="${COLORS.foreground}"
      >c</text>
    </svg>
  `;

  // Generate multiple sizes for ICO
  const sizes = [16, 32, 48];
  const buffers: Buffer[] = [];

  for (const size of sizes) {
    const svg = createFaviconSvg(size);
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    buffers.push(buffer);
  }

  // Generate individual PNG favicons
  const svg32 = createFaviconSvg(32);
  const png32 = await sharp(Buffer.from(svg32)).png().toBuffer();
  writeFileSync(join(PUBLIC_DIR, "favicon.png"), png32);

  // Generate SVG favicon
  writeFileSync(join(PUBLIC_DIR, "favicon.svg"), createFaviconSvg(32));

  // Generate ICO (use 32x32 as primary)
  // ICO format header
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // ICO type
  icoHeader.writeUInt16LE(sizes.length, 4); // Number of images

  const dirEntries: Buffer[] = [];
  const imageData: Buffer[] = [];
  let offset = 6 + sizes.length * 16;

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const data = buffers[i];

    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0); // Width
    entry.writeUInt8(size === 256 ? 0 : size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(data.length, 8); // Image size
    entry.writeUInt32LE(offset, 12); // Image offset

    dirEntries.push(entry);
    imageData.push(data);
    offset += data.length;
  }

  const ico = Buffer.concat([icoHeader, ...dirEntries, ...imageData]);
  writeFileSync(join(PUBLIC_DIR, "favicon.ico"), ico);
  console.log("✓ Generated favicon.ico, favicon.png, favicon.svg");
}

async function generateAppleIcon() {
  const size = 180;
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${COLORS.background}"/>
      <text
        x="50%"
        y="50%"
        dominant-baseline="central"
        text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${size * 0.5}"
        font-weight="700"
        fill="${COLORS.foreground}"
      >c</text>
    </svg>
  `;

  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(join(PUBLIC_DIR, "apple-icon.png"), buffer);
  console.log("✓ Generated apple-icon.png");
}

async function main() {
  console.log("\n🎨 Generating brand assets for Cadence...\n");

  await generateOGImage(1200, 630, "og.png");
  await generateOGImage(1200, 600, "og-twitter.png");
  await generateFavicon();
  await generateAppleIcon();

  console.log("\n✅ All assets generated in /public\n");
}

main().catch(console.error);
