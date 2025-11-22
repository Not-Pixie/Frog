// src/pages/entrada.tsx
import React from "react";
import "../geral.css";
import Table from "../../../../../src/components/Table/Table.tsx";
import Button from "../../../../../src/components/Button/button.tsx";
import Input from "../../../../../src/components/Input/Input.tsx";
import api from "../../../../../src/api/axios";
import { COMERCIOS } from "src/api/enpoints";
import type { Produto } from "src/types/produto.ts";
import { useParams, useNavigate } from "react-router";
import { FaArrowLeft } from "react-icons/fa";

type OptionItem = {
  id?: number;
  nome?: string;
  sigla?: string;
  raw?: any;
};

interface APIResponse {
  items: Produto[];
  total: number;
}

type CartItem = {
  item_id: number;
  carrinho_id: number;
  produto_id: number;
  quantidade: number;
  valor_unitario?: number;
  subtotal?: number;
  produto?: Produto;
};

type Cart = {
  carrinho_id: number;
  itens: CartItem[];
  valor_total?: number;
  status?: string;
};

export default function Entradas() {
  const mountedRef = React.useRef(false);
  const { comercioId } = useParams();
  const navigate = useNavigate();

  const [produtos, setProdutos] = React.useState<OptionItem[]>([]);
  const [cart, setCart] = React.useState<Cart | null>(null);
  const [selectedProdutoId, setSelectedProdutoId] = React.useState<number | "">("");
  const [selectedQty, setSelectedQty] = React.useState<number>(1);
  const [loading, setLoading] = React.useState(false);
  const [loadingOptions, setLoadingOptions] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    mountedRef.current = true;
    if (comercioId) fetchProdutos();
    return () => { mountedRef.current = false; };
  }, [comercioId]);

  async function fetchProdutos() {
    setLoadingOptions(true);
    setError(null);
    try {
      const resp = await api.get<APIResponse>(`${COMERCIOS}/${comercioId}/produtos`);
      if (resp.status !== 200) throw new Error("Erro ao buscar produtos");

      // trata formatos: array direto ou { items: [...] }
      const arr = Array.isArray(resp.data) ? resp.data : (Array.isArray(resp.data?.items) ? resp.data.items : []);
      const mapped: OptionItem[] = arr
        .map((p: Produto) => ({
          id: p.produto_id,
          nome: p.nome,
          raw: p,
        }))
        .filter((x: OptionItem) => x.id !== undefined);
      if (mountedRef.current) setProdutos(mapped);
    } catch (e: any) {
      console.error("fetchProdutos error", e);
      if (mountedRef.current) setError("Erro ao carregar produtos. Veja console.");
    } finally {
      if (mountedRef.current) setLoadingOptions(false);
    }
  }

  async function ensureCart(): Promise<Cart> {
    if (cart) return cart;
    setLoading(true);
    try {
      const resp = await api.post<Cart>("/carrinhos", { comercioId });
      if (resp.status < 200 || resp.status >= 300) {
        throw new Error("Não foi possível criar carrinho");
      }
      const newCart = resp.data;
      if (mountedRef.current) setCart(newCart);
      return newCart;
    } catch (err) {
      console.error("ensureCart error", err);
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  async function addProdutoToCart() {
    if (!selectedProdutoId) { setError("Selecione um produto"); return; }
    if (selectedQty <= 0) { setError("Quantidade inválida"); return; }
    setError(null);
    try {
      setLoading(true);
      const c = await ensureCart();
      // use API axios para manter consistência com o app
      const res = await api.post(`/carrinhos/${c.carrinho_id}/itens`, {
        produto_id: selectedProdutoId,
        quantidade: selectedQty
      });
      if (res.status < 200 || res.status >= 300) {
        throw new Error("Erro ao adicionar item");
      }
      const updatedCart: Cart = res.data;
      setCart(updatedCart);
      setSelectedProdutoId("");
      setSelectedQty(1);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao adicionar produto");
    } finally {
      setLoading(false);
    }
  }

  // simplified tableData
  const tableData = (cart?.itens ?? []).map(it => {
    const valorUnitario = Number(it.valor_unitario ?? it.produto?.preco ?? 0);
    const quantidade = Number(it.quantidade ?? 0);
    return {
      item_id: it.item_id,
      nome: it.produto?.nome ?? String(it.produto_id),
      codigo: it.produto?.codigo ?? "",
      valor_unitario: valorUnitario,
      quantidade: quantidade,
      subtotal: it.subtotal ?? (valorUnitario * quantidade),
    };
  });

  return (
    <div className="conteudo-item">
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
        <h1>Entradas</h1>
      </div>

      {error && <div className="err">{error}</div>}

      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 16 }}>
        <Input label="Produto" type="select" id="produto-select" placeholder="Selecione um produto"
          value={selectedProdutoId as any}
          onChange={(e: any) => setSelectedProdutoId(Number(e.target.value) || "")}
        >
          <option value="">Selecione...</option>
          {produtos.map(p => (
            <option key={String(p.id)} value={String(p.id)}>{p.nome}</option>
          ))}
        </Input>

        <Input
          label="Quantidade"
          type="number"
          id="qty-input"
          value={selectedQty}
          onChange={(e: any) => setSelectedQty(Math.max(1, Number(e.target.value) || 1))}
          inputClassName="small-input"
        />

        <Button theme="green" onClick={addProdutoToCart} disabled={loading || !selectedProdutoId}>
          {loading ? "Carregando..." : "Adicionar"}
        </Button>

        <Button theme="light" onClick={() => { setSelectedProdutoId(""); setSelectedQty(1); }}>
          Limpar
        </Button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Carrinho:</strong> {cart ? `#${cart.carrinho_id} — total: R$ ${Number(cart.valor_total ?? 0).toFixed(2)}` : "Nenhum carrinho ativo"}
      </div>

      <Table caption="Itens do carrinho" data={tableData} keyField="item_id" /* ... */ />
    </div>
  );
}
