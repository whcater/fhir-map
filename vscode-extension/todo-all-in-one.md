# FHIR映射逻辑模型设计器 - Web和VS Code插件一体化方案

## 项目背景

FHIR映射逻辑模型设计器目前有两个并行版本：
1. 基于Vite构建的Web应用（位于项目根目录）
2. VS Code插件版本（位于vscode-extension目录）

这两个版本目前是独立维护的，导致代码重复和维护负担。我们需要一个方案将这两个版本整合，实现一套代码同时支持Web和VS Code两个环境。

## 架构设计

### 目标架构

```
fhir-map/
├── src/                      # 共享核心源代码
│   ├── components/           # UI组件
│   ├── pages/                # 页面组件
│   ├── store/                # 状态管理
│   ├── utils/                # 工具函数
│   ├── App.tsx               # 应用主组件（环境自适应）
│   └── ...
├── vite.config.ts            # Web应用Vite配置
├── dist/                     # Web应用构建输出
│   └── ...
├── public/                   # Web应用公共资源
│   └── ...
└── vscode-extension/         # VS Code插件
    ├── src/
    │   ├── web/              # 插件主体代码
    │   │   └── extension.ts  # 插件入口
    │   └── webview/          # VS Code适配层
    │       ├── VSCodeBridge.ts  # VS Code API桥接
    │       ├── VSCodeContext.tsx # VS Code上下文提供者
    │       └── index.tsx     # VS Code Webview入口
    ├── resources/            # 插件资源
    ├── vite.config.ts        # 插件Vite配置
    └── ...
```

### 核心理念

1. **共享核心代码**：业务逻辑、UI组件和状态管理在环境间共享
2. **环境适配层**：针对不同环境（Web/VS Code）提供适配层
3. **统一构建流程**：使用Vite作为统一的构建工具
4. **环境检测**：应用能够检测并适应运行环境
5. **主题适应**：支持Web和VS Code各自的主题系统

## 技术方案

### 1. 环境检测机制

创建环境检测工具，用于区分Web和VS Code环境：

```typescript
// src/utils/environment.ts
export function isVSCodeEnvironment(): boolean {
  return typeof acquireVsCodeApi !== 'undefined';
}

export function getEnvironment() {
  return isVSCodeEnvironment() ? 'vscode' : 'web';
}
```

### 2. VS Code适配层

#### VS Code API桥接

```typescript
// vscode-extension/src/webview/VSCodeBridge.ts
class VSCodeAPI {
  private static instance: VSCodeAPI;
  private vscodeApi: any;

  private constructor() {
    try {
      this.vscodeApi = acquireVsCodeApi();
    } catch (err) {
      console.error('无法获取VS Code API');
      throw err;
    }
  }

  public static getInstance(): VSCodeAPI {
    if (!VSCodeAPI.instance) {
      VSCodeAPI.instance = new VSCodeAPI();
    }
    return VSCodeAPI.instance;
  }

  public postMessage(message: any): void {
    this.vscodeApi.postMessage(message);
  }

  public getState(): any {
    return this.vscodeApi.getState();
  }

  public setState(state: any): void {
    this.vscodeApi.setState(state);
  }
}

export const vscodeApi = VSCodeAPI.getInstance();
```

#### VS Code上下文提供者

```typescript
// vscode-extension/src/webview/VSCodeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { vscodeApi } from './VSCodeBridge';

type Theme = 'light' | 'dark' | 'high-contrast';

interface VSCodeContextType {
  postMessage: (message: any) => void;
  theme: Theme;
  // 其他VS Code相关状态和方法
}

const defaultContext: VSCodeContextType = {
  postMessage: () => {},
  theme: 'light',
};

const VSCodeContext = createContext<VSCodeContextType>(defaultContext);

export const VSCodeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === 'themeChanged') {
        setTheme(message.theme);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // 获取初始主题
    vscodeApi.postMessage({ command: 'getTheme' });
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  const value = {
    postMessage: (message: any) => vscodeApi.postMessage(message),
    theme,
  };
  
  return (
    <VSCodeContext.Provider value={value}>
      {children}
    </VSCodeContext.Provider>
  );
};

export const useVSCode = () => useContext(VSCodeContext);
```

### 3. 统一构建流程

#### Web应用Vite配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
```

#### VS Code插件Vite配置

```typescript
// vscode-extension/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/webview',
    sourcemap: !process.env.PRODUCTION,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'src/webview/index.tsx'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@vscode': path.resolve(__dirname, 'src/webview'),
    },
  },
});
```

#### Vite配置Extension部分

```typescript
// vscode-extension/vite.extension.config.ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: 'dist/web',
    lib: {
      entry: path.resolve(__dirname, 'src/web/extension.ts'),
      formats: ['cjs'],
      fileName: () => 'extension.js',
    },
    rollupOptions: {
      external: ['vscode'],
    },
    sourcemap: true,
    minify: process.env.PRODUCTION ? 'esbuild' : false,
  },
});
```

### 4. 统一主应用结构

#### 共享App组件

```typescript
// src/App.tsx
import React from 'react';
import { isVSCodeEnvironment } from './utils/environment';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import Routes from './Routes';

// VS Code环境中导入上下文提供者
let VSCodeProvider: React.FC<{children: React.ReactNode}> | null = null;
if (isVSCodeEnvironment()) {
  import('@vscode/VSCodeContext').then(module => {
    VSCodeProvider = module.VSCodeProvider;
  });
}

