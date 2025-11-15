import { Link } from "react-router"
export default function PageNotFound()
{
    return(
        <div style={{ padding: 20, color: "crimson" }}>
            <h1>Ops! Página não encontrada </h1>
            <p>Verifique a URL ou volte para a <Link to="/" style={{color: "teal", textDecoration: 'underline'}}>página inicial</Link>.</p>
        </div>
    )
}