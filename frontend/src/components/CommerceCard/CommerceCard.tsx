import React from "react";
import "./CommerceCard.css";

type CommerceCardProps = {
  onClick?: () => void;
  variant?: "add" | "filled"; // mantive a prop caso precise depois
};

export default function CommerceCard({ onClick, variant = "add" }: CommerceCardProps) {
  const className = `commerce-card ${variant === "add" ? "card-add" : "card-filled"}`;

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={variant === "add" ? "Criar novo comércio" : "Abrir comércio"}
    >
      {variant === "add" ? <span className="plus-sign" aria-hidden>+</span> : <div className="card-content">Comércio</div>}
    </button>
  );
}
