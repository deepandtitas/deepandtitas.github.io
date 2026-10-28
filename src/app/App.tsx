import { useState } from "react";
import type { Lang } from "../config/translations";
import { ExperienceShell } from "./components/ExperienceShell";
import { useReducedMotion } from "./hooks/useReducedMotion";

/** Bengali is the default language. */
export const App = () => {
  const [lang, setLang] = useState<Lang>("bn");
  const reducedMotion = useReducedMotion();
  return <ExperienceShell lang={lang} onLangChange={setLang} reducedMotion={reducedMotion} />;
};
