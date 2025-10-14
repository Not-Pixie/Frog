// src/routes/Comercio/Pages/Produtos/novo-produto.tsx
import React from "react";
import "./novo-produto.css";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import Button from "../../../../../src/components/Button/button.tsx";
import { FaArrowLeft } from "react-icons/fa";

type FormValues = {
  codigo: string;
  nome: string;
  categoria: string;
  preco: string;
  fornecedor: string;
  limiteEstoque: string;
  tag: string;
};

export default function NovoProduto() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      codigo: "097356",
      nome: "",
      categoria: "",
      preco: "R$ 99,99",
      fornecedor: "",
      limiteEstoque: "padrao",
      tag: ""
    }
  });

  const onSubmit = async (data: FormValues) => {
    // Por enquanto: apenas log e feedback visual local.
    console.log("Dados do produto (sem backend):", data);
    alert("O backend ainda não existe, então, dados salvos localmente. ;) ");
    // Se quiser navegar de volta:
    // navigate(-1);
  };

  return (
    <div className="conteudo-item produto-cadastro">
      <div className="page-header">
        <button
          className="back-link"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
        >
          <FaArrowLeft />
        </button>
        <h1>Produtos</h1>
      </div>

      <p className="subtitulo">Adicionar novo produto:</p>

      <form className="product-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="field">
          <label htmlFor="codigo">Código</label>
          <input
            id="codigo"
            {...register("codigo", { required: "Código é obrigatório" })}
            placeholder="097356"
          />
          {errors.codigo && <span className="err">{errors.codigo.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="nome">Nome</label>
          <input
            id="nome"
            {...register("nome", { required: "Nome do produto é obrigatório" })}
            placeholder="Nome do produto"
          />
          {errors.nome && <span className="err">{errors.nome.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="categoria">Categoria</label>
          <input
            id="categoria"
            {...register("categoria")}
            placeholder="Categoria do Produto"
          />
        </div>

        <div className="field">
          <label htmlFor="preco">Preço</label>
          <input
            id="preco"
            {...register("preco")}
            placeholder="R$ 99,99"
          />
        </div>

        <div className="field">
          <label htmlFor="fornecedor">Fornecedor</label>
          <input
            id="fornecedor"
            {...register("fornecedor")}
            placeholder="Nome do Fornecedor"
          />
        </div>

        <div className="field">
          <label htmlFor="limiteEstoque">Limite mínimo de estoque</label>
          <select id="limiteEstoque" {...register("limiteEstoque")}>
            <option value="padrao">Padrão</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </div>

        <div className="field field-full">
          <label htmlFor="tag">Tag</label>
          <input
            id="tag"
            {...register("tag")}
            placeholder="Tag do Produto"
          />
        </div>

        <div className="form-actions">
          <Button theme="green" type="submit" disabled={isSubmitting}>
            Adicionar produto
          </Button>
        </div>
      </form>
    </div>
  );
}
