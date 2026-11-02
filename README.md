# Somlar

acacius 的个人站点，使用 [Astro](https://astro.build/) 构建。

**[somlar.com](https://somlar.com)**

## 页面与功能

- 首页、文章、项目、实验、书影音、关于、友链与 404 共用阅读布局。
- 以文字为主：白底、深色正文、蓝色链接，17px 系统字体。桌面栏目页版心 800px，文章正文保留 700px。
- Blog 按年份归档，保留标签页、RSS、文章目录、代码复制和图片浏览。
- [Pagefind](https://pagefind.app/) 提供全文搜索。
- [Twikoo](https://twikoo.js.org/) 评论在读者展开评论区后加载。
- 书影音使用小封面、标题、状态和日期的列表，按月排列，支持标题、短评、标签搜索，以及类型和状态筛选。
- 有短评的条目可以原地展开阅读，剧透内容需要单独展开。标题直接链接到 NeoDB。
- 阅读统计在读者同意后加载，通过 Partytown 运行；可在页脚修改选择。

页面使用语义化 HTML、原生表单和 `details`，样式集中在 `src/styles/reading.css`。

## 开发

使用 `.nvmrc` 指定的 Node.js 版本。

```bash
npm install
npm run dev         # 开发预览
npm run build       # 静态构建并生成搜索索引
npm run astro -- check
npm run preview     # 预览正式构建
npm run sync:neodb   # 刷新书影音快照
```

## 配置

环境变量放在 `.env`（不提交到版本库），可参考 `.env.example`。

| 变量 | 用途 |
| --- | --- |
| `PUBLIC_TWIKOO_ENV_ID` | 评论服务地址或环境 ID，会公开给浏览器。 |
| `PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 统计 ID。 |
| `NEODB_TOKEN` | NeoDB 只读令牌，用于本地开发、同步脚本与 CI；不会发送给浏览器。 |
| `NEODB_INSTANCE` | NeoDB 实例地址，默认 `https://neodb.social`。 |

### 书影音同步

正式构建读取 `src/data/library-snapshot.json`，无需访问 NeoDB。

- `.github/workflows/refresh-library.yml` 定时拉取四种状态的记录，仅在个人记录变化时提交快照。该提交随后触发站点部署。
- GitHub Actions 需要配置 `NEODB_TOKEN` secret；可用 `NEODB_INSTANCE` variable 指定实例。
- 本地运行 `npm run sync:neodb` 可刷新快照；`npm run sync:neodb -- --force` 可强制重写。审阅变化后再提交。
- `astro dev` 使用带 24 小时缓存的实时数据；接口失败时回退到已提交的快照。
- 同步失败或返回空数据时，脚本保留原快照。
- 封面沿用快照中的 Cloudflare 图片转换地址，按需加载。

## 结构

```text
src/
├── components/
│   ├── analytics/      # 统计与同意设置
│   ├── content/        # 文章索引、项目列表与短评
│   ├── interactive/    # 搜索、文章增强与评论
│   └── layout/         # 共享页面元数据
├── content/blog/       # Markdown 文章
├── data/               # NeoDB 快照
├── layouts/            # ReadingLayout
├── lib/                # 站点配置、文章与 NeoDB 数据
├── pages/              # 页面、RSS 与兼容跳转
└── styles/             # 共享阅读样式
```

## License

[MIT](LICENSE)
