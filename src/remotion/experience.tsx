import { createContext, useCallback, useContext } from "react";
import { staticFile } from "remotion";
import { asset } from "../config/assets";
import { t, type Dictionary } from "../config/translations";
import { defaultWeddingProps, type WeddingProps } from "./props";

export const ExperienceContext = createContext<WeddingProps>(defaultWeddingProps);

export const useExperience = (): WeddingProps => useContext(ExperienceContext);

/** Resolves a public-folder path for either the website (assetBase) or Remotion (staticFile). */
export const resolveAsset = (path: string, assetBase: string | null): string =>
  assetBase === null ? staticFile(path) : asset(path, assetBase);

export const useAsset = (): ((path: string) => string) => {
  const { assetBase } = useExperience();
  return useCallback((path: string) => resolveAsset(path, assetBase), [assetBase]);
};

export const useText = (): Dictionary => t(useExperience().lang);
