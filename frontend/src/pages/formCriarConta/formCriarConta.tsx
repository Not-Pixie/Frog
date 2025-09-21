import { useState } from "react";
import "./formCriarConta.css";
import Step1 from "./multistepform/Step1";
import Step2 from "./multistepform/Step2";
import { FormProvider, useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FormData } from "./schemas.ts"
import { formSchema } from "./schemas";
import api from "src/api/axios.ts";
import { CADASTRO, LOGIN } from "src/api/enpoints.ts";
import { useNavigate } from "react-router";
import { useAuth } from "src/api/auth/AuthProvider.tsx";

export default function FormCadastrarUsuario() {
    const navigate = useNavigate();
    const { checkAuth, login } = useAuth();
    
    const methods = useForm<FormData>({
        resolver: zodResolver(formSchema),
        reValidateMode: "onChange",
        defaultValues: {
            nome: "",
            email: "",
            senha: "",
            confirmarSenha: ""
        }
    })

    const stepFields: Record<number, (keyof FormData)[]> ={
        0: ["email", "nome"],
        1: ["senha", "confirmarSenha"],
        2: ["senha", "confirmarSenha"]
    };

    const handleLogin = async (data: any) => {
        try{
            if(await login(data?.email, data?.senha))
                navigate("/acessar", { replace: true });
        }
        catch (error) {
            console.error("Erro ao acessar a conta:", error);
            alert("Erro ao acessar a conta. Tente novamente.");
        }
    }

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        api.post(CADASTRO, data)
            .then((res) => {
                alert("Cadastro com sucesso!");
                console.log("Usuário cadastrado:", res.data);
                methods.reset();
                handleLogin({ email: data.email, senha: data.senha });
            })
            .catch((error) => {
                console.error("Erro ao cadastrar usuário:", error);
                alert("Erro ao cadastrar usuário. Tente novamente.");
            });
    }
    
    const [step, setStep] = useState(0);
    const previousStep = () => (setStep(prev => (prev > 0 ? prev - 1 : prev)));
    const nextStep = async () => {
        let valid = false;
        if (step<2)
        {valid = await methods.trigger(stepFields[step]);}
        if (valid && step < 1)
            {setStep(step + 1); (document.getElementById("senha1") as HTMLInputElement).focus();}
    };
    
    return (<>
    <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="formWrapper">
            <h2>Cadastrar</h2>
            <div
                  className="slider"
                  style={{ transform: `translateX(-${step * 100}%)` }}
                >
                  <fieldset className="slide" disabled={step !== 0}><Step1 wrapperClassName="stepWrapper" /></fieldset>
                  <fieldset className="slide" disabled={step !== 1}><Step2 wrapperClassName="stepWrapper" /></fieldset>
                </div>
            <div className="controls">
                <div>
                    {step > 0 && <button type="button" onClick={previousStep}>
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>}
                </div>
                <div>
                    {step < 1 && <button type="button" onClick={nextStep}>
                        <i className="fa-solid fa-arrow-right"></i>
                    </button>}
                    {step === 1 && <button type="submit">
                        <div className="finalizeButton">
                            <p>Cadastrar</p>
                        </div>
                    </button>}
                </div>
            </div>
        </form>
    </FormProvider>
     </>)
}