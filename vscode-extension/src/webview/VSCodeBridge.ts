/**
 * VSCode API 桥接模块
 * 提供对VS Code API的统一访问，确保只调用一次acquireVsCodeApi
 */

// 声明全局acquireVsCodeApi函数类型
declare function acquireVsCodeApi(): {
  postMessage(message: any): void;
  getState<T = any>(): T;
  setState(state: any): void;
};

// 全局变量标记是否已获取VSCode API
declare global {
  interface Window {
    _vscodeApiAcquired?: boolean;
    vscodeApiInstance: VSCodeAPI;
  }
}

// VS Code API类型定义
export interface VSCodeAPI {
  postMessage: (message: any) => void;
  getState: <T = any>() => T | undefined;
  setState: (state: any) => void;
}

// 全局单例实例
let vscodeApiInstance: VSCodeAPI | undefined;

/**
 * 获取VS Code API实例
 * 确保只调用一次acquireVsCodeApi()
 */
export function getVSCodeAPI(): VSCodeAPI | undefined {
  // 如果已经初始化，则返回缓存的实例
  if (vscodeApiInstance) {
    return vscodeApiInstance;
  }

  // 尝试获取VS Code API
  try {
    // 检查全局标记，是否已有其他模块获取了VSCode API
    if (window._vscodeApiAcquired) {
      console.warn('VSCode API已由其他模块获取，跳过重复调用');
      return undefined;
    }

    if (typeof acquireVsCodeApi === 'function') {
      // 标记为已获取
      window._vscodeApiAcquired = true;
      
      vscodeApiInstance = acquireVsCodeApi();
      window.vscodeApiInstance = vscodeApiInstance;
      console.log('VS Code API实例已获取并缓存');
    } else {
      console.warn('acquireVsCodeApi未定义，可能不在VS Code环境中');
    }
  } catch (error) {
    console.error('获取VS Code API失败:', error);
  }

  return vscodeApiInstance;
}

// 尝试获取全局单例
export const vscodeApi = getVSCodeAPI();

/**
 * 注册消息处理器
 * @param callback 消息处理回调
 * @returns 取消注册的函数
 */
export function registerMessageHandler(callback: (message: any) => void): () => void {
  const handler = (event: MessageEvent) => {
    callback(event.data);
  };
  
  window.addEventListener('message', handler);
  
  // 返回取消注册函数
  return () => {
    window.removeEventListener('message', handler);
  };
} 
