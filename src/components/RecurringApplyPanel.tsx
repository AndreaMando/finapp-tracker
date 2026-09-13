"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CheckSquare, Square, RefreshCw, AlertCircle, ChevronRight } from "lucide-react";
import { currentMonthKey, formatMonthKey } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { useRecurringApply } from "./useRecurringApply";
import { RecurringItemRow } from "./RecurringItemRow";

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface-sunken rounded-md animate-pulse ${className}`} aria-hidden="true" />;
}

function RecurringApplySkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Caricamento...">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-surface-sunken border border-hairline rounded-lg px-4 py-3.5 flex items-center gap-3">
          <Skeleton className="w-[18px] h-[18px] rounded-md shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="w-24 h-9 rounded-md" />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Slide-to-confirm — the "pull-to-gather" signature gesture for the monthly
// recurring-apply ritual. The handle is a real <button>: Enter/Space (or a
// plain click, for mouse users who don't drag) fires handleApply identically
// to a drag that reaches the end, so the gesture is additive, never the only
// way in. Dragging fills the track behind the handle ("gathering"); letting
// go short of the end snaps the handle back to start and applies nothing.
// ─────────────────────────────────────────────
const SLIDE_HANDLE_SIZE = 44;
const SLIDE_COMPLETE_EPSILON = 2;

function SlideToApply({
  label,
  ariaLabel,
  disabled,
  applying,
  reduceMotion,
  onConfirm,
}: {
  label: string;
  ariaLabel: string;
  disabled: boolean;
  applying: boolean;
  reduceMotion: boolean;
  onConfirm: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{ pointerId: number; startX: number; maxOffset: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Track width is measured (not just read at drag-start) so the "gather"
  // fill can animate via transform: scaleX() instead of the `width` property
  // — width triggers layout on every frame, scaleX is compositor-only.
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setTrackWidth(track.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  const settle = useCallback((finalOffset: number, completed: boolean) => {
    setDragging(false);
    dragInfo.current = null;
    if (completed) {
      // Hold the handle at the end while the apply is in flight; the panel
      // re-renders with fresh items/disabled state once it resolves.
      setOffset(finalOffset);
    } else {
      setOffset(0);
    }
  }, []);

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (disabled) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const maxOffset = Math.max(0, rect.width - SLIDE_HANDLE_SIZE);
    dragInfo.current = { pointerId: e.pointerId, startX: e.clientX, maxOffset };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const info = dragInfo.current;
    if (!info || info.pointerId !== e.pointerId) return;
    setOffset(clamp(e.clientX - info.startX, 0, info.maxOffset));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    const info = dragInfo.current;
    if (!info || info.pointerId !== e.pointerId) return;
    // Only reaching the track's end applies — anything short of that
    // (including a plain tap with near-zero movement) snaps back to start
    // and applies nothing. handleClick separately handles keyboard Enter/Space.
    const reachedEnd = info.maxOffset > 0 && offset >= info.maxOffset - SLIDE_COMPLETE_EPSILON;
    if (reachedEnd) {
      settle(info.maxOffset, true);
      onConfirm();
    } else {
      settle(0, false);
    }
  }

  function handlePointerCancel(e: React.PointerEvent<HTMLButtonElement>) {
    const info = dragInfo.current;
    if (!info || info.pointerId !== e.pointerId) return;
    // Ambiguous end of gesture — resolve to "nothing applied", never a
    // half-dragged, half-committed state.
    settle(0, false);
  }

  // A plain mouse/touch click must NOT apply — only a drag that reaches the
  // track's end does (handlePointerUp above calls onConfirm() directly for
  // that case). This handler exists solely for keyboard activation: pressing
  // Enter/Space on a focused button dispatches a "click" with `detail: 0`
  // (no pointer device involved), which is how it's told apart from a real
  // pointer click here. A user-reported bug was a plain click applying
  // immediately without completing the slide — this is the fix.
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.detail === 0) onConfirm();
  }

  return (
    <div
      ref={trackRef}
      className={`relative w-full max-w-sm mx-auto h-14 rounded-full border border-hairline bg-surface-sunken overflow-hidden transition-opacity ${
        disabled ? "opacity-50" : "opacity-100"
      }`}
    >
      {/* Gather fill — visual feedback that grows behind the handle while
          dragging. Rendered as a full-width layer scaled via transform
          (compositor-only, no layout thrash) rather than an animated
          `width`, which would reflow the track on every frame. */}
      <div
        className="absolute inset-y-0 left-0 w-full bg-accent/25 origin-left"
        style={{
          transform: `scaleX(${trackWidth > 0 ? clamp((offset + SLIDE_HANDLE_SIZE / 2) / trackWidth, 0, 1) : 0})`,
          transition: dragging || reduceMotion ? "none" : "transform 200ms ease-out",
        }}
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
        <span className="text-sm font-semibold text-ink truncate">{label}</span>
      </div>

      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-busy={applying}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          width: SLIDE_HANDLE_SIZE,
          height: SLIDE_HANDLE_SIZE,
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : reduceMotion ? "none" : "transform 200ms ease-out",
          touchAction: "pan-y",
        }}
        className="absolute inset-y-0 my-auto left-0 rounded-full bg-accent text-accent-contrast flex items-center justify-center cursor-grab active:cursor-grabbing disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-sunken"
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Panel component
// ─────────────────────────────────────────────
export default function RecurringApplyPanel({
  monthKey = currentMonthKey(),
  onApplied,
}: {
  monthKey?: string;
  onApplied?: () => void;
}) {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const reduceMotion = useReducedMotion() ?? false;

  const {
    items, selected, loading, applying, error,
    pendingCount, selectedCount, allSelected,
    toggle, setAmount, selectAll, deselectAll, handleApply,
  } = useRecurringApply(monthKey, onApplied);

  const appliedCount = items.filter((i) => i.isApplied).length;
  const canApply = selectedCount > 0 && !applying;
  const applyLabel = applying
    ? t("Applying...")
    : selectedCount > 0
    ? `${t("Apply")} ${selectedCount} ${t(selectedCount === 1 ? "expense" : "expenses")}`
    : t("Apply selected");

  return (
    <div className="w-full space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-ink font-mono tabular-nums">
            {formatMonthKey(monthKey, locale)}
          </p>
          {!loading && (
            <p className="text-xs text-ink-muted mt-0.5">
              {pendingCount === 0 && appliedCount > 0 ? (
                t("All recurring expenses applied for this month")
              ) : (
                <>
                  {appliedCount > 0
                    ? `${appliedCount} ${t("already applied")} · `
                    : ""}
                  {selectedCount} {t("of")} {pendingCount} {t("selected")}
                </>
              )}
            </p>
          )}
        </div>

        {!loading && pendingCount > 0 && (
          <button
            onClick={allSelected ? deselectAll : selectAll}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1"
          >
            {allSelected
              ? <><Square size={13} aria-hidden="true" /> {t("Deselect all")}</>
              : <><CheckSquare size={13} aria-hidden="true" /> {t("Select all")}</>
            }
          </button>
        )}
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            role="alert"
            className="flex items-center gap-2.5 bg-negative/10 border border-negative/20 rounded-lg px-4 py-3"
          >
            <AlertCircle size={13} className="text-negative shrink-0" aria-hidden="true" />
            <p className="text-xs text-negative font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div
        className="space-y-2 max-h-[48vh] overflow-y-auto pr-0.5"
        role="list"
        aria-label={t("Recurring expenses to apply")}
      >
        {loading ? (
          <RecurringApplySkeleton />
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw size={28} className="mx-auto mb-2 text-ink-faint" aria-hidden="true" />
            <p className="text-sm text-ink-muted">{t("No recurring items for this month")}</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} role="listitem">
              <RecurringItemRow
                item={item}
                checked={!!selected[item.id]}
                onToggle={() => toggle(item.id)}
                onAmountChange={(v) => setAmount(item.id, v)}
              />
            </div>
          ))
        )}
      </div>

      {/* Progress bar */}
      {!loading && items.length > 0 && appliedCount > 0 && (
        <div
          className="w-full bg-surface-sunken rounded-full h-1 overflow-hidden"
          role="progressbar"
          aria-valuenow={appliedCount}
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-label={`${appliedCount} ${t("of")} ${items.length} ${t("applied")}`}
        >
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${(appliedCount / items.length) * 100}%` }}
          />
        </div>
      )}

      {/* Slide-to-confirm apply gesture. Only a full drag to the track's end,
          or keyboard Enter/Space on the focused handle, applies — a plain
          mouse click/tap does nothing, so nobody triggers this by accident. */}
      <div className="space-y-1.5">
        <SlideToApply
          label={applyLabel}
          ariaLabel={applyLabel}
          disabled={!canApply}
          applying={applying}
          reduceMotion={reduceMotion}
          onConfirm={handleApply}
        />
        {!loading && pendingCount > 0 && (
          <p className="text-[11px] text-ink-faint text-center">
            {t("Slide to apply, or press Enter")}
          </p>
        )}
      </div>
    </div>
  );
}
