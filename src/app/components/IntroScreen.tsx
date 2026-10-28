import { otherLang, t, type Lang } from "../../config/translations";

interface Props {
  lang: Lang;
  reducedMotion: boolean;
  onWatch: (e: React.SyntheticEvent) => void;
  onExplore: (e: React.SyntheticEvent) => void;
  onSkip: () => void;
}

const PlayIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />
  </svg>
);

const Label = ({ lang, k }: { lang: Lang; k: "play" | "explore" | "skip" }) => (
  <span className="intro__label">
    <span className="intro__primary-label" lang={lang}>
      {t(lang)[k]}
    </span>
    <span className="intro__secondary-label" lang={otherLang(lang)}>
      {t(otherLang(lang))[k]}
    </span>
  </span>
);

/**
 * Cover overlay shown over the painted opening frame. The two ways to experience the story are real buttons;
 * with reduced motion the invitation itself becomes the primary action.
 */
export const IntroScreen = ({ lang, reducedMotion, onWatch, onExplore, onSkip }: Props) => {
  const tx = t(lang);
  return (
    <section className="intro" aria-label={tx.title}>
      <div className="intro__names" lang={lang}>
        <h1 className="intro__title">{tx.title}</h1>
        <p className="intro__subtitle">{tx.subtitle}</p>
      </div>

      <div className="intro__actions">
        {reducedMotion && (
          <button type="button" className="btn btn--primary" onClick={onSkip}>
            <Label lang={lang} k="skip" />
          </button>
        )}
        <button
          type="button"
          className={reducedMotion ? "btn btn--ghost" : "btn btn--primary"}
          onClick={onWatch}
        >
          <span className="btn__icon">
            <PlayIcon />
          </span>
          <Label lang={lang} k="play" />
        </button>
        <button type="button" className="btn btn--ghost" onClick={onExplore}>
          <Label lang={lang} k="explore" />
        </button>
        {!reducedMotion && (
          <button type="button" className="link-btn" onClick={onSkip}>
            {tx.skip}
          </button>
        )}
      </div>
    </section>
  );
};
