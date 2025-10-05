import React from "react";
import "./CommerceCard.css";
import type { Comercio } from "~/routes/Usuário/customComponents/schemas";
import { Link } from "react-router";
import { dateFormatter } from "./formatter";

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
  const formattedComercio =  {...comercio, criado_em: dateFormatter.format(new Date(comercio.criado_em))}

  return (
    <Link
      to={`/comercio/${formattedComercio.comercio_id}`}
      className={className}
      onClick={onClick}
      aria-label={`Entrar em ${formattedComercio.nome}`}
    >
      <div className="card-content">
        <div className="commerce-name">{formattedComercio.nome}</div>
        <div className="commerce-date">{formattedComercio.criado_em}</div>
      </div>
    </Link>
  )
}
