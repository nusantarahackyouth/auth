// @ts-check
import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig(({ command }) => ({
  adapter: cloudflare({
      imageService: "compile",
  }),
  build: {
      assets: "assets",
  },
  session: false,
  security: {
      checkOrigin: command !== "dev",
  },
  vite: {
      plugins: [tailwindcss()],
  },
  integrations: [icon()],
}));