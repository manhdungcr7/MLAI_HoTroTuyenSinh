import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Hộp thoại dùng chung: role="dialog" + aria-modal, giữ focus bên trong, Esc để đóng,
 * trả focus về nút đã mở, và luôn nằm trong viewport (kể cả màn hình 320×640).
 */
export function Modal({ isOpen, onClose, title, description, children, maxWidth = "md" }: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4">
      <div className="fixed inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`relative flex w-full ${maxWidthStyles[maxWidth]} max-h-[calc(100dvh-1.5rem)] flex-col rounded-2xl bg-white p-4 sm:p-6 shadow-xl border border-slate-200 z-10`}
      >
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-extrabold text-slate-900 tracking-tight text-pretty">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-xs text-slate-500 font-semibold mt-1 text-pretty">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="py-4 overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
}
