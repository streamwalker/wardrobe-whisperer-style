import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Public browser config fallback (URL + publishable anon key only — never service_role).
// Used when the build environment has no .env, so production never ships without a backend URL.
const PUBLIC_SUPABASE_FALLBACK = {
  VITE_SUPABASE_URL: "https://zpctyufmvrvavnidovtp.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwY3R5dWZtdnJ2YXZuaWRvdnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDE3NzMsImV4cCI6MjA4NzkxNzc3M30.KJy3v8F6-zHHM8roXxvccnb6319EXxSWtoR98olvQoA",
  VITE_SUPABASE_PROJECT_ID: "zpctyufmvrvavnidovtp",
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), "VITE_") };
  const define: Record<string, string> = {};
  for (const [key, value] of Object.entries(PUBLIC_SUPABASE_FALLBACK)) {
    if (!env[key]) define[`import.meta.env.${key}`] = JSON.stringify(value);
  }
  return {
    define,
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
