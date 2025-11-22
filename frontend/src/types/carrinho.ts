import type { Produto } from "./produto";

export type CartItem = {
  item_id: number;
  carrinho_id: number;
  produto_id: number;
  quantidade: number;
  valor_unitario?: string | number;
  subtotal?: number;
  produto?: Produto;
};

export type Cart = {
  carrinho_id: number;
  criado_em: string,
  atualizado_em: string,
  itens: CartItem[];
  valor_total?: number;
  status?: string;
};