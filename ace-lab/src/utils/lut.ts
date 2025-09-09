// Parse a .cube 3D LUT and render it to a 2D tiled PNG data URL
// Supports LUT_3D_SIZE N (commonly 16, 17, 32)

export async function cubeTextToDataURL(text: string): Promise<string> {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let size = 0;
  const data: number[] = [];
  for (const line of lines) {
    if (line.startsWith('#')) continue;
    const [key, ...rest] = line.split(/\s+/);
    if (key.toUpperCase() === 'LUT_3D_SIZE') {
      size = parseInt(rest[0], 10);
      continue;
    }
    // data rows: r g b
    if (/^[0-9.+\-eE]/.test(key)) {
      const parts = [key, ...rest].map(Number);
      if (parts.length === 3) {
        data.push(parts[0], parts[1], parts[2]);
      }
    }
  }
  if (!size || data.length !== size * size * size * 3) {
    throw new Error('Invalid .cube data');
  }

  // Tile layout: tiles = size, each tile is size x size, atlas = (size*size) x size
  const tiles = size;
  const tileSize = size;
  const width = tiles * tileSize;
  const height = tileSize;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');
  const img = ctx.createImageData(width, height);

  // Order in .cube is typically blue-fastest. Assume index = r + g*size + b*size*size
  let idx = 0;
  for (let b = 0; b < size; b++) {
    const tileX = b % tiles;
    const tileY = Math.floor(b / tiles); // should be 0 since tiles=size
    for (let g = 0; g < size; g++) {
      for (let r = 0; r < size; r++) {
        const x = tileX * tileSize + r;
        const y = tileY * tileSize + g;
        const o = (y * width + x) * 4;
        const rr = data[idx++] * 255;
        const gg = data[idx++] * 255;
        const bb = data[idx++] * 255;
        img.data[o] = rr;
        img.data[o+1] = gg;
        img.data[o+2] = bb;
        img.data[o+3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}


