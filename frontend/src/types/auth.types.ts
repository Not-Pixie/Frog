export type User = { usuario_id: number; email: string; nome?: string, comercios?: number[] | null } | null;

export interface AuthContextType {
  user: User;
  token?: string | null;
  loading: boolean;
  comercios?: number[] | null;
  checkAuth: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
  setToken?: (t: string | null) => void;
}