// src/components/PopUp/PopUpComercio.tsx
import React, { useState, useEffect, useRef } from "react";
import api from "../../../../src/api/axios"; // ajuste se necessário
import axios from "axios";
import Input from "../../../../src/components/Input"; 
import PopUp from "../../../../src/components/PopUp";
import { COMERCIOS, UNIDADES_GLOBAIS } from "src/api/enpoints";

import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { Company, FormValues } from "./schemas"
import { companySchema } from "./schemas";
import Button from "src/components/Button";
import { useAuth } from "src/api/auth/AuthProvider";

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onCreated?: (c: Company) => void;
}

type OptionItem = {
  id?: number;
  nome?: string;
  sigla?: string;
  raw?: any;
};

export default function PopupCreateCompany({ isOpen, onClose, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unidades, setUnidades] = useState<OptionItem[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const mountedRef = useRef(false);
  const { checkAuth } = useAuth();

  const resolver = zodResolver(companySchema) as unknown as Resolver<FormValues>;

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver,
    defaultValues: {
      nome: "",
      configs: {
        campo1: undefined,
        campo4: undefined,
      },
    },
  });

  // Carrega unidades de medida quando o popup abre
useEffect(() => {
  if (!isOpen) return;

  mountedRef.current = true;
  setLoadingUnidades(true);

  async function fetchUnidades() {
    try {
      const response = await api.get(UNIDADES_GLOBAIS);

      const items = response.data?.items || [];

      const mappedUnidades = items
        .map((u: any) => ({
          id: Number(u.unimed_id || u.id) || undefined,
          nome: u.nome ? String(u.nome) : undefined,
          sigla: u.sigla ? String(u.sigla) : undefined,
          raw: u,
        }))
        .filter((x: { id?: number; nome?: string; sigla?: string; raw: any }) => x.id !== undefined && (x.sigla || x.nome));
      if (mountedRef.current) {
        setUnidades(mappedUnidades);

        if (mappedUnidades.length > 0 && !getValues("configs.campo1")) {
          const first = mappedUnidades[0];
          const firstValue = String(first.id);
          setValue("configs.campo1", firstValue);
        }
      }
    } catch (error: any) {
      console.error("Erro ao carregar unidades globais:", error);
    } finally {
      if (mountedRef.current) setLoadingUnidades(false);
    }
  }

  fetchUnidades();

  return () => {
    mountedRef.current = false;
  };
}, [isOpen, setValue, getValues]);

  if (!isOpen) return null;

  function resetAll() {
    setStep(1);
    setError(null);
    setLoading(false);
    setUnidades([]);
    reset();
  }

  function handleCancel() {
    resetAll();
    onClose?.();
  }

  // valida apenas o campo 'nome' antes de avançar
  async function handleNext(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);

    const ok = await trigger("nome");
    if (!ok) return;
    setStep(2);
  }

  function handleBack() {
    setError(null);
    setStep(1);
  }

  // ====== onSubmit tipado corretamente para evitar incompatibilidade ======
  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setError(null);

    if (!values.nome || !values.nome.trim()) {
      setError("Nome é obrigatório.");
      setStep(1);
      return;
    }

    setLoading(true);

    const payload = {
      nome: values.nome,
      configs: {
        campo1: values.configs?.campo1,
        campo4: values.configs?.campo4,
        unidade: (() => {
          try {
            const sel = values.configs?.campo1;
            if (!sel) return undefined;
            const found = unidades.find((u) => String(u.id) === String(sel) || u.sigla === sel || u.nome === sel);
            return found?.sigla ?? undefined;
          } catch (e) {
            return undefined;
          }
        })(),
      },
    };

    try {
      const res = await api.post(COMERCIOS, payload);
      const data = res.data;

      onCreated?.({
        id: data.comercio_id ?? data.id ?? `temp-${Date.now()}`,
        nome: data.nome ?? values.nome,
        ...data,
      });

      await checkAuth();

      resetAll();
      onClose?.();
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const body = err.response?.data;

        if (status === 409) {
          setError(body?.msg ?? body?.message ?? "Nome de comércio já existe.");
        } else if (err.code === "ECONNABORTED") {
          setError("Tempo de conexão esgotado. Verifique o backend.");
        } else if (status) {
          setError(body?.msg ?? body?.message ?? `Erro ${status}`);
        } else {
          setError(err.message ?? "Erro ao criar comércio.");
        }
      } else {
        setError(err?.message ?? "Erro ao criar comércio.");
      }

      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // estilos (inline para manter compatibilidade)
  const scrollAreaStyle: React.CSSProperties = {
    maxHeight: 220,
    overflowY: "auto",
    paddingRight: 4,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  };

  return (
    <PopUp
      isOpen={isOpen}
      onClose={handleCancel}
      ariaLabel="Criar comércio"
      containerClassName="popup-container"
      className="popup-content"
      showCloseButton={false}
    >
      <h3 style={{ margin: 0, marginBottom: 8 }}>
        {step === 1 ? "Dê um nome para seu comércio!" : "Configure seu comércio"}
      </h3>

      {step === 1 && (
        <form onSubmit={handleNext}>
          <Input
            label={`Nome`}
            id="company-nome"
            type="text"
            placeholder="Nome do comércio"
            {...register("nome")}
          />
          {errors.nome?.message && (
            <p className="text-red-600 mt-2 text-sm">{String(errors.nome.message)}</p>
          )}

          {error && <div className="text-red-600 mt-2 text-sm">{error}</div>}

          <div className="modal-actions" style={{ marginTop: 12 }}>
            <Button
              type="button"
              onClick={handleCancel}
              theme="light"
              disabled={loading || isSubmitting}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              theme="green"
              disabled={loading || isSubmitting}
            >
              Próximo
            </Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={scrollAreaStyle}>
            <Input
              label="Unidade de medida padrão"
              id="company-campo1"
              type="select"
              {...register("configs.campo1" as const)}
              disabled={loadingUnidades}
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
            {loadingUnidades && <span>Carregando unidades...</span>}
            {errors.configs?.campo1?.message && (
              <p className="text-red-600 mt-2 text-sm">{String(errors.configs?.campo1?.message)}</p>
            )}

            <Input
              label="Limite mínimo de estoque padrão"
              id="company-campo4"
              type="number"
              placeholder="0"
              {...register("configs.campo4" as const)}
            />
            {errors.configs?.campo4?.message && (
              <p className="text-red-600 mt-2 text-sm">{String(errors.configs?.campo4?.message)}</p>
            )}
          </div>

          {error && <div className="text-red-600 mt-2 text-sm">{error}</div>}

          <div className="modal-actions" style={{ marginTop: 12 }}>
            <Button
              type="button"
              onClick={handleBack}
              theme="light"
              disabled={loading || isSubmitting}
            >
              Voltar
            </Button>

            <Button
              type="submit"
              theme="green"
              disabled={loading || isSubmitting || loadingUnidades}
            >
              {loading || isSubmitting ? "Criando..." : "Criar"}
            </Button>
          </div>
        </form>
      )}
    </PopUp>
  );
}