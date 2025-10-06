import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("./routes/HomePage/HomePage.tsx"),

   route("", "./routes/AcessarLayout/acessarLayout.tsx", [
    route("entrar", "../src/pages/formLogin/formLogin.tsx"),
    route("cadastrar", "../src/pages/formCriarConta/formCriarConta.tsx"),
  ]),

  route("meus-comercios", "./routes/MeusComercios/MeusComercios.tsx"), 

  route("convite/:inviteCode", "./routes/Convite/Convite.tsx"),

  route("comercio/:comercioId", "./routes/Comercio/comercioLayout.tsx", [
    index("./routes/Comercio/Pages/Dashboard/dashboard.tsx"),        // /comercio/42
    route("entradas", "./routes/Comercio/Pages/Movimentaçao/entrada.tsx"),    // /comercio/42/entradas
    route("saidas", "./routes/Comercio/Pages/Movimentaçao/saida.tsx"),        // /comercio/42/saidas
    route("relatorios", "./routes/Comercio/Pages/Movimentaçao/relatorio.tsx"),
    route("produtos", "./routes/Comercio/Pages/Produtos/produto.tsx"),
    route("fornecedores", "./routes/Comercio/Pages/Fornecedores/fornecedores.tsx"),
    route("configuracoes", "./routes/Comercio/Pages/Configuraçoes/configuraçao.tsx")
  ]),

] satisfies RouteConfig;
