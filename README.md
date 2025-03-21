# FHIR 映射逻辑模型设计器

基于React 18和TypeScript的FHIR资源映射工具，支持将第三方数据格式映射到FHIR资源。

## 功能特色

- FHIR资源与逻辑模型的双向映射
- 第三方数据格式(JSON/XML)与LogicDto和FHIR格式的转换
- 直观的视觉逻辑模型图生成
- 按数据领域组织的映射配置管理
- 现代化、响应式的用户界面设计

## 开发环境

- Node.js
- React 18
- TypeScript
- Tailwind CSS
- Vite

## 安装与运行

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 构建项目
npm run build
```

## 项目结构

```
src/
├── assets/        # 静态资源
├── components/    # 可复用组件
├── hooks/         # 自定义Hook
├── layouts/       # 布局组件
├── pages/         # 页面组件
├── services/      # API服务
├── store/         # 状态管理
├── types/         # TypeScript类型定义
└── utils/         # 工具函数
```

## 许可证

MIT
