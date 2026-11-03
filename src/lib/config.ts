export const siteConfig = {
  title: "林间杂记",
  description: "acacius 的个人站点，记录 Web 与 iOS 开发、Mastodon 实践、阅读和日常。",
  url: "https://somlar.com",
  author: "acacius",
  mastodon: "https://m.somincola.org/@acacius",
  links: {
    moro: "https://getmoro.app/",
    community: "https://somincola.org/",
  },
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
