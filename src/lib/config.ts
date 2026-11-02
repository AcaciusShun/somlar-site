export const siteConfig = {
  title: "Somlar",
  description: "acacius 的个人站点 — 技术实践、阅读笔记与日常随想。",
  url: "https://somlar.com",
  author: "acacius",
  mastodon: "https://m.somincola.org/@acacius",
  nav: [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: "Projects", href: "/projects" },
    { label: "Labs", href: "/labs" },
    { label: "Library", href: "/library" },
    { label: "About", href: "/about" },
  ],
  twikoo: {
    envId: import.meta.env.PUBLIC_TWIKOO_ENV_ID || "",
  },
  analytics: {
    measurementId: import.meta.env.PUBLIC_GA_MEASUREMENT_ID || "G-CBT6PFDJBD",
  },
} as const;
