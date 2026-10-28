// @vitest-environment node
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ART } from "../src/art/manifest";

const root = path.resolve(__dirname, "..");
const OLD_MANIFEST = "C:/Projects/deepandtitas.github.io/src/remotion/art-manifest.ts";

describe("art manifest", () => {
  const entries = Object.entries(ART);

  it("has files that exist with matching byte sizes and positive dimensions", () => {
    for (const [name, a] of entries) {
      const file = path.join(root, "public", a.src);
      expect(existsSync(file), name).toBe(true);
      expect(statSync(file).size, name).toBe(a.bytes);
      expect(a.w, name).toBeGreaterThan(0);
      expect(a.h, name).toBeGreaterThan(0);
    }
  });

  it("has unique names and files", () => {
    expect(new Set(entries.map(([, a]) => a.src)).size).toBe(entries.length);
  });

  it.skipIf(!existsSync(OLD_MANIFEST))("has the same names as the old build", () => {
    const text = readFileSync(OLD_MANIFEST, "utf8");
    const old = [...text.matchAll(/^ {2}"([^"]+)": \{/gm)].map((m) => m[1]).sort();
    expect(old.length).toBeGreaterThan(0);
    expect(Object.keys(ART).sort()).toEqual(old);
  });
});
