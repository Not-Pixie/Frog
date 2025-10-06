// src/components/PopUp/PopUpComercio.tsx
import React, { useState } from "react";
import api from "../../../../src/api/axios"; // ajuste se necessário
import axios from "axios";
import Input from "../../../../src/components/Input"; // ajuste o path se necessário
import PopUp from "../../../../src/components/PopUp";
import { COMERCIO } from "src/api/enpoints";


import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { Company, FormValues } from "./schemas"
import { companySchema } from "./schemas";

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onCreated?: (c: Company) => void;
}

export default function PopupCreateCompany({ isOpen, onClose, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resolver = zodResolver(companySchema) as unknown as Resolver<FormValues>;

  const {
    register,
    handleSubmit,
    trigger,
    reset,
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

  if (!isOpen) return null;

  function resetAll() {
    setStep(1);
    setError(null);
    setLoading(false);
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
      },
    };

    try {
      const res = await api.post(COMERCIO, payload);
      const data = res.data;

      onCreated?.({
        id: data.comercio_id ?? data.id ?? `temp-${Date.now()}`,
        nome: data.nome ?? values.nome,
        ...data,
      });

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

  const btnStyle: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
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
            <button
              type="button"
              onClick={handleCancel}
              style={{ ...btnStyle, background: "#f0f0f0", color: "#222" }}
              disabled={loading || isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              style={{ ...btnStyle, background: "rgba(53,172,151,1)", color: "#fff" }}
              disabled={loading || isSubmitting}
            >
              Próximo
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={scrollAreaStyle}>
            {/* Para campos aninhados, use string literal como 'configs.campo1' */}
            <Input
              label="Unidade de medida padrão"
              id="company-campo1"
              type="select"
              {...register("configs.campo1" as const)}
            >
              <option value="un">Unidade(un)</option>
              <option value="kg">Quilograma(kg)</option>
              <option value="g">Grama(g)</option>
              <option value="L">Litro(L)</option>
              <option value="ml">Mililitro(ml)</option>
              <option value="m">Metro(m)</option>
              <option value="cm">Centímetro(cm)</option>
              <option value="mm">Milímetro(mm)</option>
              <option value="cx">Caixa(cx)</option>
              <option value="pct">Pacote(pct)</option>
              <option value="gal">Galão(gal)</option>
              <option value="par">Par(par)</option>
              <option value="dz">Dúzia(dz)</option>
              <option value="sc">Saco(sc)</option>
            </Input>
            {errors.configs?.campo1?.message && (
              <p className="text-red-600 mt-2 text-sm">{String(errors.configs?.campo1?.message)}</p>
            )}

            <Input
              label="Limite mínimo de estoque padrão"
              id="company-campo4"
              type="number"
              placeholder="50"
              {...register("configs.campo4" as const)}
            />
            {errors.configs?.campo4?.message && (
              <p className="text-red-600 mt-2 text-sm">{String(errors.configs?.campo4?.message)}</p>
            )}
          </div>

          {error && <div className="text-red-600 mt-2 text-sm">{error}</div>}

          <div className="modal-actions" style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={handleBack}
              style={{ ...btnStyle, background: "#f0f0f0", color: "#222" }}
              disabled={loading || isSubmitting}
            >
              Voltar
            </button>

            <button
              type="submit"
              style={{ ...btnStyle, background: "rgba(53,172,151,1)", color: "#fff" }}
              disabled={loading || isSubmitting}
            >
              {loading || isSubmitting ? "Criando..." : "Criar"}
            </button>
          </div>
        </form>
      )}
    </PopUp>
  );
}
