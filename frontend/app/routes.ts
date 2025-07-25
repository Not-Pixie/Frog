import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("./routes/HomePage/homePage.tsx"),
  route("teste", "./routes/teste.tsx"),
  route("entrar", "./routes/Login-SignIn/cadastroUser.tsx"),
  route("cadastrar", "./routes/Login-SignIn/userPage.tsx")
] satisfies RouteConfig;
