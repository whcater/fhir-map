import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

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

try {
  console.log('开始初始化 React 应用...');
  
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('找不到根元素 #root');
  }
  
  // 创建根元素并渲染 React 应用
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('React 应用初始化成功！');
} catch (error) {
  console.error('React 应用初始化失败:', error);
  // 在页面上显示错误
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="color: red; padding: 20px; border: 1px solid red; margin: 20px;">
        <h2>React 应用初始化失败</h2>
        <p>${error instanceof Error ? error.message : String(error)}</p>
      </div>
    `;
  }
} 
