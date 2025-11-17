  import "./novo-produto.css";
  import "../geral.css";

  import { useCallback, useEffect, useRef, useState } from "react";
  import { Link, useNavigate, useParams } from "react-router";
  import { useForm } from "react-hook-form";
  import type { Resolver } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { z } from "zod";
  import { FaArrowLeft } from "react-icons/fa";
  import { COMERCIOS } from "src/api/enpoints.ts";

  import Button from "../../../../../src/components/Button/button.tsx";
  import Input from "../../../../../src/components/Input/Input.tsx";
  import api from "../../../../../src/api/axios";

  import schema from "./schema.ts";
  import { handleUpdate } from "../../comercio";

  type FormValues = z.infer<typeof schema>;

  type OptionItem = {
    id?: number;
    nome?: string;
    sigla?: string;
    raw?: any;
  };

  const defaultFormValues: FormValues = {
    nome: "",
    categoria: "",
    preco: "",
    fornecedor: "",
    limiteEstoque: "",
    tags: "",
    unimed: "",
  };

  export default function NovoProduto() {
    const navigate = useNavigate();
    const { comercioId, produtoId } = useParams() as {
      comercioId?: string;
      produtoId?: string;
    };
    const isEdit = Boolean(produtoId);
    const mountedRef = useRef(false);

    const [loadingDefaults, setLoadingDefaults] = useState(false);
    const [defaultLimite, setDefaultLimite] = useState<number>(0);

    const [categorias, setCategorias] = useState<OptionItem[]>([]);
    const [fornecedores, setFornecedores] = useState<OptionItem[]>([]);
    const [unidades, setUnidades] = useState<OptionItem[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [optionsError, setOptionsError] = useState<string | null>(null);
    const [loadingProduct, setLoadingProduct] = useState<boolean>(false);
    const [defaultUnidade, setDefaultUnidade] = useState<string | null>(null);

    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
      setValue,
      getValues, // ADICIONADO
    } = useForm<FormValues>({
      resolver: zodResolver(schema) as Resolver<FormValues>,
      defaultValues: defaultFormValues
    });

    // carrega limite padrão
useEffect(() => {
  if (!comercioId) return;
  mountedRef.current = true;
  async function loadLimitAndConfig() {
    setLoadingDefaults(true);
    try {
      const resp = await api.get(`${COMERCIOS}/${comercioId}/config`);
      if (resp.status === 200 && resp.data) {
        const l = Number(
          resp.data.limite_padrao ??
            resp.data.limitePadrao ??
            resp.data.limite ??
            resp.data.nivel_alerta_minimo ??
            0
        );
        if (!Number.isNaN(l) && mountedRef.current) {
          setDefaultLimite(l);
          setValue("limiteEstoque", String(l));
        }

        // tenta extrair unidade padrão de vários aliases possíveis
        const u =
          resp.data.unidade_padrao ??
          resp.data.unidadePadrao ??
          resp.data.unimed_padrao ??
          resp.data.unimed ??
          resp.data.unimedPadrao ??
          null;

        if (u !== null && mountedRef.current) {
          setDefaultUnidade(String(u));
        }
      }
    } catch (e) {
      if (mountedRef.current) {
        setDefaultLimite(0);
        setDefaultUnidade(null);
      }
    } finally {
      if (mountedRef.current) setLoadingDefaults(false);
    }
  }
  loadLimitAndConfig();
  return () => {
    mountedRef.current = false;
  };
}, [comercioId, setValue]);

// busca categorias, fornecedores e unidades de medida (mantive o pattern Promise.allSettled)
  useEffect(() => {
    if (!comercioId) return;
    mountedRef.current = true;
    setLoadingOptions(true);
    setOptionsError(null);

    async function fetchOptions() {
      try {
        const categoriasEp = `${COMERCIOS}/${comercioId}/categorias`;
        const fornecedoresEp = `${COMERCIOS}/${comercioId}/fornecedores`;
        const unidadesEp = `${COMERCIOS}/${comercioId}/unidades`;

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
              id: Number(u.unidade_medida_id ?? u.unimed_id ?? u.id ?? u.pk ?? 0) || undefined,
              nome: u.nome ? String(u.nome) : undefined,
              sigla: u.sigla ? String(u.sigla) : u.sig ? String(u.sig) : undefined,
              raw: u,
            }))
            .filter(
              (x) =>
                x.id !== undefined ||
                (x.sigla && x.sigla.length > 0) ||
                (x.nome && x.nome.length > 0)
            );

          setUnidades(mappedUnidades);

          if (mountedRef.current && mappedUnidades.length > 0 && !getValues("unimed") && !defaultUnidade) {
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
        setOptionsError("Erro ao carregar categorias/fornecedores/unidades. Veja o console.");
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

  // sincroniza unidade selecionada com a unidade padrão da config (resolve race entre fetchOptions e loadConfig)
  useEffect(() => {
    // só se tivermos unidades carregadas
    if (unidades.length === 0) return;

    // se usuário já escolheu algo (ou estamos em edição que preencheu p.unimed), respeitamos
    if (getValues("unimed")) return;

    // se não veio unidade padrão, já tentamos setar fallback no fetchOptions (primeira)
    if (!defaultUnidade) return;

    // tenta casar por id (string compare)
    const matchById = unidades.find((u) => u.id && String(u.id) === String(defaultUnidade));
    if (matchById) {
      setValue("unimed", String(matchById.id));
      return;
    }

    const defaultLower = String(defaultUnidade).toLowerCase();

    // tenta casar por sigla
    const matchBySigla = unidades.find((u) => u.sigla && String(u.sigla).toLowerCase() === defaultLower);
    if (matchBySigla) {
      const val = matchBySigla.id ? String(matchBySigla.id) : String(matchBySigla.sigla ?? matchBySigla.nome ?? "");
      setValue("unimed", val);
      return;
    }

    // tenta casar por nome completo
    const matchByNome = unidades.find((u) => u.nome && String(u.nome).toLowerCase() === defaultLower);
    if (matchByNome) {
      const val = matchByNome.id ? String(matchByNome.id) : String(matchByNome.sigla ?? matchByNome.nome ?? "");
      setValue("unimed", val);
      return;
    }

    // fallback: primeira unidade disponível (somente se campo ainda vazio)
    if (!getValues("unimed") && unidades.length > 0) {
      const first = unidades[0];
      const firstValue = first.id ? String(first.id) : String(first.sigla ?? first.nome ?? "");
      setValue("unimed", firstValue);
    }
  }, [unidades, defaultUnidade, getValues, setValue]);

    useEffect(() => {
      if (!comercioId || !produtoId) return;
      mountedRef.current = true;
      setLoadingProduct(true);
      (async function loadProduct() {
        try {
          const res = await api.get(
            `${COMERCIOS}/${comercioId}/produtos/${produtoId}`
          );
          const p = res.data;
          // preenche form (casts para string)
          setValue("nome", p.nome ?? "");
          setValue("preco", p.preco ? String(p.preco) : "");
          setValue("tags", p.tags ?? "");
          setValue(
            "limiteEstoque",
            p.limiteEstoque !== undefined ? String(p.limiteEstoque) : ""
          );
          setValue("categoria", p.categoria_id ? String(p.categoria_id) : "");
          setValue("fornecedor", p.fornecedor_id ? String(p.fornecedor_id) : "");
          setValue(
            "unimed",
            p.unimed_id ? String(p.unimed_id) : p.unimed ? String(p.unimed) : ""
          );
        } catch (err) {
          console.error("Erro ao buscar produto:", err);
          alert("Erro ao carregar produto. Veja console.");
          navigate(-1);
        } finally {
          setLoadingProduct(false);
        }
      })();
      return () => {
        mountedRef.current = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [comercioId, produtoId, setValue]);

    // utilitários
    const safeNumberFromInputString = useCallback(
      (v: string | undefined | null, fallback: number) => {
        if (v === null || v === undefined || v === "") return fallback;
        const cleaned = String(v)
          .replace(/[^\d\-,.]/g, "")
          .replace(",", ".");
        const n = Number(cleaned);
        return Number.isNaN(n) ? fallback : n;
      },
      []
    );

    const decimalString = useCallback(
      (v: string | undefined | null): string | null => {
        if (v === null || v === undefined) return null;
        const cleaned = String(v)
          .trim()
          .replace(/[^\d\-,.]/g, "");
        if (cleaned === "") return null;
        const withDot = cleaned.replace(",", ".");
        const m = withDot.match(/-?\d+(\.\d+)?/);
        return m ? m[0] : null;
      },
      []
    );

    const toIntOrUndefined = useCallback(
      (v: string | undefined | null): number | undefined => {
        if (v === undefined || v === null || String(v).trim() === "")
          return undefined;
        const n = parseInt(String(v).trim(), 10);
        return Number.isNaN(n) ? undefined : n;
      },
      []
    );

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
        // quantidade_estoque: 0, // se for criação set, se for edição prefira não incluir
        categoria_id: categoriaId,
        fornecedor_id: fornecedorId,
        unimed_id:
          unimedInt ?? (values.unimed?.trim() ? values.unimed : undefined),
        limiteEstoque: Number(limiteNumber),
        tags: values.tags || undefined,
      };

      // limpa chaves undefined (mantém apenas as que querem enviar)
      Object.keys(payload).forEach(
        (k) => payload[k] === undefined && delete payload[k]
      );

      try {
        if (isEdit && produtoId) {
          // edição — reaproveite handleUpdate se tiver
          const res: any = await (handleUpdate
            ? handleUpdate(
                "produtos",
                Number(produtoId),
                Number(comercioId),
                payload
              )
            : api.put(
                `${COMERCIOS}/${comercioId}/produtos/${produtoId}`,
                payload
              ));

          // suporte a dois tipos de retorno: objeto { success, error } ou AxiosResponse
          if (res && typeof res === "object" && "success" in res) {
            if (res.success === false) {
              alert("Erro ao atualizar: " + (res.error ?? JSON.stringify(res)));
            } else {
              alert("Produto atualizado com sucesso.");
              navigate(`/comercio/${comercioId}/produtos`);
            }
          } else {
            // assume AxiosResponse
            const status = res?.status;
            const data = res?.data;
            if (typeof status === "number" && status >= 200 && status < 300) {
              alert("Produto atualizado com sucesso.");
              navigate(`/comercio/${comercioId}/produtos`);
            } else {
              alert(
                "Erro ao atualizar: " +
                  (data?.error ?? JSON.stringify(data ?? res))
              );
            }
          }
        } else {
          // criação
          const resp = await api.post(
            `/comercios/${comercioId}/produtos`,
            payload
          );
          if (resp.status === 201) {
            alert("Produto criado com sucesso.");
            navigate(`/comercio/${comercioId}/produtos`);
          } else {
            const err = resp.data || { error: "Erro desconhecido" };
            alert("Erro: " + (err.error ?? JSON.stringify(err)));
          }
        }
      } catch (err: any) {
        console.error("Erro ao salvar produto:", err);
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
          <Link to={`/comercio/${comercioId}/produtos`}>
          <button
            className="back-link"
            aria-label="Voltar"
          >
            <FaArrowLeft color="#35AC97" />
          </button>
          </Link>
          <h1>Produtos</h1>
        </div>

        <p className="subtitulo">
          {isEdit ? "Editar produto:" : "Adicionar novo produto:"}
        </p>

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
              {...register("categoria")}
              placeholder=""
            >
              {categorias.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>
                  {c.nome}
                </option>
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
              {...register("fornecedor")}
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
              placeholder="0"
              inputWrapperClassName="input-wrapper"
              {...register("limiteEstoque")}
            />
          </div>

          <div className="grid-item">
            <Input
              label="Unidade de medida"
              id="unimed"
              type="select"
              {...register("unimed", {
                required: "Selecione uma unidade de medida",
              })}
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
              disabled={
                isSubmitting ||
                loadingDefaults ||
                loadingOptions ||
                (isEdit ? loadingProduct : false)
              }
            >
              {isSubmitting
                ? "Salvando..."
                : isEdit
                  ? "Salvar alterações"
                  : "Adicionar produto"}
            </Button>
          </div>
        </form>
      </div>
    );
  }
