import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { api } from "./server/api.mjs";

export default defineConfig(({mode})=>({
  base: mode==='pages'?'/nawg-dashboard/':'/',
  publicDir: mode==='pages'?false:'public',
  build: {
    outDir: mode==='pages'?"dist/pages":"dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "127.0.0.1",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), { name:"activityinfo-server", configureServer(server) {
    if(mode!=='pages')server.middlewares.use(async(req,res,next)=>{ if(!(await api(req,res))) next(); });
  }, configurePreviewServer(server) {
    if(mode!=='pages')server.middlewares.use(async(req,res,next)=>{ if(!(await api(req,res))) next(); });
  }}],
}));
