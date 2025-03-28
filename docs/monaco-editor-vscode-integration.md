# Monaco编辑器与VSCode扩展集成指南

## 问题描述

在VSCode扩展环境中，由于内容安全策略(CSP)的限制，Monaco编辑器默认从CDN加载资源的方式会导致错误：

```
Refused to load the script 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js' because it violates the following Content Security Policy directive: "script-src 'self' https://*.vscode-cdn.net 'unsafe-inline' 'unsafe-eval' blob:". 
Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback.
```

此外，在Web环境中，monaco编辑器的worker文件也可能出现"define is not defined"错误，这是因为这些文件期望在AMD模块系统中运行，但未正确加载AMD加载器。

## 最终解决方案

经过反复测试，我们发现最佳解决方案是：**为Web环境和VSCode环境分别采用不同的加载策略**。

### Web环境

在Web环境中，保持简单是关键。我们选择:

1. **使用默认加载方式**: 让`@monaco-editor/react`自行处理Monaco编辑器的加载
2. **不干预Worker加载**: 避免自定义Worker加载逻辑
3. **静态资源托管**: 只需将Monaco编辑器的静态资源复制到public目录

这种方法简单可靠，避免了复杂的自定义加载逻辑可能引入的问题。

### VSCode扩展环境

在VSCode环境中，我们需要特殊处理:

1. **内联Worker加载**: 使用data URI注入Worker脚本，避免跨域请求
2. **模拟AMD环境**: 为Monaco编辑器Worker提供一个简化的AMD模块系统
3. **环境标识**: 使用`window.VSCODE_EDITOR_ENV`标记VSCode环境，便于检测

## 核心代码片段

### VSCode扩展环境的WebView配置

```javascript
const monacoBaseUri = webview.asWebviewUri(
  vscode.Uri.joinPath(context.extensionUri, 'dist', 'monaco-editor')
);

// Webview HTML头部添加
`
<!-- VSCode环境标识和Monaco编辑器配置 -->
<script>
  // VSCode API初始化
  const vscode = acquireVsCodeApi();
  
  // 设置VSCode环境标识
  window.VSCODE_EDITOR_ENV = true;
  
  // Monaco编辑器配置
  window.MonacoEnvironment = {
    getWorkerUrl: function() {
      // 使用data URIs避免CSP限制
      return "data:text/javascript;charset=utf-8," + encodeURIComponent(`
        self.MonacoEnvironment = {
          baseUrl: '${monacoBaseUri.toString()}/min/'
        };
        
        // 创建一个模拟的AMD模块系统
        self.define = function(deps, callback) {
          if (typeof deps === 'function') {
            callback = deps;
            deps = [];
          }
          callback.apply(null, deps.map(function() { return {}; }));
        };
        self.define.amd = true;
        
        self.importScripts('${monacoBaseUri.toString()}/min/vs/base/worker/workerMain.js');
      `);
    }
  };
</script>
`
```

### React环境检测钩子

```typescript
// 自定义monaco编辑器环境配置钩子
export const useMonacoEnvironment = (): void => {
  useEffect(() => {
    // 仅在VSCode环境中进行特殊配置
    if (isVSCodeExtension()) {
      console.log('VSCode环境中配置Monaco编辑器');
      
      // 在VSCode中禁用外部CDN加载
      loader.config({
        // 使用相对路径
        paths: {
          vs: ''
        }
      });
    } else {
      // Web环境使用默认配置，无需特殊处理
      console.log('Web环境使用默认Monaco配置');
    }
  }, []);
};
```

### 编辑器包装组件

创建统一的`MonacoEditorWrapper`组件，根据环境自动应用不同的配置:

```tsx
// 检测是否在VSCode环境中
const isVSCode = typeof window !== 'undefined' && (
  window.VSCODE_EDITOR_ENV || 
  typeof (window as any).acquireVsCodeApi === 'function' ||
  window.location.protocol === 'vscode-webview:'
);

// 在编辑器挂载时应用环境特定优化
const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
  // 在VSCode环境中应用更多的优化
  if (isVSCode) {
    // 针对VSCode环境的特殊处理
    editor.updateOptions({
      renderWhitespace: 'selection',
      scrollBeyondLastLine: false,
      fixedOverflowWidgets: true,
    });
  }
  
  // ... 其他代码 ...
};
```

## 实施步骤

1. **准备资源**:
   - 将Monaco编辑器的静态资源复制到`public/monaco-editor`目录
   - 将Monaco编辑器的静态资源复制到`vscode-extension/resources/monaco-editor`目录

2. **环境检测钩子**:
   - 创建`useMonacoEnvironment`钩子，专门处理不同环境下的Monaco配置

3. **VSCode扩展配置**:
   - 在`extension.ts`的`getReactWebviewContent`函数中添加Monaco特定配置
   - 设置正确的CSP策略，允许blob URLs加载workers

4. **统一组件封装**:
   - 创建`MonacoEditorWrapper`组件，包装原始`@monaco-editor/react`组件
   - 在组件中使用环境检测，应用不同的配置

5. **构建流程集成**:
   - 添加复制Monaco资源的npm脚本
   - 在postinstall钩子中自动运行此脚本，确保资源可用

## 最佳实践和注意事项

1. **环境分离**: Web环境和VSCode环境应该分别处理，使用环境检测应用不同的配置
2. **简化Web加载**: Web环境尽量使用默认的加载方式，避免不必要的自定义逻辑
3. **VSCode资源管理**: 在VSCode扩展中，确保所有资源都通过`webview.asWebviewUri`加载
4. **统一组件接口**: 使用包装组件隐藏环境差异，为上层组件提供统一接口
5. **避免重复加载**: 确保Monaco加载器只被加载一次，避免`_amdLoaderGlobal`重复声明错误

## 故障排除

### 常见错误及解决方案

1. **`_amdLoaderGlobal`重复声明错误**
   - 原因: Monaco加载器被多次加载
   - 解决方案: 确保页面中只有一个地方引用Monaco加载器

2. **找不到worker文件**
   - 原因: worker路径不正确或CSP限制
   - 解决方案: 在VSCode环境中使用data URI加载worker，在Web环境中使用默认加载机制

3. **"define is not defined"错误**
   - 原因: worker中缺少AMD模块系统
   - 解决方案: 在worker脚本中添加define函数和define.amd标志

4. **编辑器加载但无法正常工作**
   - 原因: Monaco资源或配置不完整
   - 解决方案: 检查资源加载、环境配置，确保所有必需的文件都正确加载

## 总结

通过采用环境特定的配置方式，我们成功解决了Monaco编辑器在VSCode扩展和Web环境中的集成问题。关键在于:

1. Web环境保持简单，使用默认加载机制
2. VSCode环境使用特殊的Worker加载方式和模拟的AMD环境
3. 创建统一的组件接口，隐藏底层实现差异

这种方法确保了Monaco编辑器在两种环境中都能正常工作，同时避免了内容安全策略限制和AMD模块加载问题。 