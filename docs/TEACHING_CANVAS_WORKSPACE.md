# 教学工作区与智能画布

七个教学子页面右侧的“工作区”按钮可选择智能体执行端目录。Web 使用目录浏览器，桌面本地使用系统选择器。目录绑定按页面保存，左右两侧一起切换；不同目录的对话、教学草稿和画布彼此隔离。Web 选择的是服务器目录。

左侧默认显示智能画布，可通过“返回编辑器”修改教学字段。智能体完成回复后，Markdown、公式、Mermaid、ECharts、HTML、A2UI 界面以及结构化教学正文会显示在画布中。点击画布按钮或提交表单会将教学问题带入当前页面右侧输入框，由教师发送。

课件编辑器的“下载 PowerPoint”会生成可编辑 PPTX，同时保存到浏览器并打开左侧真实幻灯片预览，支持缩略图、翻页、缩放和下载。刷新页面后可以恢复已保存产物。清除浏览器站点数据会删除本地产物。

智能体生成的实际文件应保存到当前工作区的 `outputs/` 目录；回复完成时自动扫描，亦可点击“刷新产物”。智能体可用 `jzx-artifacts` 围栏返回真实文件路径。支持 PPTX、PDF、Word、Excel、Markdown、HTML 和常用图像的预览，单文件限 20MiB；工作区外路径、路径穿越与外部 URL 不作为教学产物读取。预览失败时显示错误，不用示意图冒充实际产物。

验证入口：

- `pnpm test:teaching-workspace`：目录绑定、身份隔离、正文投影和产物路径校验。
- `pnpm test:web-teaching-workspace`：先启动 Web，验证实际目录切换、A2UI回传、真实PPT预览与刷新恢复、手机布局。需本地 `deploy/access-output/token.txt` ；测试自行生成实际 PPTX 文件，不调用模型。

产品与时序规则见 [spec](../specs/jiaozhixing/TEACHING_WORKSPACE_ARTIFACTS.md)。

A2UI组件目录现支持响应式Grid、标题、徽标、指标卡、进度条、选择框和复选框。ECharts接受标准JSON option，支持柱线饼、雷达、仪表盘、热力、关系和桑基等图表，可配置prompt使教师点击数据点继续提问。也可输出独立 `echarts` 围栏。图表尺寸随画布调整，跟随深浅主题及减少动画设置。内置互动示例使用明确标注的模拟数据，供查看渲染效果。

`pnpm test:web-visual-components` 验证实际图表、点击回传、控件恢复和原生A2UI更新。
