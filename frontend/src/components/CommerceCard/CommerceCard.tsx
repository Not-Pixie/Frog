import { useState } from "react";
import "./CommerceCard.css";
import Input from "../Input";

export default function CommerceCard({}:{})
{
    const [isActive, setIsActive] = useState(false)
    const [isCreating, setIsCreating] = useState(false);
    const toggleIsActive = () => setIsActive(prev => !prev);
    const toggleIsCreating = () => setIsCreating(prev => !prev);

    let pClassName = "commerce-card";
    pClassName = isActive ? pClassName + " enabled" : pClassName + " disabled"

    let plusSignClassName = "plus-sign";
    plusSignClassName = isCreating ? "plus-sign" : plusSignClassName + " moved"

    let elements:React.ReactNode;

    if (isCreating)
        elements = (<>
            <div className="backArrow" onClick={toggleIsCreating}></div>
            <Input type="text" label="" placeholder="Nome do Negócio"></Input>
        </>);
    else elements = null;

    return (<div className={pClassName}>
        {elements}
        <p className={plusSignClassName} onClick={toggleIsActive}>+</p>
    </div>);
}