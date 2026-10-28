// Generates the static, painterly SVG layers in art/ (source files; they are baked to WebP by scripts/bake-art.mjs).
// Deterministic (seeded) — re-run `node scripts/generate-art.mjs && node scripts/bake-art.mjs` after tweaking.
// Layers are rasterised once by the browser; only transforms/opacity animate at runtime.
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = new URL("../art/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const INK = "#30251f";
const GREENS = ["#344638", "#425a43", "#4f6b4a", "#60794f", "#7a8c58", "#9aa86b"];
const MARIGOLDS = ["#e8a33a", "#dd8a22", "#f0b94a", "#e59a2e"];

const rng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const r1 = (n) => Math.round(n * 10) / 10;
const pick = (R, arr) => arr[Math.floor(R() * arr.length)];

const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>\n`;

// ---------- primitives ----------
const leaf = (x, y, len, wid, ang, fill, op = 0.9, outline = true) => {
  const d = `M0 0 C${r1(wid)} ${r1(-len * 0.3)} ${r1(wid * 0.8)} ${r1(-len * 0.75)} 0 ${r1(-len)} C${r1(-wid * 0.8)} ${r1(-len * 0.75)} ${r1(-wid)} ${r1(-len * 0.3)} 0 0Z`;
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(ang)})"><path d="${d}" fill="${fill}" fill-opacity="${op}"${
    outline ? ` stroke="${INK}" stroke-opacity=".45" stroke-width="1.6"` : ""
  }/><path d="M0 -3 L0 ${r1(-len * 0.88)}" stroke="${INK}" stroke-opacity=".28" stroke-width="1.2" fill="none"/></g>`;
};

const marigold = (R, cx, cy, r) => {
  let s = `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${r1(R() * 60)})">`;
  const base = pick(R, MARIGOLDS);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * 360;
    s += `<ellipse cx="0" cy="${r1(-r * 0.55)}" rx="${r1(r * 0.24)}" ry="${r1(r * 0.46)}" transform="rotate(${r1(a)})" fill="${base}" fill-opacity=".92" stroke="${INK}" stroke-opacity=".35" stroke-width="1.3"/>`;
  }
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * 360 + 18;
    s += `<ellipse cx="0" cy="${r1(-r * 0.3)}" rx="${r1(r * 0.17)}" ry="${r1(r * 0.3)}" transform="rotate(${r1(a)})" fill="#c9701a" fill-opacity=".85"/>`;
  }
  s += `<circle r="${r1(r * 0.16)}" fill="#8f4a14"/></g>`;
  return s;
};

const blossom = (R, cx, cy, r, fill = "#f8f1e6", center = "#d9a43a") => {
  let s = `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${r1(R() * 72)})">`;
  for (let i = 0; i < 5; i++) {
    s += `<ellipse cx="0" cy="${r1(-r * 0.5)}" rx="${r1(r * 0.34)}" ry="${r1(r * 0.52)}" transform="rotate(${i * 72})" fill="${fill}" stroke="${INK}" stroke-opacity=".3" stroke-width="1.2"/>`;
  }
  s += `<circle r="${r1(r * 0.17)}" fill="${center}"/></g>`;
  return s;
};

const blob = (cx, cy, r, fill, op) =>
  `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" fill="${fill}" fill-opacity="${op}"/>`;

const tree = (R, x, baseY, h, scale = 1, op = 0.5) => {
  const w = h * 0.07;
  let s = `<path d="M${r1(x - w)} ${r1(baseY)} Q${r1(x - w * 0.5)} ${r1(baseY - h * 0.5)} ${r1(x)} ${r1(baseY - h * 0.72)} Q${r1(x + w * 0.5)} ${r1(baseY - h * 0.5)} ${r1(x + w)} ${r1(baseY)}Z" fill="#5a4331" fill-opacity="${op + 0.2}"/>`;
  const n = 6 + Math.floor(R() * 4);
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2;
    const d = R() * h * 0.28 * scale;
    s += blob(x + Math.cos(a) * d * 1.2, baseY - h * 0.78 + Math.sin(a) * d * 0.8, h * (0.16 + R() * 0.12) * scale, pick(R, GREENS), op * (0.7 + R() * 0.4));
  }
  return s;
};

const wcFilter = (id, scale = 14, freq = 0.018) =>
  `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/></filter>`;

// ---------- paper (opaque base) ----------
{
  const body = `<defs>
<filter id="speck" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="11"/><feColorMatrix type="matrix" values="0 0 0 0 .36  0 0 0 0 .27  0 0 0 0 .18  1.7 0 0 0 -.78"/></filter>
<filter id="mottle" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="3" seed="5"/><feColorMatrix type="matrix" values="0 0 0 0 .75  0 0 0 0 .6  0 0 0 0 .4  1.3 0 0 0 -.5"/></filter>
<radialGradient id="vig" cx="50%" cy="46%" r="75%"><stop offset="60%" stop-color="#8a5a3a" stop-opacity="0"/><stop offset="100%" stop-color="#8a5a3a" stop-opacity=".28"/></radialGradient>
</defs>
<rect width="1080" height="1920" fill="#f5ebdd"/>
<rect width="1080" height="1920" filter="url(#mottle)" opacity=".5"/>
<rect width="1080" height="1920" fill="url(#vig)"/>`;
  writeFileSync(new URL("paper.svg", OUT), svg(1080, 1920, body));
}

