// The wedding mandap (chhadnatala), baked as separate parts so each can be built with a transform:
// floor alpana, dome canopy, valance, two banana-stem posts, hanging marigold strings, banana leaves with mangal ghat.
// Coordinates are composition coordinates (1080×1920).
import { INK, blossom, grainFilter, leafPath, lin, marigold, mix, piece, r1, rad, rng } from "./common.mjs";

const CX = 540;
const BASE = 1500;
const POSTS = [205, 875];
const ARCH_CY = 650;
const ARCH_RX = 330;
const ARCH_RY = 235;
const GOLD = "#c9a052";
const GOLD_L = "#f0d48a";
const SINDOOR = "#7d1a28";

const floor = () => {
  const R = rng(51);
  let s = `<g transform="translate(${CX} ${BASE + 40})">`;
  s += `<ellipse rx="440" ry="84" fill="url(#ochre)"/>`;
  s += `<ellipse rx="430" ry="80" fill="none" stroke="#fbf3e0" stroke-width="5"/>`;
  s += `<ellipse rx="400" ry="70" fill="none" stroke="#fbf3e0" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>`;
  s += `<ellipse rx="320" ry="52" fill="none" stroke="#fbf3e0" stroke-width="3.5"/>`;
  // rice-paste lotus petals around the ring
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const x = Math.cos(a) * 362;
    const y = Math.sin(a) * 61;
    s += `<g transform="translate(${r1(x)} ${r1(y)}) scale(1 .2) rotate(${r1((a * 180) / Math.PI + 90)})"><path d="M0 0C14 -14 14 -36 0 -52C-14 -36 -14 -14 0 0Z" fill="none" stroke="#fbf3e0" stroke-width="12"/></g>`;
  }
  // the central lotus where the couple stand
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 360;
    s += `<g transform="scale(1 .2) rotate(${a})"><path d="M0 0C30 -40 30 -120 0 -170C-30 -120 -30 -40 0 0Z" fill="#fbf3e0" fill-opacity=".2" stroke="#fbf3e0" stroke-width="9"/></g>`;
  }
  for (let i = 0; i < 40; i++) {
    const a = R() * Math.PI * 2;
    s += `<circle cx="${r1(Math.cos(a) * 280)}" cy="${r1(Math.sin(a) * 46)}" r="2.6" fill="#fbf3e0" opacity=".8"/>`;
  }
  s += `</g>`;
  return piece("mandap-floor", { x: 80, y: BASE - 60, w: 920, h: 200 }, `<g filter="url(#grain)">${s}</g>`, {
    scale: 1,
    defs: `${rad("ochre", [[0, "#c8643d", 0.55], [0.75, "#a8482c", 0.45], [1, "#8f3b26", 0.2]])}${grainFilter("grain", 0.2)}`,
  });
};

const dome = () => {
  let s = `<path d="M${CX - ARCH_RX} ${ARCH_CY}A${ARCH_RX} ${ARCH_RY} 0 0 1 ${CX + ARCH_RX} ${ARCH_CY}Z" fill="url(#velvet)" stroke="${INK}" stroke-opacity=".7" stroke-width="3"/>`;
  // gold ribs and a border of zari
  for (let i = 0; i < 11; i++) {
    const a = Math.PI - ((i + 1) / 12) * Math.PI;
    s += `<path d="M${CX} ${ARCH_CY}L${r1(CX + ARCH_RX * Math.cos(a))} ${r1(ARCH_CY - ARCH_RY * Math.sin(a))}" stroke="${GOLD}" stroke-width="3" stroke-opacity=".6"/>`;
  }
  for (const k of [0.94, 0.62, 0.34]) {
    s += `<path d="M${r1(CX - ARCH_RX * k)} ${ARCH_CY}A${r1(ARCH_RX * k)} ${r1(ARCH_RY * k)} 0 0 1 ${r1(CX + ARCH_RX * k)} ${ARCH_CY}" fill="none" stroke="${GOLD_L}" stroke-width="${k === 0.94 ? 6 : 3}" stroke-opacity=".75" stroke-dasharray="${k === 0.94 ? "none" : "2 12"}" stroke-linecap="round"/>`;
  }
  // buti dots on the velvet
  const R = rng(61);
  for (let i = 0; i < 70; i++) {
    const a = Math.PI * R();
    const d = 0.15 + R() * 0.75;
    s += `<circle cx="${r1(CX + Math.cos(a) * ARCH_RX * d)}" cy="${r1(ARCH_CY - Math.sin(a) * ARCH_RY * d)}" r="2.6" fill="${GOLD_L}" opacity=".7"/>`;
  }
  // sheen
  s += `<path d="M${CX - ARCH_RX * 0.8} ${ARCH_CY - 20}A${ARCH_RX * 0.8} ${ARCH_RY * 0.85} 0 0 1 ${CX + ARCH_RX * 0.1} ${ARCH_CY - ARCH_RY * 0.85}" stroke="#ffffff" stroke-opacity=".12" stroke-width="40" fill="none" stroke-linecap="round"/>`;
  // kalash finial
  s += `<g transform="translate(${CX} ${ARCH_CY - ARCH_RY})"><path d="M-6 0V-16" stroke="${GOLD}" stroke-width="5"/><path d="M-22 -16C-26 -46 26 -46 22 -16Z" fill="url(#goldv)" stroke="${INK}" stroke-width="2"/><path d="M-12 -40C-10 -50 10 -50 12 -40" fill="${GOLD_L}" stroke="${INK}" stroke-width="1.5"/><circle cy="-60" r="10" fill="url(#goldv)" stroke="${INK}" stroke-width="1.6"/><path d="M0 -70V-86" stroke="${GOLD}" stroke-width="3"/></g>`;
  return piece("mandap-dome", { x: CX - ARCH_RX - 10, y: ARCH_CY - ARCH_RY - 100, w: ARCH_RX * 2 + 20, h: ARCH_RY + 110 }, `<g filter="url(#grain)">${s}</g>`, {
    scale: 1.2,
    defs: `${lin("velvet", [[0, "#5a0f1c"], [0.6, "#7e1a29"], [1, "#9a2636"]])}${lin("goldv", [[0, "#f3d98f"], [1, "#a8802f"]])}${grainFilter("grain", 0.18)}`,
  });
};

