import type { Produto } from "./produto";

export type CartItem = {
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
};

export type Cart = {
  carrinho_id: number;
  criado_em: string,
  atualizado_em: string,
  itens: CartItem[];
  valor_total?: number;
  status?: string;
};