// ---------- grain overlay (transparent) ----------
{
  const body = `<defs><filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="23"/><feColorMatrix type="matrix" values="0 0 0 0 .3  0 0 0 0 .22  0 0 0 0 .15  1.9 0 0 0 -.9"/></filter></defs>
<rect width="1080" height="1920" filter="url(#grain)"/>`;
  writeFileSync(new URL("grain.svg", OUT), svg(1080, 1920, body));
}

// ---------- garden far (opaque, 1200 wide for parallax) ----------
const GW = 1200;
const GH = 1920;
const HORIZON = 880;
{
  const R = rng(101);
  let s = `<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3dcae"/><stop offset=".55" stop-color="#f6e6c4"/><stop offset="1" stop-color="#f5ebdd"/></linearGradient>
<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdc48f"/><stop offset=".35" stop-color="#a9b073"/><stop offset="1" stop-color="#6f8250"/></linearGradient>
<radialGradient id="sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff3cf" stop-opacity=".95"/><stop offset=".45" stop-color="#f3cf86" stop-opacity=".45"/><stop offset="1" stop-color="#f3cf86" stop-opacity="0"/></radialGradient>
<filter id="blur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter>
${wcFilter("wc", 16, 0.014)}
</defs>
<rect width="${GW}" height="${HORIZON + 40}" fill="url(#sky)"/>
<circle cx="860" cy="470" r="520" fill="url(#sun)"/>
<g filter="url(#blur)">
<path d="M0 ${HORIZON - 40} Q260 ${HORIZON - 150} 520 ${HORIZON - 70} T1200 ${HORIZON - 90} V${HORIZON + 40} H0Z" fill="#8da47a" fill-opacity=".38"/>
<path d="M0 ${HORIZON - 10} Q300 ${HORIZON - 90} 640 ${HORIZON - 25} T1200 ${HORIZON - 40} V${HORIZON + 40} H0Z" fill="#6f8a63" fill-opacity=".42"/>
</g>
<g filter="url(#wc)">`;
  for (let x = -60; x < GW + 60; x += 46 + R() * 40) {
    const h = 110 + R() * 150;
    s += tree(R, x, HORIZON + 6 + R() * 18, h, 1, 0.34 + R() * 0.16);
  }
  s += `</g>
<rect y="${HORIZON}" width="${GW}" height="${GH - HORIZON}" fill="url(#ground)"/>
<g filter="url(#wc)" opacity=".7">`;
  // meadow wash patches
  for (let i = 0; i < 26; i++) {
    const y = HORIZON + 20 + R() * (GH - HORIZON);
    const t = (y - HORIZON) / (GH - HORIZON);
    s += `<ellipse cx="${r1(R() * GW)}" cy="${r1(y)}" rx="${r1(60 + t * 220)}" ry="${r1(14 + t * 50)}" fill="${pick(R, ["#8fa061", "#b9b97c", "#6f8a55", "#c8c08a"])}" fill-opacity=".35"/>`;
  }
  s += `</g><g stroke-linecap="round" fill="none">`;
  // grass blades
  for (let i = 0; i < 520; i++) {
    const y = HORIZON + 10 + Math.pow(R(), 0.8) * (GH - HORIZON);
    const t = (y - HORIZON) / (GH - HORIZON);
    const x = R() * GW;
    const hgt = 6 + t * 38 * (0.5 + R());
    s += `<path d="M${r1(x)} ${r1(y)} q${r1((R() - 0.5) * 8)} ${r1(-hgt * 0.6)} ${r1((R() - 0.5) * 12)} ${r1(-hgt)}" stroke="${pick(R, GREENS)}" stroke-opacity="${r1(0.25 + R() * 0.25)}" stroke-width="${r1(1 + t * 2)}"/>`;
  }
  s += `</g>`;
  // distant flowers, size grows with proximity
  for (let i = 0; i < 260; i++) {
    const y = HORIZON + 30 + Math.pow(R(), 0.9) * (GH - HORIZON - 30);
    const t = (y - HORIZON) / (GH - HORIZON);
    const x = R() * GW;
    const rad = 3 + Math.pow(t, 1.5) * 20;
    const kind = R();
    s += kind < 0.45 ? marigold(R, x, y, rad) : kind < 0.8 ? blossom(R, x, y, rad) : blossom(R, x, y, rad, "#d66a7c", "#f3cf86");
  }
  writeFileSync(new URL("garden-far.svg", OUT), svg(GW, GH, s));
}

