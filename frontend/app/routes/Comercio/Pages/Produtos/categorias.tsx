// categorias.tsx
import "../geral.css";
import Button from "src/components/Button/button.tsx";
import Table from "src/components/Table/Table.tsx";
import { useCallback, useEffect, useState } from "react";
import CategoriaPopUp from "./CategoriaPopUp"; // ajuste caminho se necessário
import api from "src/api/axios";
import { COMERCIOS } from "src/api/enpoints";
import axios from "axios";
import { useParams, useNavigate } from "react-router";
import { FaArrowLeft } from "react-icons/fa";

interface Category {
  id: string;
  nome: string;
}

export default function Categorias() {
  const { comercioId } = useParams() as { comercioId?: string };
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchCategorias = useCallback(async () => {
    if (!comercioId) return;
    setLoading(true);
    try {
      const res = await api.get(`${COMERCIOS}/${comercioId}/categorias`);
      const items = res.data?.items ?? res.data ?? [];
      const mapped: Category[] = Array.isArray(items)
        ? items.map((it: any) => ({
            id: String(it.id ?? it.categoria_id ?? it._id ?? `cat-${Date.now()}`),
            nome: it.nome ?? it.name ?? "",
          }))
        : [];
      setCategorias(mapped);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao buscar categorias:", err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const body = err.response?.data;
        const message = body?.msg ?? body?.message ?? `Erro ${status ?? ""}`;
        setError(message);
      } else {
        setError(err?.message ?? "Erro ao buscar categorias.");
      }
    } finally {
      setLoading(false);
    }
  }, [comercioId]);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  function handleCreated(c: Category) {
    setCategorias((prev) => {
      if (prev.some((p) => p.id === c.id || p.nome === c.nome)) return prev;
      return [c, ...prev];
    });
  }

async function handleDelete(id: string) {
  if (!comercioId) {
    alert("ID do comércio não encontrado.");
    return;
  }

  const ok = window.confirm("Confirma excluir esta categoria? Esta ação não pode ser desfeita.");
  if (!ok) return;

  try {
    const resp = await api.delete(`${COMERCIOS}/${comercioId}/categorias/${id}`);
    // servidor deve retornar 204; alguns servers retornam 200 com body
    if (resp.status === 204 || resp.status === 200) {
      setCategorias((prev) => prev.filter((c) => c.id !== id));
    } else {
      // trata respostas inesperadas
      const data = resp.data ?? {};
      alert("Erro ao excluir categoria: " + (data.msg ?? JSON.stringify(data)));
    }
  } catch (err: any) {
    console.error("Erro ao deletar categoria:", err);
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const body = err.response?.data;
      if (status === 400) {
        alert("Não foi possível excluir: " + (body?.msg ?? body?.error ?? "Categoria em uso por produtos."));
      } else if (status === 403) {
        alert("Você não tem permissão para excluir esta categoria.");
      } else if (status === 404) {
        alert("Categoria não encontrada.");
        // já remove localmente para sincronizar UI (opcional)
        setCategorias((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert("Erro ao comunicar com o servidor. Veja o console para detalhes.");
      }
    } else {
      alert("Erro inesperado ao excluir categoria.");
    }
  }
}

  return (
    <>
      <div className="conteudo-item produto-header">
        <div className="page-header">
          {/* Botão de voltar com seta — comportamento: volta para a lista de produtos */}
          <button
            className="back-link"
            onClick={() => {
              // opção 1: voltar para a página de produtos explicitamente
              if (comercioId) navigate(`/comercio/${comercioId}/produtos`);
              else navigate(-1);
            }}
            aria-label="Voltar"
          >
            <FaArrowLeft />
          </button>

          <h1>Gerenciar Categorias</h1>
        </div>
      </div>

      <div className="conteudo-item">
        {error && <div className="text-red-600">{error}</div>}

        <Table
          data={categorias}
          keyField="id"
          columns={[
            { key: "id", label: "ID" },
            { key: "nome", label: "Nome" },
          ]}
          rowActions={(row: any) => (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => /* implementar edição */ null}>Editar</button>
              <button onClick={() => handleDelete(row.id)}>Excluir</button>
            </div>
          )}
          actionHeader="Opções"
          emptyMessage={loading ? "Carregando categorias..." : "Nenhuma categoria encontrada"}
        />
      </div>

      <div className="conteudo-item botoes" style={{ marginTop: 12 }}>
        <Button theme="green" onClick={() => setIsOpen(true)}>
          Nova categoria
        </Button>
      </div>

      <CategoriaPopUp
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCreated={(c) => {
          handleCreated(c);
          setIsOpen(false);
        }}
      />
    </>
  );
}
