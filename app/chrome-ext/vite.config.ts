import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    build: {
        outDir: "dist",
        rollupOptions: {
            input: {
                popup: resolve(__dirname, "index.html"),
            },
            output: {
                entryFileNames: "[name].js",
                chunkFileNames: "[name].js",
                assetFileNames: "[name].[ext]"
            }
        }
    },
    server: {
        port: 1420
    }
});
