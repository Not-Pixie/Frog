import { useFormContext } from "react-hook-form";
import type { FormData } from "../schemas.ts";
import Input from "src/components/Input";

type props = {
    wrapperClassName?: string;
}

export default function Step3({wrapperClassName}:props){
    const { register, formState: { errors } } = useFormContext<FormData>();

    return(
        <div className={wrapperClassName}>
            <p>Agora crie sua senha</p>
            <div>
                <Input
                    label="Senha"
                    type="password"
                    placeholder="Digite sua senha"
                    id="senha1"
                    {...register("senha")}/>
                {errors.senha && <span className="erro">{errors.senha.message}</span>}
            </div>
            
            <div>
                <Input
                    label="Validar senha"
                    type="password"
                    id="senha2"
                    placeholder="Digite a Mesma Senha"
                    {...register("confirmarSenha")}/>
                {errors.confirmarSenha && <span className="erro">{errors.confirmarSenha.message}</span>}
            </div>
        </div>
    )

}