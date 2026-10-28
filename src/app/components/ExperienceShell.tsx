import { Player, type PlayerRef } from "@remotion/player";
import { useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import { asset, AUDIO_PATH, IMAGES } from "../../config/assets";
import { COVER_FRAME, DURATION, FPS, HEIGHT, LAST_FRAME, WIDTH, type SceneId } from "../../config/timeline";
import { t, type Lang } from "../../config/translations";
import { WeddingComposition } from "../../remotion/WeddingComposition";
import type { WeddingProps } from "../../remotion/props";
import { usePlayerEvents } from "../hooks/usePlayerEvents";
import { useStoryMachine } from "../hooks/useStoryMachine";
import { IntroScreen } from "./IntroScreen";
import { LanguageToggle } from "./LanguageToggle";
import { StoryControls } from "./StoryControls";

interface Props {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  reducedMotion: boolean;
}

const HAS_AUDIO = typeof __HAS_AUDIO__ !== "undefined" && __HAS_AUDIO__;
const SCENE_HEADING = { awakening: "opening", meeting: "meeting", wedding: "wedding", invitation: "invitation" } as const;

/**
 * The 9:16 website shell: a fixed-ratio frame holding the Remotion Player, with the intro, language toggle and
 * story controls layered above it. Website state lives in a reducer; the animation stays frame-driven inside the Player.
 */
export const ExperienceShell = ({ lang, onLangChange, reducedMotion }: Props) => {
  const playerRef = useRef<PlayerRef>(null);
  const { state, stateRef, send } = useStoryMachine();
  const { isPlaying, scene } = usePlayerEvents({ playerRef, stateRef, send });
  const [muted, setMuted] = useState(true);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | undefined>(undefined);

  const base = import.meta.env.BASE_URL;
  const audioSrc = HAS_AUDIO ? asset(AUDIO_PATH, base) : null;

  // Warm the browser cache for the painted layers (and the soundtrack) while the guest reads the intro.
  useEffect(() => {
    const images = [IMAGES.paper, IMAGES.grain, IMAGES.gardenFar, IMAGES.gardenMid, IMAGES.gardenNear].map((p) => {
      const img = new Image();
      img.decoding = "async";
      img.src = asset(p, base);
      return img;
    });
    if (audioSrc) fetch(audioSrc).catch(() => undefined);
    // keep references until unmount so the browser keeps the decoded images warm
    return () => void images.length;
  }, [base, audioSrc]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lang === "bn" ? "দীপ ও তিতাস — শুভ পরিণয়" : "Deep & Titas — A Sacred Union";
  }, [lang]);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  // Dev-only handle so end-to-end checks can read the frame and seek the Player.
  useEffect(() => {
    if (import.meta.env.DEV) Object.assign(window, { __weddingPlayer: playerRef, __weddingState: stateRef });
  }, [stateRef]);

  // Sound begins only after a guest gesture (browsers block it otherwise); the story works fine without it.
  const enableSound = useCallback(() => {
    if (!HAS_AUDIO) return;
    playerRef.current?.unmute();
    setMuted(false);
  }, []);

  const watch = useCallback(
    (e: SyntheticEvent) => {
      const p = playerRef.current;
      if (!p) return;
      send({ type: "START_CINEMATIC" });
      p.seekTo(0);
      enableSound();
      p.play(e);
    },
    [send, enableSound],
  );

  const explore = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    send({ type: "START_GUIDED" });
    p.pause();
    p.seekTo(0);
    enableSound();
  }, [send, enableSound]);

  const activate = useCallback(
    (target: SceneId, e: SyntheticEvent) => {
      const p = playerRef.current;
      const s = stateRef.current;
      if (!p || s.phase !== "awaiting" || s.awaiting !== target) return;
      send({ type: "ACTIVATE", target });
      p.play(e);
    },
    [send, stateRef],
  );

  const skip = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    p.pause();
    p.seekTo(LAST_FRAME);
    send({ type: "SKIP" });
  }, [send]);

  const replay = useCallback(
    (e: SyntheticEvent) => {
      const p = playerRef.current;
      if (!p) return;
      send({ type: "REPLAY" });
      p.seekTo(0);
      p.play(e);
    },
    [send],
  );

  const togglePlay = useCallback((e: SyntheticEvent) => playerRef.current?.toggle(e), []);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isMuted()) {
      p.unmute();
      setMuted(false);
    } else {
      p.mute();
      setMuted(true);
    }
  }, []);

  const share = useCallback(async () => {
    const tx = t(lang);
    const url = window.location.href.split("#")[0];
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: tx.title, text: tx.shareText, url });
        return;
      }
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2400);
    } catch {
      window.prompt(tx.share, url);
    }
  }, [lang]);

  const guided = useMemo(
    () => ({ enabled: state.mode === "guided", awaiting: state.awaiting, onActivate: activate }),
    [state.mode, state.awaiting, activate],
  );

  // Memoised so the Player re-renders the composition only when something it shows actually changes.
  const inputProps = useMemo<WeddingProps>(
    () => ({
      lang,
      assetBase: base,
      audioSrc,
      reducedMotion,
      interactive: true,
      guided,
    }),
    [lang, base, audioSrc, reducedMotion, guided],
  );

  const tx = t(lang);
  return (
    <div className="stage">
      <main className="frame" aria-label={tx.storyLabel}>
        <div className="frame__player">
          <Player
            ref={playerRef}
            component={WeddingComposition}
            inputProps={inputProps}
            durationInFrames={DURATION}
            compositionWidth={WIDTH}
            compositionHeight={HEIGHT}
            fps={FPS}
            initialFrame={COVER_FRAME}
            controls={false}
            loop={false}
            clickToPlay={false}
            doubleClickToFullscreen={false}
            spaceKeyToPlayOrPause={false}
            allowFullscreen={false}
            moveToBeginningWhenEnded={false}
            initiallyMuted
            acknowledgeRemotionLicense
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        <LanguageToggle lang={lang} onChange={onLangChange} />

        {state.phase === "intro" && (
          <IntroScreen lang={lang} reducedMotion={reducedMotion} onWatch={watch} onExplore={explore} onSkip={skip} />
        )}

        <StoryControls
          lang={lang}
          phase={state.phase}
          isPlaying={isPlaying}
          muted={muted}
          hasAudio={HAS_AUDIO}
          copied={copied}
          onTogglePlay={togglePlay}
          onToggleMute={toggleMute}
          onSkip={skip}
          onReplay={replay}
          onShare={share}
        />

        <div className="sr-only" aria-live="polite">
          {state.phase === "intro" ? "" : tx[SCENE_HEADING[scene]]}
        </div>
      </main>
    </div>
  );
};
