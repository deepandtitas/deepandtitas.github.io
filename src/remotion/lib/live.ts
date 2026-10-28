import { useCallback, useLayoutEffect, useRef } from "react";

/** The per-frame part of an element's style. Everything else is static and rendered once. */
export interface LiveStyle {
  transform?: string;
  opacity?: number;
  visibility?: "visible" | "hidden";
}

type Node = HTMLElement | SVGElement;

/**
 * Applies per-frame styles straight to DOM nodes in a layout effect, so the elements themselves are rendered once and
 * React never re-diffs them per frame. Values are still pure functions of the current frame (computed in render), and
 * only properties that changed are written. Usage: `const ref = useLiveStyles(styles); <img ref={ref(i)} … />`.
 */
export const useLiveStyles = (styles: readonly LiveStyle[]) => {
  const nodes = useRef<(Node | null)[]>([]);
  const applied = useRef<(LiveStyle | undefined)[]>([]);
  const refs = useRef<((el: Node | null) => void)[]>([]);

  useLayoutEffect(() => {
    for (let i = 0; i < styles.length; i++) {
      const el = nodes.current[i];
      if (!el) continue;
      const s = styles[i];
      const p = applied.current[i] ?? {};
      if (s.transform !== p.transform) el.style.transform = s.transform ?? "";
      if (s.opacity !== p.opacity) el.style.opacity = s.opacity === undefined ? "" : s.opacity.toFixed(3);
      if (s.visibility !== p.visibility) el.style.visibility = s.visibility ?? "";
      applied.current[i] = s;
    }
  });

  return useCallback((i: number) => {
    refs.current[i] ??= (el: Node | null) => {
      nodes.current[i] = el;
      applied.current[i] = undefined;
    };
    return refs.current[i];
  }, []);
};
