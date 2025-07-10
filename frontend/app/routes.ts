import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default 
    [
        index("./routes/homePage.tsx" ),
        route("teste", "./routes/teste.tsx"),
        route("cadastrar", "./routes/cadastroUser.tsx"),
    ] satisfies RouteConfig;
