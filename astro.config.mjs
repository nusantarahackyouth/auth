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
        checkOrigin: process.env.NODE_ENV !== "development",
    },
    vite: {
        plugins: [tailwindcss()],
    },
    integrations: [icon()],
});
