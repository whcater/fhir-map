/**
 * VSCode API 访问工具
 * 提供对VSCode API的统一访问，确保只调用一次acquireVsCodeApi
 */
import { isVSCodeEnvironment } from './environment';

// 声明全局VSCode API函数
declare function acquireVsCodeApi(): {
  postMessage(message: any): void;
  getState<T = any>(): T;
  setState(state: any): void;
};

// 全局变量标记是否已获取VSCode API
// 这个变量需要是全局的，用于跨模块检查
declare global {
  interface Window {
    _vscodeApiAcquired?: boolean;
    vscodeApiInstance: VSCodeAPI;
  }
}

/**
 * VSCode API类型定义
 */
export interface VSCodeAPI {
  postMessage: (message: any) => void;
  getState: <T = any>() => T | undefined;
  setState: (state: any) => void;
}

// 全局单例实例
let vscodeApiInstance: VSCodeAPI | null = null;

/**
 * 获取VSCode API实例
 * 确保只调用一次acquireVsCodeApi()
 * @returns VSCode API实例，如果不是VSCode环境则返回null
 */
export function getVSCodeAPI(): VSCodeAPI | null {
  if (!isVSCodeEnvironment()) {
    return null;
  }

  // 如果已经初始化，则返回缓存的实例
  if (vscodeApiInstance) {
    return vscodeApiInstance;
  }
  console.log('window main', window);
  // 检查全局变量，确保没有其他模块已经获取了VSCode API
  if (window._vscodeApiAcquired) {
    console.warn('VSCode API已由其他模块获取，不再重复调用acquireVsCodeApi()');
    // 尝试通过事件通信获取已经存在的VSCode API实例
    console.log('window.vscodeApiInstance', window.vscodeApiInstance);
    return window.vscodeApiInstance;
  }

  // 尝试获取VSCode API
  try {
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

/**
 * 向VSCode发送消息的简便方法
 * @param command 命令名称
 * @param payload 消息数据
 * @returns 是否成功发送
 */
export function postVSCodeMessage(command: string, payload?: any): boolean {
  const api = getVSCodeAPI();
  if (!api) {
    console.warn('无法发送消息到VSCode：API实例不存在');
    return false;
  }
  
  try {
    api.postMessage({ command, payload });
    return true;
  } catch (error) {
    console.error('发送消息到VS Code失败:', error);
    return false;
  }
}

/**
 * 获取VS Code状态
 */
export function getVSCodeState<T = any>(): T | undefined {
  const api = getVSCodeAPI();
  if (!api) {
    return undefined;
  }
  
  try {
    return api.getState<T>();
  } catch (error) {
    console.error('获取VS Code状态失败:', error);
    return undefined;
  }
}

/**
 * 设置VS Code状态
 */
export function setVSCodeState(state: any): boolean {
  const api = getVSCodeAPI();
  if (!api) {
    return false;
  }
  
  try {
    api.setState(state);
    return true;
  } catch (error) {
    console.error('设置VS Code状态失败:', error);
    return false;
  }
} 