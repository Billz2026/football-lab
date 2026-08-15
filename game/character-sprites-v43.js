const BUILD = "43.2.0";
const EXPECTED_BASE64_LENGTH = 100124;
const EXPECTED_BASE64_SHA256 = "8bbe50ce518207b849f446846769e4b4bda776c390644f42df3dc48bd43be6b3";

const PART_NAMES = Object.freeze([
  "masters-v43.part0.b64",
  "masters-v43.part1.b64",
  "masters-v43.part2a.b64",
  "masters-v43.part2m.b64",
  "masters-v43.part2b.b64",
  "masters-v43.part3.b64",
  "masters-v43.part4.b64",
  "masters-v43.part5.b64",
  "masters-v43.part6.b64",
  "masters-v43.part7.b64"
]);
const PART_URLS = PART_NAMES.map((name) =>
  new URL(`./assets/characters/v43/${name}`, import.meta.url).href
);

const FRAMES = Object.freeze({
  "viktor-idle-back": Object.freeze({ x: 10, y: 8, w: 79, h: 252, anchorX: 0.5, anchorY: 0.985 }),
  "viktor-windup-side": Object.freeze({ x: 99, y: 8, w: 62, h: 255, anchorX: 0.51, anchorY: 0.985 }),
  "mikkel-set": Object.freeze({ x: 171, y: 8, w: 92, h: 256, anchorX: 0.5, anchorY: 0.985 }),
  "viktor-contact": Object.freeze({ x: 273, y: 8, w: 236, h: 360, anchorX: 0.49, anchorY: 0.965 }),
  "mikkel-dive": Object.freeze({ x: 519, y: 8, w: 278, h: 339, anchorX: 0.43, anchorY: 0.63 })
});

const runtime = {
  status: "loading",
  error: null,
  image: null,
  width: 0,
  height: 0,
  base64Length: 0,
  startedAt: typeof performance !== "undefined" ? performance.now() : 0
};

let loadPromise = null;

function publish() {
  if (typeof window === "undefined") return;
  window.__footballLabCharacterSpritesV43 = Object.freeze({
    build: BUILD,
    status: runtime.status,
    error: runtime.error ? String(runtime.error.message || runtime.error) : null,
    atlas: "masters-v43-1024-q92",
    atlasWidth: runtime.width,
    atlasHeight: runtime.height,
    frameCount: Object.keys(FRAMES).length,
    frames: Object.keys(FRAMES),
    partCount: PART_NAMES.length,
    base64Length: runtime.base64Length,
    expectedBase64Length: EXPECTED_BASE64_LENGTH,
    expectedBase64Sha256: EXPECTED_BASE64_SHA256,
    fidelity: "approved-reference-high-resolution",
    ready: runtime.status === "ready"
  });
}

async function fetchPart(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`V43.2 sprite atlas part failed (${response.status})`);
  return (await response.text()).trim();
}

export function preloadCharacterSpritesV43() {
  if (loadPromise) return loadPromise;
  loadPromise = Promise.all(PART_URLS.map(fetchPart))
    .then((parts) => {
      const base64 = parts.join("");
      runtime.base64Length = base64.length;
      if (base64.length !== EXPECTED_BASE64_LENGTH || !base64.startsWith("UklGR")) {
        throw new Error(`V43.2 sprite atlas payload invalid (${base64.length})`);
      }
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("V43.2 sprite atlas image decode failed"));
        image.src = `data:image/webp;base64,${base64}`;
      });
    })
    .then((image) => {
      runtime.image = image;
      runtime.width = image.naturalWidth || image.width || 0;
      runtime.height = image.naturalHeight || image.height || 0;
      if (runtime.width !== 1024 || runtime.height !== 448) {
        throw new Error(`V43.2 sprite atlas dimensions invalid (${runtime.width}x${runtime.height})`);
      }
      runtime.status = "ready";
      runtime.error = null;
      publish();
      window.dispatchEvent(new CustomEvent("footballlab:v43spritesready"));
      return image;
    })
    .catch((error) => {
      runtime.status = "error";
      runtime.error = error;
      publish();
      console.error("Football Lab V43.2 sprite atlas failed", error);
      return null;
    });
  publish();
  return loadPromise;
}

export function spriteAtlasReadyV43() {
  return runtime.status === "ready" && Boolean(runtime.image);
}

export function spriteFrameV43(key) {
  return FRAMES[key] || null;
}

export function spriteAtlasStateV43() {
  return {
    build: BUILD,
    status: runtime.status,
    ready: spriteAtlasReadyV43(),
    width: runtime.width,
    height: runtime.height,
    base64Length: runtime.base64Length,
    error: runtime.error
  };
}

export function drawCharacterSpriteV43(context, key, x, y, targetHeight, options = {}) {
  if (!spriteAtlasReadyV43()) return false;
  const frame = FRAMES[key];
  if (!frame || !Number.isFinite(targetHeight) || targetHeight <= 0) return false;

  const scale = targetHeight / frame.h;
  const targetWidth = frame.w * scale;
  const anchorX = Number.isFinite(options.anchorX) ? options.anchorX : frame.anchorX;
  const anchorY = Number.isFinite(options.anchorY) ? options.anchorY : frame.anchorY;
  const alpha = Number.isFinite(options.alpha) ? options.alpha : 1;
  const rotation = Number.isFinite(options.rotation) ? options.rotation : 0;
  const offsetX = Number.isFinite(options.offsetX) ? options.offsetX : 0;
  const offsetY = Number.isFinite(options.offsetY) ? options.offsetY : 0;
  const flipX = Boolean(options.flipX);

  context.save();
  context.globalAlpha *= Math.max(0, Math.min(1, alpha));
  context.translate(x + offsetX, y + offsetY);
  context.rotate(rotation);
  context.scale(flipX ? -1 : 1, 1);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    runtime.image,
    frame.x,
    frame.y,
    frame.w,
    frame.h,
    -targetWidth * anchorX,
    -targetHeight * anchorY,
    targetWidth,
    targetHeight
  );
  context.restore();
  return true;
}

publish();
if (typeof window !== "undefined") preloadCharacterSpritesV43();
