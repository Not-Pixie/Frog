import type { Route } from "../+types/root";

export function meta({}: Route.MetaArgs){
    return [
        {title: "Teste Pag"},
        {name: "description", content: "Teste de criação de páginas"},
    ];
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div style={{ padding: 20, color: "crimson" }}>
      <h1>Ops! Deu ruim em Teste 😬</h1>
      <p>{error.message}</p>
    </div>
  );
}


export default function Teste()
{
    return (
        <h1>Isso é um teste</h1>
    )
}