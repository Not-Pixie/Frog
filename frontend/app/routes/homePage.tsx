import { Link } from "react-router";
import type { Route } from "../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Frog" },
    { name: "description", content: "Uma nova forma de Organizar!" },
  ];
}

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">Bem-vindo ao Frog!</h1>
      <p className="text-lg mb-8">Uma nova forma de Organizar!</p>
      <Link to="/cadastrar" className="text-blue-500 hover:underline">
        Ir para a página de cadastro
      </Link>
    </div>
  );
}
