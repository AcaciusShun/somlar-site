# 林间杂记

acacius 的个人站点，使用 [Astro](https://astro.build/) 构建。

**[somlar.com](https://somlar.com)**

## 页面与功能

- 首页、文章、项目、实验、书影音与游戏、关于、友链与 404 共用阅读布局。
- 白底、深色正文、克制的蓝色链接，原生宋体与衬线标题。栏目正文为 16px，文章正文为 17px / 1.95；桌面版心分别为 800px 和 700px。
- 手机文字导航以四列排列，文章日期与标题纵向排列。兼顾横屏、安全区域与输入字号，保留页面缩放和文字选择。
- Blog 按年份归档，年份入口在滚动时保持可见。保留标签页、RSS、代码复制和图片浏览；表格和代码在正文内横向滚动。
- 文章展示作者、日期与预计阅读时间；读到正文后出现轻量阅读栏，可回到开头、返回列表或打开目录。进度线按正文计算，不包含评论。
- 文章封面保留原图地址，另提供本地 WebP 响应式副本及明确宽高；原图在读者放大查看时加载。
- [Pagefind](https://pagefind.app/) 提供全文搜索，输入即查，清空后恢复年度归档。
- [Twikoo](https://twikoo.js.org/) 评论在读者展开评论区后加载。
- Library 使用小封面、标题、状态和日期，按月排列，宽屏双列、手机单列。支持标题、短评、标签搜索，以及类型和状态筛选；筛选默认收起，当前条件与结果数保持可见。
- 有短评的条目可以原地展开阅读，剧透内容需要单独展开。标题直接链接到 NeoDB。
- 统计默认关闭。在页脚「隐私与统计」中主动开启并保存后，才会异步加载 Google Analytics；关闭会停止采集并清除本站统计 Cookie。关闭广告个性化与 Google signals。

页面使用语义化 HTML、原生表单和 `details`，样式集中在 `src/styles/reading.css`。

## 开发

使用 `.nvmrc` 指定的 Node.js 版本。

```bash
npm install
npm run dev         # 开发预览
npm run build       # 静态构建并生成搜索索引
npm run astro -- check
npm test            # 统计选择、弹窗滚动与焦点恢复
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
