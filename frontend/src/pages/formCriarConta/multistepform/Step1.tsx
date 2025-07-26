import Input from "src/components/Input";

type props = {
    wrapperClassName?: string;
}

export default function Step1({wrapperClassName}:props){
    //2 <Input/>: Nome do comercio, nome do proprietario.
    //1 <button>: next
    return(
        <div className={wrapperClassName}>
            <Input
                label="Nome do Comércio"
                type="text"
                placeholder="Nome do Comércio"
                id="comerce"/>
            
            <Input
                label="Nome do Proprietário"
                type="text"
                placeholder="Nome do Proprietário"
                id="owner"/>
        </div>
    )

}