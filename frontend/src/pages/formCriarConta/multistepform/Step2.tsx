import Input from "src/components/Input";

type props = {
    wrapperClassName?: string;
}

export default function Step2({wrapperClassName}:props){
    //2 <Input/>: Nome do comercio, nome do proprietario.
    //1 <button>: next
    return(
        <div className={wrapperClassName}>
            <Input
                label="Número de Telefone"
                type="number"
                placeholder="Digite seu número"
                id="tel"/>
            
            <Input
                label="Email"
                type="email"
                placeholder="Nome do Proprietário"
                id="email"/>
        </div>
    )

}