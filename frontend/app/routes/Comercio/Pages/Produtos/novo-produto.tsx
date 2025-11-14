import "./novo-produto.css";
import "../geral.css"

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { FaArrowLeft } from "react-icons/fa";
import { COMERCIOS } from "src/api/enpoints.ts";

import Button from "../../../../../src/components/Button/button.tsx";
import Input from "../../../../../src/components/Input/Input.tsx";
import api from "../../../../../src/api/axios";

type FormValues = {
  nome: string;
  categoria: string; // id em string (valor do select)
  preco: string | "";
  fornecedor: string; // id em string
  limiteEstoque: string;
  tags: string;
  unimed: string; // id ou sigla em string
};

type OptionItem = {
  id?: number;
  nome?: string;
  sigla?: string;
  raw?: any;
};

export default function NovoProduto() {
  const navigate = useNavigate();
  const { comercioId } = useParams() as { comercioId?: string };
  const mountedRef = useRef(false);

  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [defaultLimite, setDefaultLimite] = useState<number>(0);

  const [categorias, setCategorias] = useState<OptionItem[]>([]);
  const [fornecedores, setFornecedores] = useState<OptionItem[]>([]);
  const [unidades, setUnidades] = useState<OptionItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    getValues, // ADICIONADO
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

  // carrega limite padrão
  useEffect(() => {
    if (!comercioId) return;
    mountedRef.current = true;
    async function loadLimit() {
      setLoadingDefaults(true);
      try {
        const resp = await api.get(`${COMERCIOS}/${comercioId}/config`);
        if (resp.status === 200 && resp.data) {
          const l = Number(
            resp.data.limite_padrao ??
              resp.data.limitePadrao ??
              resp.data.limite ??
              0
          );
          if (!Number.isNaN(l) && mountedRef.current) {
            setDefaultLimite(l);
            setValue("limiteEstoque", String(l));
          }
        }
      } catch (e) {
        if (mountedRef.current) {
          setDefaultLimite(0);
        }
      } finally {
        if (mountedRef.current) setLoadingDefaults(false);
      }
    }
    loadLimit();
    return () => {
      mountedRef.current = false;
    };
  }, [comercioId, setValue]);

  // busca categorias, fornecedores e unidades de medida
  useEffect(() => {
    if (!comercioId) return;
    mountedRef.current = true;
    setLoadingOptions(true);
    setOptionsError(null);

    async function fetchOptions() {
      try {
        const categoriasEp = `${COMERCIOS}/${comercioId}/categorias`;
        const fornecedoresEp = `${COMERCIOS}/${comercioId}/fornecedores`;
        const unidadesEp = `${COMERCIOS}/${comercioId}/unidades`; // ajuste se seu endpoint for outro (ex: /unidades)

        const results = await Promise.allSettled([
          api.get(categoriasEp),
          api.get(fornecedoresEp),
          api.get(unidadesEp),
        ]);

        const catsResp = results[0];
        const fornResp = results[1];
        const uniResp = results[2];

        const extractArray = (res: any): any[] => {
          if (!res) return [];
          const d = res.data;
          if (Array.isArray(d)) return d;
          if (Array.isArray(d?.items)) return d.items;
          return [];
        };

        // --- CATEGORIAS ---
        if (catsResp.status === "fulfilled") {
          const arr: any[] = extractArray(catsResp.value);
          const mappedCats = arr
            .map((c: any) => ({
              id: Number(c.categoria_id ?? c.id ?? c.pk ?? 0) || undefined,
              nome: String(c.nome ?? c.name ?? c.label ?? ""),
              raw: c,
            }))
            .filter((x) => x.id !== undefined);

          setCategorias(mappedCats);

          // se usuário ainda não escolheu, preenche com a primeira opção válida
          if (mountedRef.current && mappedCats.length > 0 && !getValues("categoria")) {
            setValue("categoria", String(mappedCats[0].id));
          }
        } else {
          console.debug("Categorias fetch failed:", (catsResp as any).reason);
        }

        // --- FORNECEDORES ---
        if (fornResp.status === "fulfilled") {
          const arr: any[] = extractArray(fornResp.value);
          const mappedForn = arr
            .map((f: any) => ({
              id: Number(f.fornecedor_id ?? f.id ?? f.pk ?? 0) || undefined,
              nome: String(f.nome ?? f.name ?? ""),
              raw: f,
            }))
            .filter((x) => x.id !== undefined);

          setFornecedores(mappedForn);

          if (mountedRef.current && mappedForn.length > 0 && !getValues("fornecedor")) {
            setValue("fornecedor", String(mappedForn[0].id));
          }
        } else {
          console.debug("Fornecedores fetch failed:", (fornResp as any).reason);
        }

        // --- UNIDADES ---
        if (uniResp.status === "fulfilled") {
          const arr: any[] = extractArray(uniResp.value);
          const mappedUnidades = arr
            .map((u: any) => ({
              id:
                Number(
                  u.unidade_medida_id ?? u.unimed_id ?? u.id ?? u.pk ?? 0
                ) || undefined,
              nome: u.nome ? String(u.nome) : undefined,
              sigla: u.sigla
                ? String(u.sigla)
                : u.sig
                  ? String(u.sig)
                  : undefined,
              raw: u,
            }))
            // permite unidades que tenham id ou uma sigla/nome
            .filter(
              (x) =>
                x.id !== undefined ||
                (x.sigla && x.sigla.length > 0) ||
                (x.nome && x.nome.length > 0)
            );

          setUnidades(mappedUnidades);

          // calculamos o value da primeira opção (pode ser id ou sigla/nome)
          if (mountedRef.current && mappedUnidades.length > 0 && !getValues("unimed")) {
            const first = mappedUnidades[0];
            const firstValue = first.id ? String(first.id) : String(first.sigla ?? first.nome ?? "");
            setValue("unimed", firstValue);
          }
        } else {
          console.debug("Unidades fetch failed:", (uniResp as any).reason);
        }

        setOptionsError(null);
      } catch (e: any) {
        console.error("fetchOptions error", e);
        setOptionsError(
          "Erro ao carregar categorias/fornecedores/unidades. Veja o console."
        );
      } finally {
        if (mountedRef.current) setLoadingOptions(false);
      }
    }

    fetchOptions();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comercioId]);

  // utilitários
  const safeNumberFromInputString = (v: string, fallback: number) => {
    if (v === null || v === undefined || v === "") return fallback;
    const cleaned = String(v)
      .replace(/[^\d\-,.]/g, "")
      .replace(",", ".");
    const n = Number(cleaned);
    return Number.isNaN(n) ? fallback : n;
  };

  const decimalString = (v: string | undefined | null): string | null => {
    if (v === null || v === undefined) return null;
    const cleaned = String(v)
      .trim()
      .replace(/[^\d\-,.]/g, "");
    if (cleaned === "") return null;
    const withDot = cleaned.replace(",", ".");
    const m = withDot.match(/-?\d+(\.\d+)?/);
    return m ? m[0] : null;
  };

  const toIntOrUndefined = (
    v: string | undefined | null
  ): number | undefined => {
    if (v === undefined || v === null || String(v).trim() === "")
      return undefined;
    const n = parseInt(String(v).trim(), 10);
    return Number.isNaN(n) ? undefined : n;
  };

  async function onSubmit(values: FormValues) {
    if (!comercioId) {
      alert("ID do comércio não encontrado na URL.");
      return;
    }

    const precoNumber = decimalString(values.preco) ?? "0";
    const limiteNumber = safeNumberFromInputString(
      values.limiteEstoque,
      defaultLimite ?? 0
    );

   const unimedInt = toIntOrUndefined(values.unimed);
    const categoriaId = toIntOrUndefined(values.categoria);
    const fornecedorId = toIntOrUndefined(values.fornecedor);

    const payload: any = {
      nome: values.nome,
      preco: precoNumber,
      quantidade_estoque: 0,
      categoria_id: categoriaId,
      fornecedor_id: fornecedorId,
      unimed_id: unimedInt ?? (values.unimed?.trim() ? values.unimed : undefined),
      limiteEstoque: Number(limiteNumber),
      tags: values.tags || undefined,
    };

    try {
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
        alert(
          "Erro: " +
            (err.response.data.error ?? JSON.stringify(err.response.data))
        );
      } else {
        alert("Erro ao conectar com o servidor.");
      }
    }
  }

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

      <form
        className="cadastro-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
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
            type="select"
            {...register("categoria", { required: "Selecione uma categoria" })}
            placeholder=""
          >
            {categorias.map((c) => (
              <option key={String(c.id)} value={String(c.id)}>{c.nome}</option>
            ))}
          </Input>
          {errors.categoria && (
            <span className="err">{errors.categoria.message}</span>
          )}
        </div>

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

        <div className="grid-item">
          <Input
            label="Fornecedor"
            id="fornecedor"
            type="select"
            {...register("fornecedor", { required: "Selecione um fornecedor" })}
          >
            {fornecedores.map((f) => (
              <option key={String(f.id)} value={String(f.id)}>
                {f.nome}
              </option>
            ))}
          </Input>
          {errors.fornecedor && (
            <span className="err">{errors.fornecedor.message}</span>
          )}
        </div>

        <div className="grid-item">
          <Input
            label={
              defaultLimite !== null
                ? `Limite mínimo de estoque`
                : "Limite mínimo de estoque"
            }
            id="limiteEstoque"
            type="text"
            placeholder={
              defaultLimite !== null ? String(defaultLimite) : "Ex: 5"
            }
            inputWrapperClassName="input-wrapper"
            {...register("limiteEstoque")}
          />
        </div>

        <div className="grid-item">
          <Input
            label="Unidade de medida"
            id="unimed"
            type="select"
            {...register("unimed", { required: "Selecione uma unidade de medida" })}
          >
            {unidades.map((u) => {
              const value = u.id
                ? String(u.id)
                : String(u.sigla ?? u.nome ?? "");
              const label =
                (u.nome ? `${u.nome}` : u.sigla ? `${u.sigla}` : `#${value}`) +
                (u.sigla ? ` (${u.sigla})` : "");
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </Input>
          {errors.unimed && (
            <span className="err">{errors.unimed.message}</span>
          )}
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

        {optionsError && (
          <div className="err" style={{ marginBottom: 8 }}>
            {optionsError}
          </div>
        )}

        <div className="form-actions">
          <Button
            theme="green"
            type="submit"
            disabled={isSubmitting || loadingDefaults || loadingOptions}
          >
            {isSubmitting ? "Salvando..." : "Adicionar produto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
