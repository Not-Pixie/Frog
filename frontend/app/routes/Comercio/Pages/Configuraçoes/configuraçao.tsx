import "../geral.css";
import "./configuracoes.css"
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import api from "src/api/axios";
import Input from "src/components/Input/Input.tsx";
import Button from "src/components/Button/button.tsx";
import { COMERCIOS, UNIDADES_GLOBAIS } from "src/api/enpoints";
import { useForm } from "react-hook-form";
import CopyTextBox from "./customComponents/CopyTextBox";

type OptionItem = {
  id?: number;
  nome?: string;
  sigla?: string;
  raw?: any;
};

type FormValues = {
  configs: {
    campo1?: string; // unidade
    campo4?: string; // limite
  };
};

export default function Configuracao() {
  const { comercioId } = useParams() as { comercioId?: string };
  const navigate = useNavigate();
  const mountedRef = useRef(false);

  const [unidades, setUnidades] = useState<OptionItem[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // commerce link states
  const [comercioLink, setComercioLink] = useState<string>("");
  const [loadingLink, setLoadingLink] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);

  const {
    register,
    setValue,
    getValues,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { configs: { campo1: "", campo4: "" } },
  });

  // Carrega unidades globais
  useEffect(() => {
    if (!comercioId) return;
    mountedRef.current = true;
    setLoadingUnidades(true);

    (async () => {
      try {
        const resp = await api.get(UNIDADES_GLOBAIS);
        const items: any[] = resp.data?.items ?? resp.data ?? [];
        const mapped = (Array.isArray(items) ? items : [])
          .map((u: any) => ({
            id: Number(u.unimed_id ?? u.id ?? u.pk) || undefined,
            nome: u.nome ? String(u.nome) : undefined,
            sigla: u.sigla ? String(u.sigla) : undefined,
            raw: u,
          }))
          .filter((x: OptionItem) => x.id !== undefined || x.sigla || x.nome);

        if (mountedRef.current) {
          setUnidades(mapped);
          // se ainda não há valor no form, coloca a primeira unidade como default
          const current = getValues("configs.campo1");
          if (
            (!current || String(current).trim() === "") &&
            mapped.length > 0
          ) {
            const first = mapped[0];
            const firstValue = first.id
              ? String(first.id)
              : String(first.sigla ?? first.nome ?? "");
            setValue("configs.campo1", firstValue);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar unidades:", err);
      } finally {
        if (mountedRef.current) setLoadingUnidades(false);
      }
    })();

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comercioId]);

  // Carrega config do comércio e popula o form
  useEffect(() => {
    if (!comercioId) return;
    mountedRef.current = true;
    setLoadingConfig(true);

    (async () => {
      try {
        const resp = await api.get(`${COMERCIOS}/${comercioId}/config`);
        const data = resp.data ?? {};

        const limiteVal = Number(data.limite_padrao ?? 0);
        if (!Number.isNaN(limiteVal)) {
          setValue("configs.campo4", String(limiteVal));
        }

        const candidate = data.unidade_padrao ?? null;

        let candidateNormalized: string | null = null;
        if (candidate && typeof candidate === "object") {
          const asId = candidate.unimed_id ?? candidate.id ?? candidate.pk;
          if (asId) candidateNormalized = String(asId);
          else if (candidate.sigla)
            candidateNormalized = String(candidate.sigla);
          else if (candidate.nome) candidateNormalized = String(candidate.nome);
        } else if (candidate != null) {
          candidateNormalized = String(candidate);
        }

        if (candidateNormalized) {
          // tenta casar com unidades já carregadas (por id / sigla / nome)
          const tryMatch = () => {
            if (unidades.length === 0) {
              // unidades ainda não carregadas — setValue com o raw; a effect de unidades
              // definirá primeiro item caso necessário. Mas guardamos o valor crú.
              setValue("configs.campo1", candidateNormalized as string);
              return;
            }
            const lower = candidateNormalized!.toLowerCase();
            const matchById = unidades.find(
              (u) => u.id && String(u.id) === candidateNormalized
            );
            if (matchById) {
              setValue("configs.campo1", String(matchById.id));
              return;
            }
            const matchBySigla = unidades.find(
              (u) => u.sigla && String(u.sigla).toLowerCase() === lower
            );
            if (matchBySigla) {
              setValue(
                "configs.campo1",
                matchBySigla.id
                  ? String(matchBySigla.id)
                  : String(matchBySigla.sigla ?? "")
              );
              return;
            }
            const matchByNome = unidades.find(
              (u) => u.nome && String(u.nome).toLowerCase() === lower
            );
            if (matchByNome) {
              setValue(
                "configs.campo1",
                matchByNome.id
                  ? String(matchByNome.id)
                  : String(matchByNome.sigla ?? matchByNome.nome ?? "")
              );
              return;
            }
            // se não casou, simplesmente setamos o candidateNormalized (backend pode aceitar sigla)
            setValue("configs.campo1", candidateNormalized as string);
          };

          tryMatch();
        }
      } catch (err) {
        console.error("Erro ao buscar config:", err);
      } finally {
        if (mountedRef.current) setLoadingConfig(false);
      }
    })();

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comercioId, unidades]);

  // Carrega link do comércio
  useEffect(() => {
    if (!comercioId) return;
    let mounted = true;
    setLoadingLink(true);

    (async () => {
      try {
        const res = await api.get(`${COMERCIOS}/${comercioId}/link`);
        const link = res?.data?.link ??  "";
        if (mounted) setComercioLink(link ? `localhost:5173/convite/${link}` : "");
      } catch (err) {
        console.error("Erro ao carregar link do comércio:", err);
      } finally {
        if (mounted) setLoadingLink(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [comercioId]);

  // Gera um novo link para o comércio (POST)
  async function handleGenerateLink() {
    if (!comercioId) {
      alert("ID do comércio não encontrado na URL.");
      return;
    }

    setCreatingLink(true);
    try {
      const res = await api.post(`${COMERCIOS}/${comercioId}/link`);
      const link = res?.data?.link ?? "";
      setComercioLink(link ? `localhost:5173/convite/${link}` : "");
      alert("Link gerado com sucesso.");
    } catch (err: any) {
      console.error("Erro ao gerar link:", err);
      const msg =
        err?.response?.data?.msg ??
        err?.response?.data?.message ??
        err?.message ??
        "Erro ao conectar com o servidor.";
      alert("Erro: " + msg);
    } finally {
      setCreatingLink(false);
    }
  }

  // submit
  async function onSubmit(values: FormValues) {
    if (!comercioId) {
      alert("ID do comércio não encontrado na URL.");
      return;
    }

    setSaving(true);
    try {
      const selected = values.configs?.campo1;
      const limiteRaw = values.configs?.campo4;
      const limiteNum =
        limiteRaw && String(limiteRaw).trim() !== ""
          ? Number(String(limiteRaw).replace(",", "."))
          : null;

      // tenta achar unidade nas unidades carregadas
      const found = unidades.find(
        (u) =>
          String(u.id) === String(selected) ||
          u.sigla === selected ||
          u.nome === selected
      );

      const unidadeParaEnvio = found?.sigla
        ? found.sigla
        : found?.id
          ? String(found.id)
          : selected;

      const payload: any = {
        unidade_padrao: unidadeParaEnvio ?? undefined,
        limite_padrao: limiteNum ?? undefined,
        configs: {
          campo1: unidadeParaEnvio ?? undefined,
          campo4: limiteNum ?? undefined,
          unidade: unidadeParaEnvio ?? undefined,
        },
      };

      // limpa undefineds
      Object.keys(payload).forEach(
        (k) => payload[k] === undefined && delete payload[k]
      );
      if (payload.configs) {
        Object.keys(payload.configs).forEach(
          (k) => payload.configs[k] === undefined && delete payload.configs[k]
        );
        if (Object.keys(payload.configs).length === 0) delete payload.configs;
      }

      const res = await api.patch(`${COMERCIOS}/${comercioId}/config`, payload);
      if (res.status >= 200 && res.status < 300) {
        alert("Configurações salvas com sucesso.");
      } else {
        console.warn("Resposta salvar config inesperada:", res);
        alert("Resposta inesperada do servidor. Veja console.");
      }
    } catch (err: any) {
      console.error("Erro ao salvar config:", err);
      alert("Erro ao salvar configurações. Veja console.");
    } finally {
      setSaving(false);
    }
  }

  // delete
  async function handleDeleteComercio() {
    if (!comercioId) {
      alert("ID do comércio não encontrado na URL.");
      return;
    }

    if (
      !window.confirm(
        "Tem certeza que deseja excluir comércio? Essa ação não pode ser desfeita."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await api.delete(`${COMERCIOS}/${comercioId}`);
      if (res.status >= 200 && res.status < 300) {
        alert("Comércio excluído com sucesso.");
        // redireciona para a lista/dashboard principal
        navigate("/meus-comercios"); // ajuste se sua rota de lista for diferente
      } else {
        console.warn("Resposta inesperada ao deletar:", res);
        alert("Não foi possível excluir o comércio. Veja console.");
      }
    } catch (err: any) {
      console.error("Erro ao excluir comércio:", err);
      const msg =
        err?.response?.data?.msg ??
        err?.response?.data?.message ??
        err?.message ??
        "Erro ao conectar com o servidor.";
      alert("Erro: " + msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="conteudo-item">
      {/* Cabeçalho da página — fora do form */}
      <header className="page-header" role="banner">
        <h1 id="page-title">Configurações</h1>
      </header>

      {/* Formulário principal: salvar configurações */}
      <form
      className=" form-wrapper"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-labelledby="stock-params"
      >
        <section
          id="stock-params-section"
          className="section-config"
          aria-labelledby="stock-params"
          aria-describedby={loadingUnidades ? "unidades-loading" : undefined}
        >
          <h2 id="stock-params" className="header-config">
            Parâmetros de estoque
          </h2>

          <fieldset
            disabled={loadingConfig || saving}
            aria-busy={loadingUnidades || loadingConfig}
            className="cadastro-form mb-medium"
          >
            <div className="grid-item">
              <Input
                label="Unidade de medida padrão"
                id="config-unimed"
                type="select"
                {...register("configs.campo1")}
                disabled={loadingUnidades || loadingConfig}
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

              {loadingUnidades && (
                <small id="unidades-loading" role="status" aria-live="polite">
                  Carregando unidades...
                </small>
              )}
            </div>

            <div className="grid-item">
              <Input
                label="Limite mínimo de estoque padrão"
                id="config-limite"
                type="number"
                placeholder="0"
                {...register("configs.campo4")}
                disabled={loadingConfig}
              />
            </div>
          </fieldset>

          <div
            className="form-actions"
          >
            <Button
              theme="green"
              type="submit"
              disabled={saving || loadingUnidades || loadingConfig || isSubmitting}
              aria-disabled={saving || isSubmitting}
              aria-live="polite"
            >
              {saving ? "Salvando..." : "Salvar configurações"}
            </Button>
          </div>
        </section>
      </form>

      {/* Seção separada para ações do comércio — fora do form de salvar */}
      <section
        id="comercio-options-section"
        className="section-config"
        aria-labelledby="comercio-options"
      >
        <h2 id="comercio-options" className="header-config">
          Opções do comércio
        </h2>

        <div>

              <fieldset
              className="cadastro-form mb-medium"
              disabled={loadingLink || creatingLink || deleting}
              aria-busy={loadingLink || creatingLink}
              aria-live="polite"
              aria-describedby={loadingLink ? "comercio-link-loading" : undefined}
              >
                <Button
                  theme="green"
                  type="button"
                  onClick={handleGenerateLink}
                  disabled={loadingLink || creatingLink}
                  aria-disabled={loadingLink || creatingLink}
                  aria-label="Gerar link para o comércio"
                >
                  {creatingLink ? "Gerando..." : "Gerar link para comércio"}
                </Button>
                {loadingLink && (
                  <small id="comercio-link-loading" role="status" aria-live="polite">Carregando link...</small>
                )}
                <CopyTextBox tooltip="Copiar Link">
                  {comercioLink ?? ""}
                </CopyTextBox>
              </fieldset>

           <Button
             theme="red"
             type="button"
             onClick={handleDeleteComercio}
             disabled={deleting}
             aria-disabled={deleting}
             aria-label="Excluir comércio"
           >
             {deleting ? "Excluindo..." : "Excluir comércio"}
           </Button>
         </div>
       </section>
     </main>
   );
 }
