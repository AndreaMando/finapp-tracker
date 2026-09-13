// One-off script: rasterizes src/app/icon.svg to PNGs and packs them into a
// real multi-size favicon.ico (ICO can legally embed PNG-format images
// directly, per the format spec since Vista — no external image library
// needed, just a correct ICONDIR/ICONDIRENTRY header written by hand).
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const svgPath = path.join(__dirname, "..", "src", "app", "icon.svg");
const svg = fs.readFileSync(svgPath, "utf8");
const sizes = [16, 32, 48];

function buildIco(pngBuffers) {
  const n = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + dirEntrySize * n;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(n, 4); // image count

  const dirEntries = [];
  for (const { size, buf } of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size === 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size === 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // image data size
    entry.writeUInt32LE(offset, 12); // offset
    offset += buf.length;
    dirEntries.push(entry);
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map((p) => p.buf)]);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pngBuffers = [];

  for (const size of sizes) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<!doctype html><html><body style="margin:0;padding:0;">${svg}</body></html>`
    );
    const el = await page.$("svg");
    await el.evaluate((node, s) => {
      node.setAttribute("width", String(s));
      node.setAttribute("height", String(s));
    }, size);
    const buf = await page.screenshot({ omitBackground: true });
    pngBuffers.push({ size, buf });
    console.log(`rendered ${size}x${size} (${buf.length} bytes)`);
  }

  const ico = buildIco(pngBuffers);
  const outPath = path.join(__dirname, "..", "src", "app", "favicon.ico");
  fs.writeFileSync(outPath, ico);
  console.log("wrote", outPath, ico.length, "bytes");

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
