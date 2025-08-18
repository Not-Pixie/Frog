import { useFormContext } from "react-hook-form";
import type { FormData } from "../schemas.ts";
import Input from "src/components/Input";

type props = {
    wrapperClassName?: string;
}

export default function Step1({wrapperClassName}:props){
    const { register, formState: { errors } } = useFormContext<FormData>();
    
    return(
        <div className={wrapperClassName}>
            <p>Coloque suas informações</p>
            <div>
                <Input
                    label="Email"
                    type="email"
                    placeholder="Nome do Proprietário"
                    id="email"
                    {...register("email")}/>
                {errors.email && <span className="erro">{errors.email.message}</span>}
                </div>

            <div>
                <Input
                    label="Nome do Proprietário"
                    type="text"
                    placeholder="Nome do Proprietário"
                    id="owner"
                    {...register("nome")}/>
                {errors.nome && (
                    <span className="erro">{errors.nome.message}</span>)}
                </div>
        </div>
    )

}