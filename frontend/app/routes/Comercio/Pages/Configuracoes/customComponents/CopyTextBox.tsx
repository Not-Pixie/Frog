import React, { useEffect, useId, useRef, useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import "./CopyTextBox.css";

type CopyTextBoxProps = {
  /** Texto mostrado (via children). Preferível passar string. */
  children: React.ReactNode;
  /** Texto do tooltip (quando em hover/focus) — padrão "copiar texto". */
  tooltip?: string;
  /** Texto lido após sucesso de cópia — padrão "copiado!" */
  copiedMessage?: string;
  /** id opcional para o input (útil para labels externos) */
  id?: string;
  /** aria-label para o textbox (se não informado, usa tooltip) */
  ariaLabel?: string;
  className?: string;
};

export default function CopyTextBox({
  children,
  tooltip = "copiar texto",
  copiedMessage = "copiado!",
  id,
  ariaLabel,
  className = "",
}: CopyTextBoxProps) {
  const internalId = useId();
  const inputId = id ?? `copy-textbox-${internalId}`;
  const [copied, setCopied] = useState(false);
  const liveRef = useRef<HTMLSpanElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Converte children em string (simples, cobre a maioria dos casos)
  const text = React.Children.toArray(children).join("");

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback: cria textarea temporário
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      // Avisa leitores de tela
      if (liveRef.current) liveRef.current.textContent = copiedMessage;
      // volta ao estado inicial após 2s
      timeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        if (liveRef.current) liveRef.current.textContent = "";
      }, 2000);
    } catch (err) {
      // Se falhar, limpar e não quebrar UX — poderia adicionar fallback visual se desejar
      setCopied(false);
      if (liveRef.current) liveRef.current.textContent = "erro ao copiar";
      timeoutRef.current = window.setTimeout(() => {
        if (liveRef.current) liveRef.current.textContent = "";
      }, 2000);
    }
  };

  return (
    <div className={`form-field copy-textbox ${className}`}>
      <div className="input-wrapper" style={{ position: "relative" }}>
        {/* Input não editável para manter comportamento nativo (selecionável/focusável) */}
        <input
          id={inputId}
          readOnly
          value={text}
          aria-readonly="true"
          aria-label={ariaLabel ?? tooltip}
          aria-describedby={`${inputId}-copy-live`}
          // aumenta padding à direita para acomodar botão sobreposto
          style={{ paddingRight: "68px" }}
        />

        {/* Botão overlay */}
        <button
          type="button"
          className={`copy-btn`}
          onClick={handleCopy}
          aria-label={tooltip}
          aria-describedby={`${inputId}-copy-live ${inputId}-tooltip`}
          title={tooltip}
        >
          <span className="icon-wrap" aria-hidden="true">
            {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
          </span>

          {/* Tooltip visual (aparece no hover/focus) */}
          <span id={`${inputId}-tooltip`} className="copy-tooltip" role="status" aria-hidden="true">
            {copied ? copiedMessage : tooltip}
          </span>
        </button>

        {/* Live region para leitores de tela */}
        <span
          id={`${inputId}-copy-live`}
          ref={liveRef}
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        />
      </div>
    </div>
  );
}
