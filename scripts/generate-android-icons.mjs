import { Jimp } from "jimp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "Assets/Brick & Clay White Emblem Logo.jpg");
const resDir = join(root, "android/app/src/main/res");

const ICON_SIZE = 1024;
const BG_COLOR = 0x0f0d0bff; // #0F0D0B fully opaque

const sizes = [
  { dir: "mipmap-mdpi",    px: 48  },
  { dir: "mipmap-hdpi",    px: 72  },
  { dir: "mipmap-xhdpi",   px: 96  },
  { dir: "mipmap-xxhdpi",  px: 144 },
  { dir: "mipmap-xxxhdpi", px: 192 },
];

const PADDING = 0.12;
const logoSize = Math.round(ICON_SIZE * (1 - PADDING * 2));

// Load logo and resize to fit within padded area
const logo = await Jimp.read(src);
logo.resize({ w: logoSize, h: logoSize });

const left = Math.round((ICON_SIZE - logo.width) / 2);
const top  = Math.round((ICON_SIZE - logo.height) / 2);

// Create dark background and composite logo
const base = new Jimp({ width: ICON_SIZE, height: ICON_SIZE, color: BG_COLOR });
base.composite(logo, left, top);

for (const { dir, px } of sizes) {
  const outDir = join(resDir, dir);
  mkdirSync(outDir, { recursive: true });

  const resized = base.clone().resize({ w: px, h: px });
  await resized.write(join(outDir, "ic_launcher.png"));
  await resized.write(join(outDir, "ic_launcher_round.png"));
  await resized.write(join(outDir, "ic_launcher_foreground.png"));
  console.log(`✓ ${dir} (${px}x${px})`);
}

console.log("\n✓ All Android icons generated.");
