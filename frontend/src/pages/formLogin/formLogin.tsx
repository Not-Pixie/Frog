import "./formLogin.css";
import type { Route } from "../../../app/+types/root";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import { useAuth } from "src/api/auth/AuthProvider";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Cadastrar" },
    { name: "description", content: "Página de cadastro de usuário" },
  ];
}

interface FormData {
  email: string;
  senha: string;
}

/**
 * Schema Zod para validação do formulário de login.
 * Mensagens em PT-BR alinhadas com as mensagens que você já usa.
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "O email é obrigatório")
    .email("Email inválido"),
  senha: z
    .string()
    .min(1, "A senha é obrigatória"),
    // se quiser exigir tamanho mínimo, descomente a linha abaixo e ajuste a mensagem:
    // .min(6, "A senha precisa ter ao menos 6 caracteres"),
});

export default function CadastroUser() {
  const navigate = useNavigate();
  const { checkAuth, login } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    reValidateMode: "onChange",
  });

  const onSubmit = async (data: any) => {
    try {
      const ok = await login(data?.email, data?.senha);
      if (ok) {
        navigate("/meus-comercios", { replace: true });
        return;
      }

      // Se a autenticação falhar (credenciais inválidas), definimos um erro nos campos
      // para mostrar a mesma aparência das validações do Zod.
      const msg = "Email ou senha inválidos";
      setError("senha", { type: "server", message: msg });
    } catch (error) {
      console.error("Erro ao acessar a conta:", error);

      // Em caso de erro de rede/servidor, mostramos uma mensagem genérica também nos campos.
      const msg = "Erro ao conectar com o servidor. Tente novamente.";
      setError("email", { type: "server", message: msg });
      setError("senha", { type: "server", message: msg });
    }
  };

  return (
    <div className="divFormEntrar">
      <h2 className="tituloEntrar">Entre em sua conta</h2>
      <form className="formEntrar" onSubmit={handleSubmit(onSubmit)}>
        <div className="formWrapEntrar">
          <label className="lblEntrarConta" htmlFor="email">
            Email
          </label>
          <div className="inputWithError">
            <input
              className="inputEntrarConta"
              type="email"
              placeholder="Email"
              {...register("email")}
            />
            {errors.email && <p className="error">{errors.email.message}</p>}
          </div>
        </div>
        <div className="formWrapEntrar">
          <label className="lblEntrarConta" htmlFor="senha">
            Senha
          </label>
          <div className="inputWithError">
            <input
              className="inputEntrarConta"
              type="password"
              placeholder="Senha"
              {...register("senha")}
            />
            {errors.senha && <p className="error">{errors.senha.message}</p>}
          </div>
        </div>
        <button type="submit" role="button" className="btnEntrarConta">
          Entrar
        </button>
      </form>
    </div>
  );
}
