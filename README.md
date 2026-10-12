# 景见 · 可运行首版

临时名称，可随时调整。一个面向景区伙伴的世界模型预览与双语导览原型。

新增入口：`/#world` 展示通过 Marble 1.1 API 生成并下载的真实三维资产；`/#tour` 保留五点位内容维护演示。输入为 AI 湖景概念图，不是西湖实景重建。生成记录见 `public/assets/world/generation.json`。

## 先运行

从 Git 仓库克隆后，先安装依赖并构建（`dist/` 不提交到 Git）：

```sh
git clone git@git.dev.sh.ctripcorp.com:saltsalt/hackson-2026.git
cd hackson-2026
pnpm install --frozen-lockfile
pnpm run build
pnpm start
```

预览真实世界模型：http://127.0.0.1:4173/#world 。仓库已包含生成的 SPZ 场景，观看不需要 API 密钥，也不会再次调用生成接口。

在 macOS 上双击本目录的 **启动景见.command**。它会使用系统 Node.js 或本机 Codex 自带 Node.js，启动服务并打开浏览器。终端窗口保持打开；按 Ctrl+C 停止。

默认地址：http://127.0.0.1:4173 。ZIP 交付包包含构建后的 `dist/`，本地演示无需重新安装依赖、无需互联网、无需模型密钥；Git 克隆需要先执行上面的构建步骤。语音朗读取决于浏览器与操作系统可用语音。

其他机器需要 Node.js 20+，在项目目录执行 `node server.mjs`。若修改源码，先运行 `pnpm install`、`pnpm run build`，再刷新。`pnpm` 版本建议 11+；`scripts/build.mjs` 使用 esbuild。Windows 可在终端执行 `node scripts/start.mjs`。

## 已完成的体验

- 首页、游客体验、五个模块的景区工作台、八页路演模式。
- Three.js 程序三维场景，五个概念点位、旋转、缩放、方向键移动、光照切换。
- Spark 播放器，已接入 Marble 1.1 输出的 SPZ；支持导入本地 Gaussian Splat 文件。生成样例使用独立观景视角，保留三维移动与视角重置。
- 随点位切换的中英文资料问答、来源展开、未知问题回避、系统语音朗读。
- 按兴趣和时间预算生成**线上预览**顺序，不冒充实地导航。
- JSON 项目/备份导入、文字分段导入、图片 IndexedDB 持久化。
- 双语编辑、审核门槛、发布快照、版本切换、跨标签页同步。
- 发布体验包导出；本地服务保存独立分享快照；静态托管使用压缩内容分享链接。
- 真实交互记录，明确为本浏览器计数，不伪造商业效果。

## 尚未完成的关键验证

世界模型的生成、下载和网页渲染已接通；**还需要真实景区素材验证与伙伴验收，才能作为最终参赛版本**。

1. `/#world` 是真实世界模型输出；`/#tour` 是程序搭建的工作流演示；首页封面由 imagegen 生成。均非西湖实地重建。
2. 2026-10-10 完成 Marble 1.1 单图 API 生成，消耗账户已有 1,580 credits，余额 5,420；没有充值。密钥仅存于本机 `.env`，不进入网页构建或交付 ZIP。
3. 未配置语言模型时，导游是基于关键词、点位与发布资料的确定性检索，不是大模型。兼容 Chat Completions 的服务端适配已写好，真实提供商联调待完成。
4. 导入新 3D 场景后，现有讲解按钮继续可用，但未实现新场景点位的空间校准编辑器，不能宣称自动对齐。
5. 没有真实景区合作背书、在线多人协同、实时营业信息、地理导航、商业评测或转化数据。
6. Sites 当前部署是静态预览，访问权限由 Sites 平台管理：持久数据在本浏览器。真实 API 服务仅在本机 Node 服务提供；云端多租户后端未部署。

## 准备一场 5 分钟演示

见 `docs/比赛与演示.md`。推荐顺序：游客进入 → 问眼前场景 → 切换英文 → 问未知开放时间 → 工作台编辑运营提示 → 保存草稿但游客不可见 → 审核发布 → 再次提问 → 切回旧版本。

路演入口：`/#pitch`，支持左右键切页和打印八页讲稿。PPTX 和 PDF 讲稿见 `docs/路演/`；漫游修订核验记录见 `docs/漫游修订核验.txt`。

## 配置真实模型

把 `.env.example` 复制为 `.env`，只在本机填写密钥。不要把密钥发到聊天窗口、提交到 Git 或放入前端。

```dotenv
WORLDLABS_API_KEY=你的密钥
WORLDLABS_MODEL=marble-1.1
LLM_BASE_URL=你的兼容接口地址（例如以 /v1 结尾，代码会追加 /chat/completions）
LLM_API_KEY=你的密钥
LLM_MODEL=该提供商实际支持的模型标识
PORT=4173
```

重启本地服务后，工作台「场景制作」会显示连接状态。提交生成需在页面确认素材与额度；生成任务不自动重试，提交不确定时先去服务平台核对，避免重复扣费。模型超时或输出格式不合格会回到资料检索并标注回退。

World Labs 账号与 API 额度：[官方快速开始](https://docs.worldlabs.ai/api)、[平台](https://platform.worldlabs.ai/)、[计费](https://docs.worldlabs.ai/api/pricing)。API 与 Marble 网页版额度独立。选型和接入细节见 `docs/技术与服务.md`。

## 数据与访问范围

- 草稿、历史版本、统计：浏览器 localStorage，键 `jingjian-v1`。项目备份可导出恢复。
- 用户参考图：浏览器 IndexedDB。文字项目备份不含这些图片，请保留原文件。
- 本地发布快照：`data/releases/*.json`，一旦创建不改写。生成任务：`data/jobs.json`。
- 服务只监听 `127.0.0.1`，局域网与手机不能直接打开本机地址。写接口检查 Origin 与 Host；这是单机工具，不是公网生产后端。
- Sites 静态站点默认私有；分享一个 URL 不会改变站点访问权限。无线上用户账号、权限或协同数据库。
- 真实模型问答会把所选点位资料发给你配置的提供商。用户图片不会自动上传。

## 开发与验证

```sh
pnpm install
pnpm run build
pnpm test
node server.mjs
```

浏览器验证脚本：`node scripts/browser-qa.mjs`，需要 Playwright 与 Chrome。此机器默认使用 Codex 捆绑的 Playwright；其他环境通过 `PLAYWRIGHT_MODULE` 指定模块。核心测试使用 Node 原生 test runner。

`src/data.js`：示例内容；`src/core.js`：审核、版本、规划和资料检索；`src/viewer.js`：三维场景及 splat 播放；`src/app.js`：产品界面；`server.mjs`：本地分享和模型代理；`scripts/`：构建与验收。

所有演示内容均可修改。真实景区素材与事实来源见 `docs/素材与来源.md`。第三方依赖遵循各自许可证。

## 漫游修订（2026-10-10）

取消旧版起点半径 4 米的硬限制。三个按钮对应不同位置：起点 `[0, eye, 0]`、小亭 `[0, eye, -5.5]`（亭外正对建筑）、柳岸 `[-4.5, eye, -8.5]`；不再共用站位。WASD / 方向键移动，Shift 加速，Q/E 升降；屏幕箭头支持点击和长按。显示距起点距离与可展开的观景点方位图。自由漫游不含碰撞，远离原始视点时可能看到生成空洞，重置可返回起点。

这次只修改播放器，沿用同一份已生成资产，没有再次消耗模型积分。
