import React from "react";
import "./CommerceCard.css";
import type { Comercio } from "~/routes/Usuário/customComponents/schemas";
import { Link } from "react-router";

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
  const fmt = new Intl.DateTimeFormat('pt-BR', {day: "2-digit", month: "2-digit", year: "numeric"})
  comercio = {...comercio, criado_em: fmt.format(new Date(comercio.criado_em))}

  return (
    <Link
      to={`/comercio/${comercio.comercio_id}`}
      className={className}
      onClick={onClick}
      aria-label={`Entrar em ${comercio.nome}`}
    >
      <div className="card-content">
        <div className="commerce-name">{comercio.nome}</div>
        <div className="commerce-date">{comercio.criado_em}</div>
      </div>
    </Link>
  )
}
