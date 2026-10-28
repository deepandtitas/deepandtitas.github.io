import { describe, expect, it } from "vitest";
import { ART } from "../src/art/manifest";
import { apply, I, mul, rotate, scale, translate, type Mat } from "../src/render/mat";
import type { DrawOp } from "../src/render/ops";
import { LEAVES, couplePose, meetingPose, setDownLeaves, type SpriteState } from "../src/story/choreography";
import { SCENE_BEATS } from "../src/story/timeline";
import { SKELETON, solveFigure, type FigureProps, type PartXf, type Who } from "../src/story/rig";
import { BODY, figureOps, pivotOf } from "../src/scene/figure";
import { spriteOp, spriteOps } from "../src/scene/sprites";

type Pt = { x: number; y: number };
type ImageOp = Extract<DrawOp, { kind: "image" }>;

const images = (ops: readonly DrawOp[]): ImageOp[] => ops.filter((o): o is ImageOp => o.kind === "image");
const corners = (art: keyof typeof ART): Pt[] => {
  const a = ART[art];
  return [
    { x: a.x, y: a.y },
    { x: a.x + a.w, y: a.y },
    { x: a.x, y: a.y + a.h },
    { x: a.x + a.w, y: a.y + a.h },
  ];
};

/** The OLD CSS maths by hand: `transform-origin: O; transform: translate(d) rotate(r) scale(sx, sy)` on a point p. */
const cssPart = (xf: PartXf, p: Pt): Pt => {
  const o = xf.pivot;
  const sx = xf.sx ?? 1;
  const sy = xf.sy ?? 1;
  const r = (xf.rot * Math.PI) / 180;
  const q = { x: (p.x - o.x) * sx, y: (p.y - o.y) * sy };
  return {
    x: o.x + (xf.at.x - xf.pivot.x) + q.x * Math.cos(r) - q.y * Math.sin(r),
    y: o.y + (xf.at.y - xf.pivot.y) + q.x * Math.sin(r) + q.y * Math.cos(r),
  };
};

/** The old figure shell: `translate(x, y) scale(scale)`. */
const shellOf = (p: FigureProps): ((q: Pt) => Pt) => {
  const k = p.scale ?? 1;
  return (q) => ({ x: p.x + q.x * k, y: p.y + q.y * k });
};

const near = (a: Pt, b: Pt) => {
  expect(a.x).toBeCloseTo(b.x, 3);
  expect(a.y).toBeCloseTo(b.y, 3);
};

const W0 = SCENE_BEATS.wedding.start;
const poses: [string, Who, FigureProps & { paan?: number }][] = [
  ["groom walking in", "groom", meetingPose(120, false).groom],
  ["bride walking in", "bride", meetingPose(120, false).bride],
  ["bride veiling her face", "bride", couplePose(W0 + 100, false).bride],
  ["groom receiving the garland", "groom", couplePose(W0 + 290, false).groom],
  ["bride garlanding him", "bride", couplePose(W0 + 290, false).bride],
  ["groom garlanding her", "groom", couplePose(W0 + 360, false).groom],
];

