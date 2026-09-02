"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  containerClassName?: string;
}

export function Modal({ title, onClose, children, containerClassName }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // P1: focus the close button on open so keyboard/SR users land inside the dialog
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // P1: close on Escape, trap Tab focus inside the dialog
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`bg-[#0d0d0d] rounded-2xl shadow-2xl w-full mx-4 sm:mx-auto ${containerClassName ?? "max-w-lg"} overflow-hidden`}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <h2 id="modal-title" className="text-xl font-semibold text-white">{title}</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            className="p-2 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#111318] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="border border-[#252830] my-1" />
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
