# FHIR Bundle Logic Model Designer

一个现代化的FHIR资源与逻辑模型映射工具，用于处理医疗数据的转换和互操作性。

## 功能特点

- **逻辑模型元数据管理**：定义和管理逻辑模型和第三方数据的元数据，支持从JSON/XML自动生成
- **映射配置**：可视化配置字段映射关系，支持复杂转换逻辑和条件表达式
- **可视化展示**：直观展示模型间的映射关系图，一目了然地理解数据流
- **数据转换**：基于配置的映射关系，高效执行各种格式间的数据转换
- **暗色模式**：完整的深色/浅色模式切换功能，默认跟随系统设置

## 技术栈

- **前端框架**：React + TypeScript
- **状态管理**：Redux Toolkit
- **样式系统**：Tailwind CSS
- **UI组件**：自定义组件
- **可视化**：ReactFlow、Mermaid.js
- **表单处理**：React Hook Form + Zod
- **效果交互**：Framer Motion

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm start
```

### 构建生产版本

```bash
npm run build
```

## 功能模块

### 元数据管理

- 逻辑模型元数据定义
- 第三方数据元数据定义
- 从JSON/XML结构自动生成元数据

### 映射配置

- 字段间拖拽映射
- 转换规则配置
- 按数据领域组织映射配置

### 可视化

- 映射关系图形化展示
- 交互式节点操作
- 支持缩放和平移

### 数据转换

- 多种格式间的转换
- LogicDto <-> FHIR
- 第三方数据 <-> LogicDto

## 项目结构

```
src/
  ├── components/      # UI组件
  │   ├── core/        # 核心UI组件
  │   ├── layout/      # 布局组件
  │   ├── editors/     # 编辑器组件
  │   ├── mappers/     # 映射组件
  │   ├── visualizers/ # 可视化组件
  │   └── forms/       # 表单组件
  ├── pages/           # 页面组件
  ├── services/        # 服务组件
  ├── utils/           # 工具函数
  ├── hooks/           # 自定义hooks
  ├── store/           # Redux状态管理
  ├── types/           # TypeScript类型定义
  └── assets/          # 静态资源
```

## FHIR相关资源

- [HL7 FHIR 官方文档](https://www.hl7.org/fhir/)
- [FHIR 实现指南](https://hl7.org/fhir/implementationguide.html)
- [FHIR 资源定义](https://hl7.org/fhir/resourcelist.html)

## 贡献指南

欢迎提交问题和拉取请求来改进这个项目。

## 许可证

[MIT](LICENSE)
