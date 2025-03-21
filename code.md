# FHIR 映射逻辑模型设计器 - 代码规范

## 技术栈

- **前端框架**: React 18
- **构建工具**: Vite
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Font Awesome
- **图表**: Mermaid.js
- **状态管理**: React Context API / Zustand
- **单元测试**: Jest + React Testing Library
- **E2E测试**: Cypress
- **包管理**: npm / yarn

## 项目结构

```
src/
├── assets/           # 静态资源
├── components/       # 可复用组件
│   ├── common/       # 通用UI组件
│   ├── layout/       # 布局组件
│   ├── editors/      # 编辑器相关组件
│   └── visualizers/  # 可视化组件
├── config/           # 配置文件
├── constants/        # 常量定义
├── contexts/         # React上下文
├── hooks/            # 自定义钩子
├── lib/              # 工具库
│   ├── mappers/      # 映射转换器
│   ├── parsers/      # 解析器
│   └── validators/   # 验证器
├── models/           # 数据模型定义
│   ├── dto/          # DTO定义
│   ├── fhir/         # FHIR模型定义
│   └── third-party/  # 第三方数据模型
├── pages/            # 页面组件
├── services/         # 服务层
├── store/            # 状态管理
├── styles/           # 全局样式
├── types/            # TypeScript类型定义
├── utils/            # 工具函数
├── App.tsx           # 应用入口组件
├── main.tsx          # 应用入口文件
└── vite-env.d.ts     # Vite类型声明
```

## 命名规范

- **文件命名**: 
  - 组件文件: PascalCase (如 `Button.tsx`)
  - 工具/钩子文件: camelCase (如 `useLocalStorage.ts`)
  - 样式文件: 与组件同名，后缀 `.module.css`/`.styles.ts`
  
- **组件命名**:
  - 使用PascalCase (如 `LogicModelViewer`)
  - 页面组件以Page结尾 (如 `MappingConfigPage`)
  
- **变量/函数命名**:
  - 使用camelCase (如 `getUserData`)
  - 布尔值前缀用is/has/should (如 `isLoading`, `hasError`)
  
- **接口/类型命名**:
  - 使用PascalCase
  - 接口: 以I前缀 (如 `ILogicDto`) 或直接使用名词 (如 `LogicDto`)
  - 类型: 以T前缀 (如 `TMapperConfig`) 或后缀Type (如 `MappingType`)

## 代码风格

- **缩进**: 2空格
- **引号**: 单引号 `'`
- **分号**: 使用分号 `;`
- **行长度**: 最大100字符
- **注释**: 使用JSDoc风格注释

```typescript
/**
 * 将第三方数据转换为LogicDto
 * @param data 第三方数据
 * @param config 映射配置
 * @returns 转换后的LogicDto
 */
function convertToLogicDto(data: any, config: IMapperConfig): ILogicDto {
  // 实现
}
```

## TypeScript 规范

- 尽量避免使用 `any` 类型
- 为函数参数和返回值添加类型注解
- 使用接口定义对象结构
- 使用枚举定义有限选项集合
- 使用泛型增强代码复用性
- 使用类型断言时优先使用as语法

## React 最佳实践

- 使用函数组件和React Hooks
- 组件文件结构:
  ```typescript
  // 导入
  import React from 'react';
  
  // 类型定义
  interface Props {
    // ...
  }
  
  // 组件定义
  export const Component: React.FC<Props> = ({ prop1, prop2 }) => {
    // Hooks
    
    // 处理函数
    
    // 渲染
    return (
      <div>
        {/* JSX */}
      </div>
    );
  };
  ```
  
- 组件划分原则:
  - 单一职责
  - 封装复杂性
  - 提高可重用性
  
- 状态管理策略:
  - 本地状态: `useState` / `useReducer`
  - 共享状态: Context API / Zustand
  - 表单状态: Formik / React Hook Form

## 样式规范

- 使用Tailwind CSS实用类
- 遵循移动优先的响应式设计原则
- 颜色使用Tailwind预设变量
- 自定义组件样式使用CSS Modules或styled-components

## 测试规范

- 每个UI组件编写单元测试
- 每个工具函数编写单元测试
- 关键流程编写集成测试
- 使用测试驱动开发(TDD)方式完成任务

## Git提交规范

- 使用语义化提交消息:
  - `feat:` 新功能
  - `fix:` Bug修复
  - `docs:` 文档更新
  - `style:` 代码风格更改
  - `refactor:` 代码重构
  - `test:` 测试相关
  - `chore:` 构建/工具相关
  
- 每个提交专注于一个变更
- 提交前进行代码lint和测试

## 性能优化

- 组件懒加载
- 合理使用React.memo / useMemo / useCallback
- 避免不必要的重渲染
- 图片和资源优化
- 代码分割 