import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://somlar.com",
  integrations: [
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      theme: "github-light",
    },
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "viewport",
  },
});
