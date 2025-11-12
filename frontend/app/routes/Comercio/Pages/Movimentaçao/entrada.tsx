// src/pages/entrada.tsx
import React from "react";
import "../geral.css";
import Table from "../../../../../src/components/Table/Table.tsx";
import Button from "../../../../../src/components/Button/button.tsx";
import Input from "../../../../../src/components/Input/Input.tsx";
import api from "../../../../../src/api/axios";
import { COMERCIOS } from "src/api/enpoints";

type OptionItem = {
  id?: number;
  nome?: string;
  sigla?: string;
  raw?: any;
};

type Product = {
  produto_id: number;
  codigo?: number;
  nome: string;
  preco: number;
  quantidade_estoque: number;
};

type CartItem = {
  item_id: number;
  carrinho_id: number;
  produto_id: number;
  quantidade: number;
  valor_unitario?: number;
  subtotal?: number;
  produto?: Product;
};

type Cart = {
  carrinho_id: number;
  itens: CartItem[];
  valor_total?: number;
  status?: string;
};

const COMERCIO_ID: number = (window as any).COMERCIO_ID ?? 1;

export default function Entradas() {
  const mountedRef = React.useRef(false);

  const [produtos, setProdutos] = React.useState<OptionItem[]>([]);
  const [cart, setCart] = React.useState<Cart | null>(null);
  const [selectedProductId, setSelectedProductId] = React.useState<number | "">("");
  const [selectedQty, setSelectedQty] = React.useState<number>(1);
  const [loading, setLoading] = React.useState(false);
  const [loadingOptions, setLoadingOptions] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    mountedRef.current = true;
    if (COMERCIO_ID) fetchProdutos();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProdutos() {
    setLoadingOptions(true);
    setError(null);
    try {
      // usa mesma rota que você usa no NovoProduto
      const resp = await api.get(`${COMERCIOS}/${COMERCIO_ID}/produtos`);
      if (resp.status !== 200) throw new Error("Erro ao buscar produtos");

      // trata formatos: array direto ou { items: [...] }
      const arr = Array.isArray(resp.data) ? resp.data : (Array.isArray(resp.data?.items) ? resp.data.items : []);
      // mapeia para OptionItem mantendo raw
      const mapped: OptionItem[] = arr
        .map((p: any) => ({
          id: Number(p.produto_id ?? p.id ?? p.pk ?? 0) || undefined,
          nome: String(p.nome ?? p.name ?? p.label ?? ""),
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

  // --- resto das funções de carrinho (ensureCart, addProductToCart, updateQuantity, removeItem)
  // você pode copiar as mesmas que já tinha — mantive apenas a interface

  async function ensureCart() {
    if (cart) return cart;
    setLoading(true);
    try {
      const res = await fetch("/api/carrinhos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comercio_id: COMERCIO_ID }),
      });
      if (!res.ok) throw new Error("Não foi possível criar carrinho");
      const newCart: Cart = await res.json();
      setCart(newCart);
      return newCart;
    } finally {
      setLoading(false);
    }
  }

  async function addProductToCart() {
    if (!selectedProductId) { setError("Selecione um produto"); return; }
    if (selectedQty <= 0) { setError("Quantidade inválida"); return; }
    setError(null);
    try {
      setLoading(true);
      const c = await ensureCart();
      const res = await fetch(`/api/carrinhos/${c.carrinho_id}/itens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produto_id: selectedProductId, quantidade: selectedQty }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Erro ao adicionar item");
      }
      const updatedCart: Cart = await res.json();
      setCart(updatedCart);
      setSelectedProductId("");
      setSelectedQty(1);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao adicionar produto");
    } finally {
      setLoading(false);
    }
  }

  // simplified tableData
  const tableData = (cart?.itens ?? []).map(it => ({
    item_id: it.item_id,
    nome: it.produto?.nome ?? String(it.produto_id),
    codigo: it.produto?.codigo ?? "",
    valor_unitario: it.valor_unitario ?? it.produto?.preco ?? 0,
    quantidade: it.quantidade,
    subtotal: it.subtotal ?? ((it.valor_unitario ?? it.produto?.preco ?? 0) * it.quantidade),
  }));

  return (
    <div className="conteudo-item">
      <h1>Entradas</h1>

      {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 16 }}>
        <Input label="Produto" type="select" id="produto-select" placeholder="Selecione um produto"
          value={selectedProductId as any}
          onChange={(e: any) => setSelectedProductId(Number(e.target.value) || "")}
        >
          {/* usa produtos (mesmo padrão do NovoProduto) */}
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

        <Button theme="green" onClick={addProductToCart} disabled={loading || !selectedProductId}>
          {loading ? "Carregando..." : "Adicionar"}
        </Button>

        <Button theme="light" onClick={() => { setSelectedProductId(""); setSelectedQty(1); }}>
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
