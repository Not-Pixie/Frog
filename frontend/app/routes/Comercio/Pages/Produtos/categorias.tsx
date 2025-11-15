// categorias.tsx
import "../geral.css";
import Button from "src/components/Button/button.tsx";
import Table from "src/components/Table/Table.tsx";
import { useCallback, useEffect, useState } from "react";
import CategoriaPopUp from "./CategoriaPopUp";
import api from "src/api/axios";
import { COMERCIOS } from "src/api/enpoints";
import axios from "axios";
import { useParams, useNavigate } from "react-router";
import { FaArrowLeft } from "react-icons/fa";
import type { Categoria } from "src/types/categoria";
import { handleDelete } from "../../comercio";
import CategoriaEditPopUp from "./CategoriaEditPopUp";

export default function Categorias() {
  const { comercioId } = useParams() as { comercioId?: string };
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);

  const handleEditClick = (row: any) => {
    console.log("Editando categoria:", row);
    setEditingCategoria(row);
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditingCategoria(null);
    setIsEditOpen(false);
  };

  const fetchCategorias = useCallback(async () => {
    if (!comercioId) return;
    setLoading(true);
    try {
      const res = await api.get(`${COMERCIOS}/${comercioId}/categorias`);
      const items = res.data?.items ?? res.data ?? [];
      setCategorias(items);
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

  function handleCreated(c: Categoria) {
    setCategorias((prev) => {
      if (prev.some((p) => p.categoria_id === c.categoria_id || p.nome === c.nome)) return prev;
      return [c, ...prev];
    });
  }

  function handleUpdated(c: Categoria) {
    setCategorias((prev) => prev.map((p) => {
      const pid = p.categoria_id ?? (p as any).id;
      const cid = c.categoria_id ?? (c as any).id;
      if (String(pid) === String(cid)) {
        return c;
      }
      return p;
    }));
    handleCloseEdit();
  }

  const onDelete = async (id: number) => {
    if (!comercioId) {
      alert("ID do comércio não encontrado.");
      return;
    }
    setDeletingId(id);
    try {
      const result = await handleDelete("categorias", id, Number(comercioId));
      if (result.success) {
        setCategorias((prev) =>
          prev.filter((c) => {
            const itemId = c.categoria_id ?? (c as any).id;
            return itemId !== id && String(itemId) !== String(id);
          })
        );
      } else if (!result.cancelled) {
        alert(result.error ?? "Erro ao excluir categoria.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="conteudo-item produto-header">
        <div className="page-header">
            <button
            className="back-link"
            onClick={() => {
              if (comercioId) navigate(`/comercio/${comercioId}/produtos`);
              else navigate(-1);
            }}
            aria-label="Voltar"
            >
            <FaArrowLeft style={{ fontSize: 20, color: "#35AC97" }} />
            </button>

          <h1>Gerenciar Categorias</h1>
        </div>
      </div>

      <div className="conteudo-item">
        {error && <div className="text-red-600">{error}</div>}

        <Table
          data={categorias}
          keyField="categoria_id"
          columns={[
            { key: "codigo", label: "Codigo" },
            { key: "nome", label: "Nome" },
          ]}
          rowActions={(row: any) => (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => handleEditClick(row)}
                aria-label={`Editar ${row.categoria_id ?? row.id}`}
                className="btn-edit"
              >
                <i className="fi fi-rr-pencil" style={{ fontSize: 20, color: "#35AC97" }}></i>
              </button>
              <button
                onClick={() => onDelete(Number(row.categoria_id ?? row.id))}
                disabled={deletingId !== null && deletingId === Number(row.categoria_id ?? row.id)}
              >
                <i className="fi fi-rr-trash-xmark" style={{ fontSize: 20, color: "#F45959" }}></i>
              </button>
            </div>
          )}
          actionHeader="Opções"
          emptyMessage={loading ? "Carregando categorias..." : "Nenhuma categoria encontrada"}
        />

        <div className="conteudo-item botoes" style={{ marginTop: 12 }}>
          <Button theme="green" onClick={() => setIsCreateOpen(true)}>
            Nova categoria
          </Button>
        </div>
      </div>

      {/* Popup de Criação */}
      <CategoriaPopUp
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(c) => {
          handleCreated(c);
          setIsCreateOpen(false);
        }}
      />

      {/* Popup de Edição */}
      <CategoriaEditPopUp
        isOpen={isEditOpen}
        categoria={editingCategoria}
        onClose={handleCloseEdit}
        onUpdated={handleUpdated}
      />
    </>
  );
}