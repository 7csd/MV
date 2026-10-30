# 把回忆拼好给你 · Paper Memories v2

一支 18 镜头的层叠剪纸 MV。场景由 React + SVG 绘制，由 Remotion 渲染；v2 主角采用用户选定的 C 组精致剪纸形象，以内置 image_gen 生成透明人物素材，再切分为可重复渲染的动作层。纸张纹理与原创合成音效由项目脚本生成。

v1 视频保存在 `out/`，原始源工程包是上一级目录的 `PaperMemories-source.zip`。v2 成片均在 `out-v2/`，不会覆盖 v1 视频。

## 成片

- `out-v2/PaperMemories-v2.mp4`：1080p，歌词 + 原曲 + 轻微音效。
- `out-v2/PaperMemories-v2-clean.mp4`：1080p，无歌词，原曲 + 音效。
- `out-v2/PaperMemories-v2-original-audio.mp4`：歌词 + 原曲，不含音效。
- `out-v2/characters.png`：人物设定图。
- `out-v2/storyboard-v2.jpg`：18 镜头接触表。
- `out-v2/preview-climax-v2.mp4`：40.5–47.667 秒段落的动态样片。
- `out-v2/preview-interaction-v2.mp4`：双人互动与坐姿检查段落。

## 开发与渲染

需要 Node.js 22+、Chrome 或 Edge。当前制作使用 Node 24.19、Remotion 4.0.460。

```powershell
npm install
npm run studio
npm run check
npm run stills
npm run preview
npm run render
node scripts/render.mjs clean
node scripts/render.mjs all
node scripts/final-previews-v2.mjs
```

如浏览器未自动检测到，可设置环境变量 `MV_BROWSER` 为浏览器 exe 的绝对路径。渲染不会打开可见浏览器窗口。`final-previews-v2.mjs` 需要完整版 FFmpeg，可通过 `MV_FFMPEG` 指定路径；当前机器使用 `E:/MV/tools/bin/ffmpeg.exe`。

## 时间与素材

- 原曲选段：00:55.250–02:07.929，解码后音频长 72.679 秒。
- 视频：1920×1080、24fps、1745 帧，图像长度 72.708 秒；多出的 29 毫秒用于满足完整视频帧边界。AAC 编码尾部含填充，播放器显示总时长约 72.77 秒。
- 节拍参考：159.05 BPM，锚点 0.135 秒，叙事动作采用约 79.525 BPM 的半拍感觉。
- 镜头切点量化到 24fps 时，最大会有约 20.8 毫秒的舍入误差。
- LRC 提供每句时间；句内歌词高亮按字数估算，并非经过声学识别的逐字时间。
- `public/song.mp3` 与 `public/song.lrc` 来自用户提供的素材。
- `public/foley.wav` 是原创程序合成的纸声、邮戳、水滴、鸟翼、低频和轻铃声，音量保持较低。

## 工程结构

- `src/timing.ts`：帧率、拍点、18 镜头时间表。
- `src/art.tsx`：固定人物模型、纸张分层、星形纸片与道具。
- `src/characters.tsx`：v2 角色选择、头部和手臂绑定、站坐姿、伤感表情与素材加载门。
- `src/data/character-rig.json`：原素材坐标与裁片坐标，保证每次渲染一致。
- `public/characters-v2/raw/`：六套已生成的透明人物原图。
- `public/characters-v2/`：人物动作分层、已选定的 C 组设定图与完整生成提示词。
- `src/scenes-a.tsx`：第 1–10 镜头。
- `src/scenes-b.tsx`：第 11–18 镜头。
- `src/MV.tsx`：主时间轴、字幕、音乐、纹理与人物设定图。
- `src/data/lyrics.json`：由 LRC 原时间转换，保留空白行作为停唱边界。
- `scripts/assets.mjs`：生成固定纹理及音效，准备素材。
- `scripts/render.mjs`：渲染单帧、高潮样片、完整成片及无字幕版。
- `scripts/final-previews.mjs`：从最终成片导出分镜图、封面、高潮样片，以及不含音效的版本（Windows）。
- `scripts/final-previews-v2.mjs`：v2 对应的成片预览与无附加音效版本导出。
- `scripts/rig-assets.py`：非破坏地切分透明人物素材，清理独立边缘碎片；仅重新切片时需要 Python、Pillow 和 numpy。

所有图形路径与人物纹理保持固定；随机外观只使用确定性种子。动作由当前帧计算，同一帧可独立重现。v2 的人物面部使用已选形象的实际图像素材，而非重新画成简化 SVG 脸。远处无面孔的人流剪影仍保留原画面语汇。没有采用原 painted-animation skill、p5.brush、boil 或逐帧随机轮廓。

人物与背景使用系统字体 KaiTi、Microsoft YaHei，无需网络字体。源工程包保留素材，不包含 `node_modules` 与构建缓存；重新安装依赖后即可编辑。

## 交付检查

成片通过完整解码检查。镜头截图与高潮连续帧经过视觉检查；`node scripts/render.mjs verify` 可导出相同帧两次和相邻帧，用于确定性与静态背景检查。
