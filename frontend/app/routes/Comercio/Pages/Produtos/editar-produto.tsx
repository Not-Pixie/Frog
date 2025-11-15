// src/pages/comercio/Produtos/editar-produto.tsx
import "./novo-produto.css";
import "../geral.css"

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { FaArrowLeft } from "react-icons/fa";
import { COMERCIOS } from "src/api/enpoints.ts";

import Button from "src/components/Button/button.tsx";
import Input from "src/components/Input/Input.tsx";
import api from "src/api/axios";
import { handleUpdate } from "../../comercio";

type FormValues = {
  nome: string;
  categoria: string;
  preco: string | "";
  fornecedor: string;
  limiteEstoque: string;
  tags: string;
  unimed: string;
};

type OptionItem = { id?: number; nome?: string; sigla?: string; raw?: any; unimed_id?: number; };

export default function EditarProduto() {
  const navigate = useNavigate();
  const { comercioId, produtoId } = useParams() as { comercioId?: string; produtoId?: string };
  const mountedRef = useRef(false);

  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [defaultLimite, setDefaultLimite] = useState<number>(0);
  const [categorias, setCategorias] = useState<OptionItem[]>([]);
  const [fornecedores, setFornecedores] = useState<OptionItem[]>([]);
  const [unidades, setUnidades] = useState<OptionItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [loadingProduct, setLoadingProduct] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    getValues,
  } = useForm<FormValues>({
    defaultValues: {
      nome: "",
      categoria: "",
      preco: "",
      fornecedor: "",
      limiteEstoque: "",
      tags: "",
      unimed: "",
    },
  });

  // carregar opções (categorias, fornecedores, unidades)
  useEffect(() => {
    if (!comercioId) return;
    mountedRef.current = true;
    setLoadingOptions(true);
    async function fetchOptions() {
      try {
        const [catsResp, fornResp, uniResp] = await Promise.all([
          api.get(`${COMERCIOS}/${comercioId}/categorias`),
          api.get(`${COMERCIOS}/${comercioId}/fornecedores`),
          api.get(`${COMERCIOS}/${comercioId}/unidades`),
        ]);

        const extract = (r: any) => {
          const d = r.data;
          if (Array.isArray(d)) return d;
          if (Array.isArray(d?.items)) return d.items;
          return [];
        };

        const mappedCats = extract(catsResp).map((c: any) => ({
          id: Number(c.categoria_id ?? c.id ?? 0) || undefined,
          nome: String(c.nome ?? c.label ?? c.name ?? ""),
          raw: c,
        })).filter((x:any)=>x.id!==undefined);

        setCategorias(mappedCats);
        if (mountedRef.current && mappedCats.length>0 && !getValues("categoria")) setValue("categoria", String(mappedCats[0].id));

        const mappedForn = extract(fornResp).map((f:any)=>({
          id: Number(f.fornecedor_id ?? f.id ?? 0) || undefined,
          nome: String(f.nome ?? f.name ?? ""),
          raw: f,
        })).filter((x:any)=>x.id!==undefined);
        setFornecedores(mappedForn);
        if (mountedRef.current && mappedForn.length>0 && !getValues("fornecedor")) setValue("fornecedor", String(mappedForn[0].id));

        const mappedUn = extract(uniResp).map((u: any) => {
        const rawId = Number(u.unidade_medida_id ?? u.unimed_id ?? u.id ?? 0) || undefined;
        const rawSigla = u.sigla;
        return {
            // mantenha duas chaves para maior compatibilidade com resto do código
            id: rawId,
            unimed_id: rawId,
            nome: u.nome ? String(u.nome) : undefined,
            sigla: rawSigla !== null ? String(rawSigla) : undefined,
            raw: u,
        };
        }).filter((x: any) => (x.id !== undefined) || (x.sigla) || (x.nome));
        setUnidades(mappedUn);

        setOptionsError(null);
      } catch (e:any) {
        console.error("fetchOptions error", e);
        setOptionsError("Erro ao carregar opções");
      } finally {
        if (mountedRef.current) setLoadingOptions(false);
      }
    }
    fetchOptions();
    return ()=> { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comercioId]);

  // carregar produto
  useEffect(() => {
    if (!comercioId || !produtoId) return;
    setLoadingProduct(true);
    (async function loadProduct() {
      try {
        const res = await api.get(`${COMERCIOS}/${comercioId}/produtos/${produtoId}`);
        const p = res.data;
        // preenche form (faça casts para string)
        setValue("nome", p.nome ?? "");
        setValue("preco", p.preco ? String(p.preco) : "");
        setValue("tags", p.tags ?? "");
        setValue("limiteEstoque", p.limiteEstoque !== undefined ? String(p.limiteEstoque) : "");
        // campos que podem ser null
        setValue("categoria", p.categoria_id ? String(p.categoria_id) : "");
        setValue("fornecedor", p.fornecedor_id ? String(p.fornecedor_id) : "");
        setValue("unimed", p.unimed_id ? String(p.unimed_id) : (p.unimed ? String(p.unimed) : ""));
      } catch (err) {
        console.error("Erro ao buscar produto:", err);
        alert("Erro ao carregar produto. Veja console.");
        navigate(-1);
      } finally {
        setLoadingProduct(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comercioId, produtoId]);

  // helpers (pode copiar os mesmos do novo-produto)
  const safeNumberFromInputString = (v: string, fallback: number) => {
    if (v === null || v === undefined || v === "") return fallback;
    const cleaned = String(v).replace(/[^\d\-,.]/g, "").replace(",", ".");
    const n = Number(cleaned);
    return Number.isNaN(n) ? fallback : n;
  };

  const decimalString = (v: string | undefined | null): string | null => {
    if (v === null || v === undefined) return null;
    const cleaned = String(v).trim().replace(/[^\d\-,.]/g, "");
    if (cleaned === "") return null;
    const withDot = cleaned.replace(",", ".");
    const m = withDot.match(/-?\d+(\.\d+)?/);
    return m ? m[0] : null;
  };

  const toIntOrUndefined = (v: string | undefined | null): number | undefined => {
    if (v === undefined || v === null || String(v).trim() === "") return undefined;
    const n = parseInt(String(v).trim(), 10);
    return Number.isNaN(n) ? undefined : n;
  };

  async function onSubmit(values: FormValues) {
    if (!comercioId || !produtoId) {
      alert("ID do comércio/produto não encontrado.");
      return;
    }

    const precoNumber = decimalString(values.preco) ?? "0";
    const limiteNumber = safeNumberFromInputString(values.limiteEstoque, defaultLimite ?? 0);
    const unimedInt = toIntOrUndefined(values.unimed);
    const categoriaId = toIntOrUndefined(values.categoria);
    const fornecedorId = toIntOrUndefined(values.fornecedor);

    const payload: any = {
      nome: values.nome,
      preco: precoNumber,
      quantidade_estoque: undefined, // não alteramos aqui se não enviado; você pode incluir se quiser
      categoria_id: categoriaId ?? NoneIfEmpty(values.categoria),
      fornecedor_id: fornecedorId ?? NoneIfEmpty(values.fornecedor),
      unimed_id: unimedInt ?? (values.unimed?.trim() ? values.unimed : undefined),
      limiteEstoque: Number(limiteNumber),
      tags: values.tags || undefined,
    };

    // remove undefined keys (so the backend only receives sent fields)
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    try {
      const res = await handleUpdate("produtos", Number(produtoId), Number(comercioId), payload);
      if (res.success) {
        alert("Produto atualizado com sucesso.");
        navigate(`/comercio/${comercioId}/produtos`);
      } else {
        alert("Erro ao atualizar: " + (res.error ?? "Erro desconhecido"));
      }
    } catch (err) {
      console.error("Erro no update:", err);
      alert("Erro inesperado. Veja console.");
    }
  }

  function NoneIfEmpty(v?: string | null) {
    if (v === undefined || v === null) return undefined;
    if (String(v).trim() === "") return NoneIfEmpty(null); // becomes undefined
    return undefined; // by default, we let toIntOrUndefined set value. kept to be explicit.
  }

  return (
    <div className="conteudo-item produto-cadastro">
      <div className="page-header">
        <button
          className="back-link"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
        >
          <FaArrowLeft color="#35AC97"/>
        </button>
        <h1>Produtos</h1>
      </div>

      <p className="subtitulo">Editar produto:</p>

      <form
        className="cadastro-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {/* --- os mesmos campos do novo-produto, usando register e mostrando errors --- */}
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

        {/* categoria */}
        <div className="grid-item">
          <Input
            label="Categoria"
            id="categoria"
            type="select"
            {...register("categoria")}
          >
            {categorias.map((c) => (
              <option key={String(c.id)} value={String(c.id)}>{c.nome}</option>
            ))}
          </Input>
        </div>

        {/* preço */}
        <div className="grid-item">
          <Input
            label="Preço"
            id="preco"
            type="text"
            inputMode="decimal"
            placeholder="Preço em reais"
            inputWrapperClassName="input-wrapper"
            {...register("preco")}
          />
        </div>

        {/* fornecedor */}
        <div className="grid-item">
          <Input
            label="Fornecedor"
            id="fornecedor"
            type="select"
            {...register("fornecedor")}
          >
            {fornecedores.map((f) => (
              <option key={String(f.id)} value={String(f.id)}>
                {f.nome}
              </option>
            ))}
          </Input>
        </div>

        {/* limite */}
        <div className="grid-item">
          <Input
            label="Limite mínimo de estoque"
            id="limiteEstoque"
            type="text"
            placeholder={defaultLimite ? String(defaultLimite) : "0"}
            inputWrapperClassName="input-wrapper"
            {...register("limiteEstoque")}
          />
        </div>

        {/* unimed */}
        <div className="grid-item">
          <Input
            label="Unidade de medida"
            id="unimed"
            type="select"
            {...register("unimed", { required: "Selecione uma unidade de medida" })}
          >
            {unidades.map((u) => {
            const id = u.unimed_id ?? u.id;
            const sigla = u.sigla;
            const value = id ? String(id) : String(sigla ?? u.nome ?? "");
            const label = (u.nome ? `${u.nome}` : sigla ? `${sigla}` : `#${value}`) + (sigla ? ` (${sigla})` : "");
            return (
                <option key={value} value={value}>
                {label}
                </option>
            );
            })}
          </Input>
          {errors.unimed && <span className="err">{errors.unimed.message}</span>}
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

        {optionsError && <div className="err" style={{ marginBottom: 8 }}>{optionsError}</div>}

        <div className="form-actions">
          <Button theme="green" type="submit" disabled={isSubmitting || loadingOptions || loadingProduct}>
            {isSubmitting ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