const App: React.FC = () => {
  // 根据环境选择合适的路由器
  const Router = isVSCodeEnvironment() ? HashRouter : BrowserRouter;
  
  // 渲染应用
  const renderApp = () => (
    <Router>
      <Routes />
    </Router>
  );
  
  // 根据环境决定是否包装VS Code提供者
  return isVSCodeEnvironment() && VSCodeProvider ? (
    <VSCodeProvider>
      {renderApp()}
    </VSCodeProvider>
  ) : renderApp();
};

export default App;
```

#### 共享主题系统

```typescript
// src/hooks/useTheme.ts
import { useState, useEffect } from 'react';
import { isVSCodeEnvironment } from '../utils/environment';

// 懒加载VS Code钩子
let useVSCode: any = null;
if (isVSCodeEnvironment()) {
  import('@vscode/VSCodeContext').then(module => {
    useVSCode = module.useVSCode;
  });
}

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    if (isVSCodeEnvironment() && useVSCode) {
      // VS Code环境，使用VS Code的主题
      const { theme: vsCodeTheme } = useVSCode();
      setTheme(vsCodeTheme);
    } else {
      // Web环境，使用媒体查询检测主题
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
      
      setTheme(mediaQuery.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, []);
  
  return theme;
}
```

### 5. VS Code Webview入口

```typescript
// vscode-extension/src/webview/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../../../src/App'; // 导入共享应用
import { VSCodeProvider } from './VSCodeContext';
import './vscode-styles.css'; // VS Code特定样式

try {
  const root = document.getElementById('root');
  if (!root) throw new Error('未找到root元素');
  
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <VSCodeProvider>
        <App />
      </VSCodeProvider>
    </React.StrictMode>
  );
  
  console.log('VS Code Webview React应用已成功挂载');
} catch (error) {
  console.error('挂载React应用时出错:', error);
  document.getElementById('root')!.innerHTML = `
    <div style="color: var(--vscode-errorForeground); padding: 20px;">
      <h2>加载应用出错</h2>
      <p>${error instanceof Error ? error.message : String(error)}</p>
    </div>
  `;
}
```

## 实施计划

### 第一阶段：准备工作

1. **分析现有代码**
   - [x] 审查Web应用代码库，识别可共享部分
   - [x] 审查VS Code插件代码，识别特定于VS Code的部分
   - [x] 确定需要适配的核心功能

2. **环境准备**
   - [x] 安装所需的依赖（Vite、插件等）
   - [x] 创建项目结构和配置文件
   - [x] 设置开发环境

### 第二阶段：创建适配层

3. **VS Code桥接层**
   - [x] 实现VSCodeBridge.ts
   - [x] 实现VSCodeContext.tsx
   - [x] 创建环境检测工具

4. **核心应用修改**
   - [x] 修改App.tsx使其环境感知
   - [x] 实现通用的主题钩子
   - [x] 调整状态管理以支持两种环境

### 第三阶段：构建系统整合

5. **Vite配置**
   - [x] 创建Web应用Vite配置
   - [x] 创建VS Code插件Webview的Vite配置
   - [x] 创建VS Code插件Extension的Vite配置

6. **构建脚本**
   - [x] 修改package.json，添加统一构建命令
   - [x] 创建开发模式构建脚本
   - [x] 创建生产模式构建脚本

### 第四阶段：测试与验证

7. **开发环境测试**
   - [ ] 测试Web环境开发流程
   - [x] 测试VS Code环境开发流程
   - [ ] 验证热更新功能

8. **功能测试**
   - [ ] 验证功能在两种环境中的一致性
   - [ ] 测试环境特定功能
   - [ ] 验证主题切换功能

### 第五阶段：优化与发布

9. **性能优化**
   - [ ] 优化构建产物大小
   - [ ] 实现代码分割
   - [ ] 减少冗余代码

10. **文档与部署**
    - [ ] 编写开发指南
    - [ ] 更新README.md
    - [ ] 准备发布流程

## 潜在挑战与解决方案

### 1. 环境差异处理

**挑战**: VS Code环境与Web环境有许多差异，如API访问、文件系统操作等。

**解决方案**: 
- 创建功能抽象层，为每个环境提供一致的API
- 使用策略模式，根据环境选择不同实现
- 对不支持的功能提供降级方案

### 2. 构建与依赖管理

**挑战**: 不同环境可能需要不同的依赖和构建配置。

**解决方案**:
- 使用Vite的条件编译和环境变量
- 分离环境特定的依赖
- 使用动态导入减少初始加载体积

### 3. 样式和主题

**挑战**: VS Code有自己的主题系统，Web应用可能使用不同的方案。

**解决方案**:
- 创建样式适配层
- 使用CSS变量统一主题系统
- 为VS Code特有的UI组件创建Web版本对等实现

### 4. 状态管理

**挑战**: VS Code的状态需要通过特定API持久化。

**解决方案**:
- 创建统一的状态管理接口
- 根据环境选择不同的状态持久化方案
- 使用适配器模式桥接不同的状态API

## 时间规划

| 阶段 | 预计耗时 | 关键里程碑 |
|------|----------|------------|
| 准备工作 | 1-2天 | 项目结构搭建完成 |
| 创建适配层 | 2-3天 | VS Code桥接层可用 |
| 构建系统整合 | 1-2天 | 统一构建流程可用 |
| 测试与验证 | 2-3天 | 两环境功能一致性验证 |
| 优化与发布 | 1-2天 | 构建优化完成 |

总计：约7-12个工作日

## 结论

通过统一的架构设计和适当的抽象层，我们可以实现一套代码同时支持Web和VS Code两个环境，显著减少维护成本，提高开发效率。此方案的关键在于良好的环境抽象和灵活的构建流程，使团队能够专注于核心业务逻辑，而不是重复实现不同环境的适配代码。 
