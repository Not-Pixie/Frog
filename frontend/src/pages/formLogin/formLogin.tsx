import "./formLogin.css";
import type { Route } from "../../../app/+types/root";
import { useForm } from "react-hook-form";
import api from "src/api/axios";
import { LOGIN } from "src/api/enpoints";
import { useNavigate } from "react-router";
import { useAuth } from "src/api/auth/AuthProvider";
import PublicRoute from "src/api/auth/PublicRoute";

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

export default function CadastroUser() {
  const navigate = useNavigate();
  const {checkAuth, login} = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: any) => {
    try {
      if(await login(data?.email, data?.senha)) 
        navigate("/meus-comercios", { replace: true });
      
    } catch (error) {
      console.error("Erro ao acessar a conta:", error);
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
              {...register("email", { required: "O email é obrigatório" })}
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
              {...register("senha", { required: "A senha é obrigatória" })}
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
