import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const port = Number(env.VITE_PORT) || 5173;

  return {
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
    server: {
      port: port,
      strictPort: true
    },
    optimizeDeps: {
    include: ["@hookform/resolvers/zod",
    "recharts"
    ],
    },
  };
});