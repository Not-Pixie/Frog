// src/components/Input/PopUpComercio.tsx
import React, { useState } from "react";

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

// adicione no topo do arquivo Props:
interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onCreated?: (c: Company) => void;
  authToken?: string; // novo prop opcional
}


/**
 * Pop-up com 2 telas (step flow).
 * - Step 1: Nome (obrigatório) + email (opcional) + botão Next
 * - Step 2: 4 textboxes opcionais (configs) + Back + Create
 *
 * Mantém tamanho fixo controlado pelo CSS externo (role="dialog" > div).
 * A área dos textboxes tem scroll se necessário.
 */
export default function PopupCreateCompany({ isOpen, onClose, onCreated, authToken }: Props) {
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

  const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3001") as string;
  const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT ?? 6000);

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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
      const headers: Record<string,string> = { "Content-Type": "application/json" };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }


    const res = await fetch(`${API_URL}/api/comercios`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (res.status === 409) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.msg ?? "Nome de comércio já existe.");
    }

    if (!res.ok) {
      const txt = await res.text().catch(()=>null);
      throw new Error(txt || `Erro ${res.status}`);
    }

    const data = await res.json();
    // data deve conter comercio_id e nome pelo backend (veja o route)
    onCreated?.({
      id: data.comercio_id ?? data.id ?? "temp-"+Date.now(),
      nome: data.nome ?? nome.trim(),
      ...data,
    });
    // reset & fechar
    resetAll();
    onClose?.();
  } catch (err: any) {
    if (err.name === "AbortError") {
      setError("Tempo de conexão esgotado. Verifique o backend.");
    } else {
      setError(err.message ?? "Erro ao criar comércio.");
    }
    console.error(err);
  } finally {
    clearTimeout(timer);
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

            <label style={{ display: "block", marginTop: 8 }}>
              Email do dono (opcional)
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