const valance = () => {
  const x0 = CX - ARCH_RX - 10;
  const W = ARCH_RX * 2 + 20;
  let s = `<rect x="${x0}" y="${ARCH_CY - 4}" width="${W}" height="50" fill="url(#val)" stroke="${INK}" stroke-width="3"/>`;
  s += `<rect x="${x0}" y="${ARCH_CY + 4}" width="${W}" height="7" fill="${GOLD}"/><rect x="${x0}" y="${ARCH_CY + 34}" width="${W}" height="6" fill="${GOLD}"/>`;
  for (let i = 0; i < 26; i++) {
    const x = x0 + 14 + i * ((W - 28) / 25);
    s += `<path d="M${r1(x)} ${ARCH_CY + 22}l7 -7l7 7l-7 7Z" fill="${GOLD_L}" opacity=".85"/>`;
  }
  const n = 24;
  for (let i = 0; i < n; i++) {
    const w = W / n;
    const x = x0 + i * w;
    s += `<path d="M${r1(x)} ${ARCH_CY + 46}q${r1(w / 2)} 38 ${r1(w)} 0Z" fill="${i % 2 ? GOLD : SINDOOR}" stroke="${INK}" stroke-opacity=".6" stroke-width="1.8"/>`;
    s += `<path d="M${r1(x + w / 2)} ${ARCH_CY + 64}v16" stroke="${GOLD}" stroke-width="2"/><circle cx="${r1(x + w / 2)}" cy="${ARCH_CY + 84}" r="4.5" fill="${i % 2 ? SINDOOR : GOLD_L}" stroke="${INK}" stroke-width="1"/>`;
  }
  return piece("mandap-valance", { x: x0 - 4, y: ARCH_CY - 10, w: W + 8, h: 104 }, s, {
    scale: 1.2,
    defs: lin("val", [[0, "#8e1c2c"], [1, "#6a1220"]]),
  });
};

const post = (side) => {
  const px = POSTS[side === "l" ? 0 : 1];
  const top = ARCH_CY + 5;
  const R = rng(side === "l" ? 71 : 72);
  let s = `<path d="M${px - 22} ${BASE}L${px - 16} ${top}L${px + 16} ${top}L${px + 22} ${BASE}Z" fill="url(#stem)" stroke="${INK}" stroke-width="3"/>`;
  for (let i = 0; i < 9; i++) {
    const y = lerpN(BASE - 40, top + 40, i / 8);
    s += `<path d="M${px - 18} ${r1(y)}Q${px} ${r1(y + 10)} ${px + 18} ${r1(y)}" stroke="#4d6b3a" stroke-opacity=".6" stroke-width="2" fill="none"/>`;
  }
  for (const f of [0.18, 0.5, 0.82]) {
    const y = BASE - (BASE - top) * f;
    s += `<rect x="${px - 22}" y="${r1(y - 6)}" width="44" height="12" rx="3" fill="url(#goldb)" stroke="${INK}" stroke-opacity=".6" stroke-width="1.6"/>`;
  }
  // a marigold and tuberose garland spiralling up the pillar
  for (let i = 0; i < 30; i++) {
    const f = i / 29;
    const y = BASE - 30 - f * (BASE - top - 60);
    const x = px + Math.sin(f * Math.PI * 7 + (side === "l" ? 0 : 1)) * 26;
    s += i % 4 === 3 ? blossom(R, x, y, 9, "#fbf8ef", "#d5c48a") : marigold(R, x, y, 13, { tone: i });
  }
  return piece(`mandap-post-${side}`, { x: px - 50, y: top - 10, w: 100, h: BASE - top + 20 }, s, {
    scale: 1.2,
    defs: `${lin("stem", [[0, "#a7b56f"], [0.5, "#7f9554"], [1, "#56693c"]], { x1: 0, y1: 0, x2: 1, y2: 0 })}${lin("goldb", [[0, "#f3d98f"], [1, "#a8802f"]])}`,
  });
};

