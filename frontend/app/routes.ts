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
    index("./routes/Comercio/Pages/Dashboard/dashboard.tsx"),        
    route("entradas", "./routes/Comercio/Pages/Movimentaçao/entrada.tsx"),    
    route("saidas", "./routes/Comercio/Pages/Movimentaçao/saida.tsx"),        
    route("historico", "./routes/Comercio/Pages/Movimentaçao/relatorio.tsx"),
    route("produtos", "./routes/Comercio/Pages/Produtos/produto.tsx"),
    route("produtos/novo-produto", "./routes/Comercio/Pages/Produtos/novo-produto.tsx"),
    route("produtos/categorias", "./routes/Comercio/Pages/Produtos/categorias.tsx"),
    route("fornecedores", "./routes/Comercio/Pages/Fornecedores/fornecedores.tsx"),
    route("configuracoes", "./routes/Comercio/Pages/Configuraçoes/configuraçao.tsx"),
    route("fornecedores/novo-fornecedor", "./routes/Comercio/Pages/Fornecedores/novo-fornecedor.tsx")
  ]),

] satisfies RouteConfig;
