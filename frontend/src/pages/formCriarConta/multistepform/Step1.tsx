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
            <p>Vamos começar pelos nomes</p>
            <div>
                <Input
                    label="Nome do Comércio"
                    type="text"
                    placeholder="Nome do Comércio"
                    id="comerce"
                    {...register("nomeComercio")}/>
                {errors.nomeComercio && (
                    <span className="erro">{errors.nomeComercio.message}</span>)}
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