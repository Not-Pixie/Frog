// src/pages/entrada.tsx
import React from "react";
import "../geral.css";
import Table from "../../../../../src/components/Table/Table.tsx";
import Button from "../../../../../src/components/Button/button.tsx";
import Input from "../../../../../src/components/Input/Input.tsx";
import api from "../../../../../src/api/axios";
import { COMERCIOS } from "src/api/enpoints";
import type { Produto } from "src/types/produto";
import { useParams, useNavigate } from "react-router";
import { FaArrowLeft } from "react-icons/fa";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { addSchema } from "./schemas.ts"
import { zodResolver } from "@hookform/resolvers/zod";
import type { Cart } from "src/types/carrinho.ts";

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


type AddFormValues = z.infer<typeof addSchema>;

export default function Entradas() {
  const mountedRef = React.useRef(false);
  const { comercioId } = useParams();
  const navigate = useNavigate();

  const [produtos, setProdutos] = React.useState<OptionItem[]>([]);
  const [cart, setCart] = React.useState<Cart | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingOptions, setLoadingOptions] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(addSchema),
    defaultValues: { produto: "", quantidade: 1 },
  });

  React.useEffect(() => {
    mountedRef.current = true;
    if (comercioId) fetchProdutos();
    return () => {
      mountedRef.current = false;
    };
  }, [comercioId]);

  async function fetchProdutos() {
    setLoadingOptions(true);
    setError(null);
    try {
      const resp = await api.get<APIResponse>(`${COMERCIOS}/${comercioId}/produtos`);
      if (resp.status !== 200) throw new Error("Erro ao buscar produtos");

      // suporta array direto ou { items: [...] }
      const arr = Array.isArray(resp.data) ? resp.data : (Array.isArray((resp.data as any)?.items) ? (resp.data as any).items : []);
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
      const url = `${}`;
      const resp = await api.post<Cart>(url);
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

  // adiciona item ao carrinho usando form values
  async function onAdd(values: AddFormValues) {
    setError(null);
    try {
      setLoading(true);
      const produtoId = Number(values.produto);
      if (!produtoId) {
        setError("Selecione um produto.");
        return;
      }
      const qty = Number(values.quantidade);
      if (qty <= 0) {
        setError("Quantidade inválida.");
        return;
      }

      const c = await ensureCart();

      const res = await api.post(`/carrinhos/${c.carrinho_id}/itens`, {
        produto_id: produtoId,
        quantidade: qty,
      });

      if (res.status < 200 || res.status >= 300) {
        throw new Error("Erro ao adicionar item");
      }

      const updatedCart: Cart = res.data;
      setCart(updatedCart);

      // limpa form
      reset({ produto: "", quantidade: 1 });
    } catch (err: any) {
      console.error("addProduto error", err);
      setError(err?.message ?? "Erro ao adicionar produto");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  // salvar entrada -> cria movimentação (payload mínimo)
  async function saveEntry() {
    setError(null);
    if (!cart) {
      setError("Nenhum carrinho ativo para salvar.");
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        tipo: "entrada",
        carrinho_id: cart.carrinho_id,
        comercio_id: Number(comercioId),
        valor_total: cart.valor_total ?? 0,
      };
      const resp = await api.post("/movimentacoes", payload);
      if (resp.status >= 200 && resp.status < 300) {
        // navega para lista de movimentações
        navigate(`/comercio/${comercioId}/movimentacoes`);
      } else {
        throw new Error("Erro ao salvar movimentação");
      }
    } catch (err: any) {
      console.error("saveEntry error", err);
      setError(err?.message ?? "Erro ao salvar entrada");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  // fechar entrada (cancela/deleta o carrinho no backend se existir) e navega
  async function closeEntry() {
    setError(null);
    if (!cart) {
      // só navega
      navigate(`/comercio/${comercioId}/movimentacoes`);
      return;
    }
    setLoading(true);
    try {
      const resp = await api.delete(`/carrinhos/${cart.carrinho_id}`);
      // independente do status, navega (se quiser checar -> resp.status)
      navigate(`/comercio/${comercioId}/movimentacoes`);
    } catch (err: any) {
      console.error("closeEntry error", err);
      // mesmo se falhar, navegamos, mas mostramos erro (opcional)
      setError("Falha ao fechar carrinho no servidor. Verifique o console.");
      navigate(`/comercio/${comercioId}/movimentacoes`);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  // helper: formato seguro para 2 casas decimais (mantém strings originais em produto.raw)
  const safeTwoDecimals = (v: any) => {
    if (v === null || v === undefined) return "0.00";
    const s = String(v).replace(",", ".");
    const n = Number(s);
    if (Number.isNaN(n)) return "0.00";
    return n.toFixed(2);
  };

  const tableData = (cart?.itens ?? []).map((it) => {
    // valor_unitario pode ser string (preco do produto) ou number
    const rawValor = it.valor_unitario ?? it.produto?.preco ?? "0";
    const valorUnitario = Number(String(rawValor).replace(",", "."));
    const quantidade = Number(it.quantidade ?? 0);
    const subtotal = Number.isFinite(valorUnitario) ? valorUnitario * quantidade : Number(it.subtotal ?? 0);
    return {
      item_id: it.item_id,
      nome: it.produto?.nome ?? String(it.produto_id),
      codigo: it.produto?.codigo ?? "",
      valor_unitario: safeTwoDecimals(rawValor),
      quantidade: quantidade,
      subtotal: safeTwoDecimals(subtotal),
    };
  });

  return (
    <div className="conteudo-item produto-cadastro">
      <div className="page-header">
        <button
          className="back-link"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
        >
          <FaArrowLeft style={{ fontSize: 20, color: "#35AC97" }} />
        </button>
        <h1>Entradas</h1>
      </div>

      {error && <div className="err" style={{ marginBottom: 12 }}>{error}</div>}

      <form className="cadastro-form" onSubmit={handleSubmit(onAdd)} noValidate>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 16 }}>
          <Input
            label="Produto"
            type="select"
            id="produto-select"
            placeholder="Selecione um produto"
            {...register("produto")}
            inputWrapperClassName="input-wrapper"
            disabled={loadingOptions}
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
            {...register("quantidade")}
            inputClassName="small-input"
          />

          <div style={{ display: "flex", gap: 8 }}>
            <Button theme="green" type="submit" disabled={isSubmitting || loading || loadingOptions}>
              {loading ? "Carregando..." : "Adicionar"}
            </Button>

            <Button theme="light" type="button" onClick={() => reset({ produto: "", quantidade: 1 })}>
              Limpar
            </Button>
          </div>
        </div>

        {/* mensagens de validação do form */}
        {errors.produto && <div className="err" style={{ marginBottom: 8 }}>{errors.produto.message}</div>}
        {errors.quantidade && <div className="err" style={{ marginBottom: 8 }}>{errors.quantidade.message}</div>}
      </form>

      <div style={{ marginBottom: 12 }}>
        <strong>Carrinho:</strong> {cart ? `#${cart.carrinho_id} — total: R$ ${safeTwoDecimals(cart.valor_total ?? 0)}` : "Nenhum carrinho ativo"}
      </div>

      <Table caption="Itens do carrinho" data={tableData} keyField="item_id" />

      <div className="form-actions" style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <Button theme="green" onClick={saveEntry} disabled={loading || !cart}>
          {loading ? "Salvando..." : "Salvar entrada"}
        </Button>

        <Button theme="light" onClick={closeEntry} disabled={loading}>
          {loading ? "Fechando..." : "Fechar entrada"}
        </Button>
      </div>
    </div>
  );
}
