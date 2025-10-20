// src/routes/Comercio/Pages/Fornecedores/novo-fornecedor.tsx
import React from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import Button from "../../../../../src/components/Button/button.tsx";
import Input from "../../../../../src/components/Input/Input.tsx";
import { FaArrowLeft } from "react-icons/fa";
import api from "../../../../../src/api/axios"; // adapte caminho
import { COMERCIOS } from "src/api/enpoints.ts";

type FormValues = {
  nome: string;
  cnpj: string;
  telefone?: string;
  email?: string;
  cep?: string;
  numero?: string;
};

export default function NovoFornecedor() {
  const navigate = useNavigate();
  const { comercioId } = useParams() as { comercioId?: string };

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: { nome: "", cnpj: "", telefone: "", email: "", cep: "", numero: "" }
  });

  async function onSubmit(values: FormValues) {
    if (!comercioId) {
      alert("ID do comércio não encontrado na URL.");
      return;
    }

    // payload esperado pelo backend
    const payload = {
      nome: values.nome,
      cnpj: values.cnpj,
      telefone: values.telefone || undefined,
      email: values.email || undefined,
      cep: values.cep || undefined,
      numero: values.numero || undefined
    };

    try {
      const resp = await api.post(`${COMERCIOS}/${comercioId}/fornecedores`, payload);
      if (resp.status === 201) {
        alert("Fornecedor criado com sucesso.");
        navigate(`/comercio/${comercioId}/fornecedores`);
      } else {
        alert("Erro: " + JSON.stringify(resp.data));
      }
    } catch (err: any) {
      console.error("Erro ao criar fornecedor:", err);
      if (err.response?.data) {
        alert("Erro: " + (err.response.data.msg ?? JSON.stringify(err.response.data)));
      } else {
        alert("Erro ao conectar com o servidor.");
      }
    }
  }

  return (
    <div className="conteudo-item produto-cadastro">
      <div className="page-header">
        <button className="back-link" onClick={() => navigate(-1)} aria-label="Voltar">
          <FaArrowLeft />
        </button>
        <h1>Fornecedores</h1>
      </div>

      <p className="subtitulo">Adicionar fornecedor:</p>

      <form className="product-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid-item">
          <Input label="Nome" id="nome" type="text" placeholder="Nome do fornecedor" {...register("nome", { required: "Nome é obrigatório" })} />
          {errors.nome && <span className="err">{errors.nome.message}</span>}
        </div>

        <div className="grid-item">
          <Input label="CNPJ" id="cnpj" type="text" placeholder="00.000.000/0000-00" {...register("cnpj", { required: "CNPJ é obrigatório" })} />
          {errors.cnpj && <span className="err">{errors.cnpj.message}</span>}
        </div>

        <div className="grid-item">
          <Input label="Telefone" id="telefone" type="text" placeholder="(xx) xxxxx-xxxx" {...register("telefone")} />
        </div>

        <div className="grid-item">
          <Input label="Email" id="email" type="email" placeholder="email@exemplo.com" {...register("email")} />
        </div>

        <div className="grid-item">
          <Input label="CEP" id="cep" type="text" placeholder="00000-000" {...register("cep")} />
        </div>

        <div className="grid-item">
          <Input label="Número" id="numero" type="text" placeholder="123" {...register("numero")} />
        </div>

        <div className="form-actions">
          <Button theme="green" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Adicionar fornecedor"}
          </Button>
        </div>
      </form>
    </div>
  );
}
