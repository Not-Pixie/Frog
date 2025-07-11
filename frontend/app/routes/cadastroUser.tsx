import type { Route } from '../+types/root';
import { useForm } from 'react-hook-form';
import api from 'src/api/axios'
import { USUARIOS } from 'src/api/enpoints';


export function meta({}: Route.MetaArgs) {
  return [
    { title: "Cadastrar" },
    { name: "description", content: "Página de cadastro de usuário" },
  ];
}

interface FormData {
  nome: string;
  email: string;
  senha: string;
}

export default function CadastroUser() {

    const { register, handleSubmit, formState: {errors} } = useForm<FormData>();

    const onSubmit = async (data: any) => {
        try {
            const response = await api.post(USUARIOS, data);
            console.log('Usuário cadastrado com sucesso:', response.data);
        }
        catch (error) {
            console.error('Erro ao cadastrar usuário:', error);
        }

    }



  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">Cadastro de Usuário</h1>
      <p className="text-lg mb-8">Formulário de cadastro de usuário</p>
      <form className="w-full max-w-sm" onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
            <input
              type="text"
              placeholder="Nome"
              className="border p-2 w-full"
              {...register('nome', {required: "Todos somos nomeados"})}
            />
            {errors.nome && (<p className="text-red-500 mb-2">{errors.nome.message}</p>)}
        </div>

        <div className="mb-4">
            <input
              type="email"
              placeholder="Email"
              className="border p-2 w-full"
              {...register('email', {required: "email é obrigatório"})}
            />
            {errors.email && (<p className='text-red-500'>{errors.email.message}</p>)}
        </div>

        <div className="mb-4">
            <input
              type="password"
              placeholder="Senha"
              className="border p-2 w-full"
              {...register('senha', {required: 'Segurança é essencial!'})}
            />
            {errors.senha && (<p className='text-red-500'>{errors.senha.message}</p>)}
        </div>

        <button type='submit' role='button' className="bg-blue-500 text-white p-2 w-full cursor-pointer">Cadastrar</button>
      </form>
    </div>
  );
}