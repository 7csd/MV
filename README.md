# 拾光 · MV Studio v0.4

本地运行的 MV 创作工作台。仓库包含应用源码及第一个示例项目「把回忆拼好给你 · 剪纸回忆」的成片、分镜、素材与制作参考。

## 观看示例与复现

- [观看/下载示例成片](public/assets/sample.mp4)（约 25 MB；GitHub 页面可点击 Raw 或 Download 下载播放）。
- [查看 18 镜头分镜图](public/assets/storyboard.jpg)、[封面](public/assets/poster.png)。
- [示例制作与复现步骤](examples/paper-memories/README.md)。
- [原始样板工程包](public/assets/source.zip)包含独立工程源码、素材与渲染脚本。

首次克隆后安装 Node.js 22+，在仓库根目录运行 `npm start`，打开 http://127.0.0.1:4317 即可查看样板。前后端使用 Node 内置功能，无需先安装根目录依赖；需要生成视频时再安装 `engine/` 依赖。

仓库不包含本地 `data/`、上传记录、账号/API 配置、历史备份、测试输出，以及「执迷不悟」项目和专用素材。首次启动会从 `seed.json` 创建本地数据；之后产生的项目数据默认由 Git 忽略。

## 启动

双击 `start.cmd` 或 `启动网站.cmd`。浏览器访问 http://127.0.0.1:4317 。支持 Node.js 22+；启动脚本也会自动查找本机已有 Codex Node 运行时。后台进程日志在 `data/server.log` 与 `data/server-error.log`。服务仅监听本机回环地址，未部署公网。

也可以执行 `node server.mjs`，用 Ctrl+C 停止。端口可通过环境变量 PORT 设置。修改源代码后需重启后端。

## 创作流程

方案与分镜（含镜头图片）→ 动态样片 → 成片。

上传歌曲和LRC，选择人物、风格，生成并编辑整片方案、镜头图片与动作安排。动态样片可按所选镜头或一次全部生成；逐镜调整与确认，所有镜头通过后点击“生成全片 MV”，统一合成音乐、歌词与转场，审看后导出1080p。手动代执行和 API 使用同一组按钮与任务。

生成任务与执行者分离：测试阶段由模型读取平台任务、制作并回传；接入图像/视频 API 后，由平台提交同一份提示、参考和动作要求，经同一个结果入口入库。任务不依赖聊天上下文。模型设置中选择手动测试或 API 执行，主界面仍保留方案与分镜、镜头图片、动态样片和成片。完整协议见 [PRODUCTION.md](PRODUCTION.md)。原样板仍可播放和下载。

制作约定见 [CREATIVE-WORKFLOW.md](CREATIVE-WORKFLOW.md)，后台接口见 [PRODUCTION.md](PRODUCTION.md)。

## 文件结构

- `public/` 前端与静态资源，无 CDN、无构建步骤、无需网络字体。
- `server.mjs` Node 原生 HTTP 后端，JSON 原子保存，无额外服务依赖。
- `seed.json` 首次启动的初始数据；以后项目保存在 `data/studio.json`。
- `data/uploads/` 上传的音乐、歌词、参考图；`data/renders/` 渲染快照及成片。
- `archive/character-options/` 原始 ABC 提示词、设定与场景预览。
- `public/assets/source.zip` 完整样板工程归档。
- `engine/` 独立复制的原始 Remotion 源码、素材，以及平台动态组合与渲染脚本。

渲染依赖不随仓库上传。在 `engine` 下执行 `pnpm install --frozen-lockfile`，并安装 Chrome 或 Edge。可用 MV_BROWSER 环境变量指定浏览器可执行文件。渲染使用本机中文字体。独立样板工程完整渲染脚本见 `public/assets/source.zip`。

个人备份时请另外保存本地 `data/` 与需要的输出；这些目录不会同步到 GitHub。导出的项目 JSON 是配方，不包含上传文件本体。

## 验证

`npm run check` 检查前后端语法；`npm test` 运行隔离数据的接口集成测试。UI 冒烟测试读取本地数据，首次测试前先启动一次应用以生成 `data/studio.json`。

## 使用本地 Codex 账号额度

模型设置选择「本地 Codex · 账号额度」，模型默认 gpt-6.1-sol，保存后在项目中点击 AI 分镜。本机需安装 Codex CLI，并运行 `codex login` 选择 ChatGPT 登录；可点击「检查本地 Codex」查看状态。API 配置会保留，切换回 API 即可继续使用。

本地模式复用 CLI 登录，不读取或复制登录令牌；先确认 ChatGPT 登录，并移除子进程 API Key 环境变量。请求通过 stdin 传入，JSON Schema 约束返回值，仍由后端校验镜头时间。每次调用在独立临时目录运行，只读沙箱、忽略用户配置，最长 10 分钟。额度、模型权限与当前 Codex 共享；不会自动切换到 API 计费。本地 Codex 负责故事和分镜，补现有计划时附带实际图片；独立分镜图使用另配的图像服务或手动上传，本地 Remotion 制作动态预览。

后台通过 PATH 查找 codex，可用服务环境变量 STUDIO_CODEX_BIN 指定 CLI 可执行文件绝对路径。源码修改后需要重启服务。

## 故事任务状态与待生成图片

非样板项目没有独立分镜图时，镜头缩略图与项目封面显示「待生成」，不会再按旧模板编号借用样板图片。旧模板参数仍保留，便于查阅历史配方。

点击生成故事与分镜提交后台任务，接口立即返回202；状态保存在项目 storyboardTask 字段，页面每2.5秒更新阶段和耗时，刷新或切换页面不终止模型调用。相同项目运行中重复提交返回同一任务；运行中暂不允许编辑和生图，避免覆盖。全站同时最多运行两个故事任务。失败保留原故事和镜头，显示错误；重启服务后进行中的任务标记中断，可重新生成。

Codex 使用 --json 事件流记录请求启动、模型活动与完成阶段（不显示内部推理正文），文字调用最多等待10分钟。旧版180秒是网站主动中断上限，不是歌曲长度或模型能力限制。没有收到完整结果时，不能仅凭超时确定网络或模型的具体原因。
