// The painted garden (far / mid / near parallax layers), the evening string lights and the paper ground.
// Layers are designed on a 1200×1920 canvas (60 px wider each side than the frame, for parallax drift).
import { INK, blossom, blurFilter, grainFilter, leafPath, lerp, lin, marigold, mix, pick, piece, r1, rad, rng, wcFilter } from "./common.mjs";

const GW = 1200;
const GH = 1920;
const HORIZON = 880;
const GREENS = ["#22352a", "#2f4a35", "#3f5e40", "#557648", "#6f8f52", "#93ab66", "#bccb84"];
const LIGHT = { x: 0.62, y: -0.78 }; // the sun sits up and to the right

const shadeColor = (pal, t) => {
  const i = Math.max(0, Math.min(pal.length - 1.001, t * (pal.length - 1)));
  return mix(pal[Math.floor(i)], pal[Math.ceil(i)], i - Math.floor(i));
};

/**
 * A painterly clump of foliage: a dark mass, then many leaves whose colour follows the light direction, then a few
 * sunlit highlights. Reads as volume rather than flat circles.
 */
const foliage = (R, cx, cy, rx, ry, { pal = GREENS, n = 80, len = [34, 70], haze = null, hazeAmt = 0 } = {}) => {
  const col = (c) => (haze ? mix(c, haze, hazeAmt) : c);
  let s = "";
  // the shadowed core
  for (let i = 0; i < 9; i++) {
    const a = R() * Math.PI * 2;
    const d = R() * 0.45;
    s += `<ellipse cx="${r1(cx + Math.cos(a) * rx * d)}" cy="${r1(cy + Math.sin(a) * ry * d + ry * 0.08)}" rx="${r1(rx * (0.55 + R() * 0.25))}" ry="${r1(ry * (0.5 + R() * 0.25))}" fill="${col(pal[1])}"/>`;
  }
  const leaves = [];
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2;
    const d = Math.sqrt(R());
    const ux = Math.cos(a) * d;
    const uy = Math.sin(a) * d;
    const lit = (ux * LIGHT.x + uy * LIGHT.y) * 0.5 + 0.5; // 0 shadow side … 1 sunlit side
    leaves.push({ x: cx + ux * rx, y: cy + uy * ry, ang: (a * 180) / Math.PI + 90 + (R() - 0.5) * 70, lit: lit * 0.8 + d * 0.15 + R() * 0.15, L: lerp(len[0], len[1], R()) });
  }
  leaves.sort((p, q) => p.lit - q.lit); // sunlit leaves on top
  for (const l of leaves) {
    const c = col(shadeColor(pal, Math.min(1, l.lit)));
    s += `<path d="${leafPath(l.L, l.L * 0.34)}" transform="translate(${r1(l.x)} ${r1(l.y)}) rotate(${r1(l.ang)})" fill="${c}" stroke="${mix(c, INK, 0.5)}" stroke-opacity=".35" stroke-width="1.1"/>`;
  }
  return s;
};