const lerpN = (a, b, t) => a + (b - a) * t;

const banana = (side) => {
  const px = POSTS[side === "l" ? 0 : 1];
  const m = side === "l" ? 1 : -1;
  let s = "";
  [-64, -36, -10, 18, 46].forEach((ang, i) => {
    const L = 230 + (i % 2) * 30;
    const c = i % 2 ? "#4f6b4a" : "#60794f";
    s += `<g transform="translate(${px} ${BASE + 2}) rotate(${ang * m})"><path d="${leafPath(L, 30 + i * 2)}" fill="${c}" stroke="${INK}" stroke-opacity=".5" stroke-width="2"/><path d="M0 -4V${-L + 10}" stroke="#a7b56f" stroke-width="2.4"/>${Array.from({ length: 8 }, (_, k) => `<path d="M0 ${-20 - k * (L / 9)}l${24} ${-14}M0 ${-20 - k * (L / 9)}l-24 -14" stroke="#3b5536" stroke-opacity=".45" stroke-width="1.4"/>`).join("")}</g>`;
  });
  // mangal ghat: a brass pot with mango leaves and a coconut, beside the post
  const gx = px + m * 70;
  const gy = BASE + 10;
  s += `<g transform="translate(${gx} ${gy})">`;
  for (let i = 0; i < 5; i++) s += `<g transform="translate(0 -62) rotate(${-50 + i * 25})"><path d="${leafPath(46, 11)}" fill="#3f6b36" stroke="${INK}" stroke-opacity=".5" stroke-width="1.4"/></g>`;
  s += `<ellipse cx="0" cy="-72" rx="16" ry="18" fill="#7a4a24" stroke="${INK}" stroke-width="1.8"/><path d="M-6 -86q6 -8 12 0" stroke="#a5713c" stroke-width="2" fill="none"/>`;
  s += `<path d="M-14 -58C-34 -50 -36 -8 -18 0H18C36 -8 34 -50 14 -58Z" fill="url(#brass)" stroke="${INK}" stroke-width="2"/><rect x="-16" y="-62" width="32" height="7" rx="3" fill="url(#brass)" stroke="${INK}" stroke-width="1.5"/>`;
  s += `<path d="M-22 -30h44" stroke="${SINDOOR}" stroke-width="3"/><circle cx="0" cy="-30" r="5" fill="${SINDOOR}"/><path d="M-8 -20l8 -10l8 10" stroke="#fbf3e0" stroke-width="2" fill="none"/></g>`;
  const bx = side === "l" ? px - 270 : px - 150;
  return piece(`mandap-leaves-${side}`, { x: bx, y: BASE - 280, w: 420, h: 310 }, s, {
    scale: 1,
    defs: lin("brass", [[0, "#f0cc6c"], [0.5, "#c9962f"], [1, "#8a6420"]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
  });
};

const strings = () => {
  const R = rng(81);
  let s = "";
  for (let i = 0; i < 13; i++) {
    const x = CX - ARCH_RX + 22 + (i * (ARCH_RX * 2 - 44)) / 12;
    const len = 100 + ((i * 37) % 5) * 26 + (i === 6 ? 40 : 0);
    s += `<path d="M${r1(x)} ${ARCH_CY + 60}V${r1(ARCH_CY + 60 + len)}" stroke="#7a5a30" stroke-width="1.4"/>`;
    const n = Math.floor(len / 22);
    for (let j = 0; j < n; j++) {
      const y = ARCH_CY + 70 + j * 22;
      s += j % 3 === 2 ? blossom(R, x, y, 7.5, "#fbf8ef", "#d5c48a") : marigold(R, x, y, 11, { tone: i + j });
    }
    // little brass bell at the end
    const ey = ARCH_CY + 70 + n * 22;
    s += `<path d="M${r1(x - 6)} ${ey + 10}Q${r1(x)} ${ey - 6} ${r1(x + 6)} ${ey + 10}Z" fill="#d7aa45" stroke="${INK}" stroke-width="1.2"/><circle cx="${r1(x)}" cy="${ey + 12}" r="2" fill="#7a5a30"/>`;
  }
  return piece("mandap-strings", { x: CX - ARCH_RX, y: ARCH_CY + 50, w: ARCH_RX * 2, h: 260 }, s, { scale: 1.2 });
};

export const mandapArt = () => [floor(), dome(), valance(), post("l"), post("r"), banana("l"), banana("r"), strings()];

void mix;
