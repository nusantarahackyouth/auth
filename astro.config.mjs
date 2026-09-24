// @ts-check
import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare({
      imageService: "compile",
  }),

  build: {
      assets: "assets",
  },

  session: false,

  security: {
      checkOrigin: true,
  },

  vite: {
      plugins: [tailwindcss()],
  },

  integrations: [icon()],
});