const trunk = (x, baseY, topY, w, lean) => {
  const d = `M${x - w} ${baseY}C${x - w * 0.8} ${baseY - 420} ${x - w * 0.45 + lean * 0.4} ${topY + 380} ${x - w * 0.25 + lean} ${topY}L${x + w * 0.3 + lean} ${topY}C${x + w * 0.5 + lean * 0.4} ${topY + 380} ${x + w * 0.85} ${baseY - 420} ${x + w} ${baseY}Z`;
  let s = `<path d="${d}" fill="url(#bark)" stroke="${INK}" stroke-opacity=".45" stroke-width="2.5"/>`;
  const R = rng(Math.round(x * 7 + baseY));
  for (let i = 0; i < 16; i++) {
    const yy = lerp(baseY - 40, topY + 60, i / 16);
    const xx = x + lerp(0, lean, (baseY - yy) / (baseY - topY)) + (R() - 0.5) * w * 0.9;
    s += `<path d="M${r1(xx - 14)} ${r1(yy)}q${r1(10)} ${r1(-8 - R() * 6)} ${r1(26)} ${r1(-2 + R() * 4)}" stroke="#2c1d14" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }
  return s;
};

const branch = (x1, y1, x2, y2, w) =>
  `<path d="M${x1} ${y1}Q${r1((x1 + x2) / 2)} ${r1(Math.min(y1, y2) - 30)} ${x2} ${y2}" stroke="#5b4030" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;

/* ------------------------------------------------------------------ paper */
const paper = () => {
  const defs = `
<filter id="mottle" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="3" seed="5"/><feColorMatrix type="matrix" values="0 0 0 0 .75  0 0 0 0 .6  0 0 0 0 .4  1.3 0 0 0 -.5"/></filter>
<filter id="fibre" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.35" numOctaves="2" seed="17"/><feColorMatrix type="matrix" values="0 0 0 0 .36  0 0 0 0 .27  0 0 0 0 .18  1.6 0 0 0 -.86"/></filter>
${rad("vig", [[0.6, "#8a5a3a", 0], [1, "#8a5a3a", 0.3]], { cx: 0.5, cy: 0.46, r: 0.75 })}`;
  const body = `<rect width="1080" height="1920" fill="#f5ebdd"/><rect width="1080" height="1920" filter="url(#mottle)" opacity=".5"/><rect width="1080" height="1920" filter="url(#fibre)" opacity=".55"/><rect width="1080" height="1920" fill="url(#vig)"/>`;
  return piece("paper", { x: 0, y: 0, w: 1080, h: 1920 }, body, { opaque: true, quality: 0.8, defs });
};

/* ------------------------------------------------------------------ far */
const far = () => {
  const R = rng(101);
  const defs = `
${lin("sky", [[0, "#f0d3a0"], [0.5, "#f6e3bd"], [1, "#f5ebdd"]])}
${lin("ground", [[0, "#d3c995"], [0.25, "#b3b678"], [0.7, "#86975a"], [1, "#5f7446"]])}
${lin("hazeband", [[0, "#f6e8c8", 0], [0.5, "#f6e8c8", 0.75], [1, "#f6e8c8", 0]])}
${rad("sun", [[0, "#fff6d8", 1], [0.25, "#fbe3a6", 0.7], [1, "#f3cf86", 0]])}
${blurFilter("b14", 14)}${blurFilter("b5", 5)}${blurFilter("b2", 1.6)}
${wcFilter("wc", 9, 0.02)}${grainFilter("grain", 0.16, 0.85)}`;
  let s = `<g filter="url(#grain)"><rect width="${GW}" height="${HORIZON + 60}" fill="url(#sky)"/>`;
  s += `<circle cx="900" cy="430" r="560" fill="url(#sun)"/>`;
  // soft light shafts from the sun
  s += `<g opacity=".22" filter="url(#b14)">`;
  for (let i = 0; i < 6; i++) {
    const a = 2.2 + i * 0.16 + R() * 0.05;
    s += `<path d="M900 430L${r1(900 + Math.cos(a) * 1500)} ${r1(430 + Math.sin(a) * 1500)}L${r1(900 + Math.cos(a + 0.05) * 1500)} ${r1(430 + Math.sin(a + 0.05) * 1500)}Z" fill="#fff4d2"/>`;
  }
  s += `</g>`;
  // distant hills
  s += `<g filter="url(#b5)"><path d="M0 ${HORIZON - 70}Q240 ${HORIZON - 190} 520 ${HORIZON - 100}T1200 ${HORIZON - 130}V${HORIZON + 60}H0Z" fill="#a9b493" opacity=".55"/>`;
  s += `<path d="M0 ${HORIZON - 30}Q300 ${HORIZON - 120} 660 ${HORIZON - 45}T1200 ${HORIZON - 60}V${HORIZON + 60}H0Z" fill="#8ea17a" opacity=".6"/></g>`;
  // distant tree line, hazed toward the sky colour
  s += `<g filter="url(#b2)">`;
  for (let x = -40; x < GW + 60; x += 70 + R() * 50) {
    const h = 90 + R() * 120;
    const by = HORIZON + 8 + R() * 14;
    s += `<path d="M${r1(x - 4)} ${r1(by)}L${r1(x - 2)} ${r1(by - h * 0.55)}L${r1(x + 3)} ${r1(by - h * 0.55)}L${r1(x + 5)} ${r1(by)}Z" fill="#6d6150" opacity=".5"/>`;
    s += foliage(R, x, by - h * 0.7, h * 0.32, h * 0.3, { n: 26, len: [14, 26], haze: "#e8dcb5", hazeAmt: 0.55 });
  }
  s += `</g><rect y="${HORIZON - 60}" width="${GW}" height="140" fill="url(#hazeband)"/>`;
  // meadow
  s += `<rect y="${HORIZON}" width="${GW}" height="${GH - HORIZON}" fill="url(#ground)"/><g filter="url(#wc)" opacity=".75">`;
  for (let i = 0; i < 34; i++) {
    const y = HORIZON + 20 + R() * (GH - HORIZON);
    const t = (y - HORIZON) / (GH - HORIZON);
    s += `<ellipse cx="${r1(R() * GW)}" cy="${r1(y)}" rx="${r1(60 + t * 240)}" ry="${r1(10 + t * 48)}" fill="${pick(R, ["#93a463", "#c2bf82", "#718c56", "#d0c690", "#5f7a49"])}" fill-opacity=".38"/>`;
  }
  s += `</g><g stroke-linecap="round" fill="none">`;
  for (let i = 0; i < 900; i++) {
    const y = HORIZON + 10 + Math.pow(R(), 0.75) * (GH - HORIZON);
    const t = (y - HORIZON) / (GH - HORIZON);
    const x = R() * GW;
    const h = 5 + t * 40 * (0.5 + R());
    const c = shadeColor(GREENS, 0.3 + R() * 0.6);
    s += `<path d="M${r1(x)} ${r1(y)}q${r1((R() - 0.5) * 8)} ${r1(-h * 0.6)} ${r1((R() - 0.4) * 14)} ${r1(-h)}" stroke="${c}" stroke-opacity="${r1(0.3 + R() * 0.3)}" stroke-width="${r1(1 + t * 2.4)}"/>`;
  }
  s += `</g>`;
  for (let i = 0; i < 300; i++) {
    const y = HORIZON + 30 + Math.pow(R(), 0.9) * (GH - HORIZON - 30);
    const t = (y - HORIZON) / (GH - HORIZON);
    const x = R() * GW;
    const rr = 2.5 + Math.pow(t, 1.5) * 18;
    const k = R();
    s += k < 0.45 ? marigold(R, x, y, rr, { tone: i }) : k < 0.78 ? blossom(R, x, y, rr) : blossom(R, x, y, rr, "#dc7488", "#f3cf86");
  }
  s += `</g>`;
  return piece("garden-far", { x: 0, y: 0, w: GW, h: GH }, s, { opaque: true, quality: 0.82, defs });
};

/* ------------------------------------------------------------------ mid (framing trees and bushes) */
const bush = (R, cx, cy, r) => {
  let b = foliage(R, cx, cy, r * 1.15, r * 0.7, { n: Math.round(r * 0.7), len: [26, 46] });
  for (let i = 0; i < Math.round(r / 12); i++) {
    const a = R() * Math.PI * 2;
    const d = Math.sqrt(R()) * 0.85;
    const px = cx + Math.cos(a) * d * r * 1.05;
    const py = cy + Math.sin(a) * d * r * 0.55 - r * 0.12;
    const k = R();
    b += k < 0.5 ? marigold(R, px, py, 14 + R() * 9, { tone: i }) : k < 0.8 ? blossom(R, px, py, 12 + R() * 7) : blossom(R, px, py, 12 + R() * 7, "#dc7488", "#f3cf86");
  }
  return b;
};

const midSide = (side) => {
  const R = rng(side === "l" ? 202 : 203);
  const left = side === "l";
  const x = left ? 50 : GW - 50;
  const s = left ? 1 : -1;
  const defs = `${lin("bark", [[0, "#7a5a40"], [0.45, "#5a4030"], [1, "#3b2a1e"]], { x1: 0, y1: 0, x2: 1, y2: 0 })}${wcFilter("wc2", 6, 0.03, left ? 3 : 4)}${grainFilter("grain", 0.14, 0.9, left ? 8 : 9)}`;
  let b = `<g filter="url(#grain)"><g filter="url(#wc2)">`;
  b += trunk(x, left ? 1130 : 1090, left ? 160 : 230, 78, s * 60);
  b += branch(x + s * 40, 520, x + s * 260, 360, 18) + branch(x + s * 30, 700, x + s * 210, 640, 13);
  // the canopy: several overlapping clumps, darker underneath
  const clumps = left
    ? [[90, 300, 260, 200], [260, 200, 200, 150], [300, 420, 190, 130], [40, 560, 200, 150], [380, 300, 140, 110], [170, 110, 220, 140]]
    : [[1110, 330, 260, 200], [930, 240, 200, 150], [900, 450, 190, 130], [1150, 600, 200, 150], [820, 340, 130, 100], [1030, 140, 220, 140]];
  for (const [cx, cy, rx, ry] of clumps) b += foliage(R, cx, cy, rx, ry, { n: Math.round(rx * 0.75), len: [36, 70] });
  b += `</g>`;
  // flowering bushes at the foot of the tree
  b += left ? bush(R, 100, 1160, 190) + bush(R, 270, 1010, 110) : bush(R, 1110, 1130, 200) + bush(R, 950, 1000, 120);
  b += `</g>`;
  const bounds = left ? { x: 0, y: 0, w: 560, h: 1400 } : { x: 640, y: 0, w: 560, h: 1400 };
  return piece(`garden-mid-${side}`, bounds, b, { quality: 0.84, defs });
};

/* ------------------------------------------------------------------ near (foreground framing) */
const nearSide = (side) => {
  const R = rng(side === "l" ? 303 : 304);
  const left = side === "l";
  const s = left ? 1 : -1;
  const X = (x) => (left ? x : GW - x);
  const defs = `${lin("leafg", [[0, "#2a4130"], [1, "#4d6d46"]])}${grainFilter("grain", 0.14, 0.9, left ? 11 : 12)}`;
  let b = `<g filter="url(#grain)">`;
  const fan = (cx, cy, n, len, spread, base) => {
    let f = "";
    for (let i = 0; i < n; i++) {
      const a = base + (i / (n - 1) - 0.5) * spread;
      const L = len * (0.7 + R() * 0.45);
      const W = 46 + R() * 34;
      const c = shadeColor(GREENS.slice(0, 5), 0.25 + R() * 0.75);
      f += `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${r1(a)})"><path d="${leafPath(L, W)}" fill="${c}" stroke="${INK}" stroke-opacity=".45" stroke-width="1.8"/>`;
      f += `<path d="M0 -4L0 ${r1(-L * 0.9)}" stroke="${mix(c, "#ffffff", 0.25)}" stroke-opacity=".7" stroke-width="2" fill="none"/>`;
      for (let k = 1; k < 6; k++) {
        const y = -L * (k / 6.5);
        f += `<path d="M0 ${r1(y)}l${r1(W * 0.55)} ${r1(-L * 0.08)}M0 ${r1(y)}l${r1(-W * 0.55)} ${r1(-L * 0.08)}" stroke="${mix(c, "#ffffff", 0.18)}" stroke-opacity=".45" stroke-width="1.3" fill="none"/>`;
      }
      f += `<path d="${leafPath(L * 0.92, W * 0.35)}" transform="translate(${r1(-W * 0.18)} 0)" fill="#ffffff" opacity=".07"/></g>`;
    }
    return f;
  };
  b += fan(X(40), 1960, 11, 560, 130, s * 28);
  b += fan(X(-30), 1760, 6, 360, 90, s * 55);
  for (let i = 0; i < 7; i++) {
    const x = X(30 + R() * 330);
    const y = 1700 + R() * 190;
    b += R() < 0.6 ? marigold(R, x, y, 34 + R() * 24, { tone: i }) : blossom(R, x, y, 30 + R() * 18, R() < 0.5 ? "#f8f1e6" : "#c4566a");
  }
  // foliage hanging from the top corner
  for (let i = 0; i < 6; i++) {
    const L = 150 + R() * 120;
    const c = shadeColor(GREENS, 0.2 + R() * 0.6);
    b += `<g transform="translate(${r1(X(R() * 230))} -10) rotate(${r1(s * 160 + (R() - 0.5) * 60)})"><path d="${leafPath(L, 28 + R() * 12)}" fill="${c}" stroke="${INK}" stroke-opacity=".4" stroke-width="1.6"/><path d="M0 -3L0 ${r1(-L * 0.88)}" stroke="#ffffff" stroke-opacity=".25" stroke-width="1.4" fill="none"/></g>`;
  }
  b += `</g>`;
  const bounds = left ? { x: -60, y: -40, w: 620, h: 1960 } : { x: 640, y: -40, w: 620, h: 1960 };
  return piece(`garden-near-${side}`, bounds, b, { quality: 0.84, defs });
};

/* ------------------------------------------------------------------ evening string lights */
const lights = () => {
  const R = rng(404);
  const defs = `${blurFilter("glow", 7)}`;
  let glow = "";
  let bulbs = "";
  let wires = "";
  const strand = (x1, y1, x2, y2, sag, n) => {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push({ x: lerp(x1, x2, t), y: lerp(y1, y2, t) + Math.sin(Math.PI * t) * sag });
    }
    wires += `<path d="M${pts.map((p) => `${r1(p.x)} ${r1(p.y)}`).join("L")}" stroke="#3b2a1e" stroke-opacity=".55" stroke-width="2" fill="none"/>`;
    for (const p of pts.slice(1, -1)) {
      const warm = pick(R, ["#ffe7a3", "#ffd77a", "#fff2c6", "#ffcf8a"]);
      glow += `<circle cx="${r1(p.x)}" cy="${r1(p.y + 7)}" r="16" fill="${warm}" opacity=".9"/>`;
      bulbs += `<ellipse cx="${r1(p.x)}" cy="${r1(p.y + 7)}" rx="4.5" ry="6.5" fill="${warm}"/><circle cx="${r1(p.x - 1.2)}" cy="${r1(p.y + 5)}" r="1.8" fill="#ffffff"/>`;
    }
  };
  strand(150, 300, 1050, 320, 150, 26);
  strand(220, 520, 980, 540, 110, 20);
  strand(130, 260, 70, 900, 40, 14);
  strand(1070, 280, 1130, 900, -40, 14);
  const body = `<g filter="url(#glow)">${glow}</g>${wires}${bulbs}`;
  return piece("garden-lights", { x: 0, y: 200, w: GW, h: 760 }, body, { quality: 0.85, defs });
};

export const gardenArt = () => [paper(), far(), midSide("l"), midSide("r"), nearSide("l"), nearSide("r"), lights()];