// ---------- garden mid (transparent): framing trees + bushes ----------
{
  const R = rng(202);
  let s = `<defs>${wcFilter("wc2", 12, 0.02)}</defs><g filter="url(#wc2)">`;
  const bigTree = (x, baseY, topY, side) => {
    const w = 70;
    let t = `<path d="M${x - w} ${baseY} C${x - w * 0.7} ${baseY - 500} ${x - w * 0.3} ${topY + 500} ${x - 10 * side} ${topY} L${x + 24 * side} ${topY} C${x + w * 0.5} ${topY + 500} ${x + w * 0.9} ${baseY - 500} ${x + w} ${baseY}Z" fill="#5a4331" fill-opacity=".92" stroke="${INK}" stroke-opacity=".5" stroke-width="3"/>`;
    for (let i = 0; i < 9; i++) {
      const yy = baseY - 80 - i * 95;
      t += `<path d="M${x - w * 0.6 + R() * 20} ${yy} q${r1(18 * side)} ${r1(-20)} ${r1(36 * side)} ${r1(R() * 6)}" stroke="${INK}" stroke-opacity=".25" stroke-width="2" fill="none"/>`;
    }
    for (let i = 0; i < 26; i++) {
      const a = R() * Math.PI * 2;
      const d = R() * 300;
      t += blob(x - 40 * side + Math.cos(a) * d * 1.1, topY + 60 + Math.sin(a) * d * 0.75, 90 + R() * 90, pick(R, GREENS), 0.55 + R() * 0.3);
    }
    return t;
  };
  s += bigTree(40, 1120, 120, 1);
  s += bigTree(1150, 1080, 200, -1);
  s += `</g>`;
  // sparse leaf fringes catching light along the canopy edges (sharper than the washes)
  for (let i = 0; i < 70; i++) {
    const left = R() < 0.5;
    const x = left ? R() * 400 : GW - R() * 400;
    const y = 40 + R() * 620;
    s += leaf(x, y, 60 + R() * 60, 16 + R() * 12, (left ? 40 : -40) + (R() - 0.5) * 120, pick(R, GREENS), 0.75);
  }
  // flowering bushes along both sides
  const bush = (cx, cy, r) => {
    let b = `<g filter="url(#wc2)">`;
    for (let i = 0; i < 12; i++) {
      const a = R() * Math.PI * 2;
      const d = R() * r * 0.6;
      b += blob(cx + Math.cos(a) * d * 1.3, cy + Math.sin(a) * d * 0.7, r * (0.35 + R() * 0.3), pick(R, GREENS), 0.8);
    }
    b += `</g>`;
    for (let i = 0; i < 9; i++) {
      const a = R() * Math.PI * 2;
      const d = R() * r * 0.85;
      const px = cx + Math.cos(a) * d * 1.2;
      const py = cy + Math.sin(a) * d * 0.55 - r * 0.1;
      b += R() < 0.55 ? marigold(R, px, py, 16 + R() * 10) : blossom(R, px, py, 14 + R() * 8, R() < 0.5 ? "#f8f1e6" : "#d66a7c");
    }
    return b;
  };
  s += bush(80, 1160, 190);
  s += bush(1130, 1130, 200);
  s += bush(250, 1010, 110);
  s += bush(960, 1000, 120);
  writeFileSync(new URL("garden-mid.svg", OUT), svg(GW, GH, s));
}

// ---------- garden near (transparent): foreground leaves + flowers ----------
{
  const R = rng(303);
  let s = "";
  const fan = (cx, cy, n, len, spread, base) => {
    let f = "";
    for (let i = 0; i < n; i++) {
      const a = base + (i / (n - 1) - 0.5) * spread;
      f += leaf(cx, cy, len * (0.7 + R() * 0.45), 46 + R() * 36, a, pick(R, GREENS.slice(1, 5)), 0.93);
    }
    return f;
  };
  s += fan(40, 1960, 11, 560, 130, 28);
  s += fan(1170, 1960, 11, 540, 130, -28);
  s += fan(-30, 1760, 6, 360, 90, 55);
  s += fan(1230, 1740, 6, 360, 90, -55);
  for (let i = 0; i < 12; i++) {
    const left = i % 2 === 0;
    const x = left ? 30 + R() * 330 : GW - 30 - R() * 330;
    const y = 1700 + R() * 190;
    s += R() < 0.6 ? marigold(R, x, y, 34 + R() * 26) : blossom(R, x, y, 30 + R() * 20, R() < 0.5 ? "#f8f1e6" : "#c4566a");
  }
  // hanging foliage from the top corners
  for (let i = 0; i < 10; i++) {
    const left = i % 2 === 0;
    s += leaf(left ? R() * 240 : GW - R() * 240, -10, 150 + R() * 120, 26 + R() * 14, (left ? 160 : -160) + (R() - 0.5) * 60, pick(R, GREENS), 0.9);
  }
  writeFileSync(new URL("garden-near.svg", OUT), svg(GW, GH, s));
}

console.log("art generated");
