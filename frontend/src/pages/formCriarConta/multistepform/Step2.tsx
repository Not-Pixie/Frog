import { useFormContext } from "react-hook-form";
import type { FormData } from "../schemas.ts";
import Input from "src/components/Input";

type props = {
    wrapperClassName?: string;
}

export default function Step2({wrapperClassName}:props){
    const { register, formState: { errors } } = useFormContext<FormData>();
    return(
        <div className={wrapperClassName}>
            <div>
                <Input
                    label="Número de Telefone"
                    type="text"
                    placeholder="Digite seu número"
                    id="tel"
                    {...register("telefone")}/>
                {errors.telefone && <span className="erro">{errors.telefone.message}</span>}
            </div>

            
            <div>
                <Input
                    label="Email"
                    type="email"
                    placeholder="Nome do Proprietário"
                    id="email"
                    {...register("email")}/>
                {errors.email && <span className="erro">{errors.email.message}</span>}
            </div>
        </div>
    )

}