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

type CarrinhoItem = {
item_id: number;
carrinho_id: number;
produto_id: number;
nome_produto?: string; 
imagem: string | null; 
preco_unitario?: string; 
quantidade: number; 
desconto_percentual?: string; 
subtotal?: string;
produto?: Produto | null;
comercio_id?: number;
criado_em?: string;
}


type Carrinho = {
carrinho_id: number;
criado_em?: string; 
atualizado_em?: string; 
comercio_id?: number;
itens: CarrinhoItem[];
valor_total: string;
}

type AddFormValues = z.infer<typeof addSchema>;

export default function Entradas() {
  const mountedRef = React.useRef(false);
  const { comercioId, link } = useParams();
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

  // fetch produtos
  const fetchProdutos = React.useCallback(async () => {
    setLoadingOptions(true);
    setError(null);
    try {
      const resp = await api.get<APIResponse>(`${COMERCIOS}/${comercioId}/produtos`);
      if (resp.status !== 200) throw new Error("Erro ao buscar produtos");

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
  }, [comercioId]);

  // fetch cart (attempts GET, handles different response shapes)
  const fetchCart = React.useCallback(async (): Promise<Cart | null> => {
    if (!link) return null;
    setError(null);
    setLoading(true);
    try {
      const url = `/movimentacoes/${link}/carrinho`;
      const resp = await api.get(url, { params: { comercio_id: comercioId } });

      // backend may return { carrinho: {...} } or other shapes
      const payload = resp.data;
      if (payload == null) throw new Error("Resposta inválida do servidor");

      // caso o backend retorne um objeto 'carrinho' com campos do carrinho
      if (payload.carrinho && typeof payload.carrinho === 'object' && payload.carrinho.carrinho_id) {
        const c = payload.carrinho as Cart;
        if (mountedRef.current) setCart(c);
        return c;
      }

      // caso o backend retorne apenas os itens (array) — construímos um cart parcial
      if (Array.isArray(payload.carrinho)) {
        const itens = payload.carrinho as any[];
        const valor_total = itens.reduce((acc, it) => acc + Number(it.subtotal ?? 0), 0);
        const c: any = { carrinho_id: itens[0]?.carrinho_id ?? null, itens, valor_total };
        if (mountedRef.current) setCart(c);
        return c;
      }

      // fallback: se retornar carrinho diretamente (sem wrapper)
      if (payload.carrinho_id) {
        const c = payload as Cart;
        if (mountedRef.current) setCart(c);
        return c;
      }

      throw new Error("Formato de carrinho desconhecido");
    } catch (err: any) {
      console.error("fetchCart error", err);
      // se o backend indicar que o link não existe -> navegar pra trás
      const message = err?.response?.data?.msg || err?.message || String(err);
      if (message && String(message).includes("mov não encontrado")) {
        // link inválido
        navigate(-1);
        return null;
      }

      // se carrinho não encontrado, tentamos criar (rota POST /movimentacoes/:link/carrinho)
      try {
        const createUrl = `/movimentacoes/${link}/carrinho`;
        const resp2 = await api.post(createUrl, { comercio_id: comercioId });
        if (resp2.status >= 200 && resp2.status < 300) {
          const created = resp2.data?.carrinho ?? resp2.data;
          if (mountedRef.current) setCart(created);
          return created as Cart;
        }
      } catch (e2: any) {
        console.warn("Criação de carrinho falhou (provavelmente rota não implementada)", e2);
        // não tratamos como erro bloqueante — apenas retornamos null
      }

      if (mountedRef.current) setError("Não foi possível obter ou criar carrinho");
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [link, comercioId, navigate]);

  // init on mount: valida link, carrega produtos e carrinho
  React.useEffect(() => {
    mountedRef.current = true;
    if (!comercioId || !link) {
      navigate(-1);
      return () => { mountedRef.current = false; };
    }

    (async () => {
      await fetchProdutos();
      await fetchCart();
    })();

    return () => {
      mountedRef.current = false;
    };
  }, [comercioId, link, fetchProdutos, fetchCart, navigate]);

  // adicionar item: usa a rota existente e depois re-fetch do carrinho
  const onAdd = React.useCallback(async (values: AddFormValues) => {
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

      const url = `/movimentacoes/${link}/carrinho/p/${produtoId}`;
      const res = await api.post(url, {
        comercio_id: comercioId,
        quantidade: qty,
      });

      if (res.status < 200 || res.status >= 300) {
        throw new Error("Erro ao adicionar item");
      }

      // backend atualmente retorna { carrinho: [items] } — aceitamos múltiplas formas
      const data = res.data;

      if (data == null) throw new Error("Resposta inválida ao adicionar item");

      // se backend devolve carrinho inteiro
      if (data.carrinho && data.carrinho.carrinho_id) {
        setCart(data.carrinho as Cart);
      } else if (Array.isArray(data.carrinho)) {
        // recebe lista de itens: atualizamos cart.itens e recalculamos total
        const itens = data.carrinho;
        const valor_total = itens.reduce((acc: number, it: any) => acc + Number(it.subtotal ?? 0), 0);
        setCart(prev => ({ ...(prev ?? {} as Cart), itens, valor_total } as Cart));
      } else if (data.item) {
        // caso futuro: retorno apenas item
        // re-fetch do carrinho para garantir consistência
        await fetchCart();
      } else {
        // fallback: re-fetch
        await fetchCart();
      }

      // limpa form
      reset({ produto: "", quantidade: 1 });
    } catch (err: any) {
      console.error("addProduto error", err);
      setError(err?.response?.data?.msg ?? err?.message ?? "Erro ao adicionar produto");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [comercioId, link, fetchCart, reset]);

  // future: remover item (a rota de deleção será adicionada no backend)
  const onRemoveItem = React.useCallback(async (itemId: number) => {
    setError(null);
    setLoading(true);
    try {
      // rota de deleção esperada: DELETE /movimentacoes/:link/carrinho/item/:itemId
      const url = `/movimentacoes/${link}/carrinho/item/${itemId}`;
      const resp = await api.delete(url, { params: { comercio_id: comercioId } });
      if (resp.status >= 200 && resp.status < 300) {
        await fetchCart();
      } else {
        throw new Error("Falha ao remover item");
      }
    } catch (err: any) {
      console.error("removeItem error", err);
      setError(err?.response?.data?.msg ?? err?.message ?? "Erro ao remover item");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [comercioId, link, fetchCart]);

  // helper: formato seguro para 2 casas decimais (mantém strings originais em produto.raw)
  const safeTwoDecimals = (v: any) => {
    if (v === null || v === undefined) return "0.00";
    const s = String(v).replace(",", ".");
    const n = Number(s);
    if (Number.isNaN(n)) return "0.00";
    return n.toFixed(2);
  };

  const tableData = (cart?.itens ?? []).map((it: any) => {
    const rawValor = it.preco_unitario ?? "0";
    const quantidade = Number(it.quantidade ?? 0);
    return {
      item_id: it.item_id,
      nome: it.nome_produto,
      valor_unitario: safeTwoDecimals(rawValor),
      quantidade: quantidade,
      subtotal: safeTwoDecimals(it.subtotal),
      rawItem: it,
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

      <Table caption="Itens do carrinho" data={tableData} 
      columns={
        [{key: "nome", label: "Nome"}, {key: "quantidade", label: "qtd"}, {key: "valor_unitario", label: "Preço unitário"}, ]
      } />

      <div className="form-actions" style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <Button theme="green" onClick={async () => {
          setError(null);
          if (!cart) { setError("Nenhum carrinho ativo para salvar."); return; }
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
              navigate(`/comercio/${comercioId}/movimentacoes`);
            } else {
              throw new Error("Erro ao salvar movimentação");
            }
          } catch (err: any) {
            console.error("saveEntry error", err);
            setError(err?.response?.data?.msg ?? err?.message ?? "Erro ao salvar entrada");
          } finally { if (mountedRef.current) setLoading(false); }
        }} disabled={loading || !cart}>
          {loading ? "Salvando..." : "Salvar entrada"}
        </Button>

        <Button theme="light" onClick={async () => {
          // fechar entrada (se carrinho existir, tentar deletar no servidor futuramente)
          setError(null);
          if (!cart) {
            navigate(`/comercio/${comercioId}/movimentacoes`);
            return;
          }
          setLoading(true);
          try {
            // aqui: se houver rota para deletar carrinho, chame-a
            navigate(`/comercio/${comercioId}/movimentacoes`);
          } catch (err: any) {
            console.error("closeEntry error", err);
            setError("Falha ao fechar carrinho no servidor. Verifique o console.");
            navigate(`/comercio/${comercioId}/movimentacoes`);
          } finally { if (mountedRef.current) setLoading(false); }
        }} disabled={loading}>
          {loading ? "Fechando..." : "Fechar entrada"}
        </Button>
      </div>
    </div>
  );
}
