# Change Log

## 2025年3月27日
实现了全屏功能的抽象化改造！现在VisualModelGraph组件使用了useFullscreen自定义Hook来实现全屏功能，这使得代码更加简洁、可维护，也提高了复用性。
主要改进包括：
1. 创建了通用的useFullscreen Hook，提供了以下功能：
- 支持任何组件类型的全屏功能
- 自动处理VSCode环境和浏览器环境的差异
- 支持主题切换（亮色/暗色）
- 提供完整的键盘快捷键支持
- 自动清理全屏状态
2. 简化了VisualModelGraph组件：
- 移除了大量与全屏相关的复杂代码
- 使用简单的Hook API：{isFullscreen, toggleFullscreen}
- 保留了调试功能方便排查问题
3. 改进了全屏实现的质量：
- 使用CSS类和样式变量提高主题适配性
- 利用计算样式获取更准确的原始样式
- 增强了错误处理能力