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
  )
] satisfies RouteConfig;

