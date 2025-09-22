// src/components/PopUp/PopUpComercio.tsx
import React, { useEffect, useRef, useCallback, isValidElement, cloneElement } from "react";
import { createPortal } from "react-dom";
import "./PopUp.css";

type CloseControlRender = (onClose: () => void) => React.ReactNode;

type PopUpProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  ariaLabel?: string;
  /** fecha ao clicar no overlay */
  closeOnOverlayClick?: boolean;
  /** mostra o botão de fechar no canto (fallback 'X') */
  showCloseButton?: boolean;
  /** controlar um elemento customizado para fechar: ReactNode ou render prop (onClose)=>ReactNode */
  closeControl?: React.ReactNode | CloseControlRender;
  children?: React.ReactNode;
  /** classes extras para container/inner */
  className?: string;
  containerClassName?: string;
  /** referência para o elemento que deve receber foco inicial ao abrir */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /**
   * Fecha automaticamente quando `closeWhen` muda.
   * Modo:
   *  - "becomesTrue" (default): fecha quando closeWhen passa de falsy -> truthy
   *  - "changes": fecha sempre que closeWhen muda ( !== )
   */
  closeWhen?: any;
  closeWhenMode?: "becomesTrue" | "changes";
};

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function PopUp({
  isOpen,
  onClose,
  title,
  ariaLabel,
  closeOnOverlayClick = true,
  showCloseButton = true,
  closeControl,
  children,
  className = "",
  containerClassName = "",
  initialFocusRef,
  closeWhen,
  closeWhenMode = "becomesTrue",
}: PopUpProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const prevBodyOverflow = useRef<string | null>(null);
  const prevCloseWhen = useRef<any>(closeWhen);

  const isDocumentDefined = typeof document !== "undefined";

  useEffect(() => {
    if (!isDocumentDefined || !isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    prevBodyOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      const toFocus =
        initialFocusRef?.current ??
        containerRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTORS) ??
        (containerRef.current as HTMLElement) ??
        null;
      toFocus?.focus();
    }, 0);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "Tab") {
        const root = containerRef.current;
        if (!root) return;
        const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
          (el) => el.offsetParent !== null || el.getAttribute("tabindex") !== "-1"
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (active === first || active === root) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      if (prevBodyOverflow.current !== null) document.body.style.overflow = prevBodyOverflow.current;
      try {
        previouslyFocused.current?.focus();
      } catch (err) {
        // ignore
      }
    };
  }, [isOpen, onClose, initialFocusRef]);

  // Observa closeWhen conforme closeWhenMode
  useEffect(() => {
    if (typeof closeWhen === "undefined") {
      prevCloseWhen.current = closeWhen;
      return;
    }

    if (closeWhenMode === "becomesTrue") {
      const prev = prevCloseWhen.current;
      if (!prev && closeWhen) {
        onClose();
      }
    } else {
      // mode === "changes"
      if (prevCloseWhen.current !== closeWhen) {
        onClose();
      }
    }
    prevCloseWhen.current = closeWhen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeWhen, closeWhenMode]);

  function onOverlayClick(e: React.MouseEvent) {
    if (!closeOnOverlayClick) return;
    if (e.target === overlayRef.current) onClose();
  }

  const renderCloseControl = useCallback(() => {
    // prioridade: closeControl (render prop or ReactNode) -> fallback to X if showCloseButton
    if (typeof closeControl === "function") {
      // render prop
      try {
        return (closeControl as CloseControlRender)(onClose);
      } catch {
        return null;
      }
    }

    if (isValidElement(closeControl)) {
      // clone element to inject onClick that chama onClose (mantendo onClick existente)
      const element = closeControl as React.ReactElement<any>;
      const existingOnClick = (element.props as any).onClick;
      const mergedOnClick = (e: React.MouseEvent) => {
        try {
          if (typeof existingOnClick === "function") existingOnClick(e);
        } finally {
          onClose();
        }
      };
      return cloneElement(element, { ...element.props, onClick: mergedOnClick });
    }

    // fallback: X button (se permitido)
    if (showCloseButton) {
      return (
        <button aria-label="Fechar" onClick={onClose} className="popup-close">
          ✕
        </button>
      );
    }

    return null;
  }, [closeControl, onClose, showCloseButton]);

  if (!isDocumentDefined || !isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      role="presentation"
      onMouseDown={onOverlayClick}
      className={`popup-overlay`}
      aria-hidden={false}
    >
      <div
        role="dialog"
        aria-modal={true}
        aria-label={ariaLabel}
        ref={containerRef}
        className={`popup-container ${containerClassName}`}
        onMouseDown={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className={`popup-content ${className}`}>
          {/* Renderiza controle de fechar (render prop | nodo clonado | fallback X) */}
          {renderCloseControl()}

          {title && <h2 className="popup-title">{title}</h2>}

          <div className="popup-children">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
