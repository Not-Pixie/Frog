import api from "src/api/axios";

/**
 * Tenta deletar um item no backend e retorna um objeto com resultado.
 * - usa o axios instance (api) para reaproveitar headers/autenticação.
 * - não altera estado global; só retorna sucesso/erro para o caller decidir.
 */
export async function handleDelete(
  itemType: "produtos" | "categorias" | "fornecedores",
  id: number,
  comercioId: number
): Promise<{ success: boolean; error?: string; cancelled?: boolean }> {
  const ok = window.confirm("Excluir produto?");
  if (!ok) return { success: false, cancelled: true };

  try {
    const resp = await api.delete(`/comercios/${comercioId}/${itemType}/${id}`);
    // axios só cai no catch em status >= 300, mas deixamos checagem por segurança
    if (resp.status === 204 || resp.status === 200) {
      return { success: true };
    }
    // caso o backend retorne 200 com payload de erro (improvável), tratar:
    return { success: false, error: resp.data?.error ?? "Resposta inesperada do servidor" };
  } catch (err: any) {
    // axios error handling
    if (err?.response) {
      const body = err.response.data ?? {};
      const serverMsg = body?.error ?? body?.message ?? JSON.stringify(body);
      return { success: false, error: String(serverMsg) };
    }
    // erro de rede ou outro
    return { success: false, error: err?.message ?? "Erro desconhecido ao conectar com o servidor" };
  }
}