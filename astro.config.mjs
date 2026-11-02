import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import partytown from "@astrojs/partytown";

export default defineConfig({
  site: "https://somlar.com",
  integrations: [
    sitemap(),
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
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
