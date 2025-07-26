import Input from "src/components/Input";

type props = {
    wrapperClassName?: string;
}

export default function Step3({wrapperClassName}:props){
    return(
        <div className={wrapperClassName}>
            <Input
                label="Senha"
                type="password"
                placeholder="Digite sua senha"
                id="senha1"/>
            
            <Input
                label="Validar senha"
                type="email"
                id="senha2"
                placeholder="Digite a Mesma Senha"/>
        </div>
    )

}