describe("figureOps placement matches the old rig CSS", () => {
  for (const [name, who, props] of poses) {
    it(name, () => {
      const ops = images(figureOps(who, props));
      const s = solveFigure(who, props);
      const toWorld = shellOf(props);
      const leaves = (props.paan ?? 0) > 0;
      const slots = BODY[who].filter(([, k]) => !(leaves && (k === "foreL" || k === "foreR")));
      for (const [art, key] of slots) {
        const op = ops.find((o) => o.art === art);
        expect(op, art).toBeDefined();
        const xf = s[key];
        expect(xf.pivot).toEqual(pivotOf(who, key));
        for (const c of corners(art)) near(apply(op!.m, c), toWorld(cssPart(xf, c)));
      }
    });
  }

  it("head group rotates about the neck and the crown wobbles on it", () => {
    const props = couplePose(W0 + 290, false).bride;
    const ops = images(figureOps("bride", props));
    const s = solveFigure("bride", props);
    const toWorld = shellOf(props);
    const headCss = (p: Pt): Pt => cssPart({ pivot: s.head.pivot, at: s.head.at, rot: s.head.rot }, p);
    const at = (art: keyof typeof ART) => ops.find((o) => o.art === art)!.m;
    for (const c of corners("bride-head")) near(apply(at("bride-head"), c), toWorld(headCss(c)));
    for (const c of corners("bride-veil-front")) near(apply(at("bride-veil-front"), c), toWorld(headCss(c)));
    const local: PartXf = { pivot: s.crown.pivot, at: s.crown.pivot, rot: s.crown.rot - s.head.rot };
    for (const c of corners("bride-mukut")) near(apply(at("bride-mukut"), c), toWorld(headCss(cssPart(local, c))));
    expect(SKELETON.bride.neck).toEqual(s.head.pivot);
  });

  it("draws the leaves and front forearms after the head while she holds the leaves", () => {
    const props = meetingPose(300, false).bride;
    const arts = images(figureOps("bride", props)).map((o) => o.art);
    const head = arts.indexOf("bride-head");
    expect(arts.indexOf("bride-torso")).toBeLessThan(head);
    expect(arts.indexOf("bride-arm-l")).toBeLessThan(head);
    expect(arts.indexOf("bride-fore-l")).toBeGreaterThan(arts.indexOf("bride-mukut"));
    expect(arts.filter((a) => a === "paan")).toHaveLength(2);
    expect(arts.indexOf("paan")).toBeLessThan(arts.indexOf("bride-fore-l"));
    // without leaves the forearms are body parts again
    const free = images(figureOps("bride", { ...props, paan: 0 })).map((o) => o.art);
    expect(free).not.toContain("paan");
    expect(free.indexOf("bride-fore-l")).toBeLessThan(free.indexOf("bride-head"));
  });

  it("the held betel leaves sit at the hands with the old placement", () => {
    const props = meetingPose(300, false).bride;
    const s = solveFigure("bride", props);
    const toWorld = shellOf(props);
    const paan = images(figureOps("bride", props)).filter((o) => o.art === "paan");
    const k = props.paan ?? 1;
    // translate(hand) rotate(angle + 90 -/+ 6) scale(paan), as the old spriteTransform wrote it
    const place = (h: Pt, deg: number, p: Pt): Pt => {
      const r = (deg * Math.PI) / 180;
      return { x: h.x + k * (p.x * Math.cos(r) - p.y * Math.sin(r)), y: h.y + k * (p.x * Math.sin(r) + p.y * Math.cos(r)) };
    };
    for (const c of corners("paan")) {
      near(apply(paan[0].m, c), toWorld(place(s.handL, s.handAngL + 90 - 6, c)));
      near(apply(paan[1].m, c), toWorld(place(s.handR, s.handAngR + 90 + 6, c)));
    }
  });

  it("draws one soft shadow ellipse of 240 x 32 under the feet", () => {
    const props = meetingPose(300, false).groom;
    const shadow = figureOps("groom", props)[0];
    if (shadow.kind !== "ellipse") throw new Error("the shadow comes first");
    const k = props.scale ?? 1;
    near(apply(shadow.m, { x: shadow.cx + shadow.rx, y: shadow.cy }), { x: props.x + 120 * k, y: props.y });
    near(apply(shadow.m, { x: shadow.cx, y: shadow.cy + shadow.ry }), { x: props.x, y: props.y + 16 * k });
  });

  it("a figure below full opacity is ONE group so overlapping parts do not show through", () => {
    const ops = figureOps("groom", { ...meetingPose(80, true).groom, opacity: 0.5 });
    expect(ops).toHaveLength(1);
    const g = ops[0];
    expect(g.kind).toBe("group");
    expect(g.kind === "group" && g.alpha).toBeCloseTo(0.5, 5);
    expect(figureOps("groom", { ...meetingPose(80, true).groom, opacity: 0 })).toEqual([]);
  });

  it("the camera matrix lands on every op", () => {
    const cam = mul(translate(540, 1000), mul(scale(1.1), translate(-540, -1000)));
    const props = meetingPose(300, false).groom;
    const a = images(figureOps("groom", props));
    const b = images(figureOps("groom", props, cam));
    a.forEach((o, i) => near(apply(b[i].m, { x: 3, y: -4 }), apply(cam, apply(o.m, { x: 3, y: -4 }))));
  });

  it("closed eyes draw a lid over the eye", () => {
    const open = figureOps("groom", { x: 0, y: 0, face: { close: 0 }, t: 40 });
    const shut = figureOps("groom", { x: 0, y: 0, face: { close: 1 }, t: 40 });
    expect(shut.length).toBeGreaterThan(open.length);
  });

  it("clips the irises with the eye shape under the eye matrix", () => {
    const ops = figureOps("bride", { x: 600, y: 1500, scale: 0.84, face: { gaze: 0.5 } });
    const clipped = ops.filter((o) => o.kind === "ellipse" && o.clip);
    expect(clipped).toHaveLength(6);
    for (const o of clipped) {
      if (o.kind !== "ellipse" || !o.clip || !("path" in o.clip)) throw new Error("path clip");
      expect(o.clip.m).toEqual(o.m);
    }
  });
});

describe("spriteOp", () => {
  const cases: SpriteState[] = [
    { name: "marigold-a", x: 300, y: 700, rot: 33, scale: 1.05, opacity: 0.6 },
    { name: "petal-pink", x: 12, y: 1500, rot: -170, scale: 0.46, sx: 0.4, opacity: 1 },
    { name: "diya", x: 120, y: 1560, scale: 0.95 },
  ];
  it("places the art like the old spriteTransform: translate(x,y) rotate(rot) scale(sx*k, k)", () => {
    for (const s of cases) {
      const op = spriteOp(s);
      if (op.kind !== "image") throw new Error("image");
      expect(op.alpha).toBeCloseTo(Math.min(1, s.opacity ?? 1), 6);
      for (const c of corners(s.name)) {
        const k = s.scale ?? 1;
        const kx = (s.sx ?? 1) * k;
        const r = ((s.rot ?? 0) * Math.PI) / 180;
        const want = { x: s.x + kx * c.x * Math.cos(r) - k * c.y * Math.sin(r), y: s.y + kx * c.x * Math.sin(r) + k * c.y * Math.cos(r) };
        near(apply(op.m, c), want);
      }
    }
  });
  it("composes a parent matrix on the left", () => {
    const parent: Mat = mul(translate(10, -20), rotate(7));
    const a = spriteOp(cases[0], parent) as ImageOp;
    const b = spriteOp(cases[0], I) as ImageOp;
    near(apply(a.m, { x: 5, y: 6 }), apply(parent, apply(b.m, { x: 5, y: 6 })));
  });
  it("spriteOps skips hidden sprites", () => {
    const list: SpriteState[] = [
      { name: "mote", x: 1, y: 1, opacity: 0 },
      { name: "mote", x: 1, y: 1, opacity: 0.001 },
      { name: "mote", x: 1, y: 1, opacity: 0.5 },
    ];
    expect(spriteOps(list)).toHaveLength(1);
    expect(spriteOps(setDownLeaves(10, false))).toHaveLength(0);
    expect(spriteOps(setDownLeaves(LEAVES.release[1], false))).toHaveLength(2);
  });
});
