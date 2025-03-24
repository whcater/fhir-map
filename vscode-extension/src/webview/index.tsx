/**
 * VS Code Webview入口文件
 * 负责在VS Code环境中初始化React应用
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { VSCodeProvider } from './VSCodeContext.js';
import './vscode-styles.css';

// 获取 vscode webview API
declare global {
  interface Window {
    acquireVsCodeApi: () => {
      postMessage: (message: any) => void;
      getState: () => any;
      setState: (state: any) => void;
    };
  }
}

// 尝试导入应用程序
// 注意：这里使用动态导入以处理可能的错误
const initApp = async () => {
  try {
    // 尝试从上级目录导入主应用
    // 如果你的应用位于不同位置，请相应地调整路径
    const { default: App } = await import('../../../src/App.js');
    
    // 获取根元素
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('未找到根元素 #root');
    }
    
    // 创建React根节点并渲染应用
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <VSCodeProvider>
          <App />
        </VSCodeProvider>
      </React.StrictMode>
    );
    
    console.log('VS Code Webview中的React应用已成功初始化');
  } catch (error) {
    // 处理初始化错误
    console.error('初始化应用失败:', error);
    
    // 显示用户友好的错误信息
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="color: var(--vscode-errorForeground); padding: 20px; margin: 20px; border: 1px solid var(--vscode-errorForeground); border-radius: 4px;">
          <h2>应用加载失败</h2>
          <p>${error instanceof Error ? error.message : String(error)}</p>
          <p>请检查控制台获取更多信息</p>
          <pre style="background: var(--vscode-editor-background); padding: 10px; overflow: auto; margin-top: 10px;">${error instanceof Error ? error.stack || '无堆栈信息' : '无详细信息'}</pre>
        </div>
      `;
    }
  }
};

// 添加一个错误边界，捕获全局未处理的错误
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error);
  
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="color: var(--vscode-errorForeground); padding: 20px; border: 1px solid var(--vscode-errorForeground); border-radius: 4px;">
        <h2>发生错误</h2>
        <p>${event.message}</p>
        <p>位置: ${event.filename}:${event.lineno}:${event.colno}</p>
      </div>
    `;
  }
  
  // 防止错误冒泡
  event.preventDefault();
});

// 初始化应用
initApp(); 
