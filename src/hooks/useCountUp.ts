"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a numeric value counting up from 0 to `target` (ease-out cubic,
 * via requestAnimationFrame) the first time a component using it mounts —
 * the dashboard stat cards use this so watching your money add up reads as
 * one deliberate brand moment, not a generic library effect.
 *
 * Later `target` changes (e.g. switching month) snap directly to the new
 * value with no re-animation, and `reduceMotion` skips the animation
 * entirely and returns `target` immediately, matching every other motion
 * check in this codebase.
 */
export function useCountUp(target: number, reduceMotion: boolean, duration = 900): number {
  const [value, setValue] = useState(reduceMotion ? target : 0);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (reduceMotion || !isFirstRun.current) {
      isFirstRun.current = false;
      // Defer to a frame (rather than calling setState synchronously in the
      // effect body) so this still goes through the same rAF-callback path
      // as the animated case below.
      const snapFrame = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(snapFrame);
    }
    isFirstRun.current = false;

    let frame: number;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduceMotion, duration]);

  return value;
}
