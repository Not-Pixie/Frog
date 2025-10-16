// src/routes/Comercio/Pages/Produtos/novo-produto.tsx
import React, { useEffect, useState } from "react";
import "./novo-produto.css";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import Button from "../../../../../src/components/Button/button.tsx";
import Input from "../../../../../src/components/Input/Input.tsx";
import { FaArrowLeft } from "react-icons/fa";
import api from "../../../../../src/api/axios"; // <- caminho corrigido

type FormValues = {
  nome: string;
  categoria: string;
  preco: number | ""; // valueAsNumber
  fornecedor: string;
  limiteEstoque: string; // textbox (editará string, converter antes de enviar)
  tags: string; // UI usa plural; backend recebe payload.tag
};

export default function NovoProduto() {
  const navigate = useNavigate();
  const { comercioId } = useParams() as { comercioId?: string };
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [defaultLimite, setDefaultLimite] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      nome: "",
      categoria: "",
      preco: "",
      fornecedor: "",
      limiteEstoque: "",
      tags: "",
    },
  });

  // tentativa em cadeia para obter limite padrão
  useEffect(() => {
    if (!comercioId) return;
    let mounted = true;
    async function loadLimit() {
      setLoadingDefaults(true);
      try {
        // 1) tenta endpoint dedicado (recomendado)
        try {
          const resp = await api.get(`/api/comercios/${comercioId}/config`);
          if (resp.status === 200 && resp.data) {
            const l = Number(resp.data.limite_padrao ?? resp.data.limitePadrao ?? resp.data.limite ?? 0);
            if (!Number.isNaN(l) && mounted) {
              setDefaultLimite(l);
              setValue("limiteEstoque", String(l));
              return;
            }
          }
        } catch (e) {
          // ignora e tenta fallback
        }

        // 2) fallback: /api/comercio/me (info do comércio do usuário)
        try {
          const resp2 = await api.get(`/api/comercio/me`);
          if (resp2.status === 200 && resp2.data) {
            // tenta campos comuns
            const data = resp2.data;
            const l = Number(data.limite_padrao ?? data.limitePadrao ?? data.limite ?? data.config?.limite_padrao ?? 0);
            if (!Number.isNaN(l) && mounted) {
              setDefaultLimite(l);
              setValue("limiteEstoque", String(l));
              return;
            }
          }
        } catch (e) {
          // ignora e tenta próximo fallback
        }

        // 3) fallback: /api/me/comercios -> procurar comércio por id
        try {
          const resp3 = await api.get(`/api/me/comercios`);
          if (resp3.status === 200 && Array.isArray(resp3.data)) {
            const found = (resp3.data as any[]).find(c => String(c.comercio_id ?? c.id ?? c.comercioId) === String(comercioId));
            if (found) {
              const l = Number(found.limite_padrao ?? found.limitePadrao ?? found.limite ?? found.config?.limite_padrao ?? 0);
              if (!Number.isNaN(l) && mounted) {
                setDefaultLimite(l);
                setValue("limiteEstoque", String(l));
                return;
              }
            }
          }
        } catch (e) {
          // tudo falhou -> usa 0
        }

        // 4) se nada deu certo, mantém 0 e não preenche
        if (mounted) {
          setDefaultLimite(0);
          // se preferir mostrar vazio em vez de 0, comente a linha abaixo
          setValue("limiteEstoque", String(0));
        }
      } finally {
        if (mounted) setLoadingDefaults(false);
      }
    }
    loadLimit();
    return () => { mounted = false; };
  }, [comercioId, setValue]);

  const safeNumberFromInputString = (v: string, fallback: number) => {
    if (v === null || v === undefined || v === "") return fallback;
    const cleaned = String(v).replace(/[^\d\-,.]/g, "").replace(",", ".");
    const n = Number(cleaned);
    return Number.isNaN(n) ? fallback : n;
  };

  async function onSubmit(values: FormValues) {
    if (!comercioId) {
      alert("ID do comércio não encontrado na URL.");
      return;
    }

    const precoNumber = typeof values.preco === "number" ? values.preco : safeNumberFromInputString(String(values.preco), 0);
    const limiteNumber = safeNumberFromInputString(values.limiteEstoque, defaultLimite ?? 0);

    const payload = {
      nome: values.nome,
      preco: precoNumber,
      quantidade_estoque: 0, // padrão inicial
      categoria_id: values.categoria ? Number(values.categoria) : undefined,
      fornecedor_id: values.fornecedor ? Number(values.fornecedor) : undefined,
      unimed_id: undefined,
      limiteEstoque: Number(limiteNumber), // número (não null)
      tag: values.tags || undefined // backend espera 'tag' (singular)
    };

    try {
      // usar endpoint existente: /comercios/:id/produtos
      const resp = await api.post(`/comercios/${comercioId}/produtos`, payload);
      if (resp.status === 201) {
        alert("Produto criado com sucesso.");
        navigate(`/comercio/${comercioId}/produtos`);
      } else {
        const err = resp.data || { error: "Erro desconhecido" };
        alert("Erro: " + (err.error ?? JSON.stringify(err)));
      }
    } catch (err: any) {
      console.error("Erro ao criar produto:", err);
      if (err.response?.data) {
        alert("Erro: " + (err.response.data.error ?? JSON.stringify(err.response.data)));
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
        <h1>Produtos</h1>
      </div>

      <p className="subtitulo">Adicionar novo produto:</p>

      <form className="product-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid-item">
          <Input
            label="Nome"
            id="nome"
            type="text"
            placeholder="Nome do produto"
            inputWrapperClassName="input-wrapper"
            {...register("nome", { required: "Nome do produto é obrigatório" })}
          />
          {errors.nome && <span className="err">{errors.nome.message}</span>}
        </div>

        <div className="grid-item">
          <Input
            label="Categoria"
            id="categoria"
            type="text"
            placeholder="Categoria do Produto"
            inputWrapperClassName="input-wrapper"
            {...register("categoria")}
          />
        </div>

        <div className="grid-item">
          <Input
            label="Preço"
            id="preco"
            type="number"
            placeholder="Preço em reais"
            inputWrapperClassName="input-wrapper"
            {...register("preco", { valueAsNumber: true })}
          />
        </div>

        <div className="grid-item">
          <Input
            label="Fornecedor"
            id="fornecedor"
            type="text"
            placeholder="Nome do Fornecedor"
            inputWrapperClassName="input-wrapper"
            {...register("fornecedor")}
          />
        </div>

        <div className="grid-item">
          <Input
            label={defaultLimite !== null ? `Limite mínimo de estoque` : "Limite mínimo de estoque"}
            id="limiteEstoque"
            type="text"
            placeholder={defaultLimite !== null ? String(defaultLimite) : "Ex: 5"}
            inputWrapperClassName="input-wrapper"
            {...register("limiteEstoque")}
          />
        </div>

        <div className="grid-item field-full">
          <Input
            label="Tags"
            id="tags"
            type="text"
            placeholder="Tags do Produto"
            wrapperClassName="form-field "
            {...register("tags")}
          />
        </div>

        <div className="form-actions">
          <Button theme="green" type="submit" disabled={isSubmitting || loadingDefaults}>
            {isSubmitting ? "Salvando..." : "Adicionar produto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
