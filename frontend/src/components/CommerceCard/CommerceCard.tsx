import React, { useMemo } from "react";
import "./CommerceCard.css";
import type { Comercio } from "src/types/comercio";
import { Link } from "react-router"; // <- use react-router-dom
import { dateFormatter } from "src/helpers";

type CommerceCardProps = {
  onClick?: () => void;
  variant?: "add" | "filled";
  comercio?: Comercio;
  clickable?: boolean;
  children?: React.ReactNode;
};

export default function CommerceCard({
  onClick,
  variant = "add",
  comercio,
  clickable = true,
  children,
}: CommerceCardProps) {
  const baseClass = "commerce-card";
  const modeClass =
    !!comercio || variant === "filled" ? "card-filled" : "card-add";
  const ownerClass = comercio?.is_proprietario ? "owner-card" : "";
  const className = [baseClass, modeClass, ownerClass]
    .filter(Boolean)
    .join(" ");

  const formattedDate = useMemo(() => {
    const raw = comercio?.criado_em;
    if (!raw) return "";
    const d = new Date(raw as any);
    if (Number.isNaN(d.getTime())) {
      return typeof raw === "string" ? raw : "";
    }
    try {
      return dateFormatter.format(d);
    } catch {
      return typeof raw === "string" ? raw : "";
    }
  }, [comercio?.criado_em]);

  if (!comercio) {
    if (variant === "add") {
      return (
        <button
          type="button"
          className={className}
          onClick={onClick}
          aria-label="Criar novo comércio"
          disabled={!clickable}
        >
          <span className="plus-sign" aria-hidden={true}>
            +
          </span>
        </button>
      );
    }

    if (clickable && onClick) {
      return (
        <button
          type="button"
          className={className}
          onClick={onClick}
          aria-label="Cartão"
        >
          {children}
        </button>
      );
    }

    return (
      <div className={className} role="group" aria-label="Cartão">
        {children}
      </div>
    );
  }


  const commerceId = comercio.comercio_id;
  const nameLabel = comercio.nome;
  const enterLabel = `Entrar em ${nameLabel}`;

  if (clickable && commerceId !== undefined) {
    return (
      <Link
        to={`/comercio/${commerceId}`}
        className={className}
        onClick={onClick}
        aria-label={enterLabel}
      >
        <div className="card-content">
          <div className="commerce-name">{nameLabel}</div>
          <div className="commerce-date">{formattedDate}</div>
        </div>
      </Link>
    );
  }

  if (clickable && onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        aria-label={enterLabel}
      >
        <div className="card-content">
          <div className="commerce-name">{nameLabel}</div>
          <div className="commerce-date">{formattedDate}</div>
        </div>
      </button>
    );
  }

  
  return (
    <div className={`${className} non-clickable`} role="group" aria-label={enterLabel}>
      <div className="card-content">
        <div className="commerce-name">{nameLabel}</div>
        <div className="commerce-date">{formattedDate}</div>
      </div>
    </div>
  );
}
