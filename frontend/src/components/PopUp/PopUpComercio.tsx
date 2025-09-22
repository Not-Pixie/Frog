import React, { useState } from "react";
import api from "../../api/axios"
import axios from "axios";

export type Company = {
  id?: string | number;
  nome: string;
  email?: string;
  configs?: {
    campo1?: string;
    campo2?: string;
    campo3?: string;
    campo4?: string;
  };
  [k: string]: any;
};

// Props atualizados: removido authToken (autenticação via api/interceptors)
interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onCreated?: (c: Company) => void;
}

/**
 * Pop-up com 2 telas (step flow).
 * - Step 1: Nome (obrigatório) + email (opcional) + botão Next
 * - Step 2: 4 textboxes opcionais (configs) + Back + Create
 */
export default function PopupCreateCompany({ isOpen, onClose, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [campo1, setCampo1] = useState("");
  const [campo2, setCampo2] = useState("");
  const [campo3, setCampo3] = useState("");
  const [campo4, setCampo4] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  function resetAll() {
    setStep(1);
    setNome("");
    setEmail("");
    setCampo1("");
    setCampo2("");
    setCampo3("");
    setCampo4("");
    setError(null);
    setLoading(false);
  }

  function handleCancel() {
    resetAll();
    onClose?.();
  }

  function handleOverlayClick() {
    handleCancel();
  }

  function handleInnerClick(e: React.MouseEvent) {
    e.stopPropagation();
  }

  function handleNext(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!nome.trim()) {
      setError("Nome é obrigatório para continuar.");
      return;
    }
    setStep(2);
  }

  function handleBack() {
    setError(null);
    setStep(1);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError("Nome é obrigatório.");
      setStep(1);
      return;
    }

    setLoading(true);

    const payload = {
      nome: nome.trim(),
      email: email.trim() || undefined,
      configs: {
        campo1: campo1.trim() || undefined,
        campo2: campo2.trim() || undefined,
        campo3: campo3.trim() || undefined,
        campo4: campo4.trim() || undefined,
      },
    };

    try {
      // usa a instância axios (api) com interceptors do seu segundo arquivo
      const res = await api.post("/api/comercios", payload);
      const data = res.data;

      onCreated?.({
        id: data.comercio_id ?? data.id ?? `temp-${Date.now()}`,
        nome: data.nome ?? nome.trim(),
        ...data,
      });

      resetAll();
      onClose?.();
    } catch (err: any) {
      // axios-specific handling
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const body = err.response?.data;

        if (status === 409) {
          // backend pode retornar { msg: '...' } ou outra forma
          setError(body?.msg ?? body?.message ?? "Nome de comércio já existe.");
        } else if (err.code === "ECONNABORTED") {
          setError("Tempo de conexão esgotado. Verifique o backend.");
        } else if (status) {
          // tenta extrair texto/erro
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
  }

  // container da area scrollável (para os 4 textboxes)
  const scrollAreaStyle: React.CSSProperties = {
    maxHeight: 220,
    overflowY: "auto",
    paddingRight: 4,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  };

  // botões estilo mínimo (visual será controlado pelo CSS que você já tem)
  const btnStyle: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
  };

  return (
    <div role="dialog" aria-modal="true" onClick={handleOverlayClick}>
      <div onClick={handleInnerClick}>
        <h3 style={{ margin: 0, marginBottom: 8 }}>{step === 1 ? "Dê um nome para seu comércio!" : "Configure seu comércio"}</h3>

        {step === 1 && (
          <form onSubmit={handleNext}>
            <label style={{ display: "block" }}>
              Nome <span style={{ color: "red" }}>*</span>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoFocus
              />
            </label>

            {error && <div className="modal-error" style={{ marginTop: 8 }}>{error}</div>}

            <div className="modal-actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{ ...btnStyle, background: "#f0f0f0", color: "#222" }}
                disabled={loading}
              >
                Cancelar
              </button>

              <button
                type="submit"
                style={{ ...btnStyle, background: "rgba(53,172,151,1)", color: "#fff" }}
                disabled={loading}
              >
                Próximo
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleCreate}>
            {/* Scroll area para manter o modal do mesmo tamanho */}
            <div style={scrollAreaStyle}>
              <label style={{ display: "block" }}>
                Campo opcional 1
                <input value={campo1} onChange={(e) => setCampo1(e.target.value)} />
              </label>

              <label style={{ display: "block" }}>
                Campo opcional 2
                <input value={campo2} onChange={(e) => setCampo2(e.target.value)} />
              </label>

              <label style={{ display: "block" }}>
                Campo opcional 3
                <input value={campo3} onChange={(e) => setCampo3(e.target.value)} />
              </label>

              <label style={{ display: "block" }}>
                Campo opcional 4
                <input value={campo4} onChange={(e) => setCampo4(e.target.value)} />
              </label>
            </div>

            {error && <div className="modal-error" style={{ marginTop: 8 }}>{error}</div>}

            <div className="modal-actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={handleBack}
                style={{ ...btnStyle, background: "#f0f0f0", color: "#222" }}
                disabled={loading}
              >
                Voltar
              </button>

              <button
                type="submit"
                style={{ ...btnStyle, background: "rgba(53,172,151,1)", color: "#fff" }}
                disabled={loading}
              >
                {loading ? "Criando..." : "Criar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
