export type User = {
  usuario_id: number;
  email: string;
  nome?: string;
  comercios?: number[] | null;
} | null;

