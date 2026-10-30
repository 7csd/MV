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

双击 `start.cmd` 或 `启动网站.cmd`。浏览器访问 http://127.0.0.1:4317 。支持 Node.js 22+。后台进程日志在 `data/server.log` 与 `data/server-error.log`。服务仅监听本机回环地址，未部署公网。

也可以执行 `node server.mjs`，用 Ctrl+C 停止。端口可通过环境变量 PORT 设置。修改源代码后需重启后端。

## 创作流程

方案与分镜（含镜头图片）→ 动态样片 → 成片。

上传歌曲和LRC，选择人物、风格，生成并编辑整片方案、镜头图片与动作安排。动态样片可按所选镜头或一次全部生成；逐镜调整与确认，所有镜头通过后点击“生成全片 MV”，统一合成音乐、歌词与转场，审看后导出1080p。生成任务统一使用模型设置中的 API 配置。

在「模型设置」中分别填写文字、图像和视频服务的 Base URL、模型名称与 API Key，保存后使用生成按钮。平台提交提示词、参考素材与动作要求，接收结果后逐镜预览、修改和确认。接口适配见 [PRODUCTION.md](PRODUCTION.md)。原样板可直接播放和下载。

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

## 模型设置

文字服务使用兼容 `/chat/completions` 的接口；图像服务支持参考图上传或自定义 JSON 映射；视频服务按服务商文档配置创建、查询与结果字段。三类服务可以分别选择服务商和模型，费用按各服务商规则计算。

密钥仅保存在本机 `data/providers.json`，不随仓库同步。观看已有样板不需要配置模型。

## 故事任务状态与待生成图片

非样板项目没有独立分镜图时，镜头缩略图与项目封面显示「待生成」，不会再按旧模板编号借用样板图片。旧模板参数仍保留，便于查阅历史配方。

点击生成故事与分镜提交后台任务，接口立即返回202；状态保存在项目 storyboardTask 字段，页面每2.5秒更新阶段和耗时，刷新或切换页面不终止模型调用。相同项目运行中重复提交返回同一任务；运行中暂不允许编辑和生图，避免覆盖。全站同时最多运行两个故事任务。失败保留原故事和镜头，显示错误；重启服务后进行中的任务标记中断，可重新生成。

文字模型请求最长等待 10 分钟。没有收到完整结果时，页面会保留原有方案并显示失败原因，可检查服务商状态后重试。
