# Change Log

## 2025年3月28日
将Monaco编辑器替换为Ace编辑器，提升编辑器性能和可维护性。
主要改进包括：
1. 移除了monaco-editor和@monaco-editor/react依赖
2. 添加了react-ace和ace-builds依赖
3. 重构了JsonEditor组件，使用AceEditor替代Editor组件
4. 更新了MappingConfigPage中的编辑器相关代码
5. 重构了编辑器的位置接口，将monaco.Position替换为自定义的接口
6. 更新了VSCode扩展的依赖，确保一致性
7. 优化了编辑器的主题切换功能

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

1. 创建了符合 FHIR 映射主题的 SVG 格式 logo
2. 创建了各种尺寸的 PNG 版本 logo（16x16, 32x32, 64x64, 96x96, 128x128, 256x256, 512x512）
3. 创建了 favicon.ico 文件
4. 将所有图像文件复制到所需的目录（public/images, resources/images, src/assets/images, vscode-extension/resources/images）
5. 更新了 index.html 文件，使其更符合 SEO 标准和项目主题
6. 创建了 manifest.json 文件以支持 PWA 功能
7. 使用 node generate-images.cjs 自动生成常见的几种图片格式

