# 常见问题与解决方案

## ESM模式导入问题

### 问题描述

在使用`"type": "module"`配置的ESM项目中，某些库可能无法正常工作，会报以下错误：

```
Uncaught SyntaxError: The requested module '/node_modules/react-ace/lib/index.js' does not provide an export named 'default'
```

```
Uncaught SyntaxError: The requested module '/node_modules/ace-builds/src-noconflict/ace.js' does not provide an export named 'default'
```

```
Uncaught (in promise) ReferenceError: require is not defined
    at webpack-resolver.js:2:12
```

尤其是在使用`react-ace`和`ace-builds`库时，在Web环境和VSCode环境中均可能遇到问题。

### 原因分析

- ESM模式下，导入语句和CommonJS模块不兼容
- `react-ace`和`ace-builds`在ESM环境中使用命名导出而非默认导出
- `ace-builds/webpack-resolver.js`使用了CommonJS的`require`函数，在ESM模式下不可用
- VSCode环境和Web环境需要不同的模块加载策略

### 解决方案

#### 1. 正确的导入语法

**使用命名导入，而非默认导入**

```typescript
// 错误
import ace from 'ace-builds';
import AceEditor from 'react-ace';

// 正确
import * as ace from 'ace-builds';
```

#### 2. 处理React组件

使用懒加载方式导入React组件，可以处理默认导出问题：

```typescript
// 使用React.lazy包装组件导入
const AceEditor = lazy(() => import('react-ace').then(module => {
  // 处理ESM模式下的默认导出问题，优先使用命名导出
  const AceEditorComponent = module.default || module;
  return { default: AceEditorComponent };
}));

// 使用Suspense包装组件
<Suspense fallback={<div>加载中...</div>}>
  <AceEditor />
</Suspense>
```

#### 3. 替换webpack-resolver

替换`ace-builds/webpack-resolver`，创建ESM兼容的替代方案：

```typescript
// src/utils/ace-esm-resolver.ts
import * as ace from 'ace-builds';
import { isVSCodeEnvironment } from '../utils/environment';

// 动态导入所需的ACE模块
const importModule = async (path: string): Promise<any> => {
  try {
    // 只在Web环境下尝试导入模块
    if (!isVSCodeEnvironment()) {
      return await import(`ace-builds/src-noconflict/${path}.js`);
    }
    return null;
  } catch (error) {
    console.error(`无法加载ACE模块 ${path}:`, error);
    return null;
  }
};

// 根据环境设置不同的配置
if (!isVSCodeEnvironment()) {
  // 初始化基本配置
  ace.config.set('basePath', '/node_modules/ace-builds/src-noconflict');
  ace.config.set('modePath', '/node_modules/ace-builds/src-noconflict');
  ace.config.set('themePath', '/node_modules/ace-builds/src-noconflict');
  ace.config.set('workerPath', '/node_modules/ace-builds/src-noconflict');
  
  // 预加载模块
  importModule('mode-json');
  importModule('theme-github');
  // ...
}

export default ace;
```

#### 4. 为不同环境创建不同的模块加载策略

**Web环境**:
- 使用动态导入加载模块
- 创建ESM兼容的webpack-resolver替代方案

```typescript
// Web环境加载模块
if (!isVSCodeEnvironment()) {
  Promise.all([
    import('ace-builds/src-noconflict/mode-json'),
    import('ace-builds/src-noconflict/theme-github')
  ]).catch(err => console.error('加载错误:', err));
}
```

**VSCode环境**:
- 使用静态导入
- 避免动态导入模块路径

```typescript
// VSCode环境加载模块
ace.config.loadModule('ace/theme/github', () => {});
ace.config.loadModule('ace/mode/json', () => {});
```

#### 5. Vite配置优化

在vite.config.ts中添加配置，解决ESM和CommonJS兼容问题：

```typescript
// 在解析配置中添加别名
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src'),
    'react-ace': path.resolve(__dirname, 'node_modules/react-ace'),
    'ace-builds': path.resolve(__dirname, 'node_modules/ace-builds'),
  },
},

// 依赖优化
optimizeDeps: {
  include: [
    'react',
    'react-dom',
    'ace-builds',
    'react-ace',
    'ace-builds/src-noconflict/mode-json',
    'ace-builds/src-noconflict/theme-github',
    'ace-builds/src-noconflict/ext-language_tools',
  ],
  force: true,
  esbuildOptions: {
    define: { global: 'globalThis' },
  },
},
```

## 多环境兼容性问题总结

1. **统一模块导入方式**:
   - 使用命名导入语法 `import * as name from 'module'`
   - 对于React组件，使用懒加载处理默认导出问题

2. **创建特定环境的加载器**:
   - 为Web环境和VSCode环境创建各自的模块加载策略
   - 使用环境检测函数区分不同环境 `isVSCodeEnvironment()`

3. **使用环境变量标记**:
   - 在window对象上设置环境标记，方便在各处判断
   - 例如 `window.VSCODE_EDITOR_ENV = true`

4. **处理资源路径**:
   - Web环境使用相对路径
   - VSCode环境需要通过扩展API获取绝对路径

## 最佳实践

1. **避免混合使用模块系统**
   - 统一使用ESM或CommonJS，不要混合使用
   - 如需跨系统使用，应用适配层或转换工具

2. **依赖处理**
   - 使用`"type": "module"`时，注意处理第三方库
   - 使用Vite的`optimizeDeps`配置预构建依赖 