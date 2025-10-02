import React from "react";
import "./CommerceCard.css";
import type { Comercio } from "~/routes/Usuário/customComponents/schemas";

type CommerceCardProps = {
  onClick?: () => void;
  variant?: "add" | "filled"; // mantive a prop caso precise depois
  comercio?: Comercio;
};

export default function CommerceCard({ onClick, variant = "add", comercio }: CommerceCardProps) {
  let className = `commerce-card ${!comercio ? "card-add" : "card-filled"}`;

  if(!comercio)
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

    className = comercio.is_proprietario ? `${className} owner-card` : className;
  
  return (
    <button
        type="button"
        className={className}
        onClick={onClick}
        aria-label={`Entrar em ${comercio.nome}`}
      >
        <div className="card-content">{comercio.nome}</div>
      </button>
  )
}
