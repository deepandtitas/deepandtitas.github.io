import type { PlayerRef } from "@remotion/player";
import { useCallback, useEffect, useRef, type RefObject } from "react";
import { FPS, framesToBeats } from "../../config/timeline";
import { soundtrackVolume } from "../../remotion/Soundtrack";

/** Re-sync the music only when it has drifted this far from the story (seeks, stalls), never every frame. */
const MAX_DRIFT_S = 0.35;

/**
 * The website plays the soundtrack with a plain <audio> element outside the Remotion Player: the browser decodes and
 * mixes it off the main thread, so the animation keeps the main thread to itself on phones. It follows the Player
 * (play, pause, seek) and the same volume envelope as video renders. Sound starts only after a guest gesture; a
 * missing or failing file is silently ignored.
 */
export const useSoundtrack = (playerRef: RefObject<PlayerRef | null>, src: string | null) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!src) return;
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.muted = true;
    audioRef.current = audio;
    audio.addEventListener("error", () => {
      audioRef.current = null;
    });
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const sync = (frame: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const t = frame / FPS;
      if (Math.abs(audio.currentTime - t) > MAX_DRIFT_S) audio.currentTime = t;
      audio.volume = Math.min(1, Math.max(0, soundtrackVolume(framesToBeats(frame))));
    };
    const onPlay = () => {
      const audio = audioRef.current;
      if (!audio) return;
      sync(player.getCurrentFrame());
      audio.play().catch(() => undefined);
    };
    const onPause = () => audioRef.current?.pause();
    const onFrame = (e: { detail: { frame: number } }) => sync(e.detail.frame);
    const onSeek = (e: { detail: { frame: number } }) => sync(e.detail.frame);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onPause);
    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("seeked", onSeek);
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onPause);
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("seeked", onSeek);
    };
  }, [playerRef]);

  /** Mutes/unmutes. Unmuting must happen in a guest gesture the first time (browsers block sound otherwise). */
  return useCallback(
    (muted: boolean) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.muted = muted;
      // play() inside the gesture unlocks audio (iOS); if the story is not running, pause again right away
      if (!muted)
        audio
          .play()
          .then(() => {
            if (!playerRef.current?.isPlaying()) audio.pause();
          })
          .catch(() => undefined);
    },
    [playerRef],
  );
};
