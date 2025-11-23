// src/pages/entrada.tsx
import React from "react";
import "../geral.css";
import Button from "src/components/Button/button";
import Input from "src/components/Input/Input";
import api from "src/api/axios";
import { COMERCIOS } from "src/api/enpoints";
import type { Produto } from "src/types/produto";
import { useParams, useNavigate } from "react-router";
import { FaArrowLeft } from "react-icons/fa";
import Table from "src/components/Table/Table";
import { useForm } from "react-hook-form";

type FormValues = {
  produto: string;
  quantidade: number;
};

type CarrinhoItem = {
  item_id: number;
  carrinho_id: number;
  produto_id: number;
  nome_produto?: string;
  imagem?: string | null;
  preco_unitario?: string;
  quantidade: number;
  desconto_percentual?: string;
  subtotal?: string;
};

type Carrinho = {
  carrinho_id: number;
  criado_em?: string;
  atualizado_em?: string;
  comercio_id?: number;
  itens: CarrinhoItem[];
  valor_total: string;
};

export default function Entrada() {
  const { comercioId, link } = useParams<{ comercioId: string; link: string }>();
  const navigate = useNavigate();
  const mountedRef = React.useRef(false);

  const [produtos, setProdutos] = React.useState<Produto[]>([]);
  const [cart, setCart] = React.useState<Carrinho | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingOptions, setLoadingOptions] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: { produto: "", quantidade: 1 },
  });

  const safeTwoDecimals = (v: any) => {
    if (v === null || v === undefined) return "0.00";
    const s = String(v).replace(",", ".");
    const n = Number(s);
    if (Number.isNaN(n)) return "0.00";
    return n.toFixed(2);
  };

  const fetchProdutos = React.useCallback(async () => {
    setLoadingOptions(true);
    setError(null);
    try {
      const resp = await api.get(`${COMERCIOS}/${comercioId}/produtos`);
      if (resp.status !== 200) throw new Error("Erro ao buscar produtos");
      const items = resp.data?.items ?? [];
      setProdutos(items);
    } catch (e) {
      console.error("fetchProdutos error", e);
      setError("Erro ao carregar produtos. Veja console.");
    } finally {
      setLoadingOptions(false);
    }
  }, [comercioId]);

  const fetchCart = React.useCallback(async (): Promise<Carrinho | null> => {
    if (!link) return null;
    setError(null);
    setLoading(true);
    try {
      const resp = await api.get(`/movimentacoes/${link}/carrinho`, { params: { comercio_id: comercioId } });
      const carrinho = resp.data?.carrinho;
      const movimentacao = resp.data?.movimentacao;
      if (!carrinho) throw new Error("Resposta inválida do servidor");

      if (movimentacao?.link && movimentacao.link !== link) {
        navigate(`/comercio/${comercioId}/entrada/${movimentacao.link}`);
        return null;
      }

      setCart(carrinho);
      return carrinho;
    } catch (err: any) {
      const msg = err?.response?.data?.msg ?? err?.message ?? "";
      if (String(msg).includes("mov não encontrado") || err?.response?.status === 404 || err?.response?.status === 400) {
        try {
          const resp2 = await api.post(`/movimentacoes/${link}/carrinho`, { comercio_id: Number(comercioId) });
          if (resp2.status >= 200 && resp2.status < 300) {
            const carrinho = resp2.data?.carrinho;
            const movimentacao = resp2.data?.movimentacao;
            if (movimentacao?.link && movimentacao.link !== link) {
              navigate(`/comercio/${comercioId}/entrada/${movimentacao.link}`);
              return null;
            }
            setCart(carrinho);
            return carrinho;
          }
        } catch (e2) {
          console.warn("Criação de carrinho falhou", e2);
        }
      }

      console.error("fetchCart error", err);
      setError("Não foi possível obter ou criar carrinho");
      return null;
    } finally {
      setLoading(false);
    }
  }, [link, comercioId, navigate]);

  React.useEffect(() => {
    mountedRef.current = true;
    if (!comercioId || !link) {
      navigate(-1);
      return;
    }
    (async () => {
      await fetchProdutos();
      await fetchCart();
    })();
    return () => { mountedRef.current = false; };
  }, [comercioId, link, fetchProdutos, fetchCart, navigate]);

  // Validação simples feita manualmente (sem zodResolver)
  const onAdd = React.useCallback(async (values: FormValues) => {
    setError(null);
    if (!link) return;
    const produtoId = Number(values.produto);
    const quantidade = Number(values.quantidade);

    if (!produtoId) { setError("Selecione um produto."); return; }
    if (!Number.isFinite(quantidade) || quantidade <= 0) { setError("Quantidade inválida."); return; }

    setLoading(true);
    try {
      const resp = await api.post(`/movimentacoes/${link}/carrinho/p/${produtoId}`, {
        comercio_id: Number(comercioId),
        quantidade,
      });
      if (resp.status < 200 || resp.status >= 300) throw new Error("Erro ao adicionar item");

      const carrinho = resp.data?.carrinho;
      if (!carrinho) {
        await fetchCart();
      } else {
        setCart(carrinho);
      }
      reset({ produto: "", quantidade: 1 });
    } catch (err: any) {
      console.error("addProduto error", err);
      setError(err?.response?.data?.msg ?? err?.message ?? "Erro ao adicionar produto");
    } finally {
      setLoading(false);
    }
  }, [link, comercioId, fetchCart, reset]);

  const onRemoveItem = React.useCallback(async (itemId: number) => {
    if (!link) return;
    setError(null);
    setLoading(true);
    try {
      const resp = await api.delete(`/movimentacoes/${link}/carrinho/item/${itemId}`, { params: { comercio_id: Number(comercioId) } });
      if (resp.status >= 200 && resp.status < 300) {
        const carrinho = resp.data?.carrinho;
        if (carrinho) setCart(carrinho);
        else await fetchCart();
      } else throw new Error("Falha ao remover item");
    } catch (err: any) {
      console.error("removeItem error", err);
      setError(err?.response?.data?.msg ?? err?.message ?? "Erro ao remover item");
    } finally {
      setLoading(false);
    }
  }, [link, comercioId, fetchCart]);

  const onSave = React.useCallback(async () => {
    setError(null);
    if (!cart) { setError("Nenhum carrinho ativo para salvar."); return; }
    if (!link) { setError("Link inválido"); return; }
    setLoading(true);
    try {
      const payload = {
        tipo: "entrada",
        carrinho_id: cart.carrinho_id,
        comercio_id: Number(comercioId),
      };
      const resp = await api.post("/movimentacoes", payload);
      if (resp.status >= 200 && resp.status < 300) {
        navigate(`/comercio/${comercioId}/entradas`);
      } else {
        throw new Error("Erro ao salvar movimentação");
      }
    } catch (err: any) {
      console.error("saveEntry error", err);
      setError(err?.response?.data?.msg ?? err?.message ?? "Erro ao salvar entrada");
    } finally {
      setLoading(false);
    }
  }, [cart, comercioId, link, navigate]);

  return (
    <div className="conteudo-item produto-cadastro">
      <div className="page-header">
        <button className="back-link" onClick={() => navigate(-1)} aria-label="Voltar">
          <FaArrowLeft style={{ fontSize: 20, color: "#35AC97" }} />
        </button>
        <h1>Entradas</h1>
      </div>

      {error && <div className="err" style={{ marginBottom: 12 }}>{error}</div>}

      <form className="cadastro-form" onSubmit={handleSubmit(onAdd)} noValidate>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 16 }}>
          <div style={{ flex: "0 0 360px", minWidth: 360 }}>
        <Input label="Produto" type="select" {...register("produto")} disabled={loadingOptions}>
          <option value="">Selecione um produto</option>
          {produtos.map(p => <option key={String(p.produto_id)} value={String(p.produto_id)}>{p.nome}</option>)}
        </Input>
          </div>

          <Input
        label="Quantidade"
        type="number"
        {...register("quantidade")}
        inputClassName="small-input"
        style={{ minWidth: 100, paddingRight: 10 }}
          />

          <div style={{ display: "flex", gap: 8, marginLeft: 402 }}>
        <Button
          theme="green"
          type="submit"
          disabled={formState.isSubmitting || loading || loadingOptions}
          style={{ minWidth: 180 }}
        >
          {loading ? "Carregando..." : "Adicionar ao carrinho"}
        </Button>

        <Button theme="light" type="button" onClick={() => reset({ produto: "", quantidade: 1 })}>Limpar</Button>
          </div>
        </div>
      </form>

      <Table
        data={cart?.itens ?? []}
        columns={[
          { key: "nome_produto", label: "Nome" },
          { key: "quantidade", label: "Quantidade" }
        ]}
        keyField="item_id"
        emptyMessage="Nenhum item no carrinho"
        renderCell={(
          value: any,
          row: Record<PropertyKey, any>,
          column: string,
          rowIndex: number
        ) => {
          if (column === "quantidade") {
        return (
          <span style={{ textAlign: "right", display: "block" }}>
            {Number(value)}
          </span>
        );
          }

          return value === null || value === undefined ? "—" : String(value);
        }}
        rowActions={(row: Record<PropertyKey, any>, rowIndex: number) => {
          const r = row as CarrinhoItem;
          return (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => {
          if (confirm("Excluir item do carrinho?")) onRemoveItem(r.item_id);
            }}
            className="btn-delete"
            aria-label="Excluir item"
            title="Excluir item"
          >
            <i className="fi fi-rr-trash-xmark" aria-hidden="true" />
          </button>
        </div>
          );
        }}
        actionHeader="Opções"
      />

      <div className="form-actions" style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <Button theme="green" onClick={onSave} disabled={loading || !cart}>
          {loading ? "Salvando..." : "Salvar entrada"}
        </Button>

        <Button theme="light" onClick={() => navigate(`/comercio/${comercioId}/entradas`)} disabled={loading}>
          Fechar entrada
        </Button>
      </div>
    </div>
  );
}
