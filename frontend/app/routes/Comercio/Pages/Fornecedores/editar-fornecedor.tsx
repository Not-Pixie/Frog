// src/pages/.../Fornecedores/editar-fornecedor.tsx
import "../geral.css";
import { useNavigate, useParams } from "react-router";
import Button from "../../../../../src/components/Button/button.tsx";
import Input from "../../../../../src/components/Input/Input.tsx";
import { FaArrowLeft } from "react-icons/fa";
import api from "../../../../../src/api/axios";
import { COMERCIOS } from "src/api/enpoints.ts";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fornecedorSchema, type FornecedorForm } from "./schemas";
import { useEffect, useState } from "react";
import { handleUpdate } from "../../comercio";

export default function EditarFornecedor() {
  const navigate = useNavigate();
  const { comercioId, fornecedorId } = useParams() as { comercioId?: string; fornecedorId?: string };

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: { nome: "", cnpj: "", telefone: "", email: "", cep: "", numero: "" }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!comercioId || !fornecedorId) return;
    setLoading(true);
    (async () => {
      try {
        const res = await api.get(`${COMERCIOS}/${comercioId}/fornecedores/${fornecedorId}`);
        const f = res.data;
        // preenche form
        setValue("nome", f.nome ?? "");
        setValue("cnpj", f.cnpj ?? "");
        setValue("telefone", f.telefone ?? "");
        setValue("email", f.email ?? "");
        // se endereço vier aninhado (ex.: endereco:{cep, numero}) adapte abaixo
        setValue("cep", f.cep ?? f.endereco?.cep ?? "");
        setValue("numero", f.numero ?? f.endereco?.numero ?? "");
      } catch (err) {
        console.error("Erro ao carregar fornecedor:", err);
        alert("Erro ao carregar fornecedor. Veja console.");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comercioId, fornecedorId]);

  const onSubmit = async (values: FornecedorForm) => {
    if (!comercioId || !fornecedorId) {
      alert("IDs não encontrados.");
      return;
    }
    const payload = {
      nome: values.nome,
      cnpj: values.cnpj,
      telefone: values.telefone || undefined,
      email: values.email || undefined,
      cep: values.cep || undefined,
      numero: values.numero || undefined,
    };

    try {
      const res = await handleUpdate("fornecedores", Number(fornecedorId), Number(comercioId), payload);
      if (res.success) {
        alert("Fornecedor atualizado com sucesso.");
        navigate(`/comercio/${comercioId}/fornecedores`);
      } else {
        alert("Erro ao atualizar fornecedor: " + (res.error ?? "erro desconhecido"));
      }
    } catch (err) {
      console.error("Erro atualizar fornecedor:", err);
      alert("Erro inesperado. Veja console.");
    }
  };

  return (
    <div className="conteudo-item produto-cadastro">
      <div className="page-header">
        <button className="back-link" onClick={() => navigate(-1)} aria-label="Voltar">
          <FaArrowLeft color="#35AC97"/>
        </button>
        <h1>Fornecedores</h1>
      </div>

      <p className="subtitulo">Editar fornecedor:</p>

      <form className="cadastro-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid-item">
          <Input label="Nome" id="nome" type="text" placeholder="Nome do fornecedor" {...register("nome")} />
          {errors.nome && <span className="err">{errors.nome.message}</span>}
        </div>

        <div className="grid-item">
          <Input label="CNPJ" id="cnpj" type="text" placeholder="CNPJ do fornecedor" {...register("cnpj")} />
          {errors.cnpj && <span className="err">{errors.cnpj.message}</span>}
        </div>

        <div className="grid-item">
          <Input label="Telefone" id="telefone" type="text" placeholder="Telefone do fornecedor" {...register("telefone")} />
          {errors.telefone && <span className="err">{errors.telefone.message}</span>}
        </div>

        <div className="grid-item">
          <Input label="Email" id="email" type="email" placeholder="Email do fornecedor" {...register("email")} />
          {errors.email && <span className="err">{errors.email.message}</span>}
        </div>

        <div className="grid-item">
          <Input label="CEP" id="cep" type="text" placeholder="CEP do endereço" {...register("cep")} />
          {errors.cep && <span className="err">{errors.cep.message}</span>}
        </div>

        <div className="grid-item">
          <Input label="Número" id="numero" type="text" placeholder="Número do endereço" {...register("numero")} />
          {errors.numero && <span className="err">{errors.numero.message}</span>}
        </div>

        <div className="form-actions">
          <Button theme="green" type="submit" disabled={isSubmitting || loading}>
            {isSubmitting || loading ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
