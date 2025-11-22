// src/comercio.ts
import api from "src/api/axios";

/**
 * Tenta deletar um item no backend e retorna um objeto com resultado.
 * - usa o axios instance (api) para reaproveitar headers/autenticação.
 * - não altera estado global; só retorna sucesso/erro para o caller decidir.
 */
export async function handleDelete(
  itemType: "produtos" | "categorias" | "fornecedores" | "movimentacoes",
  id: number | string,
  comercioId: number | string
): Promise<{ success: boolean; error?: string; cancelled?: boolean }> {
  const nameMap: Record<string, string> = {
    produtos: "produto",
    categorias: "categoria", 
    fornecedores: "fornecedor",
    movimentacoes: "movimentação",
  };
  
  const label = nameMap[itemType] ?? "item";
  const ok = window.confirm(`Excluir ${label}?`);
  if (!ok) return { success: false, cancelled: true };

  try {
    const resp = await api.delete(`/comercios/${comercioId}/${itemType}/${id}`);
    if (resp.status === 204 || resp.status === 200) {
      return { success: true };
    }
    return { success: false, error: resp.data?.error ?? "Resposta inesperada do servidor" };
  } catch (err: any) {
    if (err?.response) {
      const body = err.response.data ?? {};
      const serverMsg = body?.error ?? body?.msg ?? body?.message ?? JSON.stringify(body);
      return { success: false, error: String(serverMsg) };
    }
    return { success: false, error: err?.message ?? "Erro desconhecido ao conectar com o servidor" };
  }
}

export async function handleUpdate(
  itemType: "produtos" | "categorias" | "fornecedores",
  id: number,
  comercioId: number,
  payload: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  const nameMap: Record<string, string> = {
    produtos: "produto",
    categorias: "categoria",
    fornecedores: "fornecedor",
  };

  try {
    const resp = await api.put(`/comercios/${comercioId}/${itemType}/${id}`, payload);
    if (resp.status === 200) {
      return { success: true, data: resp.data };
    }
    return { success: false, error: resp.data?.error ?? "Resposta inesperada do servidor" };
  } catch (err: any) {
    if (err?.response) {
      const body = err.response.data ?? {};
      const serverMsg = body?.error ?? body?.message ?? JSON.stringify(body);
      return { success: false, error: String(serverMsg) };
    }
    return { success: false, error: err?.message ?? "Erro desconhecido ao conectar com o servidor" };
  }
}
