/**
 * Pool check from the county's aerial photo: fetch the lot's view through
 * /api/admin/aerial (same-origin, so its pixels can be read), mask it to the
 * lot outline, and measure the open pool water inside.
 *
 * "Pool water" is the clear, bright cyan of a sunlit pool: hue 165–210°, some
 * saturation, reasonably bright, and clearly bluer than red. Tested on recent
 * sales around NE St. Pete: open pools measured 11–28 m², lots without one
 * under 2 m². Shadows, trees, roofs and grey screen cages don't pass, which is
 * also the blind spot: a pool under a screen enclosure or deep shade can read
 * as "none seen". So the thumbnail always shows, and the answer is worded as
 * what the photo shows, not what the property has.
 */

export type PoolStatus = 'seen' | 'possible' | 'none';
export type PoolCheck = { status: PoolStatus; waterM2: number; thumb: string } | { status: 'error'; thumb: null };

/** At least this much open water inside the lot reads as a pool. */
export const POOL_SEEN_M2 = 8;
/** Between this and POOL_SEEN_M2: something blue worth a look (small, shaded or partly screened). */
export const POOL_POSSIBLE_M2 = 2.5;

const WIDTH = 320;
const PAD_DEG = 0.00006; // about 6 m round the lot, so its edges show

type Ring = Array<[number, number]>;

const view = (ring: Ring) => {
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  const bbox: [number, number, number, number] = [
    Math.min(...xs) - PAD_DEG,
    Math.min(...ys) - PAD_DEG,
    Math.max(...xs) + PAD_DEG,
    Math.max(...ys) + PAD_DEG,
  ];
  const lat = (bbox[1] + bbox[3]) / 2;
  // Degrees of longitude are shorter than latitude here; keep the photo square-pixeled.
  const widthM = (bbox[2] - bbox[0]) * 111_320 * Math.cos((lat * Math.PI) / 180);
  const heightM = (bbox[3] - bbox[1]) * 110_574;
  const h = Math.max(120, Math.min(480, Math.round((WIDTH * heightM) / widthM)));
  return { bbox, w: WIDTH, h, pixelM2: (widthM / WIDTH) * (heightM / h) };
};

const isPoolWater = (r: number, g: number, b: number): boolean => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min || b <= r + 25) return false;
  const s = (max - min) / max;
  const v = max / 255;
  let hue: number;
  if (max === r) hue = 60 * (((g - b) / (max - min)) % 6);
  else if (max === g) hue = 60 * ((b - r) / (max - min) + 2);
  else hue = 60 * ((r - g) / (max - min) + 4);
  if (hue < 0) hue += 360;
  return hue >= 165 && hue <= 210 && s >= 0.2 && v >= 0.35;
};

const loadImage = (src: string, signal?: AbortSignal): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const abort = () => {
      img.src = '';
      reject(new DOMException('aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', abort, { once: true });
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('aerial_failed'));
    img.src = src;
  });

export const checkPool = async (ring: Ring, signal?: AbortSignal): Promise<PoolCheck> => {
  const { bbox, w, h, pixelM2 } = view(ring);
  const img = await loadImage(`/api/admin/aerial?bbox=${bbox.map((n) => n.toFixed(6)).join(',')}&w=${w}&h=${h}`, signal);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { status: 'error', thumb: null };
  ctx.drawImage(img, 0, 0, w, h);

  const toPx = ([lng, lat]: [number, number]): [number, number] => [
    ((lng - bbox[0]) / (bbox[2] - bbox[0])) * w,
    ((bbox[3] - lat) / (bbox[3] - bbox[1])) * h,
  ];
  const trace = (c: CanvasRenderingContext2D) => {
    c.beginPath();
    ring.forEach((p, i) => {
      const [x, y] = toPx(p);
      if (i) c.lineTo(x, y);
      else c.moveTo(x, y);
    });
    c.closePath();
  };

  // The lot as a mask: only water inside the outline counts, never the neighbor's.
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = w;
  maskCanvas.height = h;
  const mctx = maskCanvas.getContext('2d', { willReadFrequently: true });
  if (!mctx) return { status: 'error', thumb: null };
  trace(mctx);
  mctx.fill();
  const mask = mctx.getImageData(0, 0, w, h).data;
  const px = ctx.getImageData(0, 0, w, h).data;
  let water = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (mask[i + 3] && isPoolWater(px[i], px[i + 1], px[i + 2])) water++;
  }
  const waterM2 = Math.round(water * pixelM2 * 10) / 10;

  // The thumbnail: the photo with the lot outlined in the homepage's gold.
  trace(ctx);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffc405';
  ctx.stroke();

  return {
    status: waterM2 >= POOL_SEEN_M2 ? 'seen' : waterM2 >= POOL_POSSIBLE_M2 ? 'possible' : 'none',
    waterM2,
    thumb: canvas.toDataURL('image/jpeg', 0.82),
  };
};
