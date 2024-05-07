import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.GH_PAGES ? "/reponame/" : "/",
  plugins: [react()],
  path: "/<repo>",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
