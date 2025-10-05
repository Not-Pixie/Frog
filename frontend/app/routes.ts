import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("./routes/HomePage/homePage.tsx"),
  route("acessar", 
        "./routes/Acesso/acesso.tsx",
        [index("../src/pages/formLogin/formLogin.tsx"),
          route("cadastrar", "../src/pages/formCriarConta/formCriarConta.tsx")
        ]),
  route("convite/:inviteCode",
    "./routes/Convite/convite.tsx",
  ),
   route("usuario",
    "./routes/Usuário/usuario.tsx",
  ),
  route("telaPrincipal",
  "./routes/TelaPrincipal/telaPrincipal.tsx",
  [
    index("./routes/TelaPrincipal/Pages/Dashboard/dashboard.tsx"),
    route("movimentacoes/entradas", "./routes/TelaPrincipal/Pages/Movimentaçao/entrada.tsx"),
    route("movimentacoes/saidas", "./routes/TelaPrincipal/Pages/Movimentaçao/saida.tsx"),
    route("movimentacoes/relatorios", "./routes/TelaPrincipal/Pages/Movimentaçao/relatorios.tsx"),
    route("produtos", "./routes/TelaPrincipal/Pages/Produtos/produtos.tsx"),
    route("fornecedores", "./routes/TelaPrincipal/Pages/Fornecedores/fornecedores.tsx"),
    route("configuracoes", "./routes/TelaPrincipal/Pages/Configuraçoes/configuraçoes.tsx"),
  ]
)
] satisfies RouteConfig;

