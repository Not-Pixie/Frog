import { useState } from "react";
import "./formCriarConta.css";
import Step1 from "./multistepform/Step1";
import Step2 from "./multistepform/Step2";
import Step3 from "./multistepform/Step3";

export default function FormCadastrarUsuario() {
    // TODO: -Integrar FormHook -Integrar Zod
    
    
    const [step, setStep] = useState(0);
    const nextStep = () => (setStep(prev => (step < 2 ? step + 1 : step)))
    const previousStep = () => (setStep(prev => (step > 0 ? step - 1 : step)))
    
    return (<>
    <form action="" className="formWrapper">
        <div
              className="slider"
              style={{ transform: `translateX(-${step * 100}%)` }}
            >
              <div className="slide"><Step1 wrapperClassName="stepWrapper" /></div>
              <div className="slide"><Step2 wrapperClassName="stepWrapper" /></div>
              <div className="slide"><Step3 wrapperClassName="stepWrapper" /></div>
            </div>
        <div className="controls">
            <div>
                {step > 0 && <button type="button" onClick={previousStep}>
                    <i className="fa-solid fa-arrow-left"></i>
                </button>}
            </div>
            <div>
                {step < 2 && <button type="button" onClick={nextStep}>
                    <i className="fa-solid fa-arrow-right"></i>
                </button>}
                {step === 2 && <button type="button" onClick={() => alert("Cadastro concluído!")}>
                    <div className="finalizeButton">
                        <p>Concluir Cadastro</p>
                        <i className="fa-solid fa-check-circle"/>
                    </div>
                </button>}
            </div>
        </div>
    </form>
     </>)
}