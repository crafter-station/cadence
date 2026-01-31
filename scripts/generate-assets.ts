import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";

// Brand colors from landing page
const COLORS = {
  background: "#0A0A0A",
  foreground: "#E8E4D9",
  foregroundMuted: "rgba(232, 228, 217, 0.4)",
  foregroundSubtle: "rgba(232, 228, 217, 0.1)",
  border: "rgba(232, 228, 217, 0.1)",
};

const PUBLIC_DIR = join(process.cwd(), "public");

async function generateOGImage(
  width: number,
  height: number,
  filename: string
) {
  // Neo-Brutalist Swiss Typography style matching landing page
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Grain texture filter -->
        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/>
          <feColorMatrix type="saturate" values="0"/>
          <feBlend in="SourceGraphic" in2="noise" mode="multiply"/>
        </filter>

        <!-- Radial lines pattern -->
        <pattern id="radialLines" x="0" y="0" width="${width}" height="${height}" patternUnits="userSpaceOnUse">
          <line x1="100" y1="80" x2="1200" y2="80" stroke="${COLORS.foreground}" stroke-width="0.5" opacity="0.15"/>
          <line x1="100" y1="80" x2="1150" y2="400" stroke="${COLORS.foreground}" stroke-width="0.5" opacity="0.15"/>
          <line x1="100" y1="80" x2="1000" y2="700" stroke="${COLORS.foreground}" stroke-width="0.5" opacity="0.15"/>
          <line x1="100" y1="80" x2="750" y2="900" stroke="${COLORS.foreground}" stroke-width="0.5" opacity="0.15"/>
          <line x1="100" y1="80" x2="400" y2="1000" stroke="${COLORS.foreground}" stroke-width="0.5" opacity="0.15"/>
          <line x1="100" y1="80" x2="100" y2="1000" stroke="${COLORS.foreground}" stroke-width="0.5" opacity="0.15"/>
          <line x1="100" y1="80" x2="-200" y2="900" stroke="${COLORS.foreground}" stroke-width="0.5" opacity="0.15"/>
        </pattern>
      </defs>

      <!-- Background -->
      <rect width="100%" height="100%" fill="${COLORS.background}"/>

      <!-- Radial lines overlay -->
      <rect width="100%" height="100%" fill="url(#radialLines)"/>

      <!-- Grain overlay -->
      <rect width="100%" height="100%" fill="${COLORS.background}" opacity="0.03" filter="url(#grain)"/>

      <!-- Small decorative square (logo mark) -->
      <rect x="80" y="80" width="8" height="8" fill="${COLORS.foreground}"/>

      <!-- Floating label top-left -->
      <text x="80" y="120" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="${COLORS.foregroundMuted}" letter-spacing="0.1em">
        AI AGENT TESTING
      </text>

      <!-- Floating label top-right -->
      <text x="${width - 80}" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="${COLORS.foregroundMuted}" letter-spacing="0.1em" text-anchor="end">
        PARALLEL
      </text>
      <text x="${width - 80}" y="95" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="${COLORS.foregroundMuted}" letter-spacing="0.1em" text-anchor="end">
        EXECUTION
      </text>

      <!-- Horizontal divider line -->
      <line x1="80" y1="200" x2="280" y2="200" stroke="${COLORS.foreground}" stroke-width="1" opacity="0.3"/>

      <!-- Main headline - Large-Scale -->
      <text
        x="80"
        y="290"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="100"
        font-weight="700"
        fill="${COLORS.foreground}"
        letter-spacing="-0.04em"
      >Large-Scale</text>

      <!-- Main headline - Agent -->
      <text
        x="80"
        y="390"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="100"
        font-weight="700"
        fill="${COLORS.foreground}"
        letter-spacing="-0.04em"
      >Agent</text>

      <!-- Main headline - Evaluation -->
      <text
        x="80"
        y="490"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="100"
        font-weight="700"
        fill="${COLORS.foreground}"
        letter-spacing="-0.04em"
      >Evaluation</text>

      <!-- Tagline italic -->
      <text
        x="80"
        y="${height - 100}"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="16"
        font-style="italic"
        fill="${COLORS.foregroundMuted}"
      >A Testing Framework for AI Agents &amp; LLM-Powered Systems</text>

      <!-- Bottom decorative elements -->
      <rect x="80" y="${height - 60}" width="40" height="3" fill="${COLORS.foreground}"/>

      <!-- Brand name bottom right -->
      <text
        x="${width - 80}"
        y="${height - 60}"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="14"
        font-weight="500"
        fill="${COLORS.foregroundMuted}"
        text-anchor="end"
        letter-spacing="-0.02em"
      >cadence</text>

      <!-- Stats indicators -->
      <g transform="translate(${width - 300}, 200)">
        <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="${COLORS.foreground}">10,000+</text>
        <text x="0" y="20" font-family="system-ui, -apple-system, sans-serif" font-size="9" fill="${COLORS.foregroundMuted}" letter-spacing="0.1em">TESTS PER RUN</text>

        <text x="0" y="70" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="${COLORS.foreground}">50x</text>
        <text x="0" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="9" fill="${COLORS.foregroundMuted}" letter-spacing="0.1em">PARALLEL SESSIONS</text>
      </g>
    </svg>
  `;

  const buffer = await sharp(Buffer.from(svg)).png({ quality: 90 }).toBuffer();
  writeFileSync(join(PUBLIC_DIR, filename), buffer);
  console.log(`✓ Generated ${filename}`);
}

async function generateFavicon() {
  // Minimalist square mark favicon (matching the logo mark on landing)
  const createFaviconSvg = (size: number) => {
    const padding = Math.floor(size * 0.2);
    const squareSize = Math.floor(size * 0.35);
    return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${COLORS.background}"/>
      <!-- Simple "c" letterform -->
      <text
        x="50%"
        y="54%"
        dominant-baseline="central"
        text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${size * 0.65}"
        font-weight="700"
        fill="${COLORS.foreground}"
        letter-spacing="-0.04em"
      >c</text>
    </svg>
  `;
  };

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
        y="54%"
        dominant-baseline="central"
        text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${size * 0.55}"
        font-weight="700"
        fill="${COLORS.foreground}"
        letter-spacing="-0.04em"
      >c</text>
    </svg>
  `;

  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(join(PUBLIC_DIR, "apple-icon.png"), buffer);
  console.log("✓ Generated apple-icon.png");
}

async function main() {
  console.log("\n🎨 Generating brand assets for Cadence (Neo-Brutalist style)...\n");

  await generateOGImage(1200, 630, "og.png");
  await generateOGImage(1200, 600, "og-twitter.png");
  await generateFavicon();
  await generateAppleIcon();

  console.log("\n✅ All assets generated in /public\n");
}

main().catch(console.error);
