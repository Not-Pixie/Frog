// src/pages/comercio/Configuracao.tsx
import "../geral.css";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import api from "src/api/axios";
import Input from "src/components/Input/Input.tsx";
import Button from "src/components/Button/button.tsx";
import { COMERCIOS, UNIDADES_GLOBAIS } from "src/api/enpoints";
import { useForm } from "react-hook-form";

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
          if ((!current || String(current).trim() === "") && mapped.length > 0) {
            const first = mapped[0];
            const firstValue = first.id ? String(first.id) : String(first.sigla ?? first.nome ?? "");
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

        // Extrair limite de vários aliases
        const limiteVal = Number(
          data.limite_padrao ??
            data.limitePadrao ??
            data.limite ??
            data.nivel_alerta_minimo ??
            data.configs?.campo4 ??
            data.config?.campo4 ??
            0
        );
        if (!Number.isNaN(limiteVal)) {
          setValue("configs.campo4", String(limiteVal));
        }

        // Extrair unidade — tenta várias formas
        const candidate =
          data.unidade_padrao ??
          data.unidade ??
          data.configs?.unidade ??
          data.configs?.campo1 ??
          data.config?.campo1 ??
          data.unimed_id ??
          data.unimed ??
          data.unidade_sigla ??
          null;

        // Se veio um objeto (ex: { unimed_id: 5, sigla: 'kg' })
        let candidateNormalized: string | null = null;
        if (candidate && typeof candidate === "object") {
          const asId = candidate.unimed_id ?? candidate.id ?? candidate.pk;
          if (asId) candidateNormalized = String(asId);
          else if (candidate.sigla) candidateNormalized = String(candidate.sigla);
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
            const matchById = unidades.find((u) => u.id && String(u.id) === candidateNormalized);
            if (matchById) {
              setValue("configs.campo1", String(matchById.id));
              return;
            }
            const matchBySigla = unidades.find((u) => u.sigla && String(u.sigla).toLowerCase() === lower);
            if (matchBySigla) {
              setValue("configs.campo1", matchBySigla.id ? String(matchBySigla.id) : String(matchBySigla.sigla ?? ""));
              return;
            }
            const matchByNome = unidades.find((u) => u.nome && String(u.nome).toLowerCase() === lower);
            if (matchByNome) {
              setValue("configs.campo1", matchByNome.id ? String(matchByNome.id) : String(matchByNome.sigla ?? matchByNome.nome ?? ""));
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
      const limiteNum = (limiteRaw && String(limiteRaw).trim() !== "") ? Number(String(limiteRaw).replace(",", ".")) : null;

      // tenta achar unidade nas unidades carregadas
      const found = unidades.find((u) => String(u.id) === String(selected) || u.sigla === selected || u.nome === selected);

      const unidadeParaEnvio = found?.sigla ? found.sigla : (found?.id ? String(found.id) : selected);

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
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      if (payload.configs) {
        Object.keys(payload.configs).forEach((k) => payload.configs[k] === undefined && delete payload.configs[k]);
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

    if (!window.confirm("Tem certeza que deseja excluir comércio? Essa ação não pode ser desfeita.")) {
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
      const msg = err?.response?.data?.msg ?? err?.response?.data?.message ?? err?.message ?? "Erro ao conectar com o servidor.";
      alert("Erro: " + msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="conteudo-item">
      <div className="page-header"><h1>Configurações</h1></div>

      <h2 style={{ marginTop: 30, marginBottom: 8, color: "#35AC97", fontSize: "1.3rem", fontWeight: 600 }}>
        Parâmetros de estoque
      </h2>

      <form className="cadastro-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid-item">
      <Input
      label="Unidade de medida padrão"
      id="config-unimed"
      type="select"
      {...register("configs.campo1")}
      disabled={loadingUnidades || loadingConfig}
      >
      {unidades.map((u) => {
      const value = u.id ? String(u.id) : String(u.sigla ?? u.nome ?? "");
      const label = (u.nome ? `${u.nome}` : u.sigla ? `${u.sigla}` : `#${value}`) + (u.sigla ? ` (${u.sigla})` : "");
      return <option key={value} value={value}>{label}</option>;
      })}
      </Input>
      {loadingUnidades && <small>Carregando unidades...</small>}
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

        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Button
        theme="green"
        type="submit"
        disabled={saving || loadingUnidades || loadingConfig || isSubmitting}
          >
        {saving ? "Salvando..." : "Salvar configurações"}
          </Button>

      <h2 style={{ marginTop: 100, marginBottom: 8, color: "#35AC97", fontSize: "1.3rem", fontWeight: 600 }}>
        Opções do comércio
      </h2>

          <Button
        theme="red"
        type="button"
        onClick={handleDeleteComercio}
        disabled={deleting}
        style={{ marginTop: 8 }} // Add margin to separate the buttons
          >
        {deleting ? "Excluindo..." : "Excluir comércio"}
          </Button>
        </div>
      </form>
    </div>
  );
}
