# FHIR映射逻辑模型设计器 - VS Code插件待办事项

目标： 将FHIR映射逻辑模型设计器(react web项目) 迁移到 fhir-map-extension/ 下
重点： vscode插件项目目录在 fhir-map-extension/ 下

## 项目架构调整

- [x] 创建VS Code插件基础结构
  - [x] 初始化插件项目（使用yo code生成器）
  - [x] 设置插件清单文件（package.json）
  - [x] 配置插件激活事件（activationEvents）
  - [x] 实现插件入口点（extension.ts）

- [x] 调整现有React应用架构
  - [x] 将前端应用迁移至插件webview架构
  - [x] 实现VS Code和webview之间的通信接口
  - [x] 分离UI组件与业务逻辑，便于在webview中重用

## 开发环境配置

- [x] 安装VS Code扩展开发工具
  - [x] `@types/vscode` - VS Code API类型定义
  - [x] `vscode-test` - 用于测试VS Code扩展
  - [x] `@vscode/webview-ui-toolkit` - VS Code UI组件库

- [x] 配置插件开发调试环境
  - [x] 设置launch.json配置文件
  - [x] 配置插件调试任务

## 前端适配

- [x] 集成VS Code设计语言
  - [x] 实现VS Code主题适配（支持亮色/暗色）
  - [x] 使用VS Code webview UI工具包替换现有UI组件
  - [x] 确保UI符合VS Code设计规范

- [x] 修改状态管理
  - [x] 实现VS Code扩展状态持久化
  - [x] 调整现有状态管理以适应插件环境
  - [x] 实现跨会话状态保存

- [x] 调整资源加载机制
  - [x] 修改资源路径处理以适应VS Code webview
  - [x] 实现本地资源访问安全策略

## VS Code特性集成

- [ ] 实现命令面板集成
  - [ ] 注册自定义命令
  - [ ] 实现常用功能的命令快捷方式

- [ ] 添加工作区集成
  - [ ] 实现项目文件读写
  - [ ] 支持工作区配置

- [ ] 实现设置界面
  - [ ] 定义用户可配置选项
  - [ ] 实现设置UI与数据绑定

- [ ] 集成VS Code通知系统
  - [ ] 替换现有提示/警告机制
  - [ ] 使用VS Code进度API实现长时间操作反馈

## 打包与发布

- [ ] 配置构建流程
  - [ ] 设置webpack打包配置
  - [ ] 优化资源文件大小
  - [ ] 实现生产环境构建优化

- [ ] 准备发布材料
  - [ ] 编写插件文档（README.md）
  - [ ] 准备插件图标和截图
  - [ ] 编写详细的使用说明

- [ ] 测试与验证
  - [ ] 在不同VS Code版本中测试
  - [ ] 验证在不同操作系统上的兼容性
  - [ ] 执行性能测试

- [ ] 发布准备
  - [ ] 创建VSCE发布配置
  - [ ] 生成VSIX安装包
  - [ ] 准备VS Code市场发布材料

## 连续集成/部署

- [ ] 设置CI/CD流程
  - [ ] 配置GitHub Actions自动构建
  - [ ] 实现自动化测试
  - [ ] 设置版本发布流程

## 迁移注意事项

- [ ] 识别可能的兼容性问题
  - [ ] 检查浏览器API使用情况
  - [ ] 调整网络请求实现
  - [ ] 解决文件系统访问限制

- [ ] 用户体验调整
  - [ ] 重新设计工作流以适应VS Code环境
  - [ ] 确保键盘导航和快捷键符合VS Code标准
  - [ ] 适配VS Code的上下文菜单和交互模式