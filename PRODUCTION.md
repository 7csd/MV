# MV 制作规范 v5

用户流程：方案与分镜 → 逐镜生成、调整和确认动态样片 → 手动合成全片 MV → 审看与1080p导出。详见 [CREATIVE-WORKFLOW.md](CREATIVE-WORKFLOW.md)。

## 统一生成协议

- POST /api/projects/:id/generate：{scope:"clips"|"images",indices?:[0,4],index?,force?,executor?:"manual"|"api"}。索引从0开始。clips 省略索引生成全部；正常批量生成复用已有有效视频，force 明确重做所选镜头。
- GET .../generation-tasks：完整任务、提示、人物/风格/首帧参考、动作要求、1080p规格、音乐歌词及回传格式。
- POST /api/upload?name=...：上传生成文件。
- POST .../generation-result：{taskId,artifact,sourceDescription,sourceFiles?}。API 与手动均使用同一接收函数，校验解码、规格、时长和版本，再关联镜头。

首帧完成后视频任务重新绑定实际图片版本。动态结果先预览，用户逐镜确认。API执行与手动回传均不自动合成全片。

## 用户评审与合成

- POST .../creative-feedback：{scope:"sample"|"film",indices:[4],note}。镜头选择必填；保存编号、名称、当前视频与意见，只撤销所选镜头确认。前端随后提交这些镜头的 force 生成任务。意见只进入对应镜头提示。
- POST .../clip-review：{index,decision:"approved",fingerprint}。确认当前镜头版本；重做中、未落实意见或过期版本不可通过。
- POST .../compose：所有镜头当前版本通过后合成整片观看版。重复提交复用现有任务；无自动合成。
- POST .../creative-finish：{jobId,fingerprint}。确认当前完整观看版并导出1080p，重复提交复用导出。

旧 sample-decision 自动批量流程不用于 v5。历史文件保留，迁移不伪造用户确认。原模板样板保持归档模式。

generationExecutor 控制执行者，productionRoute 表示创作方式，两者独立。HTTP服务、模型、鉴权、状态映射与时长参数需按服务商配置。旧 handoff、内部画面检查和 motion-import 保留供工程工具使用，用户主入口使用统一任务。

所有动态源须达到1920×1080，规范化24fps。完整观看版可720p，正式导出1080p。模拟服务测试验证软件链路，实际艺术效果仍由用户观看确认。
