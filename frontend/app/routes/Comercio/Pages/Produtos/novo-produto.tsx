// src/routes/Comercio/Pages/Produtos/novo-produto.tsx
import React, { useEffect } from "react";
import "./novo-produto.css";
import { useNavigate } from "react-router"; // mantenho como você tinha
import { useForm } from "react-hook-form";
import Button from "../../../../../src/components/Button/button.tsx";
import Input from "../../../../../src/components/Input/Input.tsx"; // ajuste o caminho se necessário

type FormValues = {
  nome: string;
  categoria: string;
  preco: string;
  fornecedor: string;
  limiteEstoque: string; // agora é textbox
  tag: string;
};

export default function NovoProduto() {
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<FormValues>({
    defaultValues: {
      nome: "",
      categoria: "",
      preco: "",
      fornecedor: "",
      // valor padrão (pode vir de configurações do usuário depois)
      limiteEstoque: "",
      tag: ""
    }
  });

  // exemplo: se quiser popular limiteEstoque a partir de uma API / config do usuário,
  // você pode usar setValue dentro de um useEffect (descomente e adapte quando for necessário).
  /*
  useEffect(() => {
    async function loadUserDefaults() {
      const resp = await fetch("/api/meu-usuario/config"); // exemplo
      const json = await resp.json();
      // supondo que json.limite_padrao exista
      setValue("limiteEstoque", json.limite_padrao ?? "padrao");
    }
    loadUserDefaults();
  }, [setValue]);
  */

  const onSubmit = async (data: FormValues) => {
    // Por enquanto: apenas log e feedback visual local.
    console.log("Dados do produto (sem backend):", data);
    alert("O backend ainda não existe, então, dados salvos localmente. ;) ");
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
          ←
        </button>
        <h1>Produtos</h1>
      </div>

      <p className="subtitulo">Adicionar novo produto:</p>

      <form className="product-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Nome"
          id="nome"
          type="text"
          placeholder="Nome do produto"
          wrapperClassName="field"
          inputWrapperClassName="input-wrapper"
          {...register("nome", { required: "Nome do produto é obrigatório" })}
        />
        {errors.nome && <span className="err">{errors.nome.message}</span>}

        <Input
          label="Categoria"
          id="categoria"
          type="text"
          placeholder="Categoria do Produto"
          wrapperClassName="field"
          inputWrapperClassName="input-wrapper"
          {...register("categoria")}
        />

        <Input
          label="Preço"
          id="preco"
          type="text"
          placeholder="99,99"
          wrapperClassName="field"
          inputWrapperClassName="input-wrapper"
          {...register("preco")}
        />

        <Input
          label="Fornecedor"
          id="fornecedor"
          type="text"
          placeholder="Nome do Fornecedor"
          wrapperClassName="field"
          inputWrapperClassName="input-wrapper"
          {...register("fornecedor")}
        />

        <Input
          label="Limite mínimo de estoque"
          id="limiteEstoque"
          type="text"
          placeholder="Padrão"
          wrapperClassName="field"
          inputWrapperClassName="input-wrapper"
          {...register("limiteEstoque")}
        />

        <Input
          label="Tag"
          id="tag"
          type="text"
          placeholder="Tag do Produto"
          wrapperClassName="field field-full"
          inputWrapperClassName="input-wrapper"
          {...register("tag")}
        />

        <div className="form-actions">
          <Button theme="green" type="submit" disabled={isSubmitting}>
            Adicionar produto
          </Button>
        </div>
      </form>
    </div>
  );
}
