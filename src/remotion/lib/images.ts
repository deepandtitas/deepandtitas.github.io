/**
 * One HTMLImageElement per baked image URL, shared by the website's loader (which fetches and decodes them before the
 * story starts) and the canvas sprite fields (which draw them). Keeping the references here also keeps them decoded.
 */
const CACHE = new Map<string, HTMLImageElement>();

export const artImage = (src: string): HTMLImageElement => {
  let img = CACHE.get(src);
  if (!img) {
    img = new Image();
    img.decoding = "async";
    img.src = src;
    CACHE.set(src, img);
  }
  return img;
};

export const imageReady = (img: HTMLImageElement): boolean => img.complete && img.naturalWidth > 0;
