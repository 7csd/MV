# 示例：把回忆拼好给你 · 剪纸回忆

这是工作台内置的第一个项目：72.679 秒、18 个镜头、层叠剪纸风格。共享的示例数据来自 `seed.json`，不依赖作者电脑上的项目数据库。

## 先观看

- [成片 MP4](../../public/assets/sample.mp4)：下载后用本地播放器观看。
- [分镜总览](../../public/assets/storyboard.jpg)、[封面](../../public/assets/poster.png)、[逐镜静帧](../../public/assets/stills/)。
- [角色方案与提示词](../../public/assets/character-prompts.json)、[制作约定](../../CREATIVE-WORKFLOW.md)、[原始制作说明](../../engine/CREATIVE-BRIEF.md)。

## 在工作台中查看制作步骤

1. 安装 Node.js 22+，克隆仓库，进入仓库根目录，运行 `npm start`；Windows 也可双击 `start.cmd`。
2. 浏览器打开 http://127.0.0.1:4317，进入「把回忆拼好给你 · 剪纸回忆」。首次启动从 `seed.json` 建立本地项目数据。
3. 查看角色 C、蓝金回忆风格、歌曲与歌词，逐镜对照方案、提示词、镜头时长和分镜静帧。可直接播放已有样板成片。
4. 要自行制作新作品，上传自己的歌曲和 LRC，依照「方案与分镜 → 动态样片 → 成片」推进。需要 AI 时在设置中配置自己的执行方式；已有示例播放不需要 API Key。
5. 要在工作台渲染，先进入 `engine` 执行 `pnpm install --frozen-lockfile`，安装 Chrome/Edge，再返回根目录启动工作台。浏览器位置特殊时设置 `MV_BROWSER`。

## 独立复现原始样板

1. 下载 [source.zip](../../public/assets/source.zip)，解压到一个新目录。该工程包包含 `scripts/` 渲染脚本、Remotion 源码、角色分层、音乐和歌词。
2. 在解压目录运行 `npm install`，然后运行 `npm run studio` 查看时间轴。
3. 运行 `npm run check` 检查类型，`npm run stills` 导出静帧，`npm run preview` 生成样片，`npm run render` 生成完整视频。
4. 需要无字幕版本时运行 `node scripts/render.mjs clean`。更多导出参数和字体、浏览器要求见工程包内的 `README.md`。

歌曲、歌词及各项素材保留各自的权利归属；本仓库没有为第三方素材授予新的许